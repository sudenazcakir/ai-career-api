import { useState, useMemo, useEffect } from "react";
import { FiCamera } from "react-icons/fi";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from "chart.js";
import { apiRequest, buildCareerMatrix, countryCodes } from "../utils";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function AccountPage({
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
  const fallbackCareerMatrix = useMemo(() => buildCareerMatrix(passport), [passport]);
  const [aiCareerMatrix, setAiCareerMatrix] = useState(null);
  const [careerMatrixStatus, setCareerMatrixStatus] = useState("Analyzing passport");
  const careerMatrix = aiCareerMatrix || fallbackCareerMatrix;

  useEffect(() => {
    let isActive = true;
    async function loadCareerMatrix() {
      try {
        const data = await apiRequest("/api/career-matrix", {
          method: "POST",
          body: JSON.stringify({ passport }),
        });
        if (!isActive) return;
        setAiCareerMatrix(data.data);
        setCareerMatrixStatus(data.data?.source === "ai" ? "AI-assisted analysis" : "Rule-based fallback");
      } catch {
        if (!isActive) return;
        setAiCareerMatrix(null);
        setCareerMatrixStatus("Local analysis fallback");
      }
    }
    loadCareerMatrix();
    return () => { isActive = false; };
  }, [passport]);

  function submitAccount(event) {
    event.preventDefault();
    updateUser(accountForm);
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAccountForm({ ...accountForm, photo: reader.result });
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
          <input accept="image/*" aria-label="Change profile photo" type="file" onChange={handlePhotoChange} />
          <span aria-hidden="true"><FiCamera /></span>
        </label>
        <div>
          <p className="eyebrow">My Account</p>
          <h2>{user.firstName} {user.lastName}</h2>
          <p>{user.email}</p>
        </div>
        <button className="ghost" type="button" onClick={signOut}>Sign out</button>
      </section>

      <section className="account-grid">
        <article className="account-card"><span>Phone</span><strong>{user.phone || "Not added"}</strong></article>
        <article className="account-card"><span>Target role</span><strong>{passport.targetTitle || "Not added"}</strong></article>
        <article className="account-card"><span>Primary skills</span><strong>{passport.skills || "Not added"}</strong></article>
      </section>

      <CareerMatrixPanel careerMatrix={careerMatrix} status={careerMatrixStatus} />

      <section className="panel account-panel">
        <div className="section-head">
          <div>
            <h2>Personal details</h2>
            <p className="muted">Keep your contact information current.</p>
          </div>
        </div>
        <form className="account-form" onSubmit={submitAccount}>
          <div className="two-fields">
            <label>First name<input value={accountForm.firstName || ""} onChange={(e) => setAccountForm({ ...accountForm, firstName: e.target.value })} /></label>
            <label>Last name<input value={accountForm.lastName || ""} onChange={(e) => setAccountForm({ ...accountForm, lastName: e.target.value })} /></label>
          </div>
          <label>Email<input type="email" value={accountForm.email || ""} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} /></label>
          <PhoneField
            countryCode={accountForm.countryCode || "+90"}
            phoneNumber={accountForm.phoneNumber || ""}
            setCountryCode={(countryCode) => setAccountForm({ ...accountForm, countryCode, phone: `${countryCode} ${accountForm.phoneNumber || ""}` })}
            setPhoneNumber={(phoneNumber) => setAccountForm({ ...accountForm, phoneNumber, phone: `${accountForm.countryCode || "+90"} ${phoneNumber}` })}
          />
          <button type="submit">Update Account</button>
        </form>
      </section>

      <section className="panel account-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Career Passport</p>
            <h2>Professional profile</h2>
            <p className="muted">Open the editor when you want to update your career data.</p>
          </div>
          <button type="button" onClick={() => setIsPassportModalOpen(true)}>
            Edit Professional Profile
          </button>
        </div>
        <div className="passport-preview">
          <article><span>Target role</span><strong>{passport.targetTitle || "Not added"}</strong></article>
          <article><span>Education</span><strong>{passport.school || "Not added"}</strong></article>
          <article><span>Skills</span><strong>{passport.skills || "Not added"}</strong></article>
          <article><span>Portfolio</span><strong>{passport.portfolio || "Not added"}</strong></article>
        </div>
      </section>

      {isPassportModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section aria-modal="true" className="modal-window" role="dialog">
            <div className="modal-head">
              <div>
                <p className="eyebrow">Career Passport</p>
                <h2>Edit professional profile</h2>
              </div>
              <button className="ghost" type="button" onClick={() => setIsPassportModalOpen(false)}>Close</button>
            </div>
            <PassportForm passport={passport} setPassport={setPassport} submit={submitPassport} submitLabel="Update Career Passport" />
          </section>
        </div>
      )}
    </div>
  );
}

function CareerMatrixPanel({ careerMatrix, status }) {
  const hasMatrixData = careerMatrix.average > 0;
  const chartData = {
    labels: careerMatrix.chartFields.map((f) => f.label),
    datasets: [{
      label: "Career fit",
      data: careerMatrix.chartFields.map((f) => f.score),
      backgroundColor: "rgba(20, 184, 166, 0.22)",
      borderColor: "#14b8a6",
      borderWidth: 2,
      pointBackgroundColor: "#0f766e",
      pointBorderColor: "#ecfeff",
      pointHoverBackgroundColor: "#ecfeff",
      pointHoverBorderColor: "#0f766e",
      pointRadius: 4,
    }],
  };
  const chartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.formattedValue}/100` } } },
    scales: {
      r: {
        angleLines: { color: "rgba(20, 184, 166, 0.18)" },
        grid: { color: "rgba(148, 163, 184, 0.24)" },
        pointLabels: { color: "#dffcf6", font: { size: 12, weight: "700" } },
        suggestedMin: 0, suggestedMax: 100,
        ticks: { backdropColor: "transparent", color: "rgba(226, 232, 240, 0.7)", showLabelBackdrop: false, stepSize: 20 },
      },
    },
  };

  return (
    <section className="grid items-center gap-[18px] overflow-hidden rounded-xl border border-teal-300/30 bg-[radial-gradient(circle_at_48%_48%,rgba(20,184,166,0.14),transparent_34%),linear-gradient(135deg,#0f172a_0%,#102a35_48%,#0f172a_100%)] p-[22px] text-white lg:grid-cols-[minmax(220px,0.72fr)_minmax(320px,1fr)_minmax(260px,0.82fr)]">
      <div className="grid gap-3.5">
        <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-300">AI-Assisted Career Fit Matrix</p>
        <h2 className="text-[clamp(28px,4vw,48px)] font-bold leading-none">
          {hasMatrixData ? careerMatrix.topField?.label : "Career direction"}
        </h2>
        <p className="text-slate-300 leading-relaxed">Your Career Passport is analyzed with AI first, then backed by a deterministic fallback.</p>
        <span className="w-max rounded-full border border-teal-200/25 bg-teal-300/10 px-3 py-1 text-xs font-extrabold text-teal-100">{status}</span>
        <div className="grid grid-cols-2 gap-2.5">
          <article className="grid gap-1.5 rounded-[10px] border border-teal-200/25 bg-slate-950/55 p-3">
            <span className="text-xs font-black uppercase text-teal-200">Primary field</span>
            <strong className="text-xl">{hasMatrixData ? careerMatrix.topField?.label : "Not enough data"}</strong>
          </article>
          <article className="grid gap-1.5 rounded-[10px] border border-teal-200/25 bg-slate-950/55 p-3">
            <span className="text-xs font-black uppercase text-teal-200">Overall readiness</span>
            <strong className="text-xl">{careerMatrix.average}%</strong>
          </article>
        </div>
      </div>

      <div className="min-h-80 w-full lg:min-h-[360px]">
        <Radar data={chartData} options={chartOptions} />
      </div>

      <div className="grid gap-2.5">
        {careerMatrix.fields.slice(0, 4).map((field) => (
          <article key={field.label} className="grid gap-2 rounded-[10px] border border-slate-400/30 bg-slate-950/60 p-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-black uppercase text-teal-200">{field.label}</span>
              <strong className="text-[28px] font-bold leading-none text-teal-300">{field.score}</strong>
            </div>
            <p className="text-[13px] leading-normal text-blue-100">{field.description}</p>
            <small className="text-xs leading-normal text-slate-400">
              {field.evidence.length ? field.evidence.join(", ") : "Waiting for Career Passport data"}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}

function PhoneField({ countryCode, phoneNumber, setCountryCode, setPhoneNumber }) {
  return (
    <label>
      Phone
      <div className="phone-field">
        <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
          {countryCodes.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        <input required inputMode="tel" placeholder="5xx xxx xx xx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      </div>
    </label>
  );
}

function PassportForm({ passport, setPassport, submit, submitLabel }) {
  function update(field, value) { setPassport({ ...passport, [field]: value }); }

  return (
    <form className="passport-form" onSubmit={submit}>
      <PassportSection title="Career Direction" description="What kind of role are you aiming for?">
        <Field label="Target role"        value={passport.targetTitle}      onChange={(v) => update("targetTitle", v)} />
        <Field label="Location"           value={passport.location}         onChange={(v) => update("location", v)} />
        <Field label="Work style"         value={passport.workStyle}        onChange={(v) => update("workStyle", v)} />
        <Field label="Availability"       value={passport.availability}     onChange={(v) => update("availability", v)} />
        <Field label="Salary expectation" value={passport.salaryExpectation} onChange={(v) => update("salaryExpectation", v)} />
      </PassportSection>

      <PassportSection title="Education" description="Academic background and graduation details.">
        <Field label="School"          value={passport.school}          onChange={(v) => update("school", v)} />
        <Field label="Department"      value={passport.department}      onChange={(v) => update("department", v)} />
        <Field label="Graduation year" value={passport.graduationYear}  onChange={(v) => update("graduationYear", v)} />
        <Field label="GPA"             value={passport.gpa}             onChange={(v) => update("gpa", v)} />
      </PassportSection>

      <PassportSection title="Skills & Interests" description="Separate items with commas for cleaner matching later.">
        <Field label="Skills"              value={passport.skills}     onChange={(v) => update("skills", v)} />
        <Field label="Tools / Technologies" value={passport.tools}     onChange={(v) => update("tools", v)} />
        <Field label="Languages"           value={passport.languages}  onChange={(v) => update("languages", v)} />
        <Field label="Interests"           value={passport.interests}  onChange={(v) => update("interests", v)} />
      </PassportSection>

      <PassportSection title="Experience & Proof" description="Projects, achievements, certificates, and story.">
        <Field label="Experience"   textarea value={passport.experience}   onChange={(v) => update("experience", v)} />
        <Field label="Projects"     textarea value={passport.projects}     onChange={(v) => update("projects", v)} />
        <Field label="Certificates" textarea value={passport.certificates} onChange={(v) => update("certificates", v)} />
        <Field label="Achievements" textarea value={passport.achievements} onChange={(v) => update("achievements", v)} />
        <Field label="About me"     textarea value={passport.summary}      onChange={(v) => update("summary", v)} />
      </PassportSection>

      <PassportSection title="Links" description="Profiles recruiters or mentors can inspect.">
        <Field label="Portfolio" value={passport.portfolio} onChange={(v) => update("portfolio", v)} />
        <Field label="LinkedIn"  value={passport.linkedin}  onChange={(v) => update("linkedin", v)} />
        <Field label="GitHub"    value={passport.github}    onChange={(v) => update("github", v)} />
      </PassportSection>

      <button className="passport-submit" type="submit">{submitLabel}</button>
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
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} />
      }
    </label>
  );
}
