import { FiMap, FiRefreshCw } from "react-icons/fi";
import { Empty } from "../components/common/DataViews";
import { TrendSummary } from "../components/insights/InsightPanels";
import { ui } from "../styles/ui";
import { categorizeSkill } from "../utils/skillUtils";

const STATUS_BAR = {
  "Saved for Later": { fill: "#6B6B72", label: "Saved" },
  "Under Review":    { fill: "#1E3FFF", label: "Under review" },
  "Accepted":        { fill: "#0E7C4A", label: "Accepted" },
  "Rejected":        { fill: "#5B2A86", label: "Rejected" },
};

export default function MarketSignalsPage({
  applications,
  jobs,
  loadAnalytics,
  openRoadmap,
  recommendations,
  skillAnalytics,
  trendAnalytics,
}) {
  const skillFrequency = skillAnalytics?.data || [];
  const meta           = skillAnalytics?.meta;
  const maxMissing     = skillFrequency[0]?.missingCount || 1;
  const hasAnalytics   = skillFrequency.length > 0 || trendAnalytics?.data;

  const statusRows = Object.entries(STATUS_BAR).map(([status, cfg]) => ({
    ...cfg,
    status,
    count: applications.filter((a) => a.status === status).length,
  }));

  const accepted = applications.filter((a) => a.status === "Accepted").length;

  return (
    <div className="grid gap-[18px]">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <section className={`${ui.heroPanel} lat-dot-grid`}>
        <span
          aria-hidden="true"
          style={{
            position: "absolute", right: 24, bottom: -48,
            fontFamily: "var(--font-display)", fontSize: 200, lineHeight: 1,
            color: "var(--c-mist)", opacity: 0.28,
            letterSpacing: "-0.02em", pointerEvents: "none", userSelect: "none",
          }}
        >
          {applications.length || "—"}
        </span>
        <div className="relative min-w-0">
          <p className={ui.eyebrow}>Apply · Market Signals</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px,3.5vw,46px)",
            fontWeight: 400, lineHeight: 1.02,
            letterSpacing: "-0.02em", color: "var(--c-ink)",
            maxWidth: 560, marginTop: 8,
          }}>
            Skills in demand, <em style={{ fontStyle: "italic" }}>pipeline at a glance.</em>
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#3A3A40]">
            {hasAnalytics
              ? "Analytics loaded. Refresh to update with the latest job and CV data."
              : "Analytics load automatically on page visit. Refresh to reload."}
          </p>
          <div className="mt-5">
            <button className={ui.buttonCobalt} type="button" onClick={loadAnalytics}>
              <FiRefreshCw size={13} strokeWidth={1.5} />
              Refresh analytics
            </button>
          </div>
        </div>
      </section>

      {/* ── Metrics strip ─────────────────────────────────────────────── */}
      <div className={`${ui.metrics} col-span-full`}>
        {[
          { label: "Applications",    value: applications.length },
          { label: "Jobs in DB",      value: jobs.length },
          { label: "Recommendations", value: recommendations.length },
          { label: "Accepted",        value: accepted },
        ].map(({ label, value }) => (
          <div key={label} className={ui.metric}>
            <span className={ui.metricLabel}>{label}</span>
            <strong className={ui.metricValue}>{value}</strong>
          </div>
        ))}
      </div>

      <div className={ui.splitPage}>

        {/* ── Missing skill frequency ────────────────────────────────── */}
        <section className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <p className={ui.eyebrow}>
                {meta
                  ? `${meta.cvCount} CV${meta.cvCount === 1 ? "" : "s"} × ${meta.jobCount} job${meta.jobCount === 1 ? "" : "s"} — portfolio-wide`
                  : "All CVs × all jobs — portfolio-wide"}
              </p>
              <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                Missing skill frequency
              </h2>
              <p className="mt-0.5 text-[13px] text-[#6B6B72]">
                {meta
                  ? `All ${meta.cvCount} of your CVs compared against ${meta.jobCount} jobs in the database — ${meta.comparisons} CV–job pair${meta.comparisons === 1 ? "" : "s"}.`
                  : "All your CVs compared against every job in the database."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {meta && (
                <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
                  {skillFrequency.length} skills
                </span>
              )}
              {typeof openRoadmap === "function" && skillFrequency.length > 0 && (
                <button
                  className={ui.buttonSecondary}
                  type="button"
                  onClick={() => {
                    const topSkills = skillFrequency.slice(0, 3);
                    openRoadmap({
                      source: "market",
                      selectedSkills: topSkills.map((s) => s.skill),
                      recommendedSkills: topSkills.map((s) => ({ skill: s.skill, count: s.missingCount, cat: categorizeSkill(s.skill) })),
                      label: "Based on portfolio-wide Market Signals",
                    });
                  }}
                >
                  <FiMap size={14} strokeWidth={1.5} />
                  Use in Growth Plan
                </button>
              )}
            </div>
          </div>

          {skillFrequency.length > 0 ? (
            <div className="grid gap-2.5">
              {skillFrequency.slice(0, 12).map((item, i) => (
                <div
                  key={item.skill}
                  className="grid items-center gap-2"
                  style={{ gridTemplateColumns: "22px minmax(100px,1.2fr) 1fr 32px" }}
                >
                  <span
                    className="text-right text-[10px] font-medium text-[#A4A4AC]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate text-[13px] text-[#0E0E10]">{item.skill}</span>
                  <div
                    className="h-[4px] overflow-hidden rounded-[2px] bg-[#E8E3D7]"
                    role="progressbar"
                    aria-label={`${item.skill}: missing from ${item.missingCount} CV–job comparison${item.missingCount === 1 ? "" : "s"}`}
                    aria-valuemin={0}
                    aria-valuemax={maxMissing}
                    aria-valuenow={item.missingCount}
                  >
                    <div
                      className="h-full rounded-[2px] transition-all"
                      style={{
                        width: `${Math.round((item.missingCount / maxMissing) * 100)}%`,
                        background: "var(--c-cobalt)",
                      }}
                    />
                  </div>
                  <span
                    className="text-right text-[11px] font-medium text-[#6B6B72]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {item.missingCount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty msg="No skill data yet. Analytics load automatically — refresh if data does not appear." />
          )}
        </section>

        {/* ── Application pipeline ───────────────────────────────────── */}
        <section className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <p className={ui.eyebrow}>By stage</p>
              <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                Application pipeline
              </h2>
              <p className="mt-0.5 text-[13px] text-[#6B6B72]">
                How your tracked applications are distributed across stages.
              </p>
            </div>
            <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
              {applications.length} total
            </span>
          </div>

          {applications.length > 0 ? (
            <div className="grid gap-3">
              {statusRows.map(({ status, label, fill, count }) => {
                const pct = applications.length
                  ? Math.round((count / applications.length) * 100)
                  : 0;
                return (
                  <div
                    key={status}
                    className="grid items-center gap-2"
                    style={{ gridTemplateColumns: "110px 1fr 32px" }}
                  >
                    <span
                      className="truncate text-[10px] font-medium uppercase tracking-[0.05em]"
                      style={{ fontFamily: "var(--font-mono)", color: fill }}
                    >
                      {label}
                    </span>
                    <div className="h-[4px] overflow-hidden rounded-[2px] bg-[#E8E3D7]">
                      <div
                        className="h-full rounded-[2px] transition-all"
                        style={{ width: `${pct}%`, background: fill }}
                      />
                    </div>
                    <span
                      className="text-right text-[11px] font-medium text-[#6B6B72]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty msg="No applications tracked yet. Save jobs from the Jobs page to start building your pipeline." />
          )}
        </section>

        {/* ── Market trends ──────────────────────────────────────────── */}
        <section className={`${ui.panel} ${ui.full}`}>
          <div className={ui.sectionHead}>
            <div>
              <p className={ui.eyebrow}>Market signal</p>
              <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                Market trends
              </h2>
              <p className="mt-0.5 text-[13px] text-[#6B6B72]">
                Job category distribution and salary ranges from live market data.
                Salary averages exclude listings with no salary information.
              </p>
            </div>
          </div>

          {trendAnalytics?.data ? (
            <TrendSummary data={trendAnalytics.data} />
          ) : (
            <Empty msg="No trend data yet. Analytics load automatically — refresh if data does not appear." />
          )}
        </section>
      </div>
    </div>
  );
}
