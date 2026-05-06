import { useState } from "react";
import { FiAward, FiMap, FiSearch, FiTrendingUp } from "react-icons/fi";
import { Empty, ScoreBadge } from "../components/common/DataViews";
import {
  AnalyticsBar,
  BestCvResult,
  MatchExplanation,
  SkillBlock,
  TrendSummary,
} from "../components/insights/InsightPanels";
import { ui } from "../styles/ui";

/* ── Suggested next steps from missing skills ──────────────────────────── */
const STEP_TEMPLATES = {
  docker:      "Dockerize a project and push to Docker Hub",
  kubernetes:  "Deploy an app to a local Kubernetes cluster",
  aws:         "Deploy a project on the AWS free tier",
  react:       "Build a small CRUD app with React",
  typescript:  "Migrate a module to TypeScript with strict mode",
  python:      "Build a CLI tool and write pytest tests",
  node:        "Build a REST API with Express and JWT auth",
  postgresql:  "Study query plans and run a migration",
  graphql:     "Build a resolver and add auth to a schema",
  redis:       "Integrate Redis caching into an existing project",
  java:        "Build a Spring Boot service with JPA persistence",
  kafka:       "Implement a producer/consumer app with Docker",
  terraform:   "Provision cloud resources with a Terraform plan",
  linux:       "Write shell scripts and configure a systemd service",
  git:         "Master branching strategies and rebase workflow",
};

function getSuggestedStep(skill) {
  const lower = skill.toLowerCase();
  const key = Object.keys(STEP_TEMPLATES).find((k) => lower.includes(k));
  return key ? STEP_TEMPLATES[key] : `Learn ${skill} core concepts · build a practice project · add to CV`;
}

function interviewPotentialStyle(level) {
  if (level === "High")   return { background: "var(--c-citron)",    color: "var(--c-ink)" };
  if (level === "Medium") return { background: "var(--c-warning-50)", color: "var(--c-warning)" };
  return { background: "var(--c-danger-50)", color: "var(--c-danger)" };
}

export default function InsightsPage({
  analysisResult,
  analyzeGaps,
  applications,
  bestCvResult,
  calculateSuccessScore,
  cvs,
  findBestCv,
  isBusy,
  jobs,
  matchResult,
  recommendations,
  runInsightMatch,
  skillAnalytics,
  successScore,
  trendAnalytics,
  loadAnalytics,
}) {
  const [insightCvId,  setInsightCvId]  = useState("");
  const [insightJobId, setInsightJobId] = useState("");

  /* Jobs available for matching: tracked applications first, then loaded jobs */
  const appJobs = applications
    .filter((a) => a.job?._id)
    .map((a) => a.job)
    .filter((j, i, arr) => arr.findIndex((x) => x._id === j._id) === i);

  const jobOptions = appJobs.length > 0 ? appJobs : jobs;
  const topJob     = recommendations[0] || jobs[0];
  const hasJobsForScore = Boolean(topJob);

  function handleRunMatch(e) {
    e.preventDefault();
    runInsightMatch(insightCvId, insightJobId);
  }

  const missingSteps = (matchResult?.missingSkills || []).slice(0, 4);

  return (
    <div className={ui.pageGrid}>

      {/* ── Explainability lab ───────────────────────────────────────── */}
      <section className={`${ui.panel} ${ui.full}`}>
        <div className="mb-4 min-w-0 max-w-2xl">
          <p className={ui.eyebrow}>Explainability lab</p>
          <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
            Match a CV against a job
          </h2>
          <p className="mt-1 text-[13px] text-[#6B6B72]">
            Select a CV and a saved or loaded job to calculate a detailed match score.
          </p>
        </div>

        <form
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3 max-lg:grid-cols-[repeat(2,minmax(0,1fr))] max-sm:grid-cols-1"
          onSubmit={handleRunMatch}
        >
          <label className={ui.label}>
            CV
            <select
              className={ui.input}
              value={insightCvId}
              onChange={(e) => setInsightCvId(e.target.value)}
            >
              <option value="">Select a CV…</option>
              {cvs.map((cv) => (
                <option key={cv._id} value={cv._id}>
                  {cv.title} {cv.version ? `· ${cv.version}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className={ui.label}>
            Job
            <select
              className={ui.input}
              value={insightJobId}
              onChange={(e) => setInsightJobId(e.target.value)}
            >
              <option value="">Select a job…</option>
              {jobOptions.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title}{job.company ? ` · ${job.company}` : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            className={`${ui.button} min-w-[140px] justify-center max-lg:col-span-full max-lg:w-full`}
            disabled={isBusy || !insightCvId || !insightJobId}
            type="submit"
          >
            <FiSearch size={14} strokeWidth={1.5} />
            {isBusy ? "Running…" : "Run match"}
          </button>
        </form>

        {jobOptions.length === 0 && (
          <p className="mt-3 text-[12px] text-[#A4A4AC]">
            No jobs available. Save a job from the Jobs page or load jobs first.
          </p>
        )}

        <div className="mt-3 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 border-t border-[#E8E3D7] pt-3 max-md:grid-cols-1">
          <button type="button" className={`${ui.buttonSecondary} w-full justify-center`} disabled={isBusy} onClick={findBestCv}>
            <FiAward size={14} strokeWidth={1.5} />
            Best CV for top job
          </button>
          <button type="button" className={`${ui.buttonSecondary} w-full justify-center`} disabled={isBusy} onClick={analyzeGaps}>
            <FiMap size={14} strokeWidth={1.5} />
            Build roadmap
          </button>
        </div>
      </section>

      {/* ── Match explanation ─────────────────────────────────────────── */}
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Match result</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Match explanation
            </h2>
          </div>
          <ScoreBadge value={matchResult?.matchScore} />
        </div>
        {matchResult ? <MatchExplanation result={matchResult} /> : <Empty msg="Select a CV and a job, then run match." />}
      </section>

      {/* ── Suggested next steps ──────────────────────────────────────── */}
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Growth · Next steps</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Suggested next steps
            </h2>
          </div>
          {missingSteps.length > 0 && (
            <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
              {missingSteps.length} gaps
            </span>
          )}
        </div>
        {missingSteps.length > 0 ? (
          <div className="grid gap-2">
            {missingSteps.map((skill) => (
              <div
                key={skill}
                className="flex items-start gap-3 rounded-[8px] border-l-2 border-[#5B2A86] bg-[#FBFAF6] px-4 py-3"
              >
                <span
                  className={ui.chipMissing}
                  style={{ flexShrink: 0, marginTop: 1 }}
                >
                  {skill}
                </span>
                <p className="text-[13px] leading-relaxed text-[#3A3A40]">
                  {getSuggestedStep(skill)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <Empty msg={matchResult ? "No skill gaps — your CV covers all job requirements." : "Run a match to see suggested learning steps."} />
        )}

        {/* Roadmap section */}
        {analysisResult?.roadmap?.length > 0 && (
          <div className="mt-4 border-t border-[#E8E3D7] pt-4">
            <p className={ui.miniLabel}>Roadmap steps</p>
            <div className={`${ui.roadmap} mt-2`}>
              {(analysisResult.roadmap || []).slice(0, 5).map((item, index) => (
                <p key={item}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--c-mist)", marginRight: 8 }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.replace(/ -> /g, " · ")}
                </p>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Best CV result ────────────────────────────────────────────── */}
      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>CV ranking · {topJob ? `"${topJob.title}"` : "top ranked job"}</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Best CV for top job
            </h2>
            <p className="mt-1 text-[13px] text-[#6B6B72]">
              Ranked by weighted score: 60% skill overlap, 25% experience alignment, 15% role fit.
            </p>
          </div>
          <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
            {recommendations.length} ranked jobs
          </span>
        </div>

        {topJob?.skills?.length > 0 && (
          <div className="mb-4">
            <SkillBlock label="Job requires" skills={topJob.skills.slice(0, 10)} tone="neutral" />
          </div>
        )}

        {bestCvResult ? (
          <BestCvResult result={bestCvResult} />
        ) : (
          <Empty msg={hasJobsForScore ? "Click 'Best CV for top job' to see which CV matches best." : "Load jobs or get recommendations first."} />
        )}
      </section>

      {/* ── Application success score ─────────────────────────────────── */}
      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Interview predictor</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Application success score
            </h2>
            <p className="mt-1 text-[13px] text-[#6B6B72]">
              Combines match score, skill gap count, experience depth and CV completeness
              against your top ranked job.
              {!hasJobsForScore && (
                <span className="ml-1 font-medium text-[#A4A4AC]">
                  Load jobs or get recommendations first.
                </span>
              )}
            </p>
          </div>
          <button
            className={`${ui.buttonCobalt} h-auto min-h-9 w-auto shrink-0 whitespace-normal px-3 py-2 leading-tight max-sm:w-full`}
            disabled={isBusy || !hasJobsForScore}
            type="button"
            onClick={calculateSuccessScore}
            title={hasJobsForScore ? "" : "Load jobs or get recommendations first"}
          >
            <FiTrendingUp size={14} strokeWidth={1.5} />
            {isBusy ? "Calculating…" : "Calculate score"}
          </button>
        </div>

        {successScore ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center rounded-[4px] px-3 py-1 text-[12px] font-semibold"
                style={interviewPotentialStyle(successScore.interviewPotential)}
              >
                {successScore.interviewPotential} interview potential
              </span>
              <span className="text-[13px] text-[#3A3A40]">{successScore.summary}</span>
            </div>

            <div className="grid grid-cols-4 gap-0 overflow-hidden rounded-[12px] border border-[#E8E3D7] max-lg:grid-cols-2">
              {[
                { label: "Success score",        value: `${successScore.successScore}%` },
                { label: "Match score",           value: `${successScore.matchScore}%` },
                { label: "Skill gaps",            value: successScore.skillGapCount },
                { label: "Experience alignment",  value: `${successScore.experienceAlignment}%` },
              ].map(({ label, value }) => (
                <div key={label} className={ui.metric}>
                  <span className={ui.metricLabel}>{label}</span>
                  <strong className={ui.metricValue}>{value}</strong>
                </div>
              ))}
            </div>

            {successScore.breakdown && (
              <div className="rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] p-3">
                <p className={ui.miniLabel}>Score calculation</p>
                <div className="grid gap-1 text-[12px] text-[#3A3A40]" style={{ fontFamily: "var(--font-mono)" }}>
                  <span>Base (match score):       +{successScore.breakdown.base}</span>
                  <span>Skill gap penalty:          {successScore.breakdown.skillGapPenalty}</span>
                  <span>CV completeness bonus:     +{successScore.breakdown.completenessBonus}</span>
                  <span>Experience depth bonus:    +{successScore.breakdown.experienceBonus}</span>
                  <span className="mt-1 border-t border-[#E8E3D7] pt-1 font-medium text-[#0E0E10]">
                    = {successScore.successScore}% success score
                  </span>
                </div>
              </div>
            )}

            {successScore.suggestions?.length > 0 && (
              <div>
                <p className={ui.miniLabel}>How to improve</p>
                <ul className="grid gap-2">
                  {successScore.suggestions.map((s) => (
                    <li
                      key={s}
                      className="flex items-start gap-2 rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] px-3 py-2 text-[13px] text-[#3A3A40]"
                    >
                      <span className="mt-0.5 shrink-0 text-[#1E3FFF]">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <Empty msg={hasJobsForScore ? "No success score yet. Calculate one using your selected CV and top job." : "Load jobs or get recommendations to enable this feature."} />
        )}
      </section>

      {/* ── Missing skill analytics ───────────────────────────────────── */}
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Skill analytics</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Missing skill frequency
            </h2>
          </div>
          <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
            {skillAnalytics?.data?.length || 0} skills
          </span>
        </div>
        {skillAnalytics?.data?.length ? (
          <AnalyticsBar data={skillAnalytics.data} />
        ) : (
          <Empty msg="Load analytics to see missing skill frequency." />
        )}
      </section>

      {/* ── Market trends ─────────────────────────────────────────────── */}
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Market trends</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Market trends
            </h2>
          </div>
          <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
            {trendAnalytics?.data?.source || "—"}
          </span>
        </div>
        {trendAnalytics?.data ? (
          <TrendSummary data={trendAnalytics.data} />
        ) : (
          <Empty msg="Load analytics to see market trends." />
        )}
      </section>
    </div>
  );
}
