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
            <h2 className="text-2xl font-black">Create a CV skill profile</h2>
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
            {isBusy ? "Saving..." : "Save CV"}
          </button>
        </form>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h2 className="text-2xl font-black">CV Library</h2>
            {selectedCv && (
              <p className={ui.muted}>
                Selected: {selectedCv.title} · {selectedCv.version || "v1"}
              </p>
            )}
          </div>
          <span className={ui.count}>{cvs.length}</span>
        </div>
        <div className={ui.profileList}>
          {cvs.map((cv) => (
            <button
              className={`${ui.profileButton} ${selectedCvId === cv._id ? ui.profileButtonActive : ""}`}
              key={cv._id}
              onClick={() => setSelectedCvId(cv._id)}
              type="button"
            >
              <ProfileSummary cv={cv} />
            </button>
          ))}
          {cvs.length === 0 && <p className={ui.muted}>No CV profiles yet.</p>}
        </div>
      </section>

      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Versioning</p>
            <h2 className="text-2xl font-black">Version and compare CVs</h2>
          </div>
          <button
            className={ui.buttonSecondary}
            disabled={isBusy || !selectedCvId}
            onClick={createSelectedCvVersion}
            type="button"
          >
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
