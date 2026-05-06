import { useEffect, useRef, useState } from "react";
import { FiBookmark, FiCheck } from "react-icons/fi";
import { getScoreClass, ui } from "../../styles/ui";

/* ── Metric ─────────────────────────────────────────────────────────────── */
export function Metric({ label, value, hint }) {
  return (
    <div className={ui.metric}>
      <span className={ui.metricLabel}>{label}</span>
      <strong className={ui.metricValue}>{value}</strong>
      {hint && <span className="text-[12px] text-[#6B6B72]">{hint}</span>}
    </div>
  );
}

/* ── ProfileSummary ──────────────────────────────────────────────────────── */
export function ProfileSummary({ cv }) {
  return (
    <div className={ui.profileSummary}>
      <h3 className="text-[15px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
        {cv.title}
      </h3>
      <p className={`${ui.muted} mb-2`}>
        {cv.type || "General"} · {cv.version || "v1"}
      </p>
      {cv.summary && <p className={`${ui.muted} mb-3`}>{cv.summary}</p>}
      <div className={ui.chips}>
        {(cv.skills || []).map((skill) => (
          <span className={ui.chip} key={skill}>{skill}</span>
        ))}
      </div>
      {Boolean((cv.projects || []).length) && (
        <p className={`${ui.muted} mt-2`}>
          {(cv.projects || []).length} project{(cv.projects || []).length === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

/* ── JobList ─────────────────────────────────────────────────────────────── */
export function JobList({ items, onSave }) {
  if (!items.length) return <Empty msg="No jobs yet. Import or filter to populate this list." />;

  return (
    <div className={ui.jobList}>
      {items.slice(0, 8).map((job) => (
        <JobCard job={job} key={job._id || job.title} onSave={onSave} />
      ))}
    </div>
  );
}

/* ── JobCard ─────────────────────────────────────────────────────────────── */
function JobCard({ job, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const savedTimerRef = useRef(null);
  const matched = job.matchedSkills || [];
  const missing = job.missingSkills || [];
  const partial = job.partialSkills  || [];
  const hasRich  = matched.length > 0 || missing.length > 0;

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  async function handleSave() {
    if (!onSave || isSaving) return;

    setIsSaving(true);
    setIsSaved(false);
    let didSave;
    try {
      didSave = await onSave(job, "Saved for Later");
    } finally {
      setIsSaving(false);
    }

    if (didSave === false) return;

    setIsSaved(true);
    savedTimerRef.current = window.setTimeout(() => setIsSaved(false), 1800);
  }

  return (
    <article className={ui.jobRow}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
          {job.title}
          {(job.company || job.location) && (
            <span className="ml-1.5 font-normal text-[#6B6B72]">
              · {job.company || job.location}
            </span>
          )}
        </h3>

        {job.explanation && (
          <p className="mt-1 mb-2 text-[13px] text-[#3A3A40]">{job.explanation}</p>
        )}

        {/* Skill chips */}
        {hasRich ? (
          <div className="mt-2 grid gap-1.5">
            {matched.length > 0 && (
              <div className={ui.chips}>
                {matched.map((s) => <span key={s} className={ui.chipMatched}>{s}</span>)}
              </div>
            )}
            {partial.length > 0 && (
              <div className={ui.chips}>
                {partial.map((s) => <span key={s} className={ui.chipPartial}>{s}</span>)}
              </div>
            )}
            {missing.length > 0 && (
              <div className={ui.chips}>
                {missing.slice(0, 4).map((s) => <span key={s} className={ui.chipMissing}>{s}</span>)}
                {missing.length > 4 && (
                  <span className={ui.chipMissing}>+{missing.length - 4} more</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={`${ui.chips} mt-2`}>
            {(job.skills || []).slice(0, 5).map((skill) => (
              <span className={ui.chip} key={skill}>{skill}</span>
            ))}
          </div>
        )}

        {/* Breakdown bars */}
        {job.breakdown && (
          <div className="mt-3 grid gap-1.5">
            {[
              { label: "Skill",      score: job.breakdown.skillScore,      color: "var(--c-ink)" },
              { label: "Exp",        score: job.breakdown.experienceScore,  color: "var(--c-cobalt)" },
              { label: "Role",       score: job.breakdown.roleScore,        color: "var(--c-slate)" },
            ].map(({ label, score, color }) => (
              <div key={label} className="grid items-center gap-2"
                   style={{ gridTemplateColumns: "52px 1fr 28px" }}>
                <span className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#6B6B72]"
                      style={{ fontFamily: "var(--font-mono)" }}>
                  {label}
                </span>
                <div className="h-[4px] overflow-hidden rounded-[2px] bg-[#E8E3D7]">
                  <div
                    className="h-full rounded-[2px]"
                    style={{ width: `${Math.min(score ?? 0, 100)}%`, background: color }}
                  />
                </div>
                <span className="text-right text-[10px] font-medium text-[#6B6B72]"
                      style={{ fontFamily: "var(--font-mono)" }}>
                  {score ?? 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 self-start">
        <ScoreBadge value={job.matchScore} />
        {job.level && (
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#6B6B72]"
             style={{ fontFamily: "var(--font-mono)" }}>
            {job.level}
          </p>
        )}
        {onSave && (
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] px-2.5 text-[12px] font-medium text-[#3A3A40] transition-colors hover:border-[#A4A4AC] hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaved ? <FiCheck className="h-3.5 w-3.5" /> : <FiBookmark className="h-3.5 w-3.5" />}
            {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
          </button>
        )}
      </div>
    </article>
  );
}

/* ── ScoreBadge ──────────────────────────────────────────────────────────── */
export function ScoreBadge({ value }) {
  const score = value ?? 0;
  return (
    <strong className={getScoreClass(score)}>
      {score}%
    </strong>
  );
}

/* ── Empty ───────────────────────────────────────────────────────────────── */
export function Empty({ msg = "No data yet. Run an action to populate this view." }) {
  return (
    <p
      className="rounded-[8px] border border-dashed border-[#A4A4AC] p-6 text-center text-[13px] text-[#6B6B72]"
    >
      {msg}
    </p>
  );
}
