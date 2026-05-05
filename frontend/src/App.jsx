import { useEffect, useMemo, useState } from "react";
import {
  defaultMatch,
  emptyPassport,
  emptyUser,
  pages,
} from "./constants/appData";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import AccountPage from "./pages/AccountPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import AuthPage from "./pages/AuthPage";
import CvPage from "./pages/CvPage";
import InsightsPage from "./pages/InsightsPage";
import JobsPage from "./pages/JobsPage";
import OverviewPage from "./pages/OverviewPage";
import PassportOnboarding from "./pages/PassportOnboarding";
import RoadmapPage from "./pages/RoadmapPage";
import SkillGapPage from "./pages/SkillGapPage";
import { getBackendOrigin, setUnauthorizedHandler } from "./services/api";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateCurrentUser,
  updatePassport,
} from "./services/authService";
import {
  buildRoadmap,
  calculateMatch,
  createCvProfile,
  fetchJobsFromAdzuna,
  filterJobsByQuery,
  getBestCv,
  getRecommendations,
  getSkillAnalytics,
  getTrendAnalytics,
  listApplications,
  listCvs,
  trackApplication,
  updateApplicationStatus,
} from "./services/careerService";
import { ui } from "./styles/ui";
import { firstError, splitSkills, validateAuthForm } from "./utils/validation";

const DEFAULT_AUTHENTICATED_PATH = "/dashboard";
const protectedPaths = pages.map((page) => page.path);
const pageById = Object.fromEntries(pages.map((page) => [page.id, page]));

function isProtectedPath(pathname) {
  return protectedPaths.includes(pathname);
}

function getSafeRedirect(searchParams) {
  const redirect = searchParams.get("redirect");
  if (!redirect || !redirect.startsWith("/")) return DEFAULT_AUTHENTICATED_PATH;

  const redirectPath = redirect.split("?")[0];
  if (!isProtectedPath(redirectPath)) return DEFAULT_AUTHENTICATED_PATH;

  return redirect;
}

function getLoginPathFor(pathname, search = "") {
  const target = isProtectedPath(pathname)
    ? `${pathname}${search}`
    : DEFAULT_AUTHENTICATED_PATH;

  return `/login?redirect=${encodeURIComponent(target)}`;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("System ready");
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState(emptyUser);
  const [authErrors, setAuthErrors] = useState({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [passport, setPassport] = useState(emptyPassport);
  const [cvs, setCvs] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState("");
  const [cvForm, setCvForm] = useState({
    title: "Backend CV",
    skills: "Java, SQL",
  });
  const [filterForm, setFilterForm] = useState({
    keyword: "developer",
    skill: "Java",
    minMatch: "",
    sort: "newest",
  });
  const [matchForm, setMatchForm] = useState(defaultMatch);
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [bestCvResult, setBestCvResult] = useState(null);
  const [skillAnalytics, setSkillAnalytics] = useState(null);
  const [trendAnalytics, setTrendAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [pendingAction, setPendingAction] = useState("");
  const applicationStatuses = ["Saved for Later", "Under Review", "Accepted", "Rejected"];

  const selectedCv = useMemo(
    () => cvs.find((cv) => cv._id === selectedCvId),
    [cvs, selectedCvId]
  );
  const bestJobId = jobs[0]?._id || recommendations[0]?._id;
  const topScore = recommendations[0]?.matchScore ?? jobs[0]?.matchScore ?? 0;
  const isBusy = Boolean(pendingAction);
  const activePage =
    pages.find((page) => page.path === location.pathname) || pages[0];
  const redirectPath = getSafeRedirect(searchParams);
  const destinationPath = isProtectedPath(location.pathname)
    ? `${location.pathname}${location.search}`
    : redirectPath;
  const currentAuthMode = location.pathname === "/login" ? "login" : "register";

  function navigatePage(pageId) {
    navigate(pageById[pageId]?.path || DEFAULT_AUTHENTICATED_PATH);
  }

  function changeAuthMode(nextMode) {
    setAuthErrors({});
    navigate(`${nextMode === "login" ? "/login" : "/register"}${location.search}`, {
      replace: true,
    });
  }

  async function loadCvs() {
    const data = await listCvs();
    const nextCvs = data.data || [];
    setCvs(nextCvs);
    if (!selectedCvId && nextCvs[0]?._id) setSelectedCvId(nextCvs[0]._id);
  }

  async function loadApplications() {
    const data = await listApplications();
    setApplications(data.data || []);
  }

  function handleTrackApplication(jobId, cvId, status = "Under Review") {
    if (!cvId) { setStatus("Select a CV first"); return; }
    runAction(status === "Saved for Later" ? "Saving for later" : "Tracking application", async () => {
      await trackApplication({ jobId, cvId, status });
      await loadApplications();
    });
  }

  function handleUpdateApplicationStatus(id, status) {
    runAction("Updating status", async () => {
      await updateApplicationStatus(id, status);
      await loadApplications();
    });
  }

  function applyAuthSession(data) {
    localStorage.setItem("authToken", data.token);
    setUser(data.user);
    setPassport(data.user.passport || emptyPassport);
    setShowOnboarding(!data.user.passportCompleted);
  }

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setAuthChecked(true);
      return;
    }

    getCurrentUser()
      .then((data) => {
        setUser(data.data);
        setPassport(data.data.passport || emptyPassport);
        setShowOnboarding(!data.data.passportCompleted);
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        setUser(null);
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, []);

  useEffect(() => {
    if (user) {
      loadCvs().catch((e) => setStatus(e.message));
      loadApplications().catch((e) => setStatus(e.message));
    }
  }, [user]);

  async function submitAuth(event) {
    event.preventDefault();

    const nextErrors = validateAuthForm(authForm, currentAuthMode);
    setAuthErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus(firstError(nextErrors));
      return;
    }

    const payload =
      currentAuthMode === "login"
        ? { email: authForm.email, password: authForm.password }
        : authForm;

    try {
      setPendingAction(currentAuthMode);
      setStatus(currentAuthMode === "login" ? "Signing in" : "Creating account");
      const data =
        currentAuthMode === "login" ? await loginUser(payload) : await registerUser(payload);
      applyAuthSession(data);
      if (data.user.passportCompleted) {
        navigate(destinationPath, { replace: true });
      }
      setStatus(currentAuthMode === "login" ? "Signed in" : "Account created");
    } catch (error) {
      if (error.errors) {
        setAuthErrors(error.errors);
        setStatus(firstError(error.errors));
        return;
      }
      setStatus(error.message);
    } finally {
      setPendingAction("");
    }
  }

  async function updateUser(nextUser) {
    try {
      setPendingAction("Updating account");
      const data = await updateCurrentUser(nextUser);
      setUser(data.data);
      setStatus("Account updated");
    } finally {
      setPendingAction("");
    }
  }

  function renderAvatar(sourceUser, className = ui.accountAvatar) {
    if (sourceUser?.photo) {
      return (
        <img
          alt={`${sourceUser.firstName || "User"} profile`}
          className={className}
          src={sourceUser.photo}
        />
      );
    }

    return (
      <div className={className}>
        {(sourceUser?.firstName?.[0] || "U").toUpperCase()}
      </div>
    );
  }

  async function savePassport(nextPassport = passport) {
    try {
      setPendingAction("Saving Career Passport");
      const data = await updatePassport({ passport: nextPassport, completed: true });
      setUser(data.data);
      setPassport(data.data.passport || nextPassport);
      setShowOnboarding(false);
      navigate(destinationPath, { replace: true });
      setStatus("Career Passport saved");
    } finally {
      setPendingAction("");
    }
  }

  function skipPassport() {
    savePassport(passport)
      .then(() => setStatus("You can complete Career Passport later"))
      .catch((error) => setStatus(error.message));
  }

  function signOut() {
    localStorage.removeItem("authToken");
    setUser(null);
    navigate("/login", { replace: true });
    setStatus("Signed out");
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem("authToken");
      setUser(null);
      setShowOnboarding(false);
      setStatus("Session expired. Please sign in again.");
      navigate(getLoginPathFor(location.pathname, location.search), { replace: true });
    });
  }, [location.pathname, location.search, navigate]);

  async function runAction(label, action) {
    try {
      setPendingAction(label);
      setStatus(label);
      await action();
    } catch (error) {
      if (error.status === 401) return; // handler already fired via setUnauthorizedHandler
      setStatus(error.message);
    } finally {
      setPendingAction("");
    }
  }

  function createCv(event) {
    event.preventDefault();
    runAction("Creating CV profile", async () => {
      const data = await createCvProfile({
        title: cvForm.title,
        skills: splitSkills(cvForm.skills),
      });

      setSelectedCvId(data.data._id);
      await loadCvs();
      setStatus("CV profile created");
    });
  }

  function fetchJobs() {
    runAction("Fetching jobs from Adzuna", async () => {
      const data = await fetchJobsFromAdzuna();
      const params = new URLSearchParams({ sort: "newest" });
      const loadedJobs = await filterJobsByQuery(params);
      setJobs(loadedJobs.data || []);
      setStatus(
        `Jobs imported: ${data.imported || 0} new, ${data.updated || 0} updated. ${loadedJobs.data?.length || 0} jobs loaded.`
      );
    });
  }

  function filterJobs(event) {
    event?.preventDefault();
    runAction("Filtering jobs from database", async () => {
      const needsCvContext =
        Boolean(filterForm.minMatch) || filterForm.sort === "score";

      if (needsCvContext && !selectedCvId) {
        setStatus("Select or create a CV before using match score filters.");
        return;
      }

      const params = new URLSearchParams();
      Object.entries(filterForm).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      if (selectedCvId) params.set("cvId", selectedCvId);

      const data = await filterJobsByQuery(params);
      setJobs(data.data || []);
      setStatus(`${data.data?.length || 0} jobs loaded`);
    });
  }

  function loadRecommendations() {
    if (!selectedCvId) {
      setStatus("Create or select a CV first");
      return;
    }

    runAction("Ranking recommendations", async () => {
      const data = await getRecommendations(selectedCvId);
      setRecommendations(data.recommendations || []);
      setStatus("Recommendations ranked");
    });
  }

  function findBestCv() {
    if (!bestJobId) {
      setStatus("Load jobs or recommendations first");
      return;
    }

    runAction("Finding best CV for selected job", async () => {
      const data = await getBestCv(bestJobId);
      setBestCvResult(data);
      setStatus("Best CV calculated");
    });
  }

  function runMatch(event) {
    event.preventDefault();
    runAction("Calculating match explainability", async () => {
      const data = await calculateMatch({
        cvSkills: splitSkills(matchForm.cvSkills),
        jobSkills: splitSkills(matchForm.jobSkills),
      });

      setMatchResult(data);
      setStatus("Match explanation ready");
    });
  }

  function analyzeGaps() {
    runAction("Building learning roadmap", async () => {
      const data = await buildRoadmap({
        missingSkills: matchResult?.missingSkills || [],
      });

      setAnalysisResult(data);
      setStatus("Roadmap ready");
    });
  }

  function loadAnalytics() {
    runAction("Loading analytics", async () => {
      const [skills, trends] = await Promise.all([
        getSkillAnalytics(),
        getTrendAnalytics(),
      ]);
      setSkillAnalytics(skills);
      setTrendAnalytics(trends);
      setStatus("Analytics loaded");
    });
  }

  if (!authChecked) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef2f3] p-6">
        <p className={ui.pulse}>
          <span className={ui.pulseDot} />
          Checking session
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <AuthPage
              authForm={authForm}
              authErrors={authErrors}
              authMode={currentAuthMode}
              isBusy={isBusy}
              setAuthForm={setAuthForm}
              setAuthErrors={setAuthErrors}
              setAuthMode={changeAuthMode}
              submitAuth={submitAuth}
              status={status}
            />
          }
        />
        <Route
          path="/register"
          element={
            <AuthPage
              authForm={authForm}
              authErrors={authErrors}
              authMode={currentAuthMode}
              isBusy={isBusy}
              setAuthForm={setAuthForm}
              setAuthErrors={setAuthErrors}
              setAuthMode={changeAuthMode}
              submitAuth={submitAuth}
              status={status}
            />
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="*"
          element={
            <Navigate
              to={getLoginPathFor(location.pathname, location.search)}
              replace
            />
          }
        />
      </Routes>
    );
  }

  if (showOnboarding) {
    return (
      <PassportOnboarding
        isBusy={isBusy}
        passport={passport}
        setPassport={setPassport}
        savePassport={savePassport}
        skipPassport={skipPassport}
        user={user}
      />
    );
  }

  return (
    <div className={ui.shell}>
      <aside className={ui.sidebar}>
        <div className={ui.brand}>
          <span className={ui.brandMark}>AC</span>
          <div>
            <strong>AI Career OS</strong>
            <small className="block text-slate-500">Matching workspace</small>
          </div>
        </div>

        <nav className={ui.nav}>
          <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Workspace</p>
          {pages.filter((p) => p.section === "workspace").map((page) => (
            <NavLink
              className={({ isActive }) =>
                `${ui.navButton} ${isActive ? ui.navButtonActive : ""}`
              }
              key={page.id}
              to={page.path}
            >
              {page.label}
            </NavLink>
          ))}
          <p className="px-3 pt-4 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Growth</p>
          {pages.filter((p) => p.section === "growth").map((page) => (
            <NavLink
              className={({ isActive }) =>
                `${ui.navButton} ${isActive ? ui.navButtonActive : ""}`
              }
              key={page.id}
              to={page.path}
            >
              {page.label}
            </NavLink>
          ))}
          <p className="px-3 pt-4 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Applications</p>
          {pages.filter((p) => p.section === "apply").map((page) => (
            <NavLink
              className={({ isActive }) =>
                `${ui.navButton} ${isActive ? ui.navButtonActive : ""}`
              }
              key={page.id}
              to={page.path}
            >
              {page.label}
            </NavLink>
          ))}
        </nav>

        <a
          className={ui.docLink}
          href={`${getBackendOrigin()}/api-docs`}
          target="_blank"
          rel="noreferrer"
        >
          Open Swagger
        </a>
      </aside>

      <main className={ui.workspace}>
        <header className={ui.header}>
          <div>
            <p className={ui.eyebrow}>Live backend demo</p>
            <h1 className={ui.pageTitle}>
              {activePage.label}
            </h1>
          </div>
          <div className={ui.headerActions}>
            <div className={ui.pulse}>
              <span className={ui.pulseDot} />
              <span className="min-w-0 truncate">{status}</span>
            </div>
            <button
              type="button"
              className={ui.accountButton}
              onClick={() => navigatePage("account")}
            >
              {user.photo ? <img alt="Profile" src={user.photo} /> : user.firstName?.[0] || "U"}
            </button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to={DEFAULT_AUTHENTICATED_PATH} replace />} />
          <Route path="/login" element={<Navigate to={destinationPath} replace />} />
          <Route path="/register" element={<Navigate to={destinationPath} replace />} />
          <Route
            path="/dashboard"
            element={
              <OverviewPage
                cvs={cvs}
                jobs={jobs}
                recommendations={recommendations}
                selectedCv={selectedCv}
                topScore={topScore}
                setActivePage={navigatePage}
                fetchJobs={fetchJobs}
                loadRecommendations={loadRecommendations}
                isBusy={isBusy}
              />
            }
          />
          <Route
            path="/cvs"
            element={
              <CvPage
                cvs={cvs}
                cvForm={cvForm}
                selectedCvId={selectedCvId}
                setCvForm={setCvForm}
                setSelectedCvId={setSelectedCvId}
                createCv={createCv}
                isBusy={isBusy}
              />
            }
          />
          <Route
            path="/jobs"
            element={
              <JobsPage
                filterForm={filterForm}
                setFilterForm={setFilterForm}
                selectedCv={selectedCv}
                jobs={jobs}
                fetchJobs={fetchJobs}
                filterJobs={filterJobs}
                loadRecommendations={loadRecommendations}
                isBusy={isBusy}
              />
            }
          />
          <Route
            path="/skill-gaps"
            element={
              <SkillGapPage
                jobs={jobs}
                recommendations={recommendations}
                selectedCv={selectedCv}
                setActivePage={navigatePage}
              />
            }
          />
          <Route
            path="/roadmap"
            element={
              <RoadmapPage
                jobs={jobs}
                recommendations={recommendations}
                selectedCv={selectedCv}
                analyzeGaps={analyzeGaps}
                analysisResult={analysisResult}
                matchResult={matchResult}
              />
            }
          />
          <Route
            path="/applications"
            element={
              <ApplicationsPage
                applications={applications}
                applicationStatuses={applicationStatuses}
                selectedCvId={selectedCvId}
                trackApplication={handleTrackApplication}
                updateApplicationStatus={handleUpdateApplicationStatus}
                setActivePage={navigatePage}
              />
            }
          />
          <Route
            path="/trends"
            element={
              <AnalyticsPage
                applications={applications}
                jobs={jobs}
                recommendations={recommendations}
                skillAnalytics={skillAnalytics}
                trendAnalytics={trendAnalytics}
                loadAnalytics={loadAnalytics}
              />
            }
          />
          <Route
            path="/insights"
            element={
              <InsightsPage
                matchForm={matchForm}
                setMatchForm={setMatchForm}
                runMatch={runMatch}
                analyzeGaps={analyzeGaps}
                findBestCv={findBestCv}
                matchResult={matchResult}
                analysisResult={analysisResult}
                bestCvResult={bestCvResult}
                recommendations={recommendations}
                skillAnalytics={skillAnalytics}
                trendAnalytics={trendAnalytics}
                loadAnalytics={loadAnalytics}
                isBusy={isBusy}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <AccountPage
                passport={passport}
                savePassport={savePassport}
                setPassport={setPassport}
                signOut={signOut}
                updateUser={updateUser}
                user={user}
                renderAvatar={renderAvatar}
                isBusy={isBusy}
              />
            }
          />
          <Route path="*" element={<Navigate to={DEFAULT_AUTHENTICATED_PATH} replace />} />
        </Routes>
      </main>
    </div>
  );
}
