import { FiArrowRight, FiDownload, FiZap } from "react-icons/fi";
import { Empty, Metric, ProfileSummary } from "../components/common/DataViews";
import { ui } from "../styles/ui";

function getDashboardScoreClass(value = 0) {
  const base = "inline-flex min-w-[52px] items-center justify-center rounded-[4px] px-2.5 py-1 text-[13px] font-[600]";
  if (value >= 75) return `${base} bg-[#D7E25C] text-[#0E0E10]`;
  if (value >= 50) return `${base} bg-[#E6EBFF] text-[#1E3FFF]`;
  return `${base} bg-[#EFE5F8] text-[#5B2A86]`;
}

/* Mini match-bar row used in the featured top-recommendation card */
function MatchBars({ breakdown, matchScore = 0 }) {
  const safeBreakdown = breakdown || {
    skillScore: matchScore,
    roleScore: matchScore,
    experienceScore: matchScore,
  };
  const bars = [
    { label: "Skill", value: safeBreakdown.skillScore ?? 0,      color: "var(--c-ink)" },
    { label: "Role",  value: safeBreakdown.roleScore ?? 0,       color: "var(--c-cobalt)" },
    { label: "Exp",   value: safeBreakdown.experienceScore ?? 0, color: "var(--c-slate)" },
  ];
  return (
    <div className="mt-3 grid gap-1.5">
      {bars.map(({ label, value, color }) => (
        <div key={label} className="grid items-center gap-2"
             style={{ gridTemplateColumns: "42px 1fr 34px" }}>
          <span className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#6B6B72]"
                style={{ fontFamily: "var(--font-mono)" }}>
            {label}
          </span>
          <div className="h-[4px] overflow-hidden rounded-[2px] bg-[#E8E3D7]">
            <div className="h-full rounded-[2px]"
                 style={{ width: `${Math.min(value, 100)}%`, background: color }} />
          </div>
          <span className="text-right text-[10px] font-medium text-[#6B6B72]"
                style={{ fontFamily: "var(--font-mono)" }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function OverviewPage({
  cvs,
  fetchJobs,
  isBusy,
  jobs,
  loadRecommendations,
  recommendations,
  selectedCv,
  setActivePage,
  topScore,
}) {
  const scoredJobs = jobs.filter((job) => job?.breakdown);
  const rankedJobs = recommendations.length ? recommendations : scoredJobs;
  const topRec   = rankedJobs[0] ?? null;
  const restRecs = rankedJobs.slice(1, 4);

  return (
    <div className={ui.pageGrid}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className={`${ui.heroPanel} lat-dot-grid`}>
        <span aria-hidden="true" style={{
          position: "absolute", right: 24, bottom: -60,
          fontFamily: "var(--font-display)", fontSize: 240, lineHeight: 1,
          color: "var(--c-mist)", opacity: 0.3,
          letterSpacing: "-0.02em", pointerEvents: "none", userSelect: "none",
        }}>
          {topScore ?? 86}
        </span>

        <div className="relative min-w-0">
          <p className={ui.eyebrow}>AI-assisted matching</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(34px,4vw,52px)",
            fontWeight: 400, lineHeight: 1.02,
            letterSpacing: "-0.02em", color: "var(--c-ink)",
            maxWidth: 560, marginTop: 8,
          }}>
            Turn CV skills into{" "}
            <em style={{ fontStyle: "italic" }}>ranked</em> career options.
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#3A3A40]">
            Import roles, select a CV, rank matches, and generate a learning
            path from missing skills.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button className={ui.buttonCobalt} disabled={isBusy} type="button" onClick={fetchJobs}>
              <FiDownload size={14} strokeWidth={1.5} />
              Sync Jobs
            </button>
            <button className={ui.buttonSecondary} disabled={isBusy} type="button" onClick={loadRecommendations}>
              <FiZap size={14} strokeWidth={1.5} />
              Get Recommendations
            </button>
          </div>
        </div>
      </section>

      {/* ── Metrics strip ────────────────────────────────────────────── */}
      <div className={`${ui.metrics} col-span-full`}>
        <Metric label="CV profiles"     value={cvs.length}             hint="active profiles" />
        <Metric label="Filtered jobs"   value={jobs.length}            hint="from Adzuna" />
        <Metric label="Recommendations" value={recommendations.length} hint="match ≥ 60%" />
        <Metric label="Top score"       value={`${topScore}%`}         hint="best match" />
      </div>

      {/* ── Top recommendation (featured) ────────────────────────────── */}
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Top recommendation</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              {topRec ? topRec.title : "Best match"}
            </h2>
          </div>
          <button type="button" className={ui.buttonGhost} onClick={() => setActivePage("jobs")}>
            Explore
            <FiArrowRight size={13} strokeWidth={1.5} />
          </button>
        </div>

        {topRec ? (
          <>
            {/* Featured job card */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-[13px] text-[#6B6B72]">
                  {topRec.company || topRec.location || "Unknown company"}
                  {topRec.location && topRec.company ? ` · ${topRec.location}` : ""}
                </p>

                {/* Skill chips */}
                <div className={ui.chips}>
                  {(
                    topRec.matchedSkills?.length
                      ? topRec.matchedSkills
                      : topRec.skills || []
                  ).slice(0, 5).map((s) => (
                    <span key={s} className={ui.chipMatched}>{s}</span>
                  ))}
                  {(topRec.missingSkills || []).slice(0, 3).map((s) => (
                    <span key={s} className={ui.chipMissing}>{s}</span>
                  ))}
                </div>

                {/* Match bars */}
                <MatchBars breakdown={topRec.breakdown} matchScore={topRec.matchScore ?? 0} />
              </div>

              {/* Score pill */}
              <strong className={getDashboardScoreClass(topRec.matchScore ?? 0)}>
                {topRec.matchScore ?? 0}%
              </strong>
            </div>

            {/* Additional recommendations (compact) */}
            {restRecs.length > 0 && (
              <div className="mt-4 border-t border-[#E8E3D7] pt-4">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6B72]"
                   style={{ fontFamily: "var(--font-mono)" }}>
                  Also recommended
                </p>
                <div className="grid gap-2">
                  {restRecs.map((job) => (
                    <div key={job._id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[13px] font-medium text-[#0E0E10]">{job.title}</span>
                        {job.company && (
                          <span className="ml-1.5 text-[12px] text-[#6B6B72]">· {job.company}</span>
                        )}
                      </div>
                      <strong className={getDashboardScoreClass(job.matchScore ?? 0)}>
                        {job.matchScore ?? 0}%
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Empty msg="No recommendations yet. Sync jobs and click Get Recommendations." />
        )}
      </section>

      {/* ── Selected CV ──────────────────────────────────────────────── */}
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Selected CV</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              {selectedCv ? selectedCv.title : "No CV selected"}
            </h2>
          </div>
          <button type="button" className={ui.buttonGhost} onClick={() => setActivePage("cv")}>
            Manage
            <FiArrowRight size={13} strokeWidth={1.5} />
          </button>
        </div>
        <div className="mb-4 border-t border-[#E8E3D7]" />
        {selectedCv ? (
          <ProfileSummary cv={selectedCv} />
        ) : (
          <Empty msg="No CV profiles yet. Create one to start matching." />
        )}
      </section>
    </div>
  );
}
