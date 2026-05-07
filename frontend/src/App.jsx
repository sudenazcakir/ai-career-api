import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBarChart2, FiBriefcase, FiColumns, FiFileText,
  FiLayout, FiMap, FiTarget, FiUser, FiZap,
} from "react-icons/fi";
import {
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
import NotFoundPage from "./pages/NotFoundPage";
import OverviewPage from "./pages/OverviewPage";
import PassportOnboarding from "./pages/PassportOnboarding";
import RoadmapPage from "./pages/RoadmapPage";
import SkillGapPage, { buildSkillGaps } from "./pages/SkillGapPage";
import { ToastList } from "./components/common/Toast";
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
  calculateFullMatch,
  compareCvProfiles,
  createCvProfile,
  createCvVersion,
  fetchJobsFromAdzuna,
  filterJobsByQuery,
  getBestCv,
  getSuccessScore,
  getSkillAnalytics,
  getTrendAnalytics,
  deleteCv,
  generateCv,
  getSimilarApplications,
  listApplications,
  listCvs,
  trackApplication,
  updateApplicationStatus,
  updateCv,
} from "./services/careerService";
import { ui } from "./styles/ui";
import {
  friendlyErrorMessage,
  inferExpectedPatternError,
  normalizePhoneNumber,
  normalizePassportForAI,
  splitLines,
  splitSkills,
  validateAuthForm,
} from "./utils/validation";

const NAV_ICONS = {
  overview:     FiLayout,
  jobs:         FiBriefcase,
  cv:           FiFileText,
  skillgap:     FiTarget,
  roadmap:      FiMap,
  applications: FiColumns,
  analytics:    FiBarChart2,
  insights:     FiZap,
  account:      FiUser,
};

const DEFAULT_AUTHENTICATED_PATH = "/dashboard";
const DEFAULT_FILTER_FORM = {
  keyword: "",
  skill: "",
  minMatch: "",
  sort: "newest",
  company: "",
  location: "",
  remoteType: "",
  seniority: "",
  salaryMin: "",
  maxSkillGap: "",
  level: "",
};
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
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState(emptyUser);
  const [authErrors, setAuthErrors] = useState({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [passport, setPassport] = useState(emptyPassport);
  const [cvs, setCvs] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState("");
  const [compareCvId, setCompareCvId] = useState("");
  const [editingCvId, setEditingCvId] = useState(null);
  const [cvComparison, setCvComparison] = useState(null);
  const [cvForm, setCvForm] = useState({
    title: "Backend CV",
    type: "Backend",
    version: "v1",
    summary: "",
    skills: "Java, SQL",
    projects: "",
    experience: "",
    education: "",
    certifications: "",
  });
  const [filterForm, setFilterForm] = useState(DEFAULT_FILTER_FORM);
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [roadmapIntent, setRoadmapIntent] = useState(null);
  const [bestCvResult, setBestCvResult] = useState(null);
  const [successScore, setSuccessScore] = useState(null);
  const [skillAnalytics, setSkillAnalytics] = useState(null);
  const [trendAnalytics, setTrendAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [similarApplications, setSimilarApplications] = useState([]);
  const [pendingAction, setPendingAction] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [jobsSyncedAt, setJobsSyncedAt] = useState(null);
  const [showLoadingBar, setShowLoadingBar] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastTimersRef = useRef({});

  const loadingBarTimerRef = useRef(null);
  const jobsAutoSyncDoneRef = useRef(false);
  const similarApplicationsLoadedRef = useRef(false);

  function addToast(message, type = "info") {
    if (!message) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    const duration = type === "error" ? 5000 : 3000;
    toastTimersRef.current[id] = setTimeout(() => removeToast(id), duration);
  }

  function removeToast(id) {
    clearTimeout(toastTimersRef.current[id]);
    delete toastTimersRef.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function setStatus(message) {
    if (!message || message === "System ready") return;
    const lower = message.toLowerCase();
    const isBlank = lower.startsWith("no ") || lower.includes("no jobs");
    const isError = !isBlank &&
      /select|choose|couldn't|could not|failed|invalid|not found|expired|cannot|rejected|load jobs|fill in|error/i
        .test(lower);
    const isSuccess = !isError && !isBlank &&
      /ready|created|updated|deleted|saved|tracked|loaded|imported|ranked|signed|calculated|complete|found/i
        .test(lower);
    addToast(message, isError ? "error" : isSuccess ? "success" : "info");
  }

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
  const pageTitle = isProtectedPath(location.pathname) || location.pathname === "/"
    ? activePage.label
    : "Page not found";
  const redirectPath = getSafeRedirect(searchParams);
  const destinationPath = isProtectedPath(location.pathname)
    ? `${location.pathname}${location.search}`
    : redirectPath;
  const currentAuthMode = location.pathname === "/login" ? "login" : "register";

  function smoothNavigate(to, options) {
    const currentPath = `${location.pathname}${location.search}`;
    if (to === currentPath || to === location.pathname) return;
    navigate(to, options);
  }

  function handleRouteClick(event, to) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    smoothNavigate(to);
  }

  function navigatePage(pageId) {
    if (pageId === "roadmap") setRoadmapIntent(null);
    smoothNavigate(pageById[pageId]?.path || DEFAULT_AUTHENTICATED_PATH);
  }

  function openRoadmap(intent = {}) {
    const { cvId, ...rest } = intent;
    if (cvId) setSelectedCvId(cvId);
    setRoadmapIntent({
      source: "roadmap",
      selectedSkills: [],
      recommendedSkills: [],
      autoGenerate: false,
      label: "",
      ...rest,
    });
    smoothNavigate("/roadmap");
  }

  function changeAuthMode(nextMode) {
    setAuthErrors({});
    smoothNavigate(`${nextMode === "login" ? "/login" : "/register"}${location.search}`, {
      replace: true,
    });
  }

  async function loadCvs() {
    const data = await listCvs();
    const nextCvs = data.data || [];
    setCvs(nextCvs);
    if (!selectedCvId && nextCvs[0]?._id) setSelectedCvId(nextCvs[0]._id);
    if (!compareCvId && nextCvs[1]?._id) setCompareCvId(nextCvs[1]._id);
  }

  async function loadApplications() {
    const data = await listApplications();
    setApplications(data.data || []);
  }

  function loadSimilarApplications() {
    runAction("Finding similar roles", async () => {
      const data = await getSimilarApplications();
      setSimilarApplications(data.data || []);
      setStatus(`${data.data?.length || 0} similar roles found`);
    });
  }

  function loadCvIntoForm(cv) {
    setCvForm({
      title: cv.title || "",
      type: cv.type || "",
      version: cv.version || "",
      summary: cv.summary || "",
      skills: (cv.skills || []).join(", "),
      projects: (cv.projects || []).join("\n"),
      experience: (cv.experience || []).join("\n"),
      education: (cv.education || []).join("\n"),
      certifications: (cv.certifications || []).join("\n"),
    });
    setEditingCvId(cv._id);
    setSelectedCvId(cv._id);
  }

  function clearEditMode() {
    setEditingCvId(null);
    setCvForm({
      title: "Backend CV",
      type: "Backend",
      version: "v1",
      summary: "",
      skills: "Java, SQL",
      projects: "",
      experience: "",
      education: "",
      certifications: "",
    });
  }

  function handleTrackApplication(jobOrJobId, cvIdOrStatus, nextStatus = "Under Review") {
    const status = applicationStatuses.includes(cvIdOrStatus)
      ? cvIdOrStatus
      : nextStatus;
    const jobId = typeof jobOrJobId === "object" ? jobOrJobId?._id : jobOrJobId;
    const cvId = applicationStatuses.includes(cvIdOrStatus)
      ? selectedCvId
      : cvIdOrStatus || selectedCvId;

    if (!jobId) {
      setStatus("Couldn't determine job ID for this role");
      return false;
    }
    if (!cvId) {
      setStatus("Select a CV first");
      return false;
    }

    return runAction(status === "Saved for Later" ? "Saving for later" : "Tracking application", async () => {
      await trackApplication({ jobId, cvId, status });
      await loadApplications();
      setStatus(status === "Saved for Later" ? "Saved for later" : "Application tracked");
      return true;
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

    const normalizedAuthForm = {
      ...authForm,
      phoneNumber: normalizePhoneNumber(authForm.phoneNumber),
    };
    const nextErrors = validateAuthForm(normalizedAuthForm, currentAuthMode);
    setAuthErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    const payload =
      currentAuthMode === "login"
        ? { email: normalizedAuthForm.email, password: normalizedAuthForm.password }
        : normalizedAuthForm;

    try {
      setPendingAction(currentAuthMode);
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
        return;
      }
      if (String(error.message || "").toLowerCase().includes("expected pattern")) {
        const inferredErrors = inferExpectedPatternError(normalizedAuthForm);
        setAuthErrors(inferredErrors);
        return;
      }
      const message = friendlyErrorMessage(error.message);
      setStatus(message);
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

  // Show a loading bar after 2s for any long-running action
  useEffect(() => {
    if (pendingAction) {
      loadingBarTimerRef.current = setTimeout(() => setShowLoadingBar(true), 2000);
    } else {
      clearTimeout(loadingBarTimerRef.current);
      setShowLoadingBar(false);
    }
    return () => clearTimeout(loadingBarTimerRef.current);
  }, [pendingAction]);

  // Cleanup pending toast timers on unmount
  useEffect(() => {
    return () => {
      Object.values(toastTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Auto-load analytics on first visit to /trends or /insights
  useEffect(() => {
    if (!user || (skillAnalytics && trendAnalytics)) return;
    if (location.pathname !== "/trends" && location.pathname !== "/insights") return;

    Promise.all([getSkillAnalytics(), getTrendAnalytics()])
      .then(([skills, trends]) => {
        setSkillAnalytics(skills);
        setTrendAnalytics(trends);
      })
      .catch((e) => {
        if (e?.status !== 401) setStatus(`Could not load analytics: ${e.message}`);
      });
  }, [location.pathname, user, skillAnalytics, trendAnalytics]);

  // Hydrate jobs from the database once per signed-in session so dependent pages
  // keep working after refresh without forcing an Adzuna sync.
  useEffect(() => {
    if (!user || jobs.length > 0 || jobsAutoSyncDoneRef.current) return;
    jobsAutoSyncDoneRef.current = true;

    const params = new URLSearchParams({ sort: "newest" });

    filterJobsByQuery(params)
      .then((data) => {
        const dbJobs = data.data || [];
        setJobs(dbJobs);
        if (dbJobs.length > 0) {
          setJobsSyncedAt(new Date());
          if (location.pathname === "/jobs") setStatus(`${dbJobs.length} jobs loaded`);
        } else if (location.pathname === "/jobs") {
          setStatus("No jobs loaded. Use Sync to import jobs.");
        }
      })
      .catch((e) => {
        if (e?.status !== 401) setStatus(`Could not load jobs: ${e.message}`);
      });
  }, [jobs.length, location.pathname, user]);

  // Auto-load similar roles on first visit to /applications
  useEffect(() => {
    if (!user || location.pathname !== "/applications" || similarApplicationsLoadedRef.current) return;
    similarApplicationsLoadedRef.current = true;

    getSimilarApplications()
      .then((data) => setSimilarApplications(data.data || []))
      .catch((e) => {
        if (e?.status !== 401) setStatus(`Could not load similar roles: ${e.message}`);
      });
  }, [location.pathname, user]);

  async function runAction(label, action) {
    try {
      setPendingAction(label);
      const result = await action();
      return result ?? true;
    } catch (error) {
      if (error.status === 401) return false; // handler already fired via setUnauthorizedHandler
      addToast(error.message, "error");
      return false;
    } finally {
      setPendingAction("");
    }
  }

  function saveCv(event) {
    event.preventDefault();
    const payload = {
      title: cvForm.title,
      type: cvForm.type,
      version: cvForm.version,
      summary: cvForm.summary,
      skills: splitSkills(cvForm.skills),
      projects: splitLines(cvForm.projects),
      experience: splitLines(cvForm.experience),
      education: splitLines(cvForm.education),
      certifications: splitLines(cvForm.certifications),
    };

    if (editingCvId) {
      runAction("Updating CV", async () => {
        await updateCv(editingCvId, payload);
        await loadCvs();
        setEditingCvId(null);
        setStatus("CV updated");
      });
    } else {
      runAction("Creating CV profile", async () => {
        const data = await createCvProfile(payload);
        setSelectedCvId(data.data._id);
        await loadCvs();
        setStatus("CV profile created");
      });
    }
  }

  function createSelectedCvVersion() {
    if (!selectedCvId) {
      setStatus("Select a CV first");
      return;
    }

    runAction("Creating CV version", async () => {
      const data = await createCvVersion(selectedCvId);
      setSelectedCvId(data.data._id);
      await loadCvs();
      setStatus("CV version created");
    });
  }

  function compareSelectedCvs() {
    if (!selectedCvId || !compareCvId) {
      setStatus("Select two CVs to compare");
      return;
    }
    if (selectedCvId === compareCvId) {
      setStatus("Choose a different CV to compare");
      return;
    }

    runAction("Comparing CV versions", async () => {
      const data = await compareCvProfiles(selectedCvId, compareCvId);
      setCvComparison(data.data);
      setStatus("CV comparison ready");
    });
  }

  function handleDeleteCv(cvId) {
    runAction("Deleting CV", async () => {
      await deleteCv(cvId);
      if (editingCvId === cvId) setEditingCvId(null);
      if (compareCvId === cvId) setCompareCvId("");
      const data = await listCvs();
      const nextCvs = data.data || [];
      setCvs(nextCvs);
      if (selectedCvId === cvId) {
        const next = nextCvs.find((cv) => cv._id !== cvId);
        setSelectedCvId(next?._id || "");
      }
      setStatus("CV deleted");
    });
  }

  function generateCvFromPassport() {
    if (!passport?.skills && !passport?.targetTitle && !passport?.experience) {
      setStatus("Fill in your Career Passport first (at least Skills or Target role)");
      return;
    }
    runAction("Generating CV draft from passport", async () => {
      const normalizedPassport = normalizePassportForAI(passport);
      const data = await generateCv({
        passport: normalizedPassport,
        targetField: passport.targetTitle ? "Auto" : "Backend",
      });
      const draft = data.data;
      setCvForm({
        title: draft.title || "",
        type: draft.type || "General",
        version: draft.version || "v1",
        summary: draft.summary || "",
        skills: (draft.skills || []).join(", "),
        projects: (draft.projects || []).join("\n"),
        experience: (draft.experience || []).join("\n"),
        education: (draft.education || []).join("\n"),
        certifications: (draft.certifications || []).join("\n"),
      });
      setEditingCvId(null);
      setStatus("CV draft ready");
    });
  }

  function fetchJobs() {
    runAction("Fetching jobs from Adzuna", async () => {
      const data = await fetchJobsFromAdzuna();
      const params = new URLSearchParams({ sort: "newest" });
      const loadedJobs = await filterJobsByQuery(params);
      setJobs(loadedJobs.data || []);
      setJobsSyncedAt(new Date());
      setStatus(
        `Jobs imported: ${data.imported || 0} new, ${data.updated || 0} updated. ${loadedJobs.data?.length || 0} jobs loaded.`
      );
    });
  }

  function filterJobs(event) {
    event?.preventDefault();
    runAction("Filtering jobs from database", async () => {
      const needsCvContext =
        Boolean(filterForm.minMatch) ||
        Boolean(filterForm.maxSkillGap) ||
        Boolean(filterForm.level) ||
        filterForm.sort === "score" ||
        filterForm.sort === "gaps" ||
        filterForm.sort === "potential";

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
      const params = new URLSearchParams({
        cvId: selectedCvId,
        sort: "score",
      });
      const data = await filterJobsByQuery(params);
      const rankedJobs = data.data || [];
      setJobs(rankedJobs);
      setRecommendations(rankedJobs.slice(0, 10));
      setFilterForm((current) => ({ ...current, sort: "score" }));
      setStatus(`${rankedJobs.length} jobs ranked`);
    });
  }

  function resetJobFilters() {
    const nextFilterForm = { ...DEFAULT_FILTER_FORM };
    setFilterForm(nextFilterForm);

    runAction("Resetting job filters", async () => {
      const params = new URLSearchParams({ sort: nextFilterForm.sort });
      if (selectedCvId) params.set("cvId", selectedCvId);
      const data = await filterJobsByQuery(params);
      setJobs(data.data || []);
      setStatus(`${data.data?.length || 0} jobs loaded`);
    });
  }

  function findBestCv(jobId = bestJobId) {
    if (!jobId) {
      setStatus("Select a job first");
      return;
    }

    runAction("Finding best CV for selected job", async () => {
      const data = await getBestCv(jobId);
      setBestCvResult(data);
      setStatus("Best CV calculated");
    });
  }

  function runInsightMatch(cvId, jobId) {
    if (!cvId || !jobId) {
      setStatus("Select a CV and a job first");
      return;
    }
    runAction("Calculating match", async () => {
      const [matchData, scoreData] = await Promise.all([
        calculateFullMatch({ cvId, jobId }),
        getSuccessScore({ cvId, jobId }),
      ]);
      setMatchResult(matchData);
      setSuccessScore(scoreData);
      setStatus("Match ready");
    });
  }

  function analyzeGaps(selectedSkills = []) {
    const allJobs = [...jobs, ...recommendations].filter((job) => job?._id);
    const uniqueJobs = [...new Map(allJobs.map((job) => [job._id, job])).values()];
    const marketMissingSkills = buildSkillGaps(uniqueJobs, selectedCv?.skills).map(
      (gap) => gap.skill
    );
    const explicitSkills = Array.isArray(selectedSkills)
      ? selectedSkills.map((skill) => String(skill || "").trim()).filter(Boolean)
      : [];
    const missingSkills = explicitSkills.length
      ? explicitSkills
      : matchResult?.missingSkills?.length
      ? matchResult.missingSkills
      : marketMissingSkills;

    if (!selectedCv) {
      setStatus("Select a CV first");
      return;
    }

    if (!explicitSkills.length && !uniqueJobs.length) {
      setStatus("Load jobs before building a roadmap");
      return;
    }

    if (!missingSkills.length) {
      setStatus("No skill gaps found for this CV");
      setAnalysisResult(null);
      return;
    }

    runAction("Building learning roadmap", async () => {
      const data = await buildRoadmap({
        missingSkills,
      });

      const visibleMilestones = Math.min(missingSkills.length, 4);
      const visibleTasks = visibleMilestones * 4;
      setAnalysisResult(data);
      setStatus(`Roadmap ready: ${visibleMilestones} skills, ${visibleTasks} tasks`);
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
      <main className="grid min-h-screen place-items-center bg-[#F6F3EC] p-6">
        <p className={ui.loadingPill}>
          <span className={ui.loadingDot} />
          Checking session
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F6F3EC]">
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
              />
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          {pages.map((page) => (
            <Route
              element={
                <Navigate
                  to={getLoginPathFor(location.pathname, location.search)}
                  replace
                />
              }
              key={page.id}
              path={page.path}
            />
          ))}
          <Route
            path="*"
            element={
              <NotFoundPage />
            }
          />
        </Routes>
      </div>
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

      {/* Loading bar — appears after 2 s of any pending action */}
      {showLoadingBar && (
        <div aria-hidden="true" className="lat-loading-bar-track">
          <div className="lat-loading-bar-fill" />
        </div>
      )}

      <ToastList toasts={toasts} onRemove={removeToast} />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          aria-hidden="true"
          className={ui.sidebarOverlay}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={`${ui.sidebar} ${mobileSidebarOpen ? ui.sidebarOpen : ""}`}>
        {/* Brand */}
        <div className={ui.brand}>
          {/* Lattice 2×2 grid mark */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="8" height="8" fill="#0E0E10"/>
            <rect x="11" y="1" width="8" height="8" fill="none" stroke="#E8E3D7" strokeWidth="1.2"/>
            <rect x="1" y="11" width="8" height="8" fill="none" stroke="#E8E3D7" strokeWidth="1.2"/>
            <rect x="11" y="11" width="8" height="8" fill="#0E0E10"/>
          </svg>
          <strong style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--c-ink)" }}>
            Lattice
          </strong>
          <button
            aria-label="Close navigation"
            className={ui.sidebarClose}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className={ui.nav}>
          {[
            { label: "WORKSPACE", section: "workspace" },
            { label: "GROWTH",    section: "growth" },
            { label: "APPLY",     section: "apply" },
          ].map(({ label, section }) => (
            <div key={section} className="mb-3">
              <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6B72]"
                 style={{ fontFamily: "var(--font-mono)" }}>
                {label}
              </p>
              {pages.filter((p) => p.section === section).map((page) => {
                const Icon = NAV_ICONS[page.id];
                return (
                  <NavLink
                    className={({ isActive }) =>
                      `${ui.navButton} ${isActive ? ui.navButtonActive : ""}`
                    }
                    key={page.id}
                    onClick={(event) => handleRouteClick(event, page.path)}
                    style={({ isActive }) => isActive
                      ? { position: "relative", background: "var(--c-cobalt-50)", color: "var(--c-cobalt)" }
                      : {}}
                    to={page.path}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span style={{
                            position: "absolute", left: -14, top: 6, bottom: 6,
                            width: 2, background: "var(--c-cobalt)", borderRadius: 1,
                          }} />
                        )}
                        {Icon && (
                          <Icon
                            size={15}
                            strokeWidth={1.5}
                            style={{ flexShrink: 0, opacity: isActive ? 1 : 0.65 }}
                          />
                        )}
                        {page.label}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <a
          className={ui.docLink}
          href={`${getBackendOrigin()}/api-docs`}
          target="_blank"
          rel="noreferrer"
        >
          API docs
        </a>
      </aside>

      <main className={ui.workspace}>
        <header className={ui.header}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open navigation"
              className={ui.hamburger}
              onClick={() => setMobileSidebarOpen(true)}
            >
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
                <path d="M0 1h16M0 6h16M0 11h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="min-w-0">
              <p className={ui.eyebrow}>AI Career OS</p>
              <h1 className={ui.pageTitle}>{pageTitle}</h1>
            </div>
          </div>
          <div className={ui.headerActions}>
            <button
              type="button"
              className={ui.accountButton}
              onClick={() => navigatePage("account")}
            >
              {user.photo ? (
                <img
                  alt="Profile"
                  className="h-full w-full object-cover"
                  src={user.photo}
                />
              ) : (
                user.firstName?.[0] || "U"
              )}
            </button>
          </div>
        </header>

        <div className="route-transition" key={location.pathname}>
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
                  clearEditMode={clearEditMode}
                  compareCvId={compareCvId}
                  compareSelectedCvs={compareSelectedCvs}
                  createSelectedCvVersion={createSelectedCvVersion}
                  cvComparison={cvComparison}
                  cvForm={cvForm}
                  cvs={cvs}
                  deleteCv={handleDeleteCv}
                  editingCvId={editingCvId}
                  generateCvFromPassport={generateCvFromPassport}
                  isBusy={isBusy}
                  loadCvIntoForm={loadCvIntoForm}
                  passport={passport}
                  saveCv={saveCv}
                  selectedCv={selectedCv}
                  selectedCvId={selectedCvId}
                  setCompareCvId={setCompareCvId}
                  setCvForm={setCvForm}
                  setSelectedCvId={setSelectedCvId}
                />
              }
            />
            <Route
              path="/jobs"
              element={
                <JobsPage
                  filterForm={filterForm}
                  setFilterForm={setFilterForm}
                  cvs={cvs}
                  selectedCv={selectedCv}
                  selectedCvId={selectedCvId}
                  setSelectedCvId={setSelectedCvId}
                  jobs={jobs}
                  jobsSyncedAt={jobsSyncedAt}
                  fetchJobs={fetchJobs}
                  filterJobs={filterJobs}
                  loadRecommendations={loadRecommendations}
                  resetJobFilters={resetJobFilters}
                  trackApplication={handleTrackApplication}
                  isBusy={isBusy}
                />
              }
            />
            <Route
              path="/skill-gaps"
              element={
                <SkillGapPage
                  jobs={jobs}
                  openRoadmap={openRoadmap}
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
                  onRoadmapIntentConsumed={() => setRoadmapIntent(null)}
                  roadmapIntent={roadmapIntent}
                  roadmapStorageUserId={user?.email || user?._id || user?.id}
                />
              }
            />
            <Route
              path="/applications"
              element={
                <ApplicationsPage
                  applications={applications}
                  applicationStatuses={applicationStatuses}
                  loadSimilarApplications={loadSimilarApplications}
                  similarApplications={similarApplications}
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
                  applications={applications}
                  bestCvResult={bestCvResult}
                  cvs={cvs}
                  findBestCv={findBestCv}
                  isBusy={isBusy}
                  jobs={jobs}
                  matchResult={matchResult}
                  openRoadmap={openRoadmap}
                  recommendations={recommendations}
                  runInsightMatch={runInsightMatch}
                  skillAnalytics={skillAnalytics}
                  successScore={successScore}
                  trendAnalytics={trendAnalytics}
                  loadAnalytics={loadAnalytics}
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
            <Route
              path="*"
              element={<NotFoundPage isAuthenticated variant="shell" />}
            />
          </Routes>
        </div>

      </main>
    </div>
  );
}
