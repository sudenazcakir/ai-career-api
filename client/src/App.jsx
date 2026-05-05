import { useEffect, useMemo, useState } from "react";
import {
  defaultMatch,
  emptyPassport,
  emptyUser,
  pages,
} from "./constants/appData";
import AccountPage from "./pages/AccountPage";
import AuthPage from "./pages/AuthPage";
import CvPage from "./pages/CvPage";
import InsightsPage from "./pages/InsightsPage";
import JobsPage from "./pages/JobsPage";
import OverviewPage from "./pages/OverviewPage";
import PassportOnboarding from "./pages/PassportOnboarding";
import { getBackendOrigin } from "./services/api";
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
  listCvs,
} from "./services/careerService";
import { ui } from "./styles/ui";
import { firstError, splitSkills, validateAuthForm } from "./utils/validation";

export default function App() {
  const [activePage, setActivePage] = useState("overview");
  const [status, setStatus] = useState("System ready");
  const [authMode, setAuthMode] = useState("register");
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
    minMatch: "50",
    sort: "score",
  });
  const [matchForm, setMatchForm] = useState(defaultMatch);
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [bestCvResult, setBestCvResult] = useState(null);
  const [skillAnalytics, setSkillAnalytics] = useState(null);
  const [trendAnalytics, setTrendAnalytics] = useState(null);
  const [pendingAction, setPendingAction] = useState("");

  const selectedCv = useMemo(
    () => cvs.find((cv) => cv._id === selectedCvId),
    [cvs, selectedCvId]
  );
  const bestJobId = jobs[0]?._id || recommendations[0]?._id;
  const topScore = recommendations[0]?.matchScore ?? jobs[0]?.matchScore ?? 0;
  const isBusy = Boolean(pendingAction);

  async function loadCvs() {
    const data = await listCvs();
    const nextCvs = data.data || [];
    setCvs(nextCvs);

    if (!selectedCvId && nextCvs[0]?._id) {
      setSelectedCvId(nextCvs[0]._id);
    }
  }

  function applyAuthSession(data) {
    localStorage.setItem("authToken", data.token);
    setUser(data.user);
    setPassport(data.user.passport || emptyPassport);
    setShowOnboarding(!data.user.passportCompleted);
  }

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    getCurrentUser()
      .then((data) => {
        setUser(data.data);
        setPassport(data.data.passport || emptyPassport);
        setShowOnboarding(!data.data.passportCompleted);
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        setUser(null);
      });
  }, []);

  useEffect(() => {
    if (user) {
      loadCvs().catch((error) => setStatus(error.message));
    }
  }, [user]);

  async function submitAuth(event) {
    event.preventDefault();

    const nextErrors = validateAuthForm(authForm, authMode);
    setAuthErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus(firstError(nextErrors));
      return;
    }

    const payload =
      authMode === "login"
        ? { email: authForm.email, password: authForm.password }
        : authForm;

    try {
      setPendingAction(authMode);
      setStatus(authMode === "login" ? "Signing in" : "Creating account");
      const data =
        authMode === "login" ? await loginUser(payload) : await registerUser(payload);
      applyAuthSession(data);
      setStatus(authMode === "login" ? "Signed in" : "Account created");
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
    setActivePage("overview");
    setStatus("Signed out");
  }

  async function runAction(label, action) {
    try {
      setPendingAction(label);
      setStatus(label);
      await action();
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem("authToken");
        setUser(null);
        setShowOnboarding(false);
        setStatus("Session expired. Please sign in again.");
        return;
      }

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
      setStatus(data.message || "Jobs fetched and saved");
    });
  }

  function filterJobs(event) {
    event?.preventDefault();
    runAction("Filtering jobs from database", async () => {
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

  if (!user) {
    return (
      <AuthPage
        authForm={authForm}
        authErrors={authErrors}
        authMode={authMode}
        isBusy={isBusy}
        setAuthForm={setAuthForm}
        setAuthErrors={setAuthErrors}
        setAuthMode={setAuthMode}
        submitAuth={submitAuth}
        status={status}
      />
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
          {pages.map((page) => (
            <button
              className={`${ui.navButton} ${activePage === page.id ? ui.navButtonActive : ""}`}
              key={page.id}
              onClick={() => setActivePage(page.id)}
              type="button"
            >
              {page.label}
            </button>
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
              {pages.find((page) => page.id === activePage)?.label}
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
              onClick={() => setActivePage("account")}
            >
              {user.photo ? <img alt="Profile" src={user.photo} /> : user.firstName?.[0] || "U"}
            </button>
          </div>
        </header>

        {activePage === "overview" && (
          <OverviewPage
            cvs={cvs}
            jobs={jobs}
            recommendations={recommendations}
            selectedCv={selectedCv}
            topScore={topScore}
            setActivePage={setActivePage}
            fetchJobs={fetchJobs}
            loadRecommendations={loadRecommendations}
            isBusy={isBusy}
          />
        )}

        {activePage === "cv" && (
          <CvPage
            cvs={cvs}
            cvForm={cvForm}
            selectedCvId={selectedCvId}
            setCvForm={setCvForm}
            setSelectedCvId={setSelectedCvId}
            createCv={createCv}
            isBusy={isBusy}
          />
        )}

        {activePage === "jobs" && (
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
        )}

        {activePage === "insights" && (
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
        )}

        {activePage === "account" && (
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
        )}
      </main>
    </div>
  );
}
