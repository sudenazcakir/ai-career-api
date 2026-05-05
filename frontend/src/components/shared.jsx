// Shared UI components used across multiple pages

import { FiFileText, FiBriefcase, FiTrendingUp, FiActivity, FiAlertCircle } from "react-icons/fi";
import { listToText } from "../utils";

export function Empty() {
  return (
    <p className="empty-state">No data yet. Run an action to populate this view.</p>
  );
}

export function ScoreBadge({ value }) {
  const score = value ?? 0;
  const cls = score >= 75 ? "score-high" : score >= 50 ? "score-med" : "score-low";
  return <span className={`score-badge ${cls}`}>{score}%</span>;
}

export function Metric({ label, value, icon: Icon }) {
  return (
    <div className="metric">
      <div className="metric-header">
        {Icon && <Icon className="metric-icon" />}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

export function ProfileSummary({ cv }) {
  return (
    <div className="profile-summary">
      <h3>{cv.title}</h3>
      {(cv.type || cv.summary) && (
        <p className="profile-summary-meta">
          {cv.type || "General"} {cv.summary ? `– ${cv.summary}` : ""}
        </p>
      )}
      <div className="chips">
        {(cv.skills || []).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </div>
  );
}

export function JobList({ items, onDetails, onTrack }) {
  if (!items.length) return <Empty />;

  return (
    <div className="grid gap-3">
      {items.slice(0, 8).map((job) => (
        <article
          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-lg md:flex-row md:items-start md:justify-between"
          key={job._id || job.title}
        >
          <div className="min-w-0">
            <h3 className="mb-1 text-lg font-black text-slate-950">{job.title}</h3>
            <p className="mb-3 text-sm font-semibold text-slate-500">
              {job.company || job.location || "Unknown company"}
            </p>
            <div className="chips">
              {(job.skills || []).slice(0, 5).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </div>
          <div className="grid min-w-[150px] gap-2 md:justify-items-end">
            {job.matchScore != null && (
              <ScoreBadge value={job.matchScore} />
            )}
            {onDetails && (
              <button
                type="button"
                className="secondary w-full"
                onClick={() => onDetails(job)}
              >
                Details
              </button>
            )}
            {onTrack && (
              <>
                <button
                  type="button"
                  className="w-full"
                  onClick={() => onTrack(job, "Under Review")}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="ghost w-full"
                  onClick={() => onTrack(job, "Saved for Later")}
                >
                  Save for Later
                </button>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export function GeneratedListEditor({ label, onChange, value }) {
  return (
    <label className="field tall">
      {label}
      <textarea
        value={listToText(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
