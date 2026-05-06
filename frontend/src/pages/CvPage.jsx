import { FiCheck, FiCopy, FiGitBranch, FiSave } from "react-icons/fi";
import { ProfileSummary } from "../components/common/DataViews";
import { ui } from "../styles/ui";

export default function CvPage({
  compareCvId,
  compareSelectedCvs,
  createCv,
  createSelectedCvVersion,
  cvForm,
  cvComparison,
  cvs,
  isBusy,
  selectedCv,
  selectedCvId,
  setCompareCvId,
  setCvForm,
  setSelectedCvId,
}) {
  const comparisonOptions = cvs.filter((cv) => cv._id !== selectedCvId);

  return (
    <div className={ui.splitPage}>
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Profile builder</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">Create a CV skill profile</h2>
          </div>
        </div>
        <form className={ui.formStack} onSubmit={createCv}>
          <div className={ui.gridForm}>
            <label className={ui.label}>
              CV title
              <input
                className={ui.input}
                value={cvForm.title}
                onChange={(event) =>
                  setCvForm({ ...cvForm, title: event.target.value })
                }
              />
            </label>
            <label className={ui.label}>
              Type
              <input
                className={ui.input}
                value={cvForm.type}
                onChange={(event) =>
                  setCvForm({ ...cvForm, type: event.target.value })
                }
              />
            </label>
            <label className={ui.label}>
              Version
              <input
                className={ui.input}
                value={cvForm.version}
                onChange={(event) =>
                  setCvForm({ ...cvForm, version: event.target.value })
                }
              />
            </label>
            <label className={ui.label}>
              Skills
              <input
                className={ui.input}
                value={cvForm.skills}
                onChange={(event) =>
                  setCvForm({ ...cvForm, skills: event.target.value })
                }
              />
            </label>
          </div>
          <label className={ui.label}>
            Summary
            <textarea
              className={ui.input}
              rows={3}
              value={cvForm.summary}
              onChange={(event) =>
                setCvForm({ ...cvForm, summary: event.target.value })
              }
            />
          </label>
          <div className={ui.gridForm}>
            {[
              ["projects", "Projects"],
              ["experience", "Experience"],
              ["education", "Education"],
              ["certifications", "Certifications"],
            ].map(([field, label]) => (
              <label className={ui.label} key={field}>
                {label}
                <textarea
                  className={ui.input}
                  rows={3}
                  value={cvForm[field]}
                  onChange={(event) =>
                    setCvForm({ ...cvForm, [field]: event.target.value })
                  }
                />
              </label>
            ))}
          </div>
          <button className={ui.button} disabled={isBusy} type="submit">
            <FiSave size={14} strokeWidth={1.5} />
            {isBusy ? "Saving..." : "Save CV"}
          </button>
        </form>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>CV Library</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              {selectedCv ? selectedCv.title : "No CV selected"}
            </h2>
            {selectedCv && (
              <p className="mt-0.5 text-[12px] text-[#6B6B72]">
                {selectedCv.type || "General"} · {selectedCv.version || "v1"} · used for matching
              </p>
            )}
          </div>
          <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
            {cvs.length} CV{cvs.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className={ui.profileList}>
          {cvs.map((cv) => {
            const isActive = selectedCvId === cv._id;
            return (
              <button
                key={cv._id}
                type="button"
                onClick={() => setSelectedCvId(cv._id)}
                className="relative w-full min-w-0 rounded-[12px] p-3 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1"
                style={isActive ? {
                  border: "2px solid var(--c-cobalt)",
                  background: "var(--c-cobalt-50)",
                  boxShadow: "0 1px 4px rgba(30,63,255,0.10)",
                } : {
                  border: "1px solid var(--c-hairline)",
                  background: "var(--c-paper)",
                }}
              >
                {/* Active badge */}
                {isActive && (
                  <span
                    className="mb-2 inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: "var(--c-cobalt)",
                      color: "#fff",
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                      <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Active · Matching CV
                  </span>
                )}
                <ProfileSummary cv={cv} />
              </button>
            );
          })}
          {cvs.length === 0 && (
            <p className="rounded-[8px] border border-dashed border-[#A4A4AC] p-4 text-center text-[13px] text-[#6B6B72]">
              No CV profiles yet. Create one using the form on the left.
            </p>
          )}
        </div>
      </section>

      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Versioning</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">Version and compare CVs</h2>
          </div>
          <button
            className={ui.buttonSecondary}
            disabled={isBusy || !selectedCvId}
            onClick={createSelectedCvVersion}
            type="button"
          >
            <FiGitBranch size={14} strokeWidth={1.5} />
            Create New Version
          </button>
        </div>

        <div className={ui.gridForm}>
          <label className={ui.label}>
            Base CV
            <input
              className={ui.input}
              disabled
              value={
                selectedCv
                  ? `${selectedCv.title} (${selectedCv.version || "v1"})`
                  : "Select a CV"
              }
            />
          </label>
          <label className={ui.label}>
            Compare with
            <select
              className={ui.input}
              value={compareCvId}
              onChange={(event) => setCompareCvId(event.target.value)}
            >
              <option value="">Choose CV</option>
              {comparisonOptions.map((cv) => (
                <option key={cv._id} value={cv._id}>
                  {cv.title} ({cv.version || "v1"})
                </option>
              ))}
            </select>
          </label>
          <button
            className={ui.button}
            disabled={isBusy || !selectedCvId || !compareCvId}
            onClick={compareSelectedCvs}
            type="button"
          >
            <FiCopy size={14} strokeWidth={1.5} />
            Compare
          </button>
        </div>

        {cvComparison && (
          <CvComparisonResult comparison={cvComparison} />
        )}
      </section>
    </div>
  );
}

function CvComparisonResult({ comparison }) {
  return (
    <div className="mt-4 grid gap-4">
      <div className={ui.metrics}>
        <div className={ui.metric}>
          <span className={ui.metricLabel}>Similarity</span>
          <strong className={ui.metricValue}>{comparison.similarityScore}%</strong>
        </div>
        <div className={ui.metric}>
          <span className={ui.metricLabel}>Shared Skills</span>
          <strong className={ui.metricValue}>{comparison.skills.shared.length}</strong>
        </div>
        <div className={ui.metric}>
          <span className={ui.metricLabel}>Only in Base</span>
          <strong className={ui.metricValue}>{comparison.skills.onlyLeft.length}</strong>
        </div>
        <div className={ui.metric}>
          <span className={ui.metricLabel}>Only in Compare</span>
          <strong className={ui.metricValue}>{comparison.skills.onlyRight.length}</strong>
        </div>
      </div>

      <div className={ui.pageGrid}>
        <ComparisonList title="Shared skills" items={comparison.skills.shared} />
        <ComparisonList
          title={`${comparison.left.version || "Base"} only`}
          items={comparison.skills.onlyLeft}
        />
        <ComparisonList
          title={`${comparison.right.version || "Compare"} only`}
          items={comparison.skills.onlyRight}
        />
      </div>

      <div className={ui.pageGrid}>
        {comparison.fields.map((field) => (
          <article className={ui.panel} key={field.field}>
            <p className={ui.eyebrow}>{field.field}</p>
            <h3 className="mb-2 text-lg font-black">
              {field.leftCount} vs {field.rightCount}
            </h3>
            <p className={ui.muted}>
              Shared {field.shared.length}, base-only {field.onlyLeft.length},
              compare-only {field.onlyRight.length}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ComparisonList({ title, items }) {
  return (
    <article className={ui.panel}>
      <h3 className="mb-3 text-lg font-black">{title}</h3>
      {items.length ? (
        <div className={ui.chips}>
          {items.map((item) => (
            <span className={ui.chip} key={item}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className={ui.muted}>No items.</p>
      )}
    </article>
  );
}
