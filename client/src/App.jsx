import { useEffect, useMemo, useState } from "react";
import {
  FiGrid, FiFileText, FiBriefcase, FiList, FiBarChart2,
  FiUser, FiPieChart, FiTarget, FiMap,
} from "react-icons/fi";

import { apiRequest, getBackendOrigin, splitSkills, countryCodes } from "./utils";
import OverviewPage      from "./pages/OverviewPage";
import CvPage            from "./pages/CvPage";
import JobsPage          from "./pages/JobsPage";
import ApplicationsPage  from "./pages/ApplicationsPage";
import InsightsPage      from "./pages/InsightsPage";
import SkillGapPage      from "./pages/SkillGapPage";
import RoadmapPage       from "./pages/RoadmapPage";
import AnalyticsPage     from "./pages/AnalyticsPage";
import AccountPage       from "./pages/AccountPage";

// ─── Navigation ──────────────────────────────────────────────────────────────
const pages = [
  { id: "overview",     label: "Dashboard",   icon: FiGrid,      section: "workspace" },
  { id: "jobs",         label: "Jobs",         icon: FiBriefcase, section: "workspace" },
  { id: "cv",           label: "My CVs",       icon: FiFileText,  section: "workspace" },
  { id: "skillgap",     label: "Skill gaps",   icon: FiTarget,    section: "growth" },
  { id: "roadmap",      label: "Roadmap",      icon: FiMap,       section: "growth" },
  { id: "applications", label: "Applications", icon: FiList,      section: "apply" },
  { id: "analytics",    label: "Trends",       icon: FiPieChart,  section: "apply" },
  { id: "insights",     label: "AI Insights",  icon: FiBarChart2, section: "apply" },
  { id: "account",      label: "Profile",      icon: FiUser,      section: "apply" },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const defaultMatch   = { cvSkills: "Java, SQL", jobSkills: "Java, Docker, SQL" };
const applicationStatuses = ["Saved for Later", "Under Review", "Accepted", "Rejected"];

const emptyUser = {
  firstName: "", lastName: "", email: "",
  countryCode: "+90", phoneNumber: "", photo: "", password: "",
};

const emptyPassport = {
  targetTitle: "", school: "", department: "", graduationYear: "", gpa: "",
  location: "", interests: "", skills: "", languages: "", tools: "",
  experience: "", projects: "", certificates: "", achievements: "", summary: "",
  workStyle: "", salaryExpectation: "", availability: "",
  portfolio: "", linkedin: "", github: "",
};

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [activePage,          setActivePage]          = useState("overview");
  const [status,              setStatus]              = useState("System ready");
  const [toast,               setToast]               = useState("");
  const [authMode,            setAuthMode]            = useState("register");
  const [user,                setUser]                = useState(() => {
    const s = localStorage.getItem("careerUser");
    return s ? JSON.parse(s) : null;
  });
  const [authForm,            setAuthForm]            = useState(emptyUser);
  const [showOnboarding,      setShowOnboarding]      = useState(() =>
    localStorage.getItem("careerPassportSkipped") !== "true"
  );
  const [passport,            setPassport]            = useState(() => {
    const s = localStorage.getItem("careerPassport");
    return s ? JSON.parse(s) : emptyPassport;
  });
  const [cvs,                 setCvs]                 = useState([]);
  const [selectedCvId,        setSelectedCvId]        = useState("");
  const [cvForm,              setCvForm]              = useState({ title: "Backend CV", skills: "Java, SQL" });
  const [cvGeneratorForm,     setCvGeneratorForm]     = useState({ targetField: "Backend", jobId: "" });
  const [generatedCv,         setGeneratedCv]         = useState(null);
  const [filterForm,          setFilterForm]          = useState({ keyword: "developer", skill: "Java", minMatch: "50", sort: "score" });
  const [matchForm,           setMatchForm]           = useState(defaultMatch);
  const [jobs,                setJobs]                = useState([]);
  const [recommendations,     setRecommendations]     = useState([]);
  const [applications,        setApplications]        = useState([]);
  const [selectedJobDetail,   setSelectedJobDetail]   = useState(null);
  const [jobCvRankings,       setJobCvRankings]       = useState([]);
  const [jobCvRankingStatus,  setJobCvRankingStatus]  = useState("");
  const [matchResult,         setMatchResult]         = useState(null);
  const [analysisResult,      setAnalysisResult]      = useState(null);
  const [bestCvResult,        setBestCvResult]        = useState(null);
  const [successScore,        setSuccessScore]        = useState(null);
  const [cvSuggestions,       setCvSuggestions]       = useState(null);
  const [skillFrequency,      setSkillFrequency]      = useState([]);
  const [similarApplications, setSimilarApplications] = useState([]);

  const selectedCv = useMemo(
    () => cvs.find((cv) => cv._id === selectedCvId),
    [cvs, selectedCvId]
  );
  const availableJobs = useMemo(() => {
    const map = new Map();
    [...jobs, ...recommendations].forEach((j) => { if (j?._id) map.set(j._id, j); });
    return [...map.values()];
  }, [jobs, recommendations]);
  const bestJobId = jobs[0]?._id || recommendations[0]?._id;

  // ── Data loaders ────────────────────────────────────────────────────────────
  async function loadCvs() {
    const data = await apiRequest("/api/cvs");
    const next = data.data || [];
    setCvs(next);
    if (!selectedCvId && next[0]?._id) setSelectedCvId(next[0]._id);
  }

  async function loadApplications() {
    if (!user?.email) return;
    const data = await apiRequest(`/api/applications?userEmail=${encodeURIComponent(user.email)}`);
    setApplications(data.data || []);
  }

  useEffect(() => {
    if (user) {
      loadCvs().catch((e) => setStatus(e.message));
      loadApplications().catch((e) => setStatus(e.message));
    }
  }, [user]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  async function runAction(label, action) {
    try { setStatus(label); await action(); }
    catch (e) { setStatus(e.message); }
  }

  function notify(message) { setStatus(message); setToast(message); }

  function renderAvatar(sourceUser, className = "account-avatar") {
    if (sourceUser?.photo) return <img alt="Profile" className={className} src={sourceUser.photo} />;
    return <div className={className}>{(sourceUser?.firstName?.[0] || "U").toUpperCase()}</div>;
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  function submitAuth(event) {
    event.preventDefault();
    if (authMode === "login") {
      const saved = localStorage.getItem("careerUser");
      const savedUser = saved ? JSON.parse(saved) : null;
      if (!savedUser || savedUser.email !== authForm.email) { setStatus("No account found for this email"); return; }
      setUser(savedUser);
      setStatus("Signed in");
      setShowOnboarding(localStorage.getItem("careerPassportSkipped") !== "true");
      return;
    }
    const nextUser = {
      firstName: authForm.firstName, lastName: authForm.lastName,
      email: authForm.email, countryCode: authForm.countryCode,
      phoneNumber: authForm.phoneNumber,
      phone: `${authForm.countryCode} ${authForm.phoneNumber}`, photo: "",
    };
    localStorage.setItem("careerUser", JSON.stringify(nextUser));
    setUser(nextUser); setStatus("Account created"); setShowOnboarding(true);
  }

  function updateUser(nextUser) {
    localStorage.setItem("careerUser", JSON.stringify(nextUser));
    setUser(nextUser); setStatus("Account updated");
  }

  function savePassport(nextPassport = passport) {
    localStorage.setItem("careerPassport", JSON.stringify(nextPassport));
    localStorage.setItem("careerPassportSkipped", "true");
    setPassport(nextPassport); setShowOnboarding(false); setStatus("Career Passport saved");
  }

  function skipPassport() {
    localStorage.setItem("careerPassportSkipped", "true");
    setShowOnboarding(false); setStatus("You can complete Career Passport later");
  }

  function signOut() { setUser(null); setActivePage("overview"); setStatus("Signed out"); }

  // ── CV actions ──────────────────────────────────────────────────────────────
  function createCv(event) {
    event.preventDefault();
    runAction("Creating CV profile", async () => {
      const data = await apiRequest("/api/cvs", {
        method: "POST",
        body: JSON.stringify({ title: cvForm.title, skills: splitSkills(cvForm.skills) }),
      });
      setSelectedCvId(data.data._id); await loadCvs(); setStatus("CV profile created");
    });
  }

  function generateTailoredCv(event) {
    event.preventDefault();
    runAction("Generating tailored CV draft", async () => {
      const data = await apiRequest("/api/cvs/generate", {
        method: "POST",
        body: JSON.stringify({ passport, targetField: cvGeneratorForm.targetField, jobId: cvGeneratorForm.jobId || undefined }),
      });
      setGeneratedCv(data.data); setStatus(data.data?.message || "Tailored CV draft ready");
    });
  }

  async function generateCvDraft({ targetField = "Auto", jobId } = {}) {
    const data = await apiRequest("/api/cvs/generate", {
      method: "POST",
      body: JSON.stringify({ passport, targetField, jobId }),
    });
    setGeneratedCv(data.data); setStatus(data.data?.message || "Tailored CV draft ready");
    setActivePage("cv");
  }

  function generateCvForJob(job) {
    if (!job?._id) return;
    runAction("Generating job-specific CV draft", async () => { await generateCvDraft({ targetField: "Auto", jobId: job._id }); });
  }

  function updateGeneratedCv(field, value) { setGeneratedCv((c) => ({ ...c, [field]: value })); }

  function saveGeneratedCv() {
    if (!generatedCv) return;
    runAction("Saving tailored CV", async () => {
      const data = await apiRequest("/api/cvs", { method: "POST", body: JSON.stringify(generatedCv) });
      setSelectedCvId(data.data._id); setGeneratedCv(null); await loadCvs(); setStatus("Tailored CV saved");
    });
  }

  // ── Job actions ──────────────────────────────────────────────────────────────
  function fetchJobs() {
    runAction("Fetching jobs from Adzuna", async () => {
      const data = await apiRequest("/api/jobs/fetch");
      setStatus(data.message || "Jobs fetched and saved");
    });
  }

  function filterJobs(event) {
    event?.preventDefault();
    runAction("Filtering jobs from database", async () => {
      const params = new URLSearchParams();
      Object.entries(filterForm).forEach(([k, v]) => { if (v) params.set(k, v); });
      if (selectedCvId) params.set("cvId", selectedCvId);
      const data = await apiRequest(`/api/jobs/filter?${params.toString()}`);
      setJobs(data.data || []); setStatus(`${data.data?.length || 0} jobs loaded`);
    });
  }

  function loadRecommendations() {
    if (!selectedCvId) { setStatus("Create or select a CV first"); return; }
    runAction("Ranking recommendations", async () => {
      const data = await apiRequest(`/api/recommendations?cvId=${selectedCvId}`);
      setRecommendations(data.recommendations || []); setStatus("Recommendations ranked");
    });
  }

  function openJobDetail(job) {
    setSelectedJobDetail(job); setJobCvRankings([]); setJobCvRankingStatus("Ranking saved CVs");
    runAction("Ranking saved CVs for this job", async () => {
      const data = await apiRequest("/api/cvs/rank-for-job", { method: "POST", body: JSON.stringify({ jobId: job._id }) });
      setJobCvRankings(data.data?.rankings || []);
      setJobCvRankingStatus(data.data?.source === "ai" ? "AI-assisted CV ranking" : "Rule-based CV ranking");
      setStatus("CV ranking ready");
    });
  }

  // ── Application actions ──────────────────────────────────────────────────────
  function trackApplication(job, nextStatus = "Under Review") {
    if (!selectedCvId) { setStatus("Create or select a CV first"); return; }
    if (!job?._id)     { setStatus("Select a saved job first"); return; }
    runAction(nextStatus === "Saved for Later" ? "Saving job for later" : "Adding application", async () => {
      const data = await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({ userEmail: user.email, jobId: job._id, cvId: selectedCvId, status: nextStatus }),
      });
      await loadApplications();
      notify(nextStatus === "Saved for Later" ? "Job saved for later" : data.message || "Application added");
    });
  }

  function updateApplicationStatus(applicationId, status) {
    runAction("Updating application status", async () => {
      await apiRequest(`/api/applications/${applicationId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await loadApplications(); notify("Application status updated");
    });
  }

  function loadSimilarApplications() {
    if (!user?.email) return;
    runAction("Loading similar role recommendations", async () => {
      const data = await apiRequest(`/api/similar-applications?userEmail=${encodeURIComponent(user.email)}`);
      setSimilarApplications(data.data || []); setStatus("Similar roles loaded");
    });
  }

  // ── Insights actions ─────────────────────────────────────────────────────────
  function findBestCv() {
    if (!bestJobId) { setStatus("Load jobs or recommendations first"); return; }
    runAction("Finding best CV for selected job", async () => {
      const data = await apiRequest(`/api/best-cv/${bestJobId}`);
      setBestCvResult(data); setStatus("Best CV calculated");
    });
  }

  function runMatch(event) {
    event.preventDefault();
    runAction("Calculating match explainability", async () => {
      const data = await apiRequest("/api/match", {
        method: "POST",
        body: JSON.stringify({ cvSkills: splitSkills(matchForm.cvSkills), jobSkills: splitSkills(matchForm.jobSkills) }),
      });
      setMatchResult(data); setStatus("Match explanation ready");
    });
  }

  function analyzeGaps() {
    runAction("Building learning roadmap", async () => {
      const data = await apiRequest("/api/analysis", {
        method: "POST",
        body: JSON.stringify({ missingSkills: matchResult?.missingSkills || [] }),
      });
      setAnalysisResult(data); setStatus("Roadmap ready");
    });
  }

  function getSuccessScore() {
    if (!selectedCvId || !bestJobId) { setStatus("Load jobs and select a CV first"); return; }
    runAction("Calculating application success score", async () => {
      const data = await apiRequest("/api/success-score", { method: "POST", body: JSON.stringify({ cvId: selectedCvId, jobId: bestJobId }) });
      setSuccessScore(data); setStatus("Success score ready");
    });
  }

  function generateCvSuggestions() {
    if (!selectedCvId) { setStatus("Select a CV first"); return; }
    runAction("Generating CV improvement suggestions", async () => {
      const data = await apiRequest("/api/cv-suggestions", { method: "POST", body: JSON.stringify({ cvId: selectedCvId }) });
      setCvSuggestions(data); setStatus("CV suggestions ready");
    });
  }

  function loadSkillFrequency() {
    runAction("Analyzing missing skill frequency", async () => {
      const data = await apiRequest("/api/skill-frequency");
      setSkillFrequency(data.data || []); setStatus("Skill frequency analysis ready");
    });
  }

  // ── Route guards ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <AuthPage authForm={authForm} authMode={authMode} setAuthForm={setAuthForm}
        setAuthMode={setAuthMode} submitAuth={submitAuth} status={status} />
    );
  }

  if (showOnboarding) {
    return (
      <PassportOnboarding passport={passport} setPassport={setPassport}
        savePassport={savePassport} skipPassport={skipPassport} user={user} />
    );
  }

  // ── Shell ────────────────────────────────────────────────────────────────────
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <span className="brand-name">Career Match</span>
        </div>

        <div className="nav-section">Workspace</div>
        {pages.filter((p) => p.section === "workspace").map((page) => (
          <button key={page.id} className="nav-item" data-active={activePage === page.id}
            type="button" onClick={() => setActivePage(page.id)}>
            <page.icon className="ico" size={15} />
            {page.label}
          </button>
        ))}

        <div className="nav-section">Growth</div>
        {pages.filter((p) => p.section === "growth").map((page) => (
          <button key={page.id} className="nav-item" data-active={activePage === page.id}
            type="button" onClick={() => setActivePage(page.id)}>
            <page.icon className="ico" size={15} />
            {page.label}
          </button>
        ))}

        <div className="nav-section">Applications</div>
        {pages.filter((p) => p.section === "apply").map((page) => (
          <button key={page.id} className="nav-item" data-active={activePage === page.id}
            type="button" onClick={() => setActivePage(page.id)}>
            <page.icon className="ico" size={15} />
            {page.label}
          </button>
        ))}

        <div className="sidebar-foot">
          <a className="doc-link" href={`${getBackendOrigin()}/api-docs`} target="_blank" rel="noreferrer">
            API Docs ↗
          </a>
          <div className="profile-chip" role="button" tabIndex={0}
            style={{ marginTop: 8 }} onClick={() => setActivePage("account")}>
            <div className="avatar-chip">
              {user.photo
                ? <img src={user.photo} alt="Profile" />
                : (user.firstName?.[0] || "U").toUpperCase()
              }
            </div>
            <div className="meta">
              <span className="name">{user.firstName} {user.lastName}</span>
              <span className="role">{passport.targetTitle || "Career seeker"}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="workspace">
        {toast && <div className="toast-notification" role="status">{toast}</div>}

        <header className="workspace-header">
          <div>
            <p className="eyebrow">AI Career OS — Live demo</p>
            <h1>{pages.find((p) => p.id === activePage)?.label}</h1>
          </div>
          <div className="header-actions">
            <div className="pulse"><span />{status}</div>
            <button type="button" className="account-button" onClick={() => setActivePage("account")}>
              {user.photo ? <img alt="Profile" src={user.photo} /> : (user.firstName?.[0] || "U").toUpperCase()}
            </button>
          </div>
        </header>

        {activePage === "overview" && (
          <OverviewPage applications={applications} cvs={cvs} jobs={jobs}
            recommendations={recommendations} selectedCv={selectedCv}
            setActivePage={setActivePage} fetchJobs={fetchJobs}
            loadRecommendations={loadRecommendations} />
        )}
        {activePage === "cv" && (
          <CvPage availableJobs={availableJobs} cvs={cvs} cvForm={cvForm}
            cvGeneratorForm={cvGeneratorForm} generatedCv={generatedCv}
            selectedCvId={selectedCvId} setCvForm={setCvForm}
            setCvGeneratorForm={setCvGeneratorForm} setSelectedCvId={setSelectedCvId}
            createCv={createCv} generateTailoredCv={generateTailoredCv}
            saveGeneratedCv={saveGeneratedCv} updateGeneratedCv={updateGeneratedCv}
            cvSuggestions={cvSuggestions} generateCvSuggestions={generateCvSuggestions} />
        )}
        {activePage === "jobs" && (
          <JobsPage filterForm={filterForm} setFilterForm={setFilterForm}
            selectedCv={selectedCv} jobs={jobs} fetchJobs={fetchJobs}
            filterJobs={filterJobs} generateCvForJob={generateCvForJob}
            jobCvRankings={jobCvRankings} jobCvRankingStatus={jobCvRankingStatus}
            loadRecommendations={loadRecommendations} openJobDetail={openJobDetail}
            selectedJobDetail={selectedJobDetail} setSelectedJobDetail={setSelectedJobDetail}
            trackApplication={trackApplication} />
        )}
        {activePage === "skillgap" && (
          <SkillGapPage jobs={jobs} recommendations={recommendations}
            selectedCv={selectedCv} setActivePage={setActivePage} />
        )}
        {activePage === "roadmap" && (
          <RoadmapPage jobs={jobs} recommendations={recommendations}
            selectedCv={selectedCv} analyzeGaps={analyzeGaps}
            analysisResult={analysisResult} matchResult={matchResult} />
        )}
        {activePage === "applications" && (
          <ApplicationsPage applications={applications}
            applicationStatuses={applicationStatuses} setActivePage={setActivePage}
            updateApplicationStatus={updateApplicationStatus}
            similarApplications={similarApplications}
            loadSimilarApplications={loadSimilarApplications} />
        )}
        {activePage === "analytics" && (
          <AnalyticsPage applications={applications} jobs={jobs}
            recommendations={recommendations} skillFrequency={skillFrequency}
            loadSkillFrequency={loadSkillFrequency} />
        )}
        {activePage === "insights" && (
          <InsightsPage matchForm={matchForm} setMatchForm={setMatchForm}
            runMatch={runMatch} analyzeGaps={analyzeGaps} findBestCv={findBestCv}
            matchResult={matchResult} analysisResult={analysisResult}
            bestCvResult={bestCvResult} recommendations={recommendations}
            successScore={successScore} getSuccessScore={getSuccessScore} />
        )}
        {activePage === "account" && (
          <AccountPage passport={passport} savePassport={savePassport}
            setPassport={setPassport} signOut={signOut} updateUser={updateUser}
            user={user} renderAvatar={renderAvatar} />
        )}
      </main>
    </div>
  );
}

// ─── Auth & Onboarding (kept here as they're flow screens, not pages) ─────────
function AuthPage({ authForm, authMode, setAuthForm, setAuthMode, submitAuth, status }) {
  const isRegister = authMode === "register";
  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <p className="eyebrow">AI Career OS</p>
        <h1>Build a smarter career profile before you search.</h1>
        <p>Create your Career Passport once, then match it with live job data, recommendations, and skill roadmaps.</p>
      </section>
      <section className="auth-card">
        <div className="auth-tabs">
          <button className={`auth-tab-btn${isRegister ? " active" : ""}`} type="button" onClick={() => setAuthMode("register")}>Sign Up</button>
          <button className={`auth-tab-btn${!isRegister ? " active" : ""}`} type="button" onClick={() => setAuthMode("login")}>Sign In</button>
        </div>
        <form className="form-stack" onSubmit={submitAuth}>
          {isRegister && (
            <div className="two-fields">
              <label>First name<input required value={authForm.firstName} onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })} /></label>
              <label>Last name<input required value={authForm.lastName} onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })} /></label>
            </div>
          )}
          <label>Email<input required type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} /></label>
          {isRegister && (
            <label>
              Phone
              <div className="phone-field">
                <select value={authForm.countryCode} onChange={(e) => setAuthForm({ ...authForm, countryCode: e.target.value })}>
                  {countryCodes.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <input required inputMode="tel" placeholder="5xx xxx xx xx" value={authForm.phoneNumber} onChange={(e) => setAuthForm({ ...authForm, phoneNumber: e.target.value })} />
              </div>
            </label>
          )}
          <label>Password<input required type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} /></label>
          <button type="submit">{isRegister ? "Create Account" : "Sign In"}</button>
        </form>
        <p className="auth-status">{status}</p>
      </section>
    </main>
  );
}

function PassportOnboarding({ passport, setPassport, savePassport, skipPassport, user }) {
  function submit(event) { event.preventDefault(); savePassport(passport); }
  return (
    <main className="onboarding">
      <header className="onboarding-head">
        <div>
          <p className="eyebrow">Career Passport</p>
          <h1>Welcome, {user.firstName}. Let's build your professional profile.</h1>
          <p>Add your education, skills, experience, goals, and portfolio details. You can edit everything later from My Account.</p>
        </div>
        <button className="ghost" type="button" onClick={skipPassport}>Skip now</button>
      </header>
      <PassportFormInline passport={passport} setPassport={setPassport} submit={submit} submitLabel="Save Career Passport" />
    </main>
  );
}

function PassportFormInline({ passport, setPassport, submit, submitLabel }) {
  function update(field, value) { setPassport({ ...passport, [field]: value }); }
  const F = ({ label, f, textarea }) => (
    <label className={textarea ? "field tall" : "field"}>
      {label}
      {textarea
        ? <textarea value={passport[f] || ""} onChange={(e) => update(f, e.target.value)} />
        : <input value={passport[f] || ""} onChange={(e) => update(f, e.target.value)} />
      }
    </label>
  );
  return (
    <form className="passport-form" onSubmit={submit}>
      <section className="passport-section">
        <div className="passport-section-head"><h3>Career Direction</h3><p>What kind of role are you aiming for?</p></div>
        <div className="passport-section-fields">
          <F label="Target role" f="targetTitle" /><F label="Location" f="location" />
          <F label="Work style" f="workStyle" /><F label="Availability" f="availability" />
          <F label="Salary expectation" f="salaryExpectation" />
        </div>
      </section>
      <section className="passport-section">
        <div className="passport-section-head"><h3>Education</h3><p>Academic background.</p></div>
        <div className="passport-section-fields">
          <F label="School" f="school" /><F label="Department" f="department" />
          <F label="Graduation year" f="graduationYear" /><F label="GPA" f="gpa" />
        </div>
      </section>
      <section className="passport-section">
        <div className="passport-section-head"><h3>Skills & Interests</h3><p>Separate with commas.</p></div>
        <div className="passport-section-fields">
          <F label="Skills" f="skills" /><F label="Tools / Technologies" f="tools" />
          <F label="Languages" f="languages" /><F label="Interests" f="interests" />
        </div>
      </section>
      <section className="passport-section">
        <div className="passport-section-head"><h3>Experience & Proof</h3><p>Projects, certs, achievements.</p></div>
        <div className="passport-section-fields">
          <F label="Experience" f="experience" textarea /><F label="Projects" f="projects" textarea />
          <F label="Certificates" f="certificates" textarea /><F label="Achievements" f="achievements" textarea />
          <F label="About me" f="summary" textarea />
        </div>
      </section>
      <section className="passport-section">
        <div className="passport-section-head"><h3>Links</h3><p>Portfolio, LinkedIn, GitHub.</p></div>
        <div className="passport-section-fields">
          <F label="Portfolio" f="portfolio" /><F label="LinkedIn" f="linkedin" /><F label="GitHub" f="github" />
        </div>
      </section>
      <button className="passport-submit" type="submit">{submitLabel}</button>
    </form>
  );
}
