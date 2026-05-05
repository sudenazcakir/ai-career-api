import { ui } from "../../styles/ui";

export default function PassportForm({
  isBusy = false,
  passport,
  setPassport,
  submit,
  submitLabel,
}) {
  function update(field, value) {
    setPassport({ ...passport, [field]: value });
  }

  return (
    <form className={ui.passportForm} onSubmit={submit}>
      <PassportSection
        title="Career Direction"
        description="What kind of role are you aiming for?"
      >
        <Field label="Target role" value={passport.targetTitle} onChange={(value) => update("targetTitle", value)} />
        <Field label="Location" value={passport.location} onChange={(value) => update("location", value)} />
        <Field label="Work style" value={passport.workStyle} onChange={(value) => update("workStyle", value)} />
        <Field label="Availability" value={passport.availability} onChange={(value) => update("availability", value)} />
        <Field label="Salary expectation" value={passport.salaryExpectation} onChange={(value) => update("salaryExpectation", value)} />
      </PassportSection>

      <PassportSection title="Education" description="Academic background and graduation details.">
        <Field label="School" value={passport.school} onChange={(value) => update("school", value)} />
        <Field label="Department" value={passport.department} onChange={(value) => update("department", value)} />
        <Field label="Graduation year" value={passport.graduationYear} onChange={(value) => update("graduationYear", value)} />
        <Field label="GPA" value={passport.gpa} onChange={(value) => update("gpa", value)} />
      </PassportSection>

      <PassportSection
        title="Skills & Interests"
        description="Separate items with commas for cleaner matching later."
      >
        <Field label="Skills" value={passport.skills} onChange={(value) => update("skills", value)} />
        <Field label="Tools / Technologies" value={passport.tools} onChange={(value) => update("tools", value)} />
        <Field label="Languages" value={passport.languages} onChange={(value) => update("languages", value)} />
        <Field label="Interests" value={passport.interests} onChange={(value) => update("interests", value)} />
      </PassportSection>

      <PassportSection
        title="Experience & Proof"
        description="Projects, achievements, certificates, and story."
      >
        <Field textarea label="Experience" value={passport.experience} onChange={(value) => update("experience", value)} />
        <Field textarea label="Projects" value={passport.projects} onChange={(value) => update("projects", value)} />
        <Field textarea label="Certificates" value={passport.certificates} onChange={(value) => update("certificates", value)} />
        <Field textarea label="Achievements" value={passport.achievements} onChange={(value) => update("achievements", value)} />
        <Field textarea label="About me" value={passport.summary} onChange={(value) => update("summary", value)} />
      </PassportSection>

      <PassportSection title="Links" description="Profiles recruiters or mentors can inspect.">
        <Field label="Portfolio" value={passport.portfolio} onChange={(value) => update("portfolio", value)} />
        <Field label="LinkedIn" value={passport.linkedin} onChange={(value) => update("linkedin", value)} />
        <Field label="GitHub" value={passport.github} onChange={(value) => update("github", value)} />
      </PassportSection>

      <button className={ui.button} disabled={isBusy} type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

function PassportSection({ children, description, title }) {
  return (
    <section className={ui.passportSection}>
      <div className={ui.passportSectionHead}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className={ui.passportFields}>{children}</div>
    </section>
  );
}

function Field({ label, onChange, textarea, value }) {
  return (
    <label className={ui.label}>
      {label}
      {textarea ? (
        <textarea
          className={`${ui.input} min-h-28 resize-y`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={ui.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
