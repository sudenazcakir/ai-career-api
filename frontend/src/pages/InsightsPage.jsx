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
  findBestCv,
  isBusy,
  loadAnalytics,
  matchForm,
  matchResult,
  recommendations,
  runMatch,
  setMatchForm,
  skillAnalytics,
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
