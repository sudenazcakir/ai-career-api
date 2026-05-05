import { FiActivity, FiBriefcase, FiTrendingUp, FiThumbsUp, FiBarChart2 } from "react-icons/fi";
import { Empty } from "../components/common/DataViews";
import { ui } from "../styles/ui";

const STATUS_COLORS = {
  "Saved for Later": "bg-blue-500",
  "Under Review":    "bg-amber-500",
  "Accepted":        "bg-teal-600",
  "Rejected":        "bg-red-500",
};

export default function AnalyticsPage({
  applications,
  jobs,
  recommendations,
  skillAnalytics,
  loadAnalytics,
}) {
  const skillFrequency = skillAnalytics?.data || [];
  const meta           = skillAnalytics?.meta;
  const maxMissing     = skillFrequency[0]?.missingCount || 1;

  const statusCounts = ["Saved for Later", "Under Review", "Accepted", "Rejected"].map(
    (s) => ({ status: s, count: applications.filter((a) => a.status === s).length })
  );

  return (
    <div className="grid gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: FiActivity,   label: "Total Applications", value: applications.length },
          { icon: FiBriefcase,  label: "Jobs in DB",         value: jobs.length },
          { icon: FiTrendingUp, label: "Recommendations",    value: recommendations.length },
          { icon: FiThumbsUp,   label: "Accepted",           value: applications.filter((a) => a.status === "Accepted").length },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className={ui.metric}>
            <Icon className="h-4 w-4 text-teal-700" />
            <span className={ui.metricLabel}>{label}</span>
            <strong className="text-2xl font-black leading-none">{value}</strong>
          </div>
        ))}
      </div>

      <div className={ui.splitPage}>
        {/* Missing skill frequency */}
        <section className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <p className={ui.eyebrow}>Across all your CVs × all jobs</p>
              <h2 className="text-2xl font-black">Missing skill frequency</h2>
              {meta && (
                <p className="mt-1 text-xs text-slate-500">
                  {meta.cvCount} CV{meta.cvCount !== 1 ? "s" : ""} ×{" "}
                  {meta.jobCount} job{meta.jobCount !== 1 ? "s" : ""} ={" "}
                  {meta.comparisons} comparisons
                </p>
              )}
            </div>
            <button className={ui.button} type="button" onClick={loadAnalytics}>
              Analyze
            </button>
          </div>

          {skillFrequency.length > 0 ? (
            <div className="grid gap-2">
              {skillFrequency.slice(0, 12).map((item, i) => (
                <div key={item.skill} className="grid grid-cols-[22px_minmax(0,1fr)_1fr_36px] items-center gap-2">
                  <span className="text-right text-[10px] font-black text-slate-400">
                    #{i + 1}
                  </span>
                  <span className="min-w-0 truncate text-sm font-bold">{item.skill}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-700 transition-all duration-500"
                      style={{ width: `${Math.round((item.missingCount / maxMissing) * 100)}%` }}
                    />
                  </div>
                  <span className="text-right text-xs font-bold text-slate-500">
                    {item.missingCount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </section>

        {/* Application pipeline */}
        <section className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <p className={ui.eyebrow}>By stage</p>
              <h2 className="text-2xl font-black">Application pipeline</h2>
            </div>
          </div>

          {applications.length > 0 ? (
            <div className="grid gap-3">
              {statusCounts.map(({ status, count }) => {
                const pct = applications.length
                  ? Math.round((count / applications.length) * 100)
                  : 0;
                return (
                  <div key={status} className="grid grid-cols-[120px_1fr_36px] items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-500 truncate">
                      {status}
                    </span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[status] || "bg-slate-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-right text-xs font-bold text-slate-500">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty />
          )}
        </section>

        {/* Trend placeholder */}
        <section className={`${ui.panel} ${ui.full} flex flex-col items-center justify-center gap-2 border-dashed py-10 text-center`}>
          <FiBarChart2 className="h-8 w-8 text-slate-300" />
          <p className="font-semibold text-slate-500">
            Trend charts — match score over time, skill gap reduction, application outcomes.
          </p>
          <p className="text-sm text-slate-400">
            Click <strong>Analyze</strong> on the left panel to load skill data, then visit{" "}
            <strong>AI Insights</strong> for trend analytics.
          </p>
        </section>
      </div>
    </div>
  );
}
