import { Empty, ScoreBadge } from "../components/common/DataViews";
import {
  AnalyticsBar,
  BestCvResult,
  MatchExplanation,
  TrendSummary,
} from "../components/insights/InsightPanels";
import { ui } from "../styles/ui";

export default function InsightsPage({
  analysisResult,
  analyzeGaps,
  bestCvResult,
  calculateSuccessScore,
  findBestCv,
  isBusy,
  loadAnalytics,
  matchForm,
  matchResult,
  recommendations,
  runMatch,
  setMatchForm,
  skillAnalytics,
  successScore,
  trendAnalytics,
}) {
  return (
    <div className={ui.pageGrid}>
      <section className={`${ui.panel} ${ui.full}`}>
        <div className="mb-4 max-w-2xl min-w-0">
          <p className={ui.eyebrow}>Explainability lab</p>
          <h2 className="text-2xl font-black">Compare skills and generate next steps</h2>
        </div>

        <form className="grid grid-cols-[repeat(4,minmax(0,1fr))] items-end gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1" onSubmit={runMatch}>
          <label className={ui.label}>
            CV skills
            <input
              className={ui.input}
              value={matchForm.cvSkills}
              onChange={(event) =>
                setMatchForm({ ...matchForm, cvSkills: event.target.value })
              }
            />
          </label>
          <label className={ui.label}>
            Job skills
            <input
              className={ui.input}
              value={matchForm.jobSkills}
              onChange={(event) =>
                setMatchForm({ ...matchForm, jobSkills: event.target.value })
              }
            />
          </label>
          <button className={ui.button} disabled={isBusy} type="submit">
            {isBusy ? "Running..." : "Run Match"}
          </button>
          <button className={ui.button} disabled={isBusy} type="button" onClick={analyzeGaps}>
            Build Roadmap
          </button>
        </form>

        <div className="mt-3 grid grid-cols-[repeat(2,minmax(0,220px))] gap-3 max-sm:grid-cols-1">
          <button type="button" className={ui.buttonSecondary} disabled={isBusy} onClick={loadAnalytics}>
            Load Analytics
          </button>
          <button type="button" className={ui.buttonSecondary} disabled={isBusy} onClick={findBestCv}>
            Best CV for Top Job
          </button>
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <h2 className="text-2xl font-black">Match Explanation</h2>
          <ScoreBadge value={matchResult?.matchScore} />
        </div>
        {matchResult ? <MatchExplanation result={matchResult} /> : <Empty />}
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <h2 className="text-2xl font-black">Roadmap</h2>
          <span className={ui.count}>{analysisResult?.roadmap?.length || 0}</span>
        </div>
        {analysisResult ? (
          <div className={ui.roadmap}>
            {analysisResult.roadmap.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </section>

      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <h2 className="text-2xl font-black">Best CV Result</h2>
          <span className={ui.count}>{recommendations.length} ranked jobs</span>
        </div>
        {bestCvResult ? <BestCvResult result={bestCvResult} /> : <Empty />}
      </section>

      {/* ── Application Success Score ─────────────────────────────── */}
      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Interview predictor</p>
            <h2 className="text-2xl font-black">Application success score</h2>
            <p className="mt-1 text-sm text-slate-500">
              Combines match score, skill gap count, experience depth and CV completeness.
              Uses your selected CV against the top ranked job.
            </p>
          </div>
          <button
            className={ui.button}
            disabled={isBusy}
            type="button"
            onClick={calculateSuccessScore}
          >
            {isBusy ? "Calculating…" : "Calculate score"}
          </button>
        </div>

        {successScore ? (
          <div className="grid gap-4">
            {/* Headline badge */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-1.5 text-sm font-black ${
                successScore.interviewPotential === "High"   ? "bg-teal-100 text-teal-800"  :
                successScore.interviewPotential === "Medium" ? "bg-amber-100 text-amber-800" :
                                                               "bg-red-100 text-red-700"
              }`}>
                {successScore.interviewPotential} interview potential
              </span>
              <span className="text-sm font-semibold text-slate-600">{successScore.summary}</span>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
              {[
                { label: "Success score",        value: `${successScore.successScore}%` },
                { label: "Match score",           value: `${successScore.matchScore}%` },
                { label: "Skill gaps",            value: successScore.skillGapCount },
                { label: "Experience alignment",  value: `${successScore.experienceAlignment}%` },
              ].map(({ label, value }) => (
                <div key={label} className={ui.metric}>
                  <span className={ui.metricLabel}>{label}</span>
                  <strong className="text-2xl font-black leading-none">{value}</strong>
                </div>
              ))}
            </div>

            {/* Score breakdown */}
            {successScore.breakdown && (
              <div className="rounded-xl border border-[#d6dee2] bg-[#f8fafc] p-3">
                <p className={ui.miniLabel}>Score calculation</p>
                <div className="grid gap-1 font-mono text-xs text-slate-600">
                  <span>Base (match score):        +{successScore.breakdown.base}</span>
                  <span>Skill gap penalty:          {successScore.breakdown.skillGapPenalty}</span>
                  <span>CV completeness bonus:      +{successScore.breakdown.completenessBonus}</span>
                  <span>Experience depth bonus:     +{successScore.breakdown.experienceBonus}</span>
                  <span className="mt-1 border-t border-[#d6dee2] pt-1 font-black text-slate-800">
                    = {successScore.successScore}% success score
                  </span>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {successScore.suggestions?.length > 0 && (
              <div>
                <p className={ui.miniLabel}>How to improve</p>
                <ul className="grid gap-2">
                  {successScore.suggestions.map((s) => (
                    <li
                      key={s}
                      className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900"
                    >
                      <span className="mt-0.5 shrink-0">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <Empty />
        )}
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <h2 className="text-2xl font-black">Missing Skill Analytics</h2>
          <span className={ui.count}>{skillAnalytics?.data?.length || 0} skills</span>
        </div>
        {skillAnalytics?.data?.length ? <AnalyticsBar data={skillAnalytics.data} /> : <Empty />}
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <h2 className="text-2xl font-black">Market Trends</h2>
          <span className={ui.count}>{trendAnalytics?.data?.source || "none"}</span>
        </div>
        {trendAnalytics?.data ? <TrendSummary data={trendAnalytics.data} /> : <Empty />}
      </section>
    </div>
  );
}
