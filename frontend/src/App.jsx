import React, { Suspense, useEffect, useState } from "react";
import {
  FiBarChart2, FiBriefcase, FiColumns, FiFileText,
  FiLayout, FiMap, FiTarget, FiUser, FiZap,
} from "react-icons/fi";
import { pages } from "./constants/appData";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Feature hooks
import { useToast } from "./features/shared/useToast";
import { useRunAction } from "./features/shared/useRunAction";
import { useAuth, getLoginPathFor } from "./features/auth/useAuth";
import { useCvs } from "./features/cv/useCvs";
import { useJobs } from "./features/jobs/useJobs";
import { useApplications } from "./features/applications/useApplications";
import { useAnalytics } from "./features/analytics/useAnalytics";
import { useGrowthPlan } from "./features/growth/useGrowthPlan";

// Services
import { createCvProfile, createCvVersion } from "./services/careerService";

// Shared UI
import { ToastList } from "./components/common/Toast";
import { ui } from "./styles/ui";

// Pages (lazy loaded)
const AiInsightsPage = React.lazy(() => import("./pages/AiInsightsPage"));
const ApplicationTrackerPage = React.lazy(() => import("./pages/ApplicationTrackerPage"));
const AuthPage = React.lazy(() => import("./pages/AuthPage"));
const GrowthPlanPage = React.lazy(() => import("./pages/GrowthPlanPage"));
const JobsPage = React.lazy(() => import("./pages/JobsPage"));
const MarketSignalsPage = React.lazy(() => import("./pages/MarketSignalsPage"));
const MyCvsPage = React.lazy(() => import("./pages/MyCvsPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
const OverviewPage = React.lazy(() => import("./pages/OverviewPage"));
const PassportOnboarding = React.lazy(() => import("./pages/PassportOnboarding"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const SkillMapPage = React.lazy(() => import("./pages/SkillMapPage"));
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
const pageById = Object.fromEntries(pages.map((page) => [page.id, page]));
const protectedPaths = pages.map((page) => page.path);

function isProtectedPath(pathname) {
  return protectedPaths.includes(pathname);
}

function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8E3D7] border-t-[#0E0E10]"
        aria-label="Loading page"
        role="status"
      />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Cross-cutting concerns
  const { toasts, addToast, removeToast, setStatus } = useToast();
  const { pendingAction, runAction, showLoadingBar } = useRunAction({ addToast });

  // Feature hooks
  const auth = useAuth({ runAction, setStatus });
  const cvs = useCvs({ user: auth.user, passport: auth.passport, runAction, setStatus });
  const jobs = useJobs({ user: auth.user, selectedCvId: cvs.selectedCvId, runAction, setStatus });
  const applications = useApplications({
    user: auth.user,
    selectedCvId: cvs.selectedCvId,
    runAction,
    setStatus,
  });
  const analytics = useAnalytics({ user: auth.user, runAction, setStatus });
  const growth = useGrowthPlan({
    selectedCv: cvs.selectedCv,
    jobs: jobs.jobs,
    recommendations: jobs.recommendations,
    runAction,
    setStatus,
  });

  const isBusy = Boolean(pendingAction) || auth.isSubmitting;
  const bestJobId = jobs.jobs[0]?._id || jobs.recommendations[0]?._id;
  const topScore = jobs.recommendations[0]?.matchScore ?? jobs.jobs[0]?.matchScore ?? 0;
  const applicationStatuses = ["Saved for Later", "Under Review", "Accepted", "Rejected"];

  const activePage = pages.find((page) => page.path === location.pathname) || pages[0];
  const pageTitle =
    isProtectedPath(location.pathname) || location.pathname === "/"
      ? activePage.label
      : "Page not found";

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Preload all page chunks immediately so Suspense never fires mid-navigation
  useEffect(() => {
    import("./pages/AiInsightsPage");
    import("./pages/ApplicationTrackerPage");
    import("./pages/GrowthPlanPage");
    import("./pages/JobsPage");
    import("./pages/MarketSignalsPage");
    import("./pages/MyCvsPage");
    import("./pages/NotFoundPage");
    import("./pages/OverviewPage");
    import("./pages/PassportOnboarding");
    import("./pages/ProfilePage");
    import("./pages/SkillMapPage");
  }, []);

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
    if (pageId === "roadmap") growth.setRoadmapIntent(null);
    smoothNavigate(pageById[pageId]?.path || DEFAULT_AUTHENTICATED_PATH);
  }

  function openRoadmap(intent = {}) {
    const { cvId, ...rest } = intent;
    if (cvId) cvs.setSelectedCvId(cvId);
    growth.setRoadmapIntent({
      source: "roadmap",
      selectedSkills: [],
      recommendedSkills: [],
      autoGenerate: false,
      label: "",
      ...rest,
    });
    smoothNavigate("/roadmap");
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

  // ── Auth gate: checking session ──────────────────────────────────────────
  if (!auth.authChecked) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F6F3EC] p-6">
        <p className={ui.loadingPill}>
          <span className={ui.loadingDot} />
          Checking session
        </p>
      </main>
    );
  }

  // ── Auth gate: unauthenticated ───────────────────────────────────────────
  if (!auth.user) {
    return (
      <div className="min-h-screen bg-[#F6F3EC]">
        <ToastList toasts={toasts} onRemove={removeToast} />
        <Routes>
          <Route
            path="/login"
            element={
              <AuthPage
                authForm={auth.authForm}
                authErrors={auth.authErrors}
                authMode={auth.currentAuthMode}
                isBusy={isBusy}
                setAuthForm={auth.setAuthForm}
                setAuthErrors={auth.setAuthErrors}
                setAuthMode={auth.changeAuthMode}
                submitAuth={auth.submitAuth}
              />
            }
          />
          <Route
            path="/register"
            element={
              <AuthPage
                authForm={auth.authForm}
                authErrors={auth.authErrors}
                authMode={auth.currentAuthMode}
                isBusy={isBusy}
                setAuthForm={auth.setAuthForm}
                setAuthErrors={auth.setAuthErrors}
                setAuthMode={auth.changeAuthMode}
                submitAuth={auth.submitAuth}
              />
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          {pages.map((page) => (
            <Route
              key={page.id}
              path={page.path}
              element={
                <Navigate
                  to={getLoginPathFor(location.pathname, location.search)}
                  replace
                />
              }
            />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    );
  }

  // ── Onboarding gate ──────────────────────────────────────────────────────
  if (auth.showOnboarding) {
    return (
      <>
        <ToastList toasts={toasts} onRemove={removeToast} />
        <PassportOnboarding
          isBusy={isBusy}
          passport={auth.passport}
          setPassport={auth.setPassport}
          savePassport={auth.savePassport}
          skipPassport={auth.skipPassport}
          user={auth.user}
        />
      </>
    );
  }

  // ── Authenticated shell ──────────────────────────────────────────────────
  return (
    <div className={ui.shell}>

      {showLoadingBar && (
        <div aria-hidden="true" className="lat-loading-bar-track">
          <div className="lat-loading-bar-fill" />
        </div>
      )}

      <ToastList toasts={toasts} onRemove={removeToast} />

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
                    style={({ isActive }) =>
                      isActive
                        ? { position: "relative", background: "var(--c-cobalt-50)", color: "var(--c-cobalt)" }
                        : {}
                    }
                    to={page.path}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span style={{
                            position: "absolute", left: -14, top: 6, bottom: 6,
                            width: 2, background: "var(--c-ink)", borderRadius: 1,
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
          href="/api-docs"
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
              {auth.user.photo ? (
                <img
                  alt="Profile"
                  className="h-full w-full object-cover"
                  src={auth.user.photo}
                />
              ) : (
                auth.user.firstName?.[0] || "U"
              )}
            </button>
          </div>
        </header>

        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<PageLoader />}>
            <div className="route-transition" key={location.pathname}>
              <Routes>
            <Route path="/" element={<Navigate to={DEFAULT_AUTHENTICATED_PATH} replace />} />
            <Route path="/login" element={<Navigate to={auth.destinationPath} replace />} />
            <Route path="/register" element={<Navigate to={auth.destinationPath} replace />} />

            <Route
              path="/dashboard"
              element={
                <OverviewPage
                  cvs={cvs.cvs}
                  jobs={jobs.jobs}
                  recommendations={jobs.recommendations}
                  selectedCv={cvs.selectedCv}
                  topScore={topScore}
                  setActivePage={navigatePage}
                  fetchJobs={jobs.fetchJobs}
                  loadRecommendations={jobs.loadRecommendations}
                  isBusy={isBusy}
                />
              }
            />

            <Route
              path="/cvs"
              element={
                <MyCvsPage
                  clearEditMode={cvs.clearEditMode}
                  compareCvId={cvs.compareCvId}
                  compareSelectedCvs={cvs.compareSelectedCvs}
                  createSelectedCvVersion={cvs.createSelectedCvVersion}
                  cvComparison={cvs.cvComparison}
                  cvForm={cvs.cvForm}
                  cvs={cvs.cvs}
                  deleteCv={cvs.handleDeleteCv}
                  editingCvId={cvs.editingCvId}
                  generateCvFromPassport={cvs.generateCvFromPassport}
                  isBusy={isBusy}
                  loadCvIntoForm={cvs.loadCvIntoForm}
                  onUploadSave={(payload) =>
                    runAction("Saving uploaded CV", async () => {
                      await createCvProfile(payload);
                      await cvs.loadCvs();
                      setStatus("CV saved from upload");
                    })
                  }
                  passport={auth.passport}
                  saveCv={cvs.saveCv}
                  selectedCv={cvs.selectedCv}
                  selectedCvId={cvs.selectedCvId}
                  setCompareCvId={cvs.setCompareCvId}
                  setCvForm={cvs.setCvForm}
                  setSelectedCvId={cvs.setSelectedCvId}
                  jobs={jobs.jobs}
                  onAiVersionSave={(sourceId, overrides) =>
                    runAction("Saving AI CV version", async () => {
                      await createCvVersion(sourceId, overrides);
                      await cvs.loadCvs();
                      setStatus("AI version saved");
                    })
                  }
                />
              }
            />

            <Route
              path="/jobs"
              element={
                <JobsPage
                  filterForm={jobs.filterForm}
                  setFilterForm={jobs.setFilterForm}
                  cvs={cvs.cvs}
                  selectedCv={cvs.selectedCv}
                  selectedCvId={cvs.selectedCvId}
                  setSelectedCvId={cvs.setSelectedCvId}
                  jobs={jobs.jobs}
                  jobsSyncedAt={jobs.jobsSyncedAt}
                  fetchJobs={jobs.fetchJobs}
                  filterJobs={jobs.filterJobs}
                  loadRecommendations={jobs.loadRecommendations}
                  resetJobFilters={jobs.resetJobFilters}
                  trackApplication={applications.handleTrackApplication}
                  isBusy={isBusy}
                />
              }
            />

            <Route
              path="/skill-gaps"
              element={
                <SkillMapPage
                  jobs={jobs.jobs}
                  openRoadmap={openRoadmap}
                  recommendations={jobs.recommendations}
                  selectedCv={cvs.selectedCv}
                  setActivePage={navigatePage}
                />
              }
            />

            <Route
              path="/roadmap"
              element={
                <GrowthPlanPage
                  jobs={jobs.jobs}
                  recommendations={jobs.recommendations}
                  selectedCv={cvs.selectedCv}
                  analyzeGaps={growth.analyzeGaps}
                  matchResult={growth.matchResult}
                  onRoadmapIntentConsumed={() => growth.setRoadmapIntent(null)}
                  roadmapIntent={growth.roadmapIntent}
                  roadmapStorageUserId={auth.user?.email || auth.user?._id || auth.user?.id}
                  setStatus={setStatus}
                  skillAnalytics={analytics.skillAnalytics}
                />
              }
            />

            <Route
              path="/applications"
              element={
                <ApplicationTrackerPage
                  applications={applications.applications}
                  applicationStatuses={applicationStatuses}
                  deleteApplication={applications.handleDeleteApplication}
                  loadSimilarApplications={applications.loadSimilarApplications}
                  similarApplications={applications.similarApplications}
                  updateApplicationStatus={applications.handleUpdateApplicationStatus}
                  setActivePage={navigatePage}
                />
              }
            />

            <Route
              path="/trends"
              element={
                <MarketSignalsPage
                  applications={applications.applications}
                  jobs={jobs.jobs}
                  recommendations={jobs.recommendations}
                  skillAnalytics={analytics.skillAnalytics}
                  trendAnalytics={analytics.trendAnalytics}
                  loadAnalytics={analytics.loadAnalytics}
                  openRoadmap={openRoadmap}
                />
              }
            />

            <Route
              path="/insights"
              element={
                <AiInsightsPage
                  applications={applications.applications}
                  bestCvResult={growth.bestCvResult}
                  cvs={cvs.cvs}
                  findBestCv={() => growth.findBestCv(bestJobId)}
                  isBusy={isBusy}
                  jobs={jobs.jobs}
                  matchResult={growth.matchResult}
                  openRoadmap={openRoadmap}
                  recommendations={jobs.recommendations}
                  runInsightMatch={growth.runInsightMatch}
                  skillAnalytics={analytics.skillAnalytics}
                  successScore={growth.successScore}
                  trendAnalytics={analytics.trendAnalytics}
                  loadAnalytics={analytics.loadAnalytics}
                />
              }
            />

            <Route
              path="/profile"
              element={
                <ProfilePage
                  passport={auth.passport}
                  savePassport={auth.savePassport}
                  setPassport={auth.setPassport}
                  signOut={auth.signOut}
                  updateUser={auth.updateUser}
                  user={auth.user}
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
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
