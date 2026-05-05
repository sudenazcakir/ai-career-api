import {
  FiActivity, FiBriefcase, FiTrendingUp, FiThumbsUp, FiBarChart2,
} from "react-icons/fi";
import { Empty } from "../components/shared";

export default function AnalyticsPage({
  applications,
  jobs,
  recommendations,
  skillAnalytics,
  loadAnalytics,
}) {
  const skillFrequency = skillAnalytics?.data || [];
  const statusCounts = ["Saved for Later", "Under Review", "Accepted", "Rejected"].map(
    (s) => ({ status: s, count: applications.filter((a) => a.status === s).length })
  );

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-2xl border border-teal-200/25 bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.18),transparent_30%),linear-gradient(135deg,#0f172a,#12343b_52%,#111827)] p-6 text-white shadow-2xl">
        <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-300">
          Analytics Dashboard
        </p>
        <h2 className="text-[clamp(28px,4vw,48px)] font-black leading-none">
          Trends, patterns, and insights.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          Track your match score trends, application outcomes, and the most in-demand skills.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: FiActivity,   label: "Total Applications", value: applications.length },
          { icon: FiBriefcase,  label: "Jobs in DB",         value: jobs.length },
          { icon: FiTrendingUp, label: "Recommendations",    value: recommendations.length },
          { icon: FiThumbsUp,   label: "Accepted",           value: applications.filter((a) => a.status === "Accepted").length },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Icon className="h-5 w-5 text-teal-600" />
            <span className="text-xs font-black uppercase tracking-normal text-slate-500">
              {label}
            </span>
            <strong className="text-3xl font-black text-slate-950">{value}</strong>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-normal text-teal-700">
                Skill frequency
              </p>
              <h3 className="text-xl font-black text-slate-950">Missing skills</h3>
            </div>
            <button type="button" className="secondary" onClick={loadAnalytics}>
              Analyze
            </button>
          </div>
          {skillFrequency.length > 0 ? (
            <div className="skill-freq-list">
              {skillFrequency.slice(0, 10).map((item, i) => (
                <div key={item.skill} className="skill-freq-row">
                  <span className="skill-freq-rank">#{i + 1}</span>
                  <span className="skill-freq-name">{item.skill}</span>
                  <div className="skill-freq-bar-wrap">
                    <div
                      className="skill-freq-bar"
                      style={{
                        width: `${Math.min(100, item.share || item.missingCount || 0)}%`,
                      }}
                    />
                  </div>
                  <span className="skill-freq-count">{item.missingCount || item.count || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="mb-1 text-xs font-black uppercase tracking-normal text-teal-700">
              Pipeline
            </p>
            <h3 className="text-xl font-black text-slate-950">Application stages</h3>
          </div>
          <div className="pipeline-bars">
            {statusCounts.map(({ status, count }) => (
              <div key={status} className="pipeline-bar-row">
                <span className="pipeline-label">{status}</span>
                <div className="pipeline-track">
                  <div
                    className={`pipeline-fill pipeline-fill--${status.toLowerCase().replace(/\s+/g, "-")}`}
                    style={{
                      width: applications.length
                        ? `${Math.round((count / applications.length) * 100)}%`
                        : "0%",
                    }}
                  />
                </div>
                <span className="pipeline-count">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
          <FiBarChart2 className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-semibold text-slate-500">
            Trend charts — match score over time, skill gap reduction, and application outcomes.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Connect backend trend endpoints to populate this panel.
          </p>
        </section>
      </div>
    </div>
  );
}
