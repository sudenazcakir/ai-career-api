import { FiRefreshCw, FiTarget, FiZap } from "react-icons/fi";
import { ui } from "../styles/ui";
import { buildSkillGaps } from "./SkillGapPage";

const STAGE_STEPS = {
  Docker:     ["Docker basics tutorial", "Dockerize an existing project", "Push image to Docker Hub", "Multi-stage builds"],
  PostgreSQL: ["Indexes & query plans", "Migrations with Prisma/Knex", "Backups and restore", "Performance tuning"],
  AWS:        ["EC2, S3, IAM basics", "Free Tier project deploy", "AWS Cloud Practitioner cert"],
  Kubernetes: ["Kubernetes fundamentals", "Deploy an app to a cluster", "Configure ingress & services"],
  default:    ["Learn core concepts", "Build a small project using it", "Integrate into an existing codebase"],
};

const STAGE_TIMELINE = ["Week 1–2", "Week 3–5", "Week 6–8", "Week 9–10"];

export default function RoadmapPage({
  jobs,
  recommendations,
  selectedCv,
  analyzeGaps,
  analysisResult,
  matchResult,
}) {
  const allJobs    = [...jobs, ...recommendations].filter((j) => j?._id);
  const uniqueJobs = [...new Map(allJobs.map((j) => [j._id, j])).values()];
  const gaps       = buildSkillGaps(uniqueJobs, selectedCv?.skills);
  const topGaps    = gaps.slice(0, 3);

  const stages = topGaps.map((g, i) => ({
    id:    `s${i}`,
    label: STAGE_TIMELINE[i] || `Phase ${i + 1}`,
    skill: g.skill,
    steps: STAGE_STEPS[g.skill] || STAGE_STEPS.default,
    freq:  g.count,
  }));

  const apiRoadmap = analysisResult?.roadmap || [];
  const hasStages  = stages.length > 0;
  const hasApi     = apiRoadmap.length > 0;

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
          {stages.length || "—"}
        </span>
        <div className="relative min-w-0">
          <p className={ui.eyebrow}>Growth · Growth Plan</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px,3.5vw,46px)",
            fontWeight: 400, lineHeight: 1.02,
            letterSpacing: "-0.02em", color: "var(--c-ink)",
            maxWidth: 560, marginTop: 8,
          }}>
            Your learning <em style={{ fontStyle: "italic" }}>roadmap.</em>
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#3A3A40]">
            Generated from your top skill gaps. Each milestone unlocks more jobs.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {matchResult?.missingSkills?.length > 0 && (
              <button className={ui.buttonCobalt} type="button" onClick={analyzeGaps}>
                <FiRefreshCw size={14} strokeWidth={1.5} />
                Refresh from AI
              </button>
            )}
            <button className={ui.buttonSecondary} type="button" onClick={analyzeGaps}>
              <FiZap size={14} strokeWidth={1.5} />
              Analyse gaps
            </button>
          </div>
        </div>
      </section>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {!hasStages && !hasApi && (
        <section className={ui.panel}>
          <div className="py-4 text-center">
            <p className="text-[13px] text-[#6B6B72]">
              {uniqueJobs.length === 0
                ? "No jobs loaded yet. Import jobs then select a CV to generate your personalised roadmap."
                : "Select a CV to compare against your loaded jobs and generate a growth plan."}
            </p>
            <div className="mt-4 flex justify-center gap-2.5">
              <button className={ui.buttonCobalt} type="button" onClick={() => window.history.back()}>
                <FiTarget size={14} strokeWidth={1.5} />
                Back to Skill Map
              </button>
              <button className={ui.buttonSecondary} type="button" onClick={analyzeGaps}>
                <FiZap size={14} strokeWidth={1.5} />
                Analyse gaps
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Milestone cards ───────────────────────────────────────────── */}
      {hasStages && (
        <div className="grid gap-[18px]">
          {stages.map((stage, idx) => (
            <section key={stage.id} className={ui.panel}>
              {/* Milestone header */}
              <div className="mb-5 flex items-start gap-4">
                {/* Step circle */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-[#F6F3EC]"
                  style={{
                    background: "var(--c-cobalt)",
                    fontFamily: "var(--font-mono)",
                    minWidth: 36,
                  }}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Timeline badge */}
                    <span
                      className="inline-flex items-center rounded-[4px] bg-[#E6EBFF] px-2 py-0.5 text-[10px] font-medium text-[#1E3FFF]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {stage.label}
                    </span>
                    {/* Frequency badge */}
                    <span
                      className="inline-flex items-center rounded-[4px] bg-[#EFE5F8] px-2 py-0.5 text-[10px] font-medium text-[#5B2A86]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {stage.freq} job{stage.freq !== 1 ? "s" : ""} require this
                    </span>
                  </div>
                  <h3
                    className="mt-1 text-[20px] font-semibold tracking-[-0.01em] text-[#0E0E10]"
                  >
                    {stage.skill}
                  </h3>
                </div>
              </div>

              {/* Learning steps */}
              <div className="grid gap-2">
                {stage.steps.map((step, stepIdx) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 rounded-[8px] border border-[#E8E3D7] bg-[#F6F3EC] px-4 py-3"
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#E8E3D7] text-[10px] font-medium text-[#6B6B72]"
                      style={{ fontFamily: "var(--font-mono)", minWidth: 20 }}
                    >
                      {stepIdx + 1}
                    </span>
                    <span className="text-[13px] text-[#3A3A40]">{step}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── AI-generated roadmap ──────────────────────────────────────── */}
      {hasApi && (
        <section className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <p className={ui.eyebrow}>AI-generated roadmap</p>
              <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                Personalised steps
              </h2>
            </div>
            <span
              className={ui.count}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {apiRoadmap.length} steps
            </span>
          </div>

          <div className="grid gap-2">
            {apiRoadmap.map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[8px] border-l-2 border-[#1E3FFF] bg-[#FBFAF6] px-4 py-3"
              >
                <span
                  className="mt-0.5 shrink-0 text-[10px] font-medium text-[#1E3FFF]"
                  style={{ fontFamily: "var(--font-mono)", minWidth: 20 }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-[13px] leading-relaxed text-[#3A3A40]">{item}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
