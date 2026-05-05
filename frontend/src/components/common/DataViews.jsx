import { ui } from "../../styles/ui";

export function Metric({ label, value }) {
  return (
    <div className={ui.metric}>
      <span className={ui.metricLabel}>{label}</span>
      <strong className={ui.metricValue}>{value}</strong>
    </div>
  );
}

export function ProfileSummary({ cv }) {
  return (
    <div className={ui.profileSummary}>
      <h3 className="min-w-0 wrap-break-word text-lg font-black">{cv.title}</h3>
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

export function JobList({ items }) {
  if (!items.length) return <Empty />;

  return (
    <div className={ui.jobList}>
      {items.slice(0, 8).map((job) => (
        <JobCard job={job} key={job._id || job.title} />
      ))}
    </div>
  );
}

function JobCard({ job }) {
  const matched = job.matchedSkills || [];
  const missing = job.missingSkills || [];
  const partial = job.partialSkills  || [];
  const hasRich = matched.length > 0 || missing.length > 0;

  return (
    <article className={ui.jobRow}>
      <div className="min-w-0">
        <h3 className="min-w-0 wrap-break-word text-lg font-black">{job.title}</h3>
        <p className={`${ui.muted} mb-2`}>
          {job.company || job.location || "Unknown company"}
        </p>

        {/* Explanation sentence */}
        {job.explanation && (
          <p className="mb-2 text-sm font-semibold text-slate-600">{job.explanation}</p>
        )}

        {/* Matched / partial / missing chips */}
        {hasRich ? (
          <div className="grid gap-1.5">
            {matched.length > 0 && (
              <div className={ui.chips}>
                {matched.map((s) => (
                  <span key={s} className={`${ui.chip} bg-teal-100 text-teal-800`}>{s}</span>
                ))}
              </div>
            )}
            {partial.length > 0 && (
              <div className={ui.chips}>
                {partial.map((s) => (
                  <span key={s} className={`${ui.chip} bg-amber-100 text-amber-800`}>{s}</span>
                ))}
              </div>
            )}
            {missing.length > 0 && (
              <div className={ui.chips}>
                {missing.slice(0, 4).map((s) => (
                  <span key={s} className={`${ui.chip} bg-red-100 text-red-700`}>{s}</span>
                ))}
                {missing.length > 4 && (
                  <span className={`${ui.chip} bg-red-50 text-red-500`}>
                    +{missing.length - 4} more missing
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Fallback: plain skill chips */
          <div className={ui.chips}>
            {(job.skills || []).slice(0, 5).map((skill) => (
              <span className={ui.chip} key={skill}>{skill}</span>
            ))}
          </div>
        )}

        {/* Breakdown mini bar */}
        {job.breakdown && (
          <div className="mt-2.5 grid gap-1">
            {[
              { label: "Skill",       score: job.breakdown.skillScore,      color: "bg-teal-600" },
              { label: "Experience",  score: job.breakdown.experienceScore,  color: "bg-slate-500" },
              { label: "Role",        score: job.breakdown.roleScore,        color: "bg-indigo-500" },
            ].map(({ label, score, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-[70px] shrink-0 text-[10px] font-black uppercase text-slate-400">
                  {label}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${Math.min(score, 100)}%` }}
                  />
                </div>
                <span className="w-[28px] shrink-0 text-right text-[10px] font-black text-slate-500">
                  {score}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 self-start">
        <ScoreBadge value={job.matchScore} />
        {job.level && (
          <p className="mt-1 text-center text-[10px] font-black uppercase text-slate-400">
            {job.level}
          </p>
        )}
      </div>
    </article>
  );
}

export function ScoreBadge({ value }) {
  const score = value ?? 0;
  const colorClass =
    score >= 75 ? "bg-teal-100 text-teal-800" :
    score >= 50 ? "bg-amber-100 text-amber-800" :
                  "bg-red-100 text-red-700";
  return (
    <strong className={`inline-block min-w-[58px] shrink-0 rounded-full px-2.5 py-1.5 text-center text-sm font-black ${colorClass}`}>
      {score}%
    </strong>
  );
}

export function Empty() {
  return <p className={ui.muted}>No data yet. Run an action to populate this view.</p>;
}
