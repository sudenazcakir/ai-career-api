import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiCopy, FiEdit2, FiEye, FiGitBranch, FiSave, FiTrash2, FiX, FiZap } from "react-icons/fi";
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
  const [previewCv, setPreviewCv] = useState(null);

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

  useEffect(() => {
    if (!previewCv || typeof document === "undefined") return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewCv]);

  function handleDeleteClick(cvId) {
    const cv = cvs.find((c) => c._id === cvId);
    if (!cv) return;
    if (!window.confirm(`Delete "${cv.title}"? This cannot be undone.`)) return;
    deleteCv(cvId);
  }

  return (
    <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] items-stretch gap-[18px] max-lg:grid-cols-1">

      {/* ── Section 1: Form ──────────────────────────────────── */}
      <section className={`${ui.panel} flex h-full flex-col`}>
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

        <form
          className="grid min-h-0 flex-1 gap-3.5"
          style={{ gridTemplateRows: "auto minmax(230px, 1.25fr) minmax(210px, 0.95fr) auto" }}
          onSubmit={saveCv}
        >
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
          <label className="flex min-h-0 flex-col gap-1.5 text-[10px] font-[500] uppercase tracking-[0.05em] text-[#6B6B72] font-mono">
            Summary
            <textarea
              className={`${ui.input} !h-full min-h-0 resize-none py-2 leading-relaxed`}
              rows={3}
              value={cvForm.summary}
              onChange={(event) => setCvForm({ ...cvForm, summary: event.target.value })}
            />
          </label>
          <div className="grid min-h-0 grid-cols-2 gap-3 max-sm:grid-cols-1">
            {[
              ["projects", "Projects"],
              ["experience", "Experience"],
              ["education", "Education"],
              ["certifications", "Certifications"],
            ].map(([field, label]) => (
              <label
                className="flex min-h-0 flex-col gap-1.5 text-[10px] font-[500] uppercase tracking-[0.05em] text-[#6B6B72] font-mono"
                key={field}
              >
                {label}
                <textarea
                  className={`${ui.input} !h-full min-h-0 resize-none py-2 leading-relaxed`}
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
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(26px,3vw,38px)",
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "var(--c-ink)",
              }}
            >
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
                className={`overflow-hidden rounded-[12px] border transition-colors ${
                  isActive
                    ? "border-[#0E0E10] bg-[#F6F3EC]"
                    : "border-[#E8E3D7] bg-[#FBFAF6] hover:border-[#A4A4AC]"
                }`}
              >
                {/* Select area */}
                <button
                  type="button"
                  onClick={() => setSelectedCvId(cv._id)}
                  className="w-full p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1"
                >
                  <div className="mb-3 flex flex-wrap gap-1.5">
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
                  <CvLibrarySummary cv={cv} />
                </button>

                {/* Action row */}
                <div className="flex flex-wrap gap-2 border-t border-[#E8E3D7] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setPreviewCv(cv)}
                    className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#E8E3D7] bg-transparent px-2.5 text-[11px] font-medium text-[#3A3A40] transition-colors hover:border-[#A4A4AC] hover:text-[#0E0E10]"
                  >
                    <FiEye size={11} strokeWidth={1.5} />
                    Preview
                  </button>
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

      {/* ── Section 4: Versioning & Compare (full-width) ─────── */}
      <section className={`${ui.full} overflow-hidden rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6]`}>
        <div className="flex min-w-0 items-start justify-between gap-4 border-b border-[#E8E3D7] px-5 py-5 max-lg:flex-col">
          <div>
            <p className={ui.eyebrow}>Versioning · Comparison</p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(26px,3vw,38px)",
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "var(--c-ink)",
              }}
            >
              Version and compare CVs
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#3A3A40]">
              The active CV is the base. Compare it with another CV to see shared skills,
              missing emphasis, and content depth differences.
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

        <div className="grid gap-5 p-5">
        <div className="grid gap-3 rounded-[12px] border border-[#E8E3D7] bg-[#F6F3EC] p-3 lg:grid-cols-2">
          <CompareCvCard
            accent="base"
            label="Base CV"
            cv={selectedCv}
            empty="Select a CV from the library above"
          />
          <CompareCvCard
            accent="compare"
            label="Compare CV"
            cv={comparisonOptions.find((cv) => cv._id === compareCvId)}
            empty="Choose the CV you want to compare against"
          />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3 max-lg:grid-cols-1">
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
            className={`${ui.button} min-w-[160px]`}
            disabled={isBusy || !selectedCvId || !compareCvId}
            onClick={compareSelectedCvs}
            type="button"
          >
            <FiCopy size={14} strokeWidth={1.5} />
            Compare
          </button>
        </div>

        {cvComparison && <CvComparisonResult comparison={cvComparison} />}
        </div>
      </section>

      {previewCv && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(14,14,16,0.38)] p-5"
          role="presentation"
          onMouseDown={() => setPreviewCv(null)}
        >
          <section
            aria-label={`${previewCv.title} CV preview`}
            aria-modal="true"
            className={ui.modalWindow}
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={ui.modalHead}>
              <div>
                <p className={ui.eyebrow}>CV Preview</p>
                <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-[#0E0E10]">
                  {previewCv.title}
                </h2>
              </div>
              <button
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[#6B6B72] transition-colors hover:bg-[#F6F3EC] hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF]"
                type="button"
                onClick={() => setPreviewCv(null)}
                aria-label="Close preview"
              >
                <FiX size={16} strokeWidth={1.5} />
              </button>
            </div>
            <ProfessionalCvPreview cv={previewCv} />
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ── CV Preview ─────────────────────────────────────────────────────────── */

function CvLibrarySummary({ cv }) {
  const skillCount = (cv.skills || []).length;
  const projectCount = (cv.projects || []).length;
  const experienceCount = (cv.experience || []).length;

  return (
    <div className="grid min-w-0 gap-3">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-[#0E0E10]">
            {cv.title}
          </h3>
          <p className="mt-1 text-[12px] uppercase tracking-[0.08em] text-[#6B6B72] font-mono">
            {cv.type || "General"} / {cv.version || "v1"}
          </p>
        </div>
        <div className="grid grid-cols-2 overflow-hidden rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6]">
          <MiniCount label="Skills" value={skillCount} />
          <MiniCount label="Projects" value={projectCount} />
        </div>
      </div>
      {cv.summary && (
        <p className="line-clamp-2 text-[13px] leading-relaxed text-[#3A3A40]">{cv.summary}</p>
      )}
      <div className={ui.chips}>
        {(cv.skills || []).slice(0, 10).map((skill) => (
          <span className={ui.chip} key={skill}>{skill}</span>
        ))}
        {skillCount > 10 && <span className={ui.chip}>+{skillCount - 10}</span>}
      </div>
      <p className="text-[12px] text-[#6B6B72]">
        {experienceCount} experience item{experienceCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function MiniCount({ label, value }) {
  return (
    <div className="grid min-w-[72px] gap-1 border-r border-[#E8E3D7] px-3 py-2 text-right last:border-r-0">
      <strong className="text-[20px] font-semibold leading-none text-[#0E0E10]">{value}</strong>
      <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#6B6B72] font-mono">{label}</span>
    </div>
  );
}

function CompareCvCard({ accent, cv, empty, label }) {
  const isBase = accent === "base";
  return (
    <article className={`min-w-0 rounded-[10px] border bg-[#FBFAF6] p-4 ${
      isBase ? "border-[#0E0E10]" : "border-[#E8E3D7]"
    }`}>
      <div className="mb-5 flex min-w-0 items-start justify-between gap-3">
        <p className={ui.miniLabel}>{label}</p>
        {cv && (
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6B72] font-mono">
            {(cv.skills || []).length} skills
          </span>
        )}
      </div>
      {cv ? (
        <>
          <h3 className="truncate text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#0E0E10]">
            {cv.title}
          </h3>
          <p className="mt-2 text-[12px] uppercase tracking-[0.12em] text-[#6B6B72] font-mono">
            {cv.type || "General"} / {cv.version || "v1"}
          </p>
          <div className="mt-4 flex flex-wrap gap-1">
            {(cv.skills || []).slice(0, 6).map((skill) => (
              <span className={ui.chip} key={skill}>{skill}</span>
            ))}
          </div>
        </>
      ) : (
        <p className="text-[13px] text-[#6B6B72]">{empty}</p>
      )}
    </article>
  );
}

function ProfessionalCvPreview({ cv }) {
  const hasContent =
    (cv.projects?.length || 0) +
    (cv.experience?.length || 0) +
    (cv.education?.length || 0) +
    (cv.certifications?.length || 0) > 0;

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E8E3D7] bg-[#F6F3EC]">
      <div className="grid gap-5 border-b border-[#E8E3D7] bg-[#FBFAF6] p-6 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <p className={ui.eyebrow}>Professional CV</p>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px,5vw,56px)",
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
              color: "var(--c-ink)",
              fontWeight: 400,
            }}
          >
            {cv.title}
          </h3>
          <p className="mt-3 text-[15px] text-[#3A3A40]">
            {cv.type || "General"} profile · {cv.version || "v1"}
          </p>
          {cv.summary && (
            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#3A3A40]">
              {cv.summary}
            </p>
          )}
        </div>
        <aside className="grid content-start gap-3 rounded-[10px] border border-[#E8E3D7] bg-[#F6F3EC] p-4">
          <PreviewStat label="Skills" value={(cv.skills || []).length} />
          <PreviewStat label="Experience" value={(cv.experience || []).length} />
          <PreviewStat label="Projects" value={(cv.projects || []).length} />
        </aside>
      </div>

      <div className="grid gap-5 p-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <p className={ui.miniLabel}>Core skills</p>
          {(cv.skills || []).length > 0 ? (
            <div className={`${ui.chips} mt-2`}>
              {cv.skills.map((skill) => (
                <span className={ui.chip} key={skill}>{skill}</span>
              ))}
            </div>
          ) : (
            <p className={ui.muted}>No skills added.</p>
          )}
        </aside>

        <div className="grid min-w-0 gap-4">
          {(cv.experience || []).length > 0 && <PreviewList title="Experience" items={cv.experience} />}
          {(cv.projects || []).length > 0 && <PreviewList title="Selected projects" items={cv.projects} />}
          <div className="grid gap-4 md:grid-cols-2">
            {(cv.education || []).length > 0 && <PreviewList title="Education" items={cv.education} />}
            {(cv.certifications || []).length > 0 && <PreviewList title="Certifications" items={cv.certifications} />}
          </div>
          {!cv.summary && (cv.skills || []).length === 0 && !hasContent && (
            <p className={ui.muted}>No content yet. Edit this CV to add details.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#E8E3D7] pb-2 last:border-b-0 last:pb-0">
      <span className={ui.metricLabel}>{label}</span>
      <strong className="text-[18px] font-semibold text-[#0E0E10]">{value}</strong>
    </div>
  );
}

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
    <div className="grid gap-[18px]">
      <section className="overflow-hidden rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6]">
        <div className="flex min-w-0 items-start justify-between gap-4 border-b border-[#E8E3D7] px-5 py-4 max-lg:flex-col">
          <div>
            <p className={ui.eyebrow}>Side-by-side comparison</p>
            <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#0E0E10]">
              {comparison.left.title} vs {comparison.right.title}
            </h3>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[#6B6B72]">
              Similarity is based on shared skills divided by all unique skills across both CVs.
              Content cards compare projects, experience, education, and certifications by item count and overlap.
            </p>
          </div>
          <div className="shrink-0 text-left lg:text-right">
            <span className={ui.metricLabel}>Skill similarity</span>
            <strong className="mt-1 block text-[46px] font-semibold leading-none tracking-[-0.03em] text-[#0E0E10]">
              {comparison.similarityScore}%
            </strong>
          </div>
        </div>
        <div className="grid min-w-0 divide-y divide-[#E8E3D7] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <CvCompareSide cv={comparison.left} label="Base CV" />
          <CvCompareSide cv={comparison.right} label="Compared CV" />
        </div>
      </section>

      <div className={ui.metrics}>
        <ComparisonMetric label="Skill similarity" value={`${comparison.similarityScore}%`} />
        <ComparisonMetric label="Shared skills" value={comparison.skills.shared.length} />
        <ComparisonMetric label="Only in base CV" value={comparison.skills.onlyLeft.length} />
        <ComparisonMetric label="Only in compared CV" value={comparison.skills.onlyRight.length} />
      </div>

      <div className="grid gap-[18px] lg:grid-cols-3">
        <ComparisonList
          tone="shared"
          title="Shared skills"
          caption="Both CVs contain these skills."
          items={comparison.skills.shared}
        />
        <ComparisonList
          tone="base"
          title={`Only in ${comparison.left.title}`}
          caption="Present in the base CV, missing from the compared CV."
          items={comparison.skills.onlyLeft}
        />
        <ComparisonList
          tone="compare"
          title={`Only in ${comparison.right.title}`}
          caption="Present in the compared CV, missing from the base CV."
          items={comparison.skills.onlyRight}
        />
      </div>

      {comparison.fields.some((f) => f.leftCount > 0 || f.rightCount > 0) && (
        <div className="grid gap-[18px] lg:grid-cols-2">
          {comparison.fields
            .filter((f) => f.leftCount > 0 || f.rightCount > 0)
            .map((field) => (
              <ComparisonFieldCard field={field} key={field.field} />
            ))}
        </div>
      )}
    </div>
  );
}

function ComparisonMetric({ label, value }) {
  return (
    <div className={ui.metric}>
      <span className={ui.metricLabel}>{label}</span>
      <strong className={ui.metricValue}>{value}</strong>
    </div>
  );
}

function CvCompareSide({ cv, label }) {
  return (
    <article className="grid min-w-0 gap-5 p-5">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-4">
        <div className="min-w-0">
          <p className={ui.miniLabel}>{label}</p>
          <h4 className="truncate text-[28px] font-semibold leading-none tracking-[-0.02em] text-[#0E0E10]">
            {cv.title}
          </h4>
          <p className="mt-2 text-[12px] uppercase tracking-[0.12em] text-[#6B6B72] font-mono">
            {cv.type || "General"} / {cv.version || "v1"}
          </p>
        </div>
        <div className="grid h-max grid-cols-2 overflow-hidden rounded-[8px] border border-[#E8E3D7]">
          <MiniCount label="Skills" value={(cv.skills || []).length} />
          <MiniCount label="Projects" value={(cv.projects || []).length} />
        </div>
      </div>

      {(cv.skills || []).length > 0 && (
        <div>
          <p className={ui.miniLabel}>Skills ({(cv.skills || []).length})</p>
          <div className={ui.chips}>
            {(cv.skills || []).slice(0, 10).map((skill) => (
              <span className={ui.chip} key={skill}>{skill}</span>
            ))}
          </div>
        </div>
      )}

      {(cv.projects || []).length > 0 && (
        <PreviewList title="Projects" items={(cv.projects || []).slice(0, 3)} />
      )}
      {(cv.experience || []).length > 0 && (
        <PreviewList title="Experience" items={(cv.experience || []).slice(0, 3)} />
      )}
    </article>
  );
}

function ComparisonList({ caption, items, title, tone = "neutral" }) {
  const chipClass =
    tone === "shared" ? ui.chipMatched :
    tone === "compare" ? ui.chipPartial :
    tone === "base" ? ui.chipMissing :
    ui.chip;

  return (
    <article className="min-w-0 rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6] p-5">
      <p className={ui.eyebrow}>Skill set</p>
      <h3 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">{title}</h3>
      {caption && <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B6B72]">{caption}</p>}
      {items.length ? (
        <div className={`${ui.chips} mt-4`}>
          {items.map((item) => (
            <span className={chipClass} key={item}>
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

function ComparisonFieldCard({ field }) {
  return (
    <article className="min-w-0 rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6] p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div>
          <p className={ui.eyebrow}>{fieldLabel(field.field)}</p>
          <h3 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
            {field.leftCount} in base / {field.rightCount} in compared CV
          </h3>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-[8px] border border-[#E8E3D7] bg-[#F6F3EC]">
        <FieldCount label="Shared" value={field.shared.length} />
        <FieldCount label="Base only" value={field.onlyLeft.length} />
        <FieldCount label="Compared only" value={field.onlyRight.length} />
      </div>
    </article>
  );
}

function FieldCount({ label, value }) {
  return (
    <div className="grid gap-1 border-r border-[#E8E3D7] px-3 py-3 last:border-r-0">
      <span className={ui.metricLabel}>{label}</span>
      <strong className="text-[24px] font-semibold leading-none text-[#0E0E10]">{value}</strong>
    </div>
  );
}

function fieldLabel(field) {
  const labels = {
    projects: "Projects",
    experience: "Experience",
    education: "Education",
    certifications: "Certifications",
  };
  return labels[field] || field;
}
