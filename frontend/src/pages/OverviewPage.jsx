import { FiArrowRight, FiDownload, FiZap } from "react-icons/fi";
import { Empty, Metric, ProfileSummary } from "../components/common/DataViews";
import { getScoreClass, ui } from "../styles/ui";

/* Mini match-bar row used in the featured top-recommendation card */
function MatchBars({ breakdown }) {
  if (!breakdown) return null;
  const bars = [
    { label: "Skill", value: breakdown.skillScore ?? 0,      color: "var(--c-ink)" },
    { label: "Role",  value: breakdown.roleScore ?? 0,       color: "var(--c-cobalt)" },
    { label: "Exp",   value: breakdown.experienceScore ?? 0, color: "var(--c-slate)" },
  ];
  return (
    <div className="mt-3 grid gap-1.5">
      {bars.map(({ label, value, color }) => (
        <div key={label} className="grid items-center gap-2"
             style={{ gridTemplateColumns: "40px 1fr 26px" }}>
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
  const topRec   = recommendations[0] ?? null;
  const restRecs = recommendations.slice(1, 4);

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
          {topScore || 86}
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
              Import jobs
            </button>
            <button className={ui.buttonSecondary} disabled={isBusy} type="button" onClick={loadRecommendations}>
              <FiZap size={14} strokeWidth={1.5} />
              Rank now
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
                  {(topRec.matchedSkills || []).slice(0, 4).map((s) => (
                    <span key={s} className={ui.chipMatched}>{s}</span>
                  ))}
                  {(topRec.missingSkills || []).slice(0, 3).map((s) => (
                    <span key={s} className={ui.chipMissing}>{s}</span>
                  ))}
                  {!(topRec.matchedSkills?.length) && (topRec.skills || []).slice(0, 5).map((s) => (
                    <span key={s} className={ui.chip}>{s}</span>
                  ))}
                </div>

                {/* Match bars */}
                <MatchBars breakdown={topRec.breakdown} />
              </div>

              {/* Score pill */}
              <strong className={getScoreClass(topRec.matchScore ?? 0)}>
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
                      <strong className={getScoreClass(job.matchScore ?? 0)}>
                        {job.matchScore ?? 0}%
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Empty msg="No recommendations yet. Import jobs and click Rank now." />
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
