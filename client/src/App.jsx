import { useEffect, useMemo, useState } from "react";
import { FiCamera } from "react-icons/fi";

const pages = [
  { id: "overview", label: "Overview" },
  { id: "cv", label: "CV Studio" },
  { id: "jobs", label: "Job Explorer" },
  { id: "insights", label: "AI Insights" },
  { id: "account", label: "My Account" },
];

const defaultMatch = {
  cvSkills: "Java, SQL",
  jobSkills: "Java, Docker, SQL",
};

const emptyUser = {
  firstName: "",
  lastName: "",
  email: "",
  countryCode: "+90",
  phoneNumber: "",
  photo: "",
  password: "",
};

const countryCodes = [
  { code: "+90", label: "TR +90" },
  { code: "+1", label: "US +1" },
  { code: "+44", label: "UK +44" },
  { code: "+49", label: "DE +49" },
  { code: "+33", label: "FR +33" },
  { code: "+31", label: "NL +31" },
  { code: "+39", label: "IT +39" },
  { code: "+34", label: "ES +34" },
];

const emptyPassport = {
  targetTitle: "",
  school: "",
  department: "",
  graduationYear: "",
  gpa: "",
  location: "",
  interests: "",
  skills: "",
  languages: "",
  tools: "",
  experience: "",
  projects: "",
  certificates: "",
  achievements: "",
  summary: "",
  workStyle: "",
  salaryExpectation: "",
  availability: "",
  portfolio: "",
  linkedin: "",
  github: "",
};

function splitSkills(value) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data;
}

function getBackendOrigin() {
  if (typeof window === "undefined") {
    return "http://localhost:5001";
  }

  return `${window.location.protocol}//${window.location.hostname}:5001`;
}

export default function App() {
  const [activePage, setActivePage] = useState("overview");
  const [status, setStatus] = useState("System ready");
  const [authMode, setAuthMode] = useState("register");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("careerUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [authForm, setAuthForm] = useState(emptyUser);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem("careerPassportSkipped") !== "true";
  });
  const [passport, setPassport] = useState(() => {
    const stored = localStorage.getItem("careerPassport");
    return stored ? JSON.parse(stored) : emptyPassport;
  });
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

  const selectedCv = useMemo(
    () => cvs.find((cv) => cv._id === selectedCvId),
    [cvs, selectedCvId]
  );
  const bestJobId = jobs[0]?._id || recommendations[0]?._id;
  const topScore = recommendations[0]?.matchScore ?? jobs[0]?.matchScore ?? 0;

  async function loadCvs() {
    const data = await apiRequest("/api/cvs");
    const nextCvs = data.data || [];
    setCvs(nextCvs);

    if (!selectedCvId && nextCvs[0]?._id) {
      setSelectedCvId(nextCvs[0]._id);
    }
  }

  useEffect(() => {
    if (user) {
      loadCvs().catch((error) => setStatus(error.message));
    }
  }, [user]);

  function submitAuth(event) {
    event.preventDefault();

    if (authMode === "login") {
      const stored = localStorage.getItem("careerUser");
      const savedUser = stored ? JSON.parse(stored) : null;

      if (!savedUser || savedUser.email !== authForm.email) {
        setStatus("No account found for this email");
        return;
      }

      if (savedUser.password && savedUser.password !== authForm.password) {
        setStatus("Incorrect password");
        return;
      }

      setUser(savedUser);
      setStatus(savedUser.password ? "Signed in" : "Signed in (legacy local account)");
      setShowOnboarding(localStorage.getItem("careerPassportSkipped") !== "true");
      return;
    }

    const nextUser = {
      firstName: authForm.firstName,
      lastName: authForm.lastName,
      email: authForm.email,
      countryCode: authForm.countryCode,
      phoneNumber: authForm.phoneNumber,
      phone: `${authForm.countryCode} ${authForm.phoneNumber}`,
      photo: "",
      password: authForm.password,
    };

    localStorage.setItem("careerUser", JSON.stringify(nextUser));
    setUser(nextUser);
    setStatus("Account created");
    setShowOnboarding(true);
  }

  function updateUser(nextUser) {
    localStorage.setItem("careerUser", JSON.stringify(nextUser));
    setUser(nextUser);
    setStatus("Account updated");
  }

  function renderAvatar(sourceUser, className = "account-avatar") {
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

  function savePassport(nextPassport = passport) {
    localStorage.setItem("careerPassport", JSON.stringify(nextPassport));
    localStorage.setItem("careerPassportSkipped", "true");
    setPassport(nextPassport);
    setShowOnboarding(false);
    setStatus("Career Passport saved");
  }

  function skipPassport() {
    localStorage.setItem("careerPassportSkipped", "true");
    setShowOnboarding(false);
    setStatus("You can complete Career Passport later");
  }

  function signOut() {
    setUser(null);
    setActivePage("overview");
    setStatus("Signed out");
  }

  async function runAction(label, action) {
    try {
      setStatus(label);
      await action();
    } catch (error) {
      setStatus(error.message);
    }
  }

  function createCv(event) {
    event.preventDefault();
    runAction("Creating CV profile", async () => {
      const data = await apiRequest("/api/cvs", {
        method: "POST",
        body: JSON.stringify({
          title: cvForm.title,
          skills: splitSkills(cvForm.skills),
        }),
      });

      setSelectedCvId(data.data._id);
      await loadCvs();
      setStatus("CV profile created");
    });
  }

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
      Object.entries(filterForm).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      if (selectedCvId) params.set("cvId", selectedCvId);

      const data = await apiRequest(`/api/jobs/filter?${params.toString()}`);
      setJobs(data.jobs || []);
      setStatus(`${data.jobs?.length || 0} jobs loaded`);
    });
  }

  function loadRecommendations() {
    if (!selectedCvId) {
      setStatus("Create or select a CV first");
      return;
    }

    runAction("Ranking recommendations", async () => {
      const data = await apiRequest(`/api/recommendations?cvId=${selectedCvId}`);
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
      const data = await apiRequest(`/api/best-cv/${bestJobId}`);
      setBestCvResult(data);
      setStatus("Best CV calculated");
    });
  }

  function runMatch(event) {
    event.preventDefault();
    runAction("Calculating match explainability", async () => {
      const data = await apiRequest("/api/match", {
        method: "POST",
        body: JSON.stringify({
          cvSkills: splitSkills(matchForm.cvSkills),
          jobSkills: splitSkills(matchForm.jobSkills),
        }),
      });

      setMatchResult(data);
      setStatus("Match explanation ready");
    });
  }

  function analyzeGaps() {
    runAction("Building learning roadmap", async () => {
      const data = await apiRequest("/api/analysis", {
        method: "POST",
        body: JSON.stringify({
          missingSkills: matchResult?.missingSkills || [],
        }),
      });

      setAnalysisResult(data);
      setStatus("Roadmap ready");
    });
  }

  if (!user) {
    return (
      <AuthPage
        authForm={authForm}
        authMode={authMode}
        setAuthForm={setAuthForm}
        setAuthMode={setAuthMode}
        submitAuth={submitAuth}
        status={status}
      />
    );
  }

  if (showOnboarding) {
    return (
      <PassportOnboarding
        passport={passport}
        setPassport={setPassport}
        savePassport={savePassport}
        skipPassport={skipPassport}
        user={user}
      />
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span>AC</span>
          <div>
            <strong>AI Career OS</strong>
            <small>Matching workspace</small>
          </div>
        </div>

        <nav className="nav">
          {pages.map((page) => (
            <button
              className={activePage === page.id ? "active" : ""}
              key={page.id}
              onClick={() => setActivePage(page.id)}
              type="button"
            >
              {page.label}
            </button>
          ))}
        </nav>

        <a
          className="doc-link"
          href={`${getBackendOrigin()}/api-docs`}
          target="_blank"
          rel="noreferrer"
        >
          Open Swagger
        </a>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Live backend demo</p>
            <h1>{pages.find((page) => page.id === activePage)?.label}</h1>
          </div>
          <div className="header-actions">
            <div className="pulse">
              <span />
              {status}
            </div>
            <button
              type="button"
              className="account-button"
              onClick={() => setActivePage("account")}
            >
              {user.photo ? (
                <img alt="Profile" src={user.photo} />
              ) : (
                user.firstName?.[0] || "U"
              )}
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
          />
        )}
      </main>
    </div>
  );
}

function AuthPage({
  authForm,
  authMode,
  setAuthForm,
  setAuthMode,
  submitAuth,
  status,
}) {
  const isRegister = authMode === "register";

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <p className="eyebrow">AI Career OS</p>
        <h1>Build a smarter career profile before you search.</h1>
        <p>
          Create your Career Passport once, then match it with live job data,
          recommendations, and skill roadmaps.
        </p>
      </section>

      <section className="auth-card">
        <div className="auth-tabs">
          <button
            className={isRegister ? "active" : ""}
            type="button"
            onClick={() => setAuthMode("register")}
          >
            Sign Up
          </button>
          <button
            className={!isRegister ? "active" : ""}
            type="button"
            onClick={() => setAuthMode("login")}
          >
            Sign In
          </button>
        </div>

        <form className="form-stack" onSubmit={submitAuth}>
          {isRegister && (
            <div className="two-fields">
              <label>
                First name
                <input
                  required
                  value={authForm.firstName}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, firstName: event.target.value })
                  }
                />
              </label>
              <label>
                Last name
                <input
                  required
                  value={authForm.lastName}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, lastName: event.target.value })
                  }
                />
              </label>
            </div>
          )}

          <label>
            Email
            <input
              required
              type="email"
              value={authForm.email}
              onChange={(event) =>
                setAuthForm({ ...authForm, email: event.target.value })
              }
            />
          </label>

          {isRegister && (
            <PhoneField
              countryCode={authForm.countryCode}
              phoneNumber={authForm.phoneNumber}
              setCountryCode={(countryCode) =>
                setAuthForm({ ...authForm, countryCode })
              }
              setPhoneNumber={(phoneNumber) =>
                setAuthForm({ ...authForm, phoneNumber })
              }
            />
          )}

          <label>
            Password
            <input
              required
              type="password"
              value={authForm.password}
              onChange={(event) =>
                setAuthForm({ ...authForm, password: event.target.value })
              }
            />
          </label>

          <button type="submit">{isRegister ? "Create Account" : "Sign In"}</button>
        </form>

        <p className="auth-status">{status}</p>
      </section>
    </main>
  );
}

function PassportOnboarding({
  passport,
  setPassport,
  savePassport,
  skipPassport,
  user,
}) {
  function submit(event) {
    event.preventDefault();
    savePassport(passport);
  }

  return (
    <main className="onboarding">
      <header className="onboarding-head">
        <div>
          <p className="eyebrow">Career Passport</p>
          <h1>Welcome, {user.firstName}. Let's build your professional profile.</h1>
          <p>
            Add your education, skills, experience, goals, and portfolio details.
            You can edit everything later from My Account.
          </p>
        </div>
        <button className="ghost" type="button" onClick={skipPassport}>
          Skip now
        </button>
      </header>

      <PassportForm
        passport={passport}
        setPassport={setPassport}
        submit={submit}
        submitLabel="Save Career Passport"
      />
    </main>
  );
}

function AccountPage({
  passport,
  renderAvatar,
  savePassport,
  setPassport,
  signOut,
  updateUser,
  user,
}) {
  const [accountForm, setAccountForm] = useState(user);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);

  function submitAccount(event) {
    event.preventDefault();
    updateUser(accountForm);
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAccountForm({ ...accountForm, photo: reader.result });
    };
    reader.readAsDataURL(file);
  }

  function submitPassport(event) {
    event.preventDefault();
    savePassport(passport);
    setIsPassportModalOpen(false);
  }

  return (
    <div className="account-page">
      <section className="account-hero">
        <label className="avatar-editor">
          {renderAvatar(accountForm)}
          <input
            accept="image/*"
            aria-label="Change profile photo"
            type="file"
            onChange={handlePhotoChange}
          />
          <span aria-hidden="true">
            <FiCamera />
          </span>
        </label>
        <div>
          <p className="eyebrow">My Account</p>
          <h2>
            {user.firstName} {user.lastName}
          </h2>
          <p>{user.email}</p>
        </div>
        <button className="ghost" type="button" onClick={signOut}>
          Sign out
        </button>
      </section>

      <section className="account-grid">
        <article className="account-card">
          <span>Phone</span>
          <strong>{user.phone || "Not added"}</strong>
        </article>
        <article className="account-card">
          <span>Target role</span>
          <strong>{passport.targetTitle || "Not added"}</strong>
        </article>
        <article className="account-card">
          <span>Primary skills</span>
          <strong>{passport.skills || "Not added"}</strong>
        </article>
      </section>

      <section className="panel account-panel">
        <div className="section-head">
          <div>
            <h2>Personal details</h2>
            <p className="muted">Keep your contact information current.</p>
          </div>
        </div>

        <form className="account-form" onSubmit={submitAccount}>
          <div className="two-fields">
            <label>
              First name
              <input
                value={accountForm.firstName || ""}
                onChange={(event) =>
                  setAccountForm({ ...accountForm, firstName: event.target.value })
                }
              />
            </label>
            <label>
              Last name
              <input
                value={accountForm.lastName || ""}
                onChange={(event) =>
                  setAccountForm({ ...accountForm, lastName: event.target.value })
                }
              />
            </label>
          </div>
          <label>
            Email
            <input
              type="email"
              value={accountForm.email || ""}
              onChange={(event) =>
                setAccountForm({ ...accountForm, email: event.target.value })
              }
            />
          </label>
          <PhoneField
            countryCode={accountForm.countryCode || "+90"}
            phoneNumber={accountForm.phoneNumber || ""}
            setCountryCode={(countryCode) =>
              setAccountForm({
                ...accountForm,
                countryCode,
                phone: `${countryCode} ${accountForm.phoneNumber || ""}`,
              })
            }
            setPhoneNumber={(phoneNumber) =>
              setAccountForm({
                ...accountForm,
                phoneNumber,
                phone: `${accountForm.countryCode || "+90"} ${phoneNumber}`,
              })
            }
          />
          <button type="submit">Update Account</button>
        </form>
      </section>

      <section className="panel account-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Career Passport</p>
            <h2>Professional profile</h2>
            <p className="muted">
              Open the editor when you want to update your career data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPassportModalOpen(true)}
          >
            Edit Professional Profile
          </button>
        </div>

        <div className="passport-preview">
          <article>
            <span>Target role</span>
            <strong>{passport.targetTitle || "Not added"}</strong>
          </article>
          <article>
            <span>Education</span>
            <strong>{passport.school || "Not added"}</strong>
          </article>
          <article>
            <span>Skills</span>
            <strong>{passport.skills || "Not added"}</strong>
          </article>
          <article>
            <span>Portfolio</span>
            <strong>{passport.portfolio || "Not added"}</strong>
          </article>
        </div>
      </section>

      {isPassportModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-modal="true"
            className="modal-window"
            role="dialog"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Career Passport</p>
                <h2>Edit professional profile</h2>
              </div>
              <button
                className="ghost"
                type="button"
                onClick={() => setIsPassportModalOpen(false)}
              >
                Close
              </button>
            </div>
            <PassportForm
              passport={passport}
              setPassport={setPassport}
              submit={submitPassport}
              submitLabel="Update Career Passport"
            />
          </section>
        </div>
      )}
    </div>
  );
}

function PhoneField({ countryCode, phoneNumber, setCountryCode, setPhoneNumber }) {
  return (
    <label>
      Phone
      <div className="phone-field">
        <select
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
        >
          {countryCodes.map((country) => (
            <option key={country.code} value={country.code}>
              {country.label}
            </option>
          ))}
        </select>
        <input
          required
          inputMode="tel"
          placeholder="5xx xxx xx xx"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
      </div>
    </label>
  );
}

function PassportForm({ passport, setPassport, submit, submitLabel }) {
  function update(field, value) {
    setPassport({ ...passport, [field]: value });
  }

  return (
    <form className="passport-form" onSubmit={submit}>
      <PassportSection
        title="Career Direction"
        description="What kind of role are you aiming for?"
      >
        <Field
          label="Target role"
          value={passport.targetTitle}
          onChange={(value) => update("targetTitle", value)}
        />
        <Field
          label="Location"
          value={passport.location}
          onChange={(value) => update("location", value)}
        />
        <Field
          label="Work style"
          value={passport.workStyle}
          onChange={(value) => update("workStyle", value)}
        />
        <Field
          label="Availability"
          value={passport.availability}
          onChange={(value) => update("availability", value)}
        />
        <Field
          label="Salary expectation"
          value={passport.salaryExpectation}
          onChange={(value) => update("salaryExpectation", value)}
        />
      </PassportSection>

      <PassportSection
        title="Education"
        description="Academic background and graduation details."
      >
        <Field
          label="School"
          value={passport.school}
          onChange={(value) => update("school", value)}
        />
        <Field
          label="Department"
          value={passport.department}
          onChange={(value) => update("department", value)}
        />
        <Field
          label="Graduation year"
          value={passport.graduationYear}
          onChange={(value) => update("graduationYear", value)}
        />
        <Field
          label="GPA"
          value={passport.gpa}
          onChange={(value) => update("gpa", value)}
        />
      </PassportSection>

      <PassportSection
        title="Skills & Interests"
        description="Separate items with commas for cleaner matching later."
      >
        <Field
          label="Skills"
          value={passport.skills}
          onChange={(value) => update("skills", value)}
        />
        <Field
          label="Tools / Technologies"
          value={passport.tools}
          onChange={(value) => update("tools", value)}
        />
        <Field
          label="Languages"
          value={passport.languages}
          onChange={(value) => update("languages", value)}
        />
        <Field
          label="Interests"
          value={passport.interests}
          onChange={(value) => update("interests", value)}
        />
      </PassportSection>

      <PassportSection
        title="Experience & Proof"
        description="Projects, achievements, certificates, and story."
      >
        <Field
          label="Experience"
          textarea
          value={passport.experience}
          onChange={(value) => update("experience", value)}
        />
        <Field
          label="Projects"
          textarea
          value={passport.projects}
          onChange={(value) => update("projects", value)}
        />
        <Field
          label="Certificates"
          textarea
          value={passport.certificates}
          onChange={(value) => update("certificates", value)}
        />
        <Field
          label="Achievements"
          textarea
          value={passport.achievements}
          onChange={(value) => update("achievements", value)}
        />
        <Field
          label="About me"
          textarea
          value={passport.summary}
          onChange={(value) => update("summary", value)}
        />
      </PassportSection>

      <PassportSection
        title="Links"
        description="Profiles recruiters or mentors can inspect."
      >
        <Field
          label="Portfolio"
          value={passport.portfolio}
          onChange={(value) => update("portfolio", value)}
        />
        <Field
          label="LinkedIn"
          value={passport.linkedin}
          onChange={(value) => update("linkedin", value)}
        />
        <Field
          label="GitHub"
          value={passport.github}
          onChange={(value) => update("github", value)}
        />
      </PassportSection>

      <button className="passport-submit" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

function PassportSection({ children, description, title }) {
  return (
    <section className="passport-section">
      <div className="passport-section-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="passport-section-fields">{children}</div>
    </section>
  );
}

function Field({ label, onChange, textarea, value }) {
  return (
    <label className={textarea ? "field tall" : "field"}>
      {label}
      {textarea ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function OverviewPage({
  cvs,
  jobs,
  recommendations,
  selectedCv,
  topScore,
  setActivePage,
  fetchJobs,
  loadRecommendations,
}) {
  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">AI-assisted job matching</p>
          <h2>Turn CV skills into ranked career options.</h2>
          <p>
            Import roles, select a CV, rank matches, and generate a learning
            path from missing skills.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" onClick={fetchJobs}>
            Import Jobs
          </button>
          <button type="button" className="secondary" onClick={loadRecommendations}>
            Rank Now
          </button>
        </div>
      </section>

      <section className="metrics">
        <Metric label="CV profiles" value={cvs.length} />
        <Metric label="Filtered jobs" value={jobs.length} />
        <Metric label="Recommendations" value={recommendations.length} />
        <Metric label="Top score" value={`${topScore}%`} />
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Selected CV</h2>
          <button type="button" className="ghost" onClick={() => setActivePage("cv")}>
            Manage
          </button>
        </div>
        {selectedCv ? (
          <ProfileSummary cv={selectedCv} />
        ) : (
          <p className="muted">Create a CV profile to start matching.</p>
        )}
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Top Recommendations</h2>
          <button
            type="button"
            className="ghost"
            onClick={() => setActivePage("jobs")}
          >
            Explore
          </button>
        </div>
        <JobList items={recommendations.slice(0, 4)} />
      </section>
    </div>
  );
}

function CvPage({
  cvs,
  cvForm,
  selectedCvId,
  setCvForm,
  setSelectedCvId,
  createCv,
}) {
  return (
    <div className="split-page">
      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Profile builder</p>
            <h2>Create a CV skill profile</h2>
          </div>
        </div>
        <form className="form-stack" onSubmit={createCv}>
          <label>
            CV title
            <input
              value={cvForm.title}
              onChange={(event) =>
                setCvForm({ ...cvForm, title: event.target.value })
              }
            />
          </label>
          <label>
            Skills
            <input
              value={cvForm.skills}
              onChange={(event) =>
                setCvForm({ ...cvForm, skills: event.target.value })
              }
            />
          </label>
          <button type="submit">Save CV</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>CV Library</h2>
          <span className="count">{cvs.length}</span>
        </div>
        <div className="profile-list">
          {cvs.map((cv) => (
            <button
              className={selectedCvId === cv._id ? "profile active" : "profile"}
              key={cv._id}
              onClick={() => setSelectedCvId(cv._id)}
              type="button"
            >
              <ProfileSummary cv={cv} />
            </button>
          ))}
          {cvs.length === 0 && <p className="muted">No CV profiles yet.</p>}
        </div>
      </section>
    </div>
  );
}

function JobsPage({
  filterForm,
  setFilterForm,
  selectedCv,
  jobs,
  fetchJobs,
  filterJobs,
  loadRecommendations,
}) {
  return (
    <div className="page-grid">
      <section className="panel full">
        <div className="section-head">
          <div>
            <p className="eyebrow">Database search</p>
            <h2>Filter jobs against {selectedCv?.title || "a selected CV"}</h2>
          </div>
          <div className="button-row">
            <button type="button" className="secondary" onClick={fetchJobs}>
              Import Jobs
            </button>
            <button type="button" onClick={loadRecommendations}>
              Recommend
            </button>
          </div>
        </div>

        <form className="filter-grid" onSubmit={filterJobs}>
          <label>
            Keyword
            <input
              value={filterForm.keyword}
              onChange={(event) =>
                setFilterForm({ ...filterForm, keyword: event.target.value })
              }
            />
          </label>
          <label>
            Skill
            <input
              value={filterForm.skill}
              onChange={(event) =>
                setFilterForm({ ...filterForm, skill: event.target.value })
              }
            />
          </label>
          <label>
            Min match
            <input
              type="number"
              value={filterForm.minMatch}
              onChange={(event) =>
                setFilterForm({ ...filterForm, minMatch: event.target.value })
              }
            />
          </label>
          <label>
            Sort
            <select
              value={filterForm.sort}
              onChange={(event) =>
                setFilterForm({ ...filterForm, sort: event.target.value })
              }
            >
              <option value="score">Score</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <button type="submit">Search</button>
        </form>
      </section>

      <section className="panel full">
        <div className="section-head">
          <h2>Job Results</h2>
          <span className="count">{jobs.length}</span>
        </div>
        <JobList items={jobs} />
      </section>
    </div>
  );
}

function InsightsPage({
  matchForm,
  setMatchForm,
  runMatch,
  analyzeGaps,
  findBestCv,
  matchResult,
  analysisResult,
  bestCvResult,
  recommendations,
}) {
  return (
    <div className="page-grid">
      <section className="panel full">
        <div className="section-head">
          <div>
            <p className="eyebrow">Explainability lab</p>
            <h2>Compare skills and generate next steps</h2>
          </div>
          <button type="button" className="secondary" onClick={findBestCv}>
            Best CV for Top Job
          </button>
        </div>

        <form className="match-grid" onSubmit={runMatch}>
          <label>
            CV skills
            <input
              value={matchForm.cvSkills}
              onChange={(event) =>
                setMatchForm({ ...matchForm, cvSkills: event.target.value })
              }
            />
          </label>
          <label>
            Job skills
            <input
              value={matchForm.jobSkills}
              onChange={(event) =>
                setMatchForm({ ...matchForm, jobSkills: event.target.value })
              }
            />
          </label>
          <button type="submit">Run Match</button>
          <button type="button" onClick={analyzeGaps}>
            Build Roadmap
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Match Explanation</h2>
          <ScoreBadge value={matchResult?.matchScore} />
        </div>
        {matchResult ? <pre>{JSON.stringify(matchResult, null, 2)}</pre> : <Empty />}
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Roadmap</h2>
          <span className="count">{analysisResult?.roadmap?.length || 0}</span>
        </div>
        {analysisResult ? (
          <div className="roadmap">
            {analysisResult.roadmap.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </section>

      <section className="panel full">
        <div className="section-head">
          <h2>Best CV Result</h2>
          <span className="count">{recommendations.length} ranked jobs</span>
        </div>
        {bestCvResult ? <pre>{JSON.stringify(bestCvResult, null, 2)}</pre> : <Empty />}
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProfileSummary({ cv }) {
  return (
    <div className="profile-summary">
      <h3>{cv.title}</h3>
      <div className="chips">
        {cv.skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </div>
  );
}

function JobList({ items }) {
  if (!items.length) return <Empty />;

  return (
    <div className="job-list">
      {items.slice(0, 8).map((job) => (
        <article className="job-row" key={job._id || job.title}>
          <div>
            <h3>{job.title}</h3>
            <p>{job.company || job.location || "Unknown company"}</p>
            <div className="chips">
              {(job.skills || []).slice(0, 5).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </div>
          <ScoreBadge value={job.matchScore} />
        </article>
      ))}
    </div>
  );
}

function ScoreBadge({ value }) {
  const score = value ?? 0;
  return <strong className="score">{score}%</strong>;
}

function Empty() {
  return <p className="muted">No data yet. Run an action to populate this view.</p>;
}
