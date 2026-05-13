import { useEffect, useRef, useState } from "react";
import { FiBriefcase, FiFileText, FiMap } from "react-icons/fi";
import { Empty } from "../components/common/DataViews";
import { ui } from "../styles/ui";
import { buildSkillGaps } from "../utils/skillUtils";

function buildHeroDescription(hasCv, hasJobs, cvTitle, jobCount, gapCount) {
  if (hasCv && hasJobs) {
    const jobWord = jobCount === 1 ? "job" : "jobs";
    const gapWord = gapCount === 1 ? "gap" : "gaps";
    return gapCount > 0
      ? `Comparing "${cvTitle}" against ${jobCount} ${jobWord}. ${gapCount} skill ${gapWord} found.`
      : `Comparing "${cvTitle}" against ${jobCount} ${jobWord}. Your CV covers all job requirements.`;
  }
  if (hasJobs) return `${jobCount} jobs loaded. Select a CV to see your skill gaps.`;
  return "Import jobs and select a CV to map your skill gaps against live market data.";
}

const CAT_LABELS = {
  technical: "Technical",
  tools:     "Tools & platforms",
  domain:    "Domain knowledge",
};

const CAT_COLORS = {
  technical: { chip: "bg-[#E6EBFF] text-[#1E3FFF]", bar: "#1E3FFF" },
  tools:     { chip: "bg-[#EFE5F8] text-[#5B2A86]", bar: "#5B2A86" },
  domain:    { chip: "bg-[#E5F4EC] text-[#0E7C4A]", bar: "#0E7C4A" },
};

export default function SkillMapPage({ jobs, openRoadmap, recommendations, selectedCv, setActivePage }) {
  const allJobs    = [...jobs, ...recommendations].filter((j) => j?._id);
  const uniqueJobs = [...new Map(allJobs.map((j) => [j._id, j])).values()];
  const gaps       = buildSkillGaps(uniqueJobs, selectedCv?.skills);
  const recommendedGaps = gaps.slice(0, 3);
  const maxCount   = gaps[0]?.count || 1;
  const [gapListMaxHeight, setGapListMaxHeight] = useState(null);
  const gapListRef = useRef(null);

  const byCategory = {
    technical: gaps.filter((g) => g.cat === "technical"),
    tools:     gaps.filter((g) => g.cat === "tools"),
    domain:    gaps.filter((g) => g.cat === "domain"),
  };

  const topCategoryEntry = Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length)[0];
  const topCategory = topCategoryEntry?.[1]?.length > 0 ? topCategoryEntry : null;

  const hasJobs = uniqueJobs.length > 0;
  const hasCv   = Boolean(selectedCv);

  const heroDescription = buildHeroDescription(hasCv, hasJobs, selectedCv?.title, uniqueJobs.length, gaps.length);

  function handleBuildGrowthPlan() {
    const selectedSkills = recommendedGaps.map((gap) => gap.skill);
    if (typeof openRoadmap === "function") {
      openRoadmap({
        source: "skill-map",
        selectedSkills,
        recommendedSkills: recommendedGaps,
        autoGenerate: false,
        label: "Based on your most frequent Skill Map gaps",
      });
      return;
    }
    setActivePage("roadmap");
  }

  useEffect(() => {
    const list = gapListRef.current;
    if (!list || gaps.length <= 12) {
      setGapListMaxHeight(null);
      return undefined;
    }

    function updateGapListHeight() {
      const children = Array.from(list.children).slice(0, 12);
      const styles = window.getComputedStyle(list);
      const gap = parseFloat(styles.rowGap || styles.gap) || 0;
      const height = children.reduce(
        (total, child) => total + child.getBoundingClientRect().height,
        0
      ) + gap * Math.max(children.length - 1, 0);

      setGapListMaxHeight(Math.ceil(height));
    }

    updateGapListHeight();
    window.addEventListener("resize", updateGapListHeight);
    return () => window.removeEventListener("resize", updateGapListHeight);
  }, [gaps]);

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
          {gaps.length || "—"}
        </span>
        <div className="relative min-w-0">
          <p className={ui.eyebrow}>Growth · Skill Map</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px,3.5vw,46px)",
            fontWeight: 400, lineHeight: 1.02,
            letterSpacing: "-0.02em", color: "var(--c-ink)",
            maxWidth: 560, marginTop: 8,
          }}>
            Where your skills meet <em style={{ fontStyle: "italic" }}>the market.</em>
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#3A3A40]">
            {heroDescription}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button className={ui.buttonCobalt} type="button" onClick={handleBuildGrowthPlan} disabled={!recommendedGaps.length}>
              <FiMap size={14} strokeWidth={1.5} />
              Build growth plan
            </button>
            {!hasJobs && (
              <button className={ui.buttonSecondary} type="button" onClick={() => setActivePage("jobs")}>
                <FiBriefcase size={14} strokeWidth={1.5} />
                Load jobs
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Metrics strip ─────────────────────────────────────────────── */}
      <div className={`${ui.metrics} col-span-full`}>
        {[
          { label: "Jobs analysed",   value: uniqueJobs.length },
          { label: "Skill gaps",      value: gaps.length },
          { label: "Top gap",         value: gaps[0]?.skill || "—" },
          { label: "Top category",    value: topCategory ? CAT_LABELS[topCategory[0]] : "—" },
        ].map(({ label, value }) => (
          <div key={label} className={ui.metric}>
            <span className={ui.metricLabel}>{label}</span>
            <strong
              className="truncate text-[18px] font-semibold leading-none tracking-[-0.01em] text-[#0E0E10]"
              title={String(value)}
            >
              {value}
            </strong>
          </div>
        ))}
      </div>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {gaps.length === 0 && (
        <section className={ui.panel}>
          {!hasCv && !hasJobs ? (
            <div className="py-6 text-center">
              <p className="text-[13px] text-[#6B6B72]">
                No data yet. Select a CV and import jobs to see your skill gaps.
              </p>
              <div className="mt-4 flex justify-center gap-2.5">
                <button className={ui.buttonCobalt} type="button" onClick={() => setActivePage("cv")}>
                  <FiFileText size={14} strokeWidth={1.5} />
                  Select CV
                </button>
                <button className={ui.buttonSecondary} type="button" onClick={() => setActivePage("jobs")}>
                  Load jobs
                </button>
              </div>
            </div>
          ) : !hasCv ? (
            <div className="py-6 text-center">
              <p className="text-[13px] text-[#6B6B72]">Select a CV to compare against your {uniqueJobs.length} loaded jobs.</p>
              <button className={`${ui.buttonCobalt} mt-4`} type="button" onClick={() => setActivePage("cv")}>
                Select CV
              </button>
            </div>
          ) : !hasJobs ? (
            <div className="py-6 text-center">
              <p className="text-[13px] text-[#6B6B72]">No jobs loaded. Import or filter jobs to analyse your gaps.</p>
              <button className={`${ui.buttonCobalt} mt-4`} type="button" onClick={() => setActivePage("jobs")}>
                Load jobs
              </button>
            </div>
          ) : (
            <Empty msg="No skill gaps found — your CV covers all job requirements." />
          )}
        </section>
      )}

      {/* ── Frequency bars ────────────────────────────────────────────── */}
      {gaps.length > 0 && (
        <>
          <section className={ui.panel}>
            <div className={ui.sectionHead}>
              <div>
                <p className={ui.eyebrow}>Recommended for Growth Plan</p>
                <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                  Start with your top market gaps
                </h2>
                <p className="mt-1 max-w-[680px] text-[13px] leading-relaxed text-[#6B6B72]">
                  These are your most frequent missing skills across the jobs analysed. You can adjust the final roadmap selection on the Growth Plan page.
                </p>
              </div>
              <button className={ui.buttonCobalt} type="button" onClick={handleBuildGrowthPlan}>
                <FiMap size={14} strokeWidth={1.5} />
                Use recommended skills
              </button>
            </div>
            <div className={ui.chips}>
              {recommendedGaps.map((gap) => (
                <span
                  key={gap.skill}
                  className={`inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${CAT_COLORS[gap.cat]?.chip || ui.chipMissing}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {gap.skill}
                  <span className="opacity-60">{gap.count}x</span>
                </span>
              ))}
            </div>
          </section>

          <section className={ui.panel}>
            <div className={ui.sectionHead}>
              <div>
                <p className={ui.eyebrow}>Your CV vs loaded jobs</p>
                <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                  CV skill gap frequency
                </h2>
                <p className="mt-0.5 text-[13px] text-[#6B6B72]">
                  Skills required by the {uniqueJobs.length} job{uniqueJobs.length === 1 ? "" : "s"} you have loaded, filtered to those missing from &ldquo;{selectedCv?.title || "your CV"}&rdquo;.
                </p>
              </div>
              <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
                {gaps.length} gaps
              </span>
            </div>

            <div
              className={`grid gap-2.5 ${gaps.length > 12 ? "overflow-y-auto pr-1" : ""}`}
              ref={gapListRef}
              style={gapListMaxHeight ? { maxHeight: gapListMaxHeight } : undefined}
            >
              {gaps.map((g, i) => (
                <div
                  key={g.skill}
                  className="grid items-center gap-2"
                  style={{ gridTemplateColumns: "24px minmax(120px,1.2fr) 1fr 44px" }}
                >
                  <span
                    className="text-right text-[10px] font-medium text-[#A4A4AC]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${CAT_COLORS[g.cat]?.chip || ui.chipMissing}`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {g.skill}
                  </span>
                  <div
                    className="h-[4px] overflow-hidden rounded-[2px] bg-[#E8E3D7]"
                    role="progressbar"
                    aria-label={`${g.skill}: missing from ${g.count} job${g.count === 1 ? "" : "s"}`}
                    aria-valuemin={0}
                    aria-valuemax={maxCount}
                    aria-valuenow={g.count}
                  >
                    <div
                      className="h-full rounded-[2px] transition-all"
                      style={{
                        width: `${Math.round((g.count / maxCount) * 100)}%`,
                        background: CAT_COLORS[g.cat]?.bar || "#5B2A86",
                      }}
                    />
                  </div>
                  <span
                    className="text-right text-[11px] font-medium text-[#6B6B72]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {g.count}×
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Category breakdown ────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-[18px] max-lg:grid-cols-1">
            {Object.entries(byCategory).map(([cat, items]) =>
              items.length === 0 ? null : (
                <section key={cat} className={ui.panel}>
                  <div className="mb-4">
                    <p className={ui.eyebrow}>{CAT_LABELS[cat]}</p>
                    <h3 className="mt-0.5 text-[17px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                      {items.length} skill{items.length !== 1 ? "s" : ""}
                    </h3>
                  </div>
                  <div className={ui.chips}>
                    {items.map((g) => (
                      <span
                        key={g.skill}
                        className={`inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${CAT_COLORS[cat]?.chip || ui.chipMissing}`}
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {g.skill}
                        <span className="opacity-60">{g.count}×</span>
                      </span>
                    ))}
                  </div>
                </section>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
