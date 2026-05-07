import { useEffect, useState } from "react";
import { FiAward, FiMap, FiSearch } from "react-icons/fi";
import { Empty, ScoreBadge } from "../components/common/DataViews";
import {
  AnalyticsBar,
  BestCvResult,
  MatchExplanation,
  SkillBlock,
  TrendSummary,
} from "../components/insights/InsightPanels";
import { ui } from "../styles/ui";

function interviewPotentialStyle(level) {
  if (level === "High")   return { background: "var(--c-citron)",    color: "var(--c-ink)" };
  if (level === "Medium") return { background: "var(--c-warning-50)", color: "var(--c-warning)" };
  return { background: "var(--c-danger-50)", color: "var(--c-danger)" };
}

export default function InsightsPage({
  applications,
  bestCvResult,
  cvs,
  findBestCv,
  isBusy,
  jobs,
  matchResult,
  openRoadmap,
  recommendations,
  runInsightMatch,
  skillAnalytics,
  successScore,
  trendAnalytics,
  loadAnalytics,
}) {
  const [insightCvId,  setInsightCvId]  = useState("");
  const [insightJobId, setInsightJobId] = useState("");

  /* Auto-run match + success score whenever CV or job selection changes */
  useEffect(() => {
    if (!insightCvId || !insightJobId) return;
    runInsightMatch(insightCvId, insightJobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insightCvId, insightJobId]);

  /* Jobs available for matching: tracked applications first, then loaded jobs */
  const appJobs = applications
    .filter((a) => a.job?._id)
    .map((a) => a.job)
    .filter((j, i, arr) => arr.findIndex((x) => x._id === j._id) === i);

  const jobOptions = appJobs.length > 0 ? appJobs : jobs;
  const selectedInsightJob = jobOptions.find((job) => job._id === insightJobId) || null;
  const hasSelection = Boolean(insightCvId && insightJobId);

  function handleRunMatch(e) {
    e.preventDefault();
    runInsightMatch(insightCvId, insightJobId);
  }

  function handleJobChange(event) {
    const nextJobId = event.target.value;
    setInsightJobId(nextJobId);
    if (nextJobId) findBestCv(nextJobId);
  }

  function handleFindBestCv() {
    findBestCv(insightJobId);
  }

  function handleBuildRoadmap() {
    const missingSkills = (matchResult?.missingSkills || []).slice(0, 4);
    openRoadmap({
      cvId: insightCvId || undefined,
      source: "insights",
      selectedSkills: missingSkills,
      recommendedSkills: missingSkills.map((skill) => ({ skill, count: 1, cat: "technical" })),
      autoGenerate: false,
      label: matchResult
        ? "Based on selected CV vs selected job from AI Insights."
        : "Choose from Skill Map recommendations to build a Growth Plan.",
    });
  }

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
            Select a CV and a saved or loaded job — match score and success score update automatically.
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
              onChange={handleJobChange}
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
          <button
            type="button"
            className={`${ui.buttonSecondary} w-full justify-center`}
            disabled={isBusy || !insightJobId}
            onClick={handleFindBestCv}
            title={insightJobId ? "" : "Select a job first"}
          >
            <FiAward size={14} strokeWidth={1.5} />
            Best CV for selected job
          </button>
          <button type="button" className={`${ui.buttonSecondary} w-full justify-center`} disabled={isBusy} onClick={handleBuildRoadmap}>
            <FiMap size={14} strokeWidth={1.5} />
            Build roadmap
          </button>
        </div>
      </section>

      {/* ── Match explanation ─────────────────────────────────────────── */}
      <section className={ui.panel} data-testid="match-result">
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Match result</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Match explanation
            </h2>
          </div>
          <ScoreBadge value={matchResult?.matchScore} />
        </div>
        {matchResult ? <MatchExplanation result={matchResult} /> : <Empty msg="Select a CV and a job above to see the match breakdown." />}
      </section>

      {/* ── Application success score ─────────────────────────────────── */}
      <section className={`${ui.panel}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Interview predictor</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Application success score
            </h2>
            <p className="mt-1 text-[13px] text-[#6B6B72]">
              Combines match score, skill gap count, experience depth and CV completeness
              for your selected CV and job. Updates automatically on selection change.
            </p>
          </div>
        </div>

        {successScore && hasSelection ? (
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

            <div className={ui.metrics}>
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
          <Empty msg={hasSelection ? "Running…" : "Select a CV and a job above — the score will appear automatically."} />
        )}
      </section>

      {/* ── Best CV result ────────────────────────────────────────────── */}
      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>CV ranking · {selectedInsightJob ? `"${selectedInsightJob.title}"` : "selected job"}</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Best CV for selected job
            </h2>
            <p className="mt-1 text-[13px] text-[#6B6B72]">
              Select a job above, then rank your CVs for that specific role.
            </p>
          </div>
          <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
            {recommendations.length} ranked jobs
          </span>
        </div>

        {selectedInsightJob?.skills?.length > 0 && (
          <div className="mb-4">
            <SkillBlock label="Job requires" skills={selectedInsightJob.skills.slice(0, 10)} tone="neutral" />
          </div>
        )}

        {bestCvResult ? (
          <BestCvResult result={bestCvResult} />
        ) : (
          <Empty msg={jobOptions.length ? "Select a job above, then click 'Best CV for selected job'." : "Load jobs or save a job first."} />
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
