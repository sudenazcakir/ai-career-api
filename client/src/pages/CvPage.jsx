import { FiCpu, FiAlertCircle } from "react-icons/fi";
import { ProfileSummary, GeneratedListEditor, Empty } from "../components/shared";
import { splitSkills, splitLines, careerFields } from "../utils";

export default function CvPage({
  availableJobs,
  cvs,
  cvForm,
  cvGeneratorForm,
  generatedCv,
  selectedCvId,
  setCvForm,
  setCvGeneratorForm,
  setSelectedCvId,
  createCv,
  generateTailoredCv,
  saveGeneratedCv,
  updateGeneratedCv,
  cvSuggestions,
  generateCvSuggestions,
}) {
  return (
    <div className="split-page">
      {/* AI CV Generator hero */}
      <section className="full overflow-hidden rounded-2xl border border-teal-200/25 bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.18),transparent_30%),linear-gradient(135deg,#0f172a,#12343b_52%,#111827)] p-6 text-white shadow-2xl shadow-slate-900/10">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-300">
              AI CV Generator
            </p>
            <h2 className="text-[clamp(30px,5vw,54px)] font-black leading-none">
              Create a job-tailored CV draft.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              The draft uses Career Passport data and the selected job requirements.
            </p>
          </div>
        </div>

        <form
          className="grid gap-3 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur md:grid-cols-[repeat(2,minmax(0,1fr))_max-content]"
          onSubmit={generateTailoredCv}
        >
          <label>
            Target field
            <select
              className="!border-white/20 !bg-white/95"
              value={cvGeneratorForm.targetField}
              onChange={(e) => setCvGeneratorForm({ ...cvGeneratorForm, targetField: e.target.value })}
            >
              {careerFields.map((field) => (
                <option key={field.label} value={field.label}>{field.label}</option>
              ))}
            </select>
          </label>
          <label>
            Target job
            <select
              className="!border-white/20 !bg-white/95"
              value={cvGeneratorForm.jobId}
              onChange={(e) => setCvGeneratorForm({ ...cvGeneratorForm, jobId: e.target.value })}
            >
              <option value="">No specific job</option>
              {availableJobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} {job.company ? `- ${job.company}` : ""}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="self-end !bg-teal-400 !text-slate-950 hover:!bg-teal-300">
            Generate Draft
          </button>
        </form>

        {generatedCv && (
          <section className="mt-5 grid gap-4 rounded-xl border border-white/10 bg-white p-4 text-slate-950">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
                  Editable preview
                </p>
                <h2 className="text-2xl font-black">{generatedCv.title}</h2>
              </div>
              <button type="button" onClick={saveGeneratedCv}>
                Save to CV Library
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label>
                CV title
                <input
                  value={generatedCv.title || ""}
                  onChange={(e) => updateGeneratedCv("title", e.target.value)}
                />
              </label>
              <label>
                Type
                <input
                  value={generatedCv.type || ""}
                  onChange={(e) => updateGeneratedCv("type", e.target.value)}
                />
              </label>
              <label className="field tall">
                Summary
                <textarea
                  value={generatedCv.summary || ""}
                  onChange={(e) => updateGeneratedCv("summary", e.target.value)}
                />
              </label>
              <label className="field tall">
                Skills
                <input
                  value={(generatedCv.skills || []).join(", ")}
                  onChange={(e) => updateGeneratedCv("skills", splitSkills(e.target.value))}
                />
              </label>
              <GeneratedListEditor label="Projects"      value={generatedCv.projects}      onChange={(v) => updateGeneratedCv("projects",      splitLines(v))} />
              <GeneratedListEditor label="Experience"    value={generatedCv.experience}    onChange={(v) => updateGeneratedCv("experience",    splitLines(v))} />
              <GeneratedListEditor label="Education"     value={generatedCv.education}     onChange={(v) => updateGeneratedCv("education",     splitLines(v))} />
              <GeneratedListEditor label="Certifications" value={generatedCv.certifications} onChange={(v) => updateGeneratedCv("certifications", splitLines(v))} />
            </div>
          </section>
        )}
      </section>

      {/* Manual CV builder */}
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
              onChange={(e) => setCvForm({ ...cvForm, title: e.target.value })}
            />
          </label>
          <label>
            Skills
            <input
              value={cvForm.skills}
              onChange={(e) => setCvForm({ ...cvForm, skills: e.target.value })}
            />
          </label>
          <button type="submit">Save CV</button>
        </form>
      </section>

      {/* CV Library */}
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

      {/* CV Suggestions */}
      <section className="panel full">
        <div className="section-head">
          <div>
            <p className="eyebrow">AI Analysis</p>
            <h2>CV Improvement Suggestions</h2>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              AI analyzes your selected CV and suggests concrete improvements.
            </p>
          </div>
          <button type="button" onClick={generateCvSuggestions}>
            <FiCpu style={{ display: "inline", marginRight: 6 }} />
            Analyze CV
          </button>
        </div>
        {cvSuggestions ? (
          <div className="cv-suggestions-list">
            {(cvSuggestions.suggestions || []).map((suggestion, i) => (
              <div key={i} className="cv-suggestion-item">
                <FiAlertCircle className="cv-suggestion-icon" />
                <p>{suggestion}</p>
              </div>
            ))}
            {cvSuggestions.overallScore !== undefined && (
              <div className="cv-suggestion-score">
                <span>CV Strength Score</span>
                <strong>{cvSuggestions.overallScore}%</strong>
              </div>
            )}
          </div>
        ) : (
          <Empty />
        )}
      </section>
    </div>
  );
}
