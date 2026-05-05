import { FiZap } from "react-icons/fi";
import { Empty } from "../components/shared";
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

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-2xl border border-teal-200/25 bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.18),transparent_30%),linear-gradient(135deg,#0f172a,#12343b_52%,#111827)] p-6 text-white shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-300">
              Growth
            </p>
            <h2 className="text-[clamp(32px,5vw,54px)] font-black leading-none">
              Your learning roadmap
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Generated from your top skill gaps. Each milestone unlocks more jobs.
            </p>
          </div>
          {matchResult?.missingSkills?.length > 0 && (
            <button
              type="button"
              className="!bg-white !text-slate-950 hover:!bg-teal-100 shrink-0"
              onClick={analyzeGaps}
            >
              <FiZap style={{ display: "inline", marginRight: 6 }} />
              Refresh from AI
            </button>
          )}
        </div>
      </section>

      {stages.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-500">
            Load jobs and select a CV to generate your personalised roadmap.
          </p>
        </div>
      )}

      {stages.length > 0 && (
        <div className="grid gap-5">
          {stages.map((stage, idx) => (
            <section
              key={stage.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-black text-teal-800">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-normal text-teal-700">
                    {stage.label} · {stage.freq} job{stage.freq !== 1 ? "s" : ""} require this
                  </p>
                  <h3 className="text-2xl font-black text-slate-950">{stage.skill}</h3>
                </div>
              </div>

              <div className="grid gap-3">
                {stage.steps.map((step, stepIdx) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-xs font-black text-slate-400">
                      {stepIdx + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{step}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {apiRoadmap.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-black uppercase tracking-normal text-teal-700">
            AI-generated roadmap
          </p>
          <h3 className="mb-4 text-xl font-black text-slate-950">Personalised steps</h3>
          <div className="grid gap-3">
            {apiRoadmap.map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-black text-teal-800">
                  {index + 1}
                </span>
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
