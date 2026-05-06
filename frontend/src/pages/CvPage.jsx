import { useEffect, useRef, useState } from "react";
import { FiCheck, FiCopy, FiEdit2, FiGitBranch, FiSave, FiTrash2, FiX, FiZap } from "react-icons/fi";
import { ProfileSummary } from "../components/common/DataViews";
import { ui } from "../styles/ui";

export default function CvPage({
  clearEditMode,
  compareCvId,
  compareSelectedCvs,
  createSelectedCvVersion,
  cvComparison,
  cvForm,
  cvs,
  deleteCv,
  editingCvId,
  generateCvFromPassport,
  isBusy,
  loadCvIntoForm,
  passport,
  saveCv,
  selectedCv,
  selectedCvId,
  setCompareCvId,
  setCvForm,
  setSelectedCvId,
}) {
  const comparisonOptions = cvs.filter((cv) => cv._id !== selectedCvId);
  const editingCv = editingCvId ? cvs.find((cv) => cv._id === editingCvId) : null;
  const hasPassport = Boolean(passport?.skills || passport?.targetTitle || passport?.experience);
  const libraryListRef = useRef(null);
  const [libraryMaxHeight, setLibraryMaxHeight] = useState(null);

  useEffect(() => {
    const list = libraryListRef.current;
    if (!list || cvs.length <= 3) {
      setLibraryMaxHeight(null);
      return undefined;
    }

    function updateLibraryHeight() {
      const children = Array.from(list.children).slice(0, 3);
      const styles = window.getComputedStyle(list);
      const gap = parseFloat(styles.rowGap || styles.gap) || 0;
      const height = children.reduce(
        (total, child) => total + child.getBoundingClientRect().height,
        0
      );
      setLibraryMaxHeight(Math.ceil(height + gap * Math.max(children.length - 1, 0)));
    }

    updateLibraryHeight();
    window.addEventListener("resize", updateLibraryHeight);
    return () => window.removeEventListener("resize", updateLibraryHeight);
  }, [cvs, selectedCvId, editingCvId]);

  function handleDeleteClick(cvId) {
    const cv = cvs.find((c) => c._id === cvId);
    if (!cv) return;
    if (!window.confirm(`Delete "${cv.title}"? This cannot be undone.`)) return;
    deleteCv(cvId);
  }

  return (
    <div className={ui.splitPage}>

      {/* ── Section 1: Form ──────────────────────────────────── */}
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Profile builder</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              {editingCv ? `Edit: ${editingCv.title}` : "Create a CV skill profile"}
            </h2>
          </div>
          {editingCv && (
            <button
              className={ui.buttonGhost}
              disabled={isBusy}
              type="button"
              onClick={clearEditMode}
            >
              <FiX size={14} strokeWidth={1.5} />
              Cancel
            </button>
          )}
        </div>

        {/* Edit mode indicator */}
        {editingCv && (
          <div
            className="mb-3 inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11px] font-medium"
            style={{
              background: "var(--c-cobalt-50, #E6EBFF)",
              color: "var(--c-cobalt, #1E3FFF)",
              fontFamily: "var(--font-mono)",
              border: "1px solid var(--c-cobalt, #1E3FFF)",
            }}
          >
            <FiEdit2 size={11} />
            Editing · changes will overwrite {editingCv.version || "v1"}
          </div>
        )}

        {/* Generate from Passport */}
        <div className="mb-4">
          <button
            className={ui.buttonSecondary}
            disabled={isBusy || !hasPassport}
            onClick={generateCvFromPassport}
            title={
              !hasPassport
                ? "Fill in your Career Passport first"
                : "Generate a CV draft from your passport data"
            }
            type="button"
          >
            <FiZap size={14} strokeWidth={1.5} />
            Generate from Passport
          </button>
          {!hasPassport && (
            <p className="mt-1.5 text-[12px] text-[#6B6B72]">
              Fill in your Career Passport to enable auto-generation.
            </p>
          )}
        </div>

        <form className={ui.formStack} onSubmit={saveCv}>
          <div className={ui.gridForm}>
            <label className={ui.label}>
              CV title
              <input
                className={ui.input}
                value={cvForm.title}
                onChange={(event) => setCvForm({ ...cvForm, title: event.target.value })}
              />
            </label>
            <label className={ui.label}>
              Type
              <input
                className={ui.input}
                value={cvForm.type}
                onChange={(event) => setCvForm({ ...cvForm, type: event.target.value })}
              />
            </label>
            <label className={ui.label}>
              Version
              <input
                className={ui.input}
                value={cvForm.version}
                onChange={(event) => setCvForm({ ...cvForm, version: event.target.value })}
              />
            </label>
            <label className={ui.label}>
              Skills
              <input
                className={ui.input}
                value={cvForm.skills}
                onChange={(event) => setCvForm({ ...cvForm, skills: event.target.value })}
              />
            </label>
          </div>
          <label className={ui.label}>
            Summary
            <textarea
              className={ui.input}
              rows={3}
              value={cvForm.summary}
              onChange={(event) => setCvForm({ ...cvForm, summary: event.target.value })}
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
            {editingCvId
              ? isBusy ? "Updating..." : "Update CV"
              : isBusy ? "Saving..." : "Save CV"}
          </button>
        </form>
      </section>

      {/* ── Section 2: Library ────────────────────────────────── */}
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

        <div
          className={`${ui.profileList} ${cvs.length > 3 ? "overflow-y-auto pr-1" : ""}`}
          ref={libraryListRef}
          style={libraryMaxHeight ? { maxHeight: libraryMaxHeight } : undefined}
        >
          {cvs.map((cv) => {
            const isActive = selectedCvId === cv._id;
            const isEditing = editingCvId === cv._id;
            return (
              <div
                key={cv._id}
                className="overflow-hidden rounded-[12px] transition-shadow"
                style={
                  isActive
                    ? {
                        border: "2px solid var(--c-cobalt)",
                        background: "var(--c-cobalt-50)",
                        boxShadow: "0 1px 4px rgba(30,63,255,0.10)",
                      }
                    : { border: "1px solid #E8E3D7", background: "#FBFAF6" }
                }
              >
                {/* Select area */}
                <button
                  type="button"
                  onClick={() => setSelectedCvId(cv._id)}
                  className="w-full p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1"
                >
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {isActive && (
                      <span
                        className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: "var(--c-cobalt)",
                          color: "#fff",
                          fontFamily: "var(--font-mono)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        <FiCheck size={8} />
                        Active · Matching CV
                      </span>
                    )}
                    {isEditing && (
                      <span
                        className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: "#FEF9E7",
                          color: "#B45309",
                          fontFamily: "var(--font-mono)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          border: "1px solid #B45309",
                        }}
                      >
                        <FiEdit2 size={8} />
                        Editing
                      </span>
                    )}
                  </div>
                  <ProfileSummary cv={cv} />
                </button>

                {/* Action row */}
                <div className="flex gap-2 border-t border-[#E8E3D7] px-3 py-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => loadCvIntoForm(cv)}
                    className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#E8E3D7] bg-transparent px-2.5 text-[11px] font-medium text-[#3A3A40] transition-colors hover:border-[#A4A4AC] hover:text-[#0E0E10] disabled:opacity-50"
                  >
                    <FiEdit2 size={11} strokeWidth={1.5} />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDeleteClick(cv._id)}
                    className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#E8E3D7] bg-transparent px-2.5 text-[11px] font-medium text-[#6B6B72] transition-colors hover:border-[var(--c-danger,#A6261A)] hover:text-[var(--c-danger,#A6261A)] disabled:opacity-50"
                  >
                    <FiTrash2 size={11} strokeWidth={1.5} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {cvs.length === 0 && (
            <p className="rounded-[8px] border border-dashed border-[#A4A4AC] p-4 text-center text-[13px] text-[#6B6B72]">
              No CV profiles yet. Use the form on the left to create one, or generate from your passport.
            </p>
          )}
        </div>
      </section>

      {/* ── Section 3: CV Preview (full-width, only when a CV is selected) ── */}
      {selectedCv && (
        <section className={`${ui.panel} ${ui.full}`}>
          <CvPreview cv={selectedCv} />
        </section>
      )}

      {/* ── Section 4: Versioning & Compare (full-width) ─────── */}
      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Versioning</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Version and compare CVs
            </h2>
            <p className={`${ui.muted} mt-0.5`}>
              Create a new version of the active CV, then compare any two CVs side by side.
            </p>
          </div>
          <button
            className={ui.buttonSecondary}
            disabled={isBusy || !selectedCvId}
            onClick={createSelectedCvVersion}
            title={
              !selectedCvId
                ? "Select a CV first"
                : "Duplicate the active CV and increment its version number"
            }
            type="button"
          >
            <FiGitBranch size={14} strokeWidth={1.5} />
            Create New Version
          </button>
        </div>

        <div className={ui.gridForm}>
          <label className={ui.label}>
            Base CV (active)
            <input
              className={ui.input}
              disabled
              value={
                selectedCv
                  ? `${selectedCv.title} (${selectedCv.version || "v1"})`
                  : "Select a CV from the library above"
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
              <option value="">Choose a different CV…</option>
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

        {cvComparison && <CvComparisonResult comparison={cvComparison} />}
      </section>
    </div>
  );
}

/* ── CV Preview ─────────────────────────────────────────────────────────── */

function CvPreview({ cv }) {
  const hasContent =
    (cv.projects?.length || 0) +
    (cv.experience?.length || 0) +
    (cv.education?.length || 0) +
    (cv.certifications?.length || 0) > 0;

  return (
    <>
      <div className={ui.sectionHead}>
        <div>
          <p className={ui.eyebrow}>CV Preview</p>
          <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
            {cv.title}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#6B6B72]">
            {cv.type || "General"} · {cv.version || "v1"}
          </p>
        </div>
      </div>

      {cv.summary && (
        <p className="mb-4 text-[13px] leading-relaxed text-[#3A3A40]">{cv.summary}</p>
      )}

      {(cv.skills || []).length > 0 && (
        <div className="mb-4">
          <p className={ui.miniLabel}>Skills</p>
          <div className={ui.chips}>
            {cv.skills.map((skill) => (
              <span className={ui.chip} key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasContent && (
        <div className={ui.pageGrid}>
          {(cv.projects || []).length > 0 && (
            <PreviewList title="Projects" items={cv.projects} />
          )}
          {(cv.experience || []).length > 0 && (
            <PreviewList title="Experience" items={cv.experience} />
          )}
          {(cv.education || []).length > 0 && (
            <PreviewList title="Education" items={cv.education} />
          )}
          {(cv.certifications || []).length > 0 && (
            <PreviewList title="Certifications" items={cv.certifications} />
          )}
        </div>
      )}

      {!cv.summary && (cv.skills || []).length === 0 && !hasContent && (
        <p className={ui.muted}>No content yet. Edit this CV to add details.</p>
      )}
    </>
  );
}

function PreviewList({ title, items }) {
  return (
    <article className="min-w-0 rounded-[10px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
      <p className={ui.miniLabel}>{title}</p>
      <ul className="mt-2 grid gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex min-w-0 gap-2 text-[13px] text-[#3A3A40]">
            <span
              aria-hidden="true"
              className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#A4A4AC]"
            />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ── CV Comparison Result ────────────────────────────────────────────────── */

function CvComparisonResult({ comparison }) {
  return (
    <div className="mt-4 grid gap-4">
      <div className={ui.metrics}>
        <div className={ui.metric}>
          <span className={ui.metricLabel}>Similarity</span>
          <strong className={ui.metricValue}>{comparison.similarityScore}%</strong>
        </div>
        <div className={ui.metric}>
          <span className={ui.metricLabel}>Shared skills</span>
          <strong className={ui.metricValue}>{comparison.skills.shared.length}</strong>
        </div>
        <div className={ui.metric}>
          <span className={ui.metricLabel}>Only in base</span>
          <strong className={ui.metricValue}>{comparison.skills.onlyLeft.length}</strong>
        </div>
        <div className={ui.metric}>
          <span className={ui.metricLabel}>Only in compare</span>
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

      {comparison.fields.some((f) => f.leftCount > 0 || f.rightCount > 0) && (
        <div className={ui.pageGrid}>
          {comparison.fields
            .filter((f) => f.leftCount > 0 || f.rightCount > 0)
            .map((field) => (
              <article className={ui.panel} key={field.field}>
                <p className={ui.eyebrow}>{field.field}</p>
                <h3 className="mb-1 text-lg font-black">
                  {field.leftCount} vs {field.rightCount}
                </h3>
                <p className={ui.muted}>
                  Shared {field.shared.length} · base-only {field.onlyLeft.length} · compare-only{" "}
                  {field.onlyRight.length}
                </p>
              </article>
            ))}
        </div>
      )}
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
