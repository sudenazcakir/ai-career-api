import { FiZap } from "react-icons/fi";
import { Empty } from "../components/common/DataViews";
import { TrendSummary } from "../components/insights/InsightPanels";
import { ui } from "../styles/ui";

/* Status → Lattice color mapping */
const STATUS_BAR = {
  "Saved for Later": { fill: "#6B6B72", label: "Saved" },
  "Under Review":    { fill: "#1E3FFF", label: "Under review" },
  "Accepted":        { fill: "#0E7C4A", label: "Accepted" },
  "Rejected":        { fill: "#5B2A86", label: "Rejected" },
};

export default function AnalyticsPage({
  applications,
  jobs,
  recommendations,
  skillAnalytics,
  trendAnalytics,
  loadAnalytics,
}) {
  const skillFrequency = skillAnalytics?.data || [];
  const meta           = skillAnalytics?.meta;
  const maxMissing     = skillFrequency[0]?.missingCount || 1;

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
            fontFamily: "var(--font-display)",
            fontSize: 200, lineHeight: 1,
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
            Analyse what the market wants against what your CVs offer, and track
            how your applications progress through each stage.
          </p>
          <div className="mt-5">
            <button className={ui.buttonCobalt} type="button" onClick={loadAnalytics}>
              <FiZap size={14} strokeWidth={1.5} />
              Analyse now
            </button>
          </div>
        </div>
      </section>

      {/* ── Metrics strip ─────────────────────────────────────────────── */}
      <div className={`${ui.metrics} col-span-full`}>
        {[
          { label: "Applications",   value: applications.length },
          { label: "Jobs in DB",     value: jobs.length },
          { label: "Recommendations",value: recommendations.length },
          { label: "Accepted",       value: accepted },
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
                  ? `${meta.cvCount} CV${meta.cvCount === 1 ? "" : "s"} × ${meta.jobCount} job${meta.jobCount === 1 ? "" : "s"}`
                  : "All CVs × all jobs"}
              </p>
              <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                Missing skill frequency
              </h2>
              {meta && (
                <p className="mt-0.5 text-[12px] text-[#6B6B72]">
                  {meta.comparisons} comparisons
                </p>
              )}
            </div>
            <button className={ui.buttonCobalt} type="button" onClick={loadAnalytics}>
              <FiZap size={14} strokeWidth={1.5} />
              Analyse
            </button>
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
                  <div className="h-[4px] overflow-hidden rounded-[2px] bg-[#E8E3D7]">
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
            <Empty msg="No skill data yet. Click Analyse to load missing skill frequency across your CVs and jobs." />
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
                  <div key={status} className="grid items-center gap-2"
                       style={{ gridTemplateColumns: "110px 1fr 32px" }}>
                    <span
                      className="truncate text-[10px] font-medium"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: fill,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
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
            <Empty msg="No applications tracked yet. Save jobs from the Jobs page and move them through stages." />
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
              <p className="mt-1 text-[13px] text-[#6B6B72]">
                Job category distribution, salary ranges, and demand signals from loaded jobs.
              </p>
            </div>
            <button className={ui.buttonCobalt} type="button" onClick={loadAnalytics}>
              <FiZap size={14} strokeWidth={1.5} />
              Analyse now
            </button>
          </div>

          {trendAnalytics?.data ? (
            <TrendSummary data={trendAnalytics.data} />
          ) : (
            <Empty msg="No trend data yet. Click Analyse now to load market signals from your jobs database." />
          )}
        </section>
      </div>
    </div>
  );
}
