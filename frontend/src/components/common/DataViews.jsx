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
      <h3 className="min-w-0 break-words text-lg font-black">{cv.title}</h3>
      <p className={`${ui.muted} mb-2`}>
        {cv.type || "General"} · {cv.version || "v1"}
      </p>
      {cv.summary && <p className={`${ui.muted} mb-3`}>{cv.summary}</p>}
      <div className={ui.chips}>
        {(cv.skills || []).map((skill) => (
          <span className={ui.chip} key={skill}>
            {skill}
          </span>
        ))}
      </div>
      {Boolean((cv.projects || []).length) && (
        <p className={`${ui.muted} mt-2`}>
          {(cv.projects || []).length} project
          {(cv.projects || []).length === 1 ? "" : "s"}
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
        <article className={ui.jobRow} key={job._id || job.title}>
          <div>
            <h3 className="min-w-0 break-words text-lg font-black">{job.title}</h3>
            <p className={`${ui.muted} mb-2`}>
              {job.company || job.location || "Unknown company"}
            </p>
            <div className={ui.chips}>
              {(job.skills || []).slice(0, 5).map((skill) => (
                <span className={ui.chip} key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <ScoreBadge value={job.matchScore} />
        </article>
      ))}
    </div>
  );
}

export function ScoreBadge({ value }) {
  const score = value ?? 0;
  return <strong className={ui.score}>{score}%</strong>;
}

export function Empty() {
  return <p className={ui.muted}>No data yet. Run an action to populate this view.</p>;
}
