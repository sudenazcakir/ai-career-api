import { useEffect, useRef, useState } from "react";
import { ui } from "../../styles/ui";

/* ── Select option constants ────────────────────────────────────────────── */
const WORK_STYLE_OPTIONS = ["Remote", "In Office", "Remote + Office", "Hybrid"];

const SALARY_OPTIONS = [
  "0-20.000", "20.000-30.000", "30.000-50.000", "50.000-70.000",
  "70.000-100.000", "100.000-150.000", "150.000-200.000",
  "200.000-300.000", "300.000+",
];

const AVAILABILITY_OPTIONS = ["Immediate", "1 week", "2 weeks", "1 month", "Flexible"];

const GPA_OPTIONS = ["0.00-2.00", "2.00-2.50", "2.50-3.00", "3.00-3.50", "3.50-4.00"];

const GRADUATION_YEARS = Array.from(
  { length: 17 },
  (_, i) => String(new Date().getFullYear() + 6 - i)
);

/* ── Projects serialization ─────────────────────────────────────────────── */
const PROJ_ITEM_SEP = "||";
const PROJ_FIELD_SEP = "::";

function parseProjects(str) {
  if (!str || !str.trim()) return [{ title: "", description: "" }];
  if (str.includes(PROJ_ITEM_SEP) || str.includes(PROJ_FIELD_SEP)) {
    const items = str.split(PROJ_ITEM_SEP).map((item) => {
      const idx = item.indexOf(PROJ_FIELD_SEP);
      const title = idx >= 0 ? item.slice(0, idx).trim() : "";
      const description = idx >= 0 ? item.slice(idx + PROJ_FIELD_SEP.length).trim() : item.trim();
      return { title, description };
    });
    return items.length > 0 ? items : [{ title: "", description: "" }];
  }
  return [{ title: "", description: str.trim() }];
}

function serializeProjects(items) {
  const filtered = items.filter((p) => p.title.trim() || p.description.trim());
  if (filtered.length === 0) return "";
  return filtered
    .map((p) => `${p.title.trim()}${PROJ_FIELD_SEP}${p.description.trim()}`)
    .join(PROJ_ITEM_SEP);
}

/* ── Certificates serialization ─────────────────────────────────────────── */
const CERT_ITEM_SEP = "||";
const CERT_FIELD_SEP = "::";

function parseCertificates(str) {
  if (!str || !str.trim()) return [{ title: "", issuer: "", link: "" }];
  if (str.includes(CERT_ITEM_SEP) || str.includes(CERT_FIELD_SEP)) {
    const items = str.split(CERT_ITEM_SEP).map((item) => {
      const parts = item.split(CERT_FIELD_SEP);
      return {
        title: (parts[0] || "").trim(),
        issuer: (parts[1] || "").trim(),
        link: (parts[2] || "").trim(),
      };
    });
    return items.length > 0 ? items : [{ title: "", issuer: "", link: "" }];
  }
  return [{ title: str.trim(), issuer: "", link: "" }];
}

function serializeCertificates(items) {
  const filtered = items.filter((c) => c.title.trim() || c.issuer.trim());
  if (filtered.length === 0) return "";
  return filtered
    .map((c) => `${c.title.trim()}${CERT_FIELD_SEP}${c.issuer.trim()}${CERT_FIELD_SEP}${c.link.trim()}`)
    .join(CERT_ITEM_SEP);
}

/* ── Languages serialization ────────────────────────────────────────────── */
function parseLanguages(str) {
  const arr = (str || "").split(",").map((s) => s.trim()).filter(Boolean);
  return arr.length > 0 ? arr : [""];
}

/* ── PassportForm ───────────────────────────────────────────────────────── */
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
        <Field label="Target role" value={passport.targetTitle} onChange={(v) => update("targetTitle", v)} />
        <Field label="Location" value={passport.location} onChange={(v) => update("location", v)} />
        <SelectField
          label="Work style"
          value={passport.workStyle}
          onChange={(v) => update("workStyle", v)}
          options={WORK_STYLE_OPTIONS}
        />
        <SelectField
          label="Availability"
          value={passport.availability}
          onChange={(v) => update("availability", v)}
          options={AVAILABILITY_OPTIONS}
        />
        <SelectField
          label="Salary expectation"
          value={passport.salaryExpectation}
          onChange={(v) => update("salaryExpectation", v)}
          options={SALARY_OPTIONS}
        />
      </PassportSection>

      <PassportSection title="Education" description="Academic background and graduation details.">
        <Field label="School" value={passport.school} onChange={(v) => update("school", v)} />
        <Field label="Department" value={passport.department} onChange={(v) => update("department", v)} />
        <SelectField
          label="Graduation year"
          value={passport.graduationYear}
          onChange={(v) => update("graduationYear", v)}
          options={GRADUATION_YEARS}
        />
        <SelectField
          label="GPA"
          value={passport.gpa}
          onChange={(v) => update("gpa", v)}
          options={GPA_OPTIONS}
        />
      </PassportSection>

      <PassportSection
        title="Skills & Interests"
        description="Separate items with commas for cleaner matching later."
      >
        <Field label="Skills" value={passport.skills} onChange={(v) => update("skills", v)} />
        <Field label="Tools / Technologies" value={passport.tools} onChange={(v) => update("tools", v)} />
        <label className={`${ui.label} col-span-full max-lg:col-span-1`}>
          Languages
          <LanguagesField value={passport.languages} onChange={(v) => update("languages", v)} />
        </label>
        <Field label="Interests" value={passport.interests} onChange={(v) => update("interests", v)} />
      </PassportSection>

      <PassportSection
        title="Experience & Proof"
        description="Projects, achievements, certificates, and story."
      >
        <Field textarea label="Experience" value={passport.experience} onChange={(v) => update("experience", v)} />
        <Field textarea label="Achievements" value={passport.achievements} onChange={(v) => update("achievements", v)} />
        <Field textarea className="col-span-full max-lg:col-span-1" label="About me" value={passport.summary} onChange={(v) => update("summary", v)} />
        <label className={`${ui.label} col-span-full max-lg:col-span-1`}>
          Projects
          <ProjectsField value={passport.projects} onChange={(v) => update("projects", v)} />
        </label>
        <label className={`${ui.label} col-span-full max-lg:col-span-1`}>
          Certificates
          <CertificatesField value={passport.certificates} onChange={(v) => update("certificates", v)} />
        </label>
      </PassportSection>

      <PassportSection title="Links" description="Profiles recruiters or mentors can inspect.">
        <Field label="Portfolio" value={passport.portfolio} onChange={(v) => update("portfolio", v)} />
        <Field label="LinkedIn" value={passport.linkedin} onChange={(v) => update("linkedin", v)} />
        <Field label="GitHub" value={passport.github} onChange={(v) => update("github", v)} />
      </PassportSection>

      <button className={ui.button} disabled={isBusy} type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

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

function Field({ className = "", label, onChange, textarea, value }) {
  return (
    <label className={`${ui.label} ${className}`.trim()}>
      {label}
      {textarea ? (
        <textarea
          className={`${ui.input} min-h-28 resize-y`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={ui.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function SelectField({ label, onChange, options, value }) {
  return (
    <label className={ui.label}>
      {label}
      <select
        className={ui.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Not specified</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}

function LanguagesField({ value, onChange }) {
  const [items, setItems] = useState(() => parseLanguages(value));
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      const serialized = items.filter(Boolean).join(", ");
      if (value !== serialized) setItems(parseLanguages(value));
      prevValueRef.current = value;
    }
  }, [value, items]);

  function handleChange(idx, val) {
    const next = items.map((item, i) => (i === idx ? val : item));
    setItems(next);
    onChange(next.filter(Boolean).join(", "));
  }

  function addItem() {
    setItems((prev) => [...prev, ""]);
  }

  function removeItem(idx) {
    const next = items.filter((_, i) => i !== idx);
    const safe = next.length > 0 ? next : [""];
    setItems(safe);
    onChange(safe.filter(Boolean).join(", "));
  }

  return (
    <div className="grid gap-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            className={ui.input}
            value={item}
            placeholder={idx === 0 ? "e.g. English" : "Another language…"}
            onChange={(e) => handleChange(idx, e.target.value)}
          />
          {idx === 0 ? (
            <button
              type="button"
              onClick={addItem}
              aria-label="Add language"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] text-[18px] font-medium text-[#3A3A40] transition-colors hover:border-[#A4A4AC] hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1"
            >
              +
            </button>
          ) : (
            <button
              type="button"
              onClick={() => removeItem(idx)}
              aria-label="Remove language"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] text-[18px] font-medium text-[#6B6B72] transition-colors hover:border-[var(--c-danger)] hover:text-[var(--c-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function ProjectsField({ value, onChange }) {
  const [items, setItems] = useState(() => parseProjects(value));
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      const serialized = serializeProjects(items);
      if (value !== serialized) setItems(parseProjects(value));
      prevValueRef.current = value;
    }
  }, [value, items]);

  function handleChange(idx, field, val) {
    const next = items.map((item, i) => (i === idx ? { ...item, [field]: val } : item));
    setItems(next);
    onChange(serializeProjects(next));
  }

  function addItem() {
    setItems((prev) => [...prev, { title: "", description: "" }]);
  }

  function removeItem(idx) {
    const next = items.filter((_, i) => i !== idx);
    const safe = next.length > 0 ? next : [{ title: "", description: "" }];
    setItems(safe);
    onChange(serializeProjects(safe));
  }

  return (
    <div className="grid gap-3">
      {items.map((item, idx) => (
        <div key={idx} className="grid gap-2 rounded-[8px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#6B6B72]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Project {idx + 1}
            </span>
            {(items.length > 1 || item.title || item.description) && (
              <button
                type="button"
                onClick={() => removeItem(idx)}
                aria-label="Remove project"
                className="inline-flex h-6 w-6 items-center justify-center rounded-[4px] text-[16px] text-[#6B6B72] transition-colors hover:text-[var(--c-danger)] focus-visible:outline-none"
              >
                ×
              </button>
            )}
          </div>
          <input
            className={ui.input}
            placeholder="Project title"
            value={item.title}
            onChange={(e) => handleChange(idx, "title", e.target.value)}
          />
          <textarea
            className={`${ui.input} min-h-[76px] resize-y`}
            placeholder="Brief description…"
            value={item.description}
            onChange={(e) => handleChange(idx, "description", e.target.value)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className={`${ui.buttonGhost} w-full justify-center`}
      >
        + Add project
      </button>
    </div>
  );
}

function CertificatesField({ value, onChange }) {
  const [items, setItems] = useState(() => parseCertificates(value));
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      const serialized = serializeCertificates(items);
      if (value !== serialized) setItems(parseCertificates(value));
      prevValueRef.current = value;
    }
  }, [value, items]);

  function handleChange(idx, field, val) {
    const next = items.map((item, i) => (i === idx ? { ...item, [field]: val } : item));
    setItems(next);
    onChange(serializeCertificates(next));
  }

  function addItem() {
    setItems((prev) => [...prev, { title: "", issuer: "", link: "" }]);
  }

  function removeItem(idx) {
    const next = items.filter((_, i) => i !== idx);
    const safe = next.length > 0 ? next : [{ title: "", issuer: "", link: "" }];
    setItems(safe);
    onChange(serializeCertificates(safe));
  }

  return (
    <div className="grid gap-3">
      {items.map((item, idx) => (
        <div key={idx} className="grid gap-2 rounded-[8px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#6B6B72]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Certificate {idx + 1}
            </span>
            {(items.length > 1 || item.title || item.issuer) && (
              <button
                type="button"
                onClick={() => removeItem(idx)}
                aria-label="Remove certificate"
                className="inline-flex h-6 w-6 items-center justify-center rounded-[4px] text-[16px] text-[#6B6B72] transition-colors hover:text-[var(--c-danger)] focus-visible:outline-none"
              >
                ×
              </button>
            )}
          </div>
          <input
            className={ui.input}
            placeholder="Certificate title"
            value={item.title}
            onChange={(e) => handleChange(idx, "title", e.target.value)}
          />
          <input
            className={ui.input}
            placeholder="Issuing organization"
            value={item.issuer}
            onChange={(e) => handleChange(idx, "issuer", e.target.value)}
          />
          <input
            className={ui.input}
            placeholder="Certificate URL (optional)"
            type="url"
            value={item.link}
            onChange={(e) => handleChange(idx, "link", e.target.value)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className={`${ui.buttonGhost} w-full justify-center`}
      >
        + Add certificate
      </button>
    </div>
  );
}
