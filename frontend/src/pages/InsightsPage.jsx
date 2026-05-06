import { FiAward, FiMap, FiSearch, FiTrendingUp } from "react-icons/fi";
import { Empty, ScoreBadge } from "../components/common/DataViews";
import {
  AnalyticsBar,
  BestCvResult,
  MatchExplanation,
  TrendSummary,
} from "../components/insights/InsightPanels";
import { ui } from "../styles/ui";

function interviewPotentialStyle(level) {
  if (level === "High")   return { background: "var(--c-citron)",    color: "var(--c-ink)" };
  if (level === "Medium") return { background: "var(--c-warning-50)", color: "var(--c-warning)" };
  return { background: "var(--c-danger-50)", color: "var(--c-danger)" };
}

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

      {/* ── Explainability lab ───────────────────────────────────────── */}
      <section className={`${ui.panel} ${ui.full}`}>
        <div className="mb-4 min-w-0 max-w-2xl">
          <p className={ui.eyebrow}>Explainability lab</p>
          <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
            Compare skills and generate next steps
          </h2>
        </div>

        <form
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3 max-lg:grid-cols-[repeat(2,minmax(0,1fr))] max-sm:grid-cols-1"
          onSubmit={runMatch}
        >
          <label className={ui.label}>
            CV skills
            <input
              className={ui.input}
              value={matchForm.cvSkills}
              onChange={(e) => setMatchForm({ ...matchForm, cvSkills: e.target.value })}
            />
          </label>
          <label className={ui.label}>
            Job skills
            <input
              className={ui.input}
              value={matchForm.jobSkills}
              onChange={(e) => setMatchForm({ ...matchForm, jobSkills: e.target.value })}
            />
          </label>
          <button className={`${ui.button} min-w-[160px] justify-center max-lg:col-span-full max-lg:w-full`} disabled={isBusy} type="submit">
            <FiSearch size={14} strokeWidth={1.5} />
            {isBusy ? "Running…" : "Run match"}
          </button>
        </form>

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
        {matchResult ? <MatchExplanation result={matchResult} /> : <Empty msg="Run a match to see the explanation." />}
      </section>

      {/* ── Roadmap ───────────────────────────────────────────────────── */}
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Skill roadmap</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Roadmap
            </h2>
          </div>
          <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
            {analysisResult?.roadmap?.length || 0} steps
          </span>
        </div>
        {analysisResult ? (
          <div className={ui.roadmap}>
            {analysisResult.roadmap.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        ) : (
          <Empty msg="Build a roadmap to see steps." />
        )}
      </section>

      {/* ── Best CV result ────────────────────────────────────────────── */}
      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>CV ranking</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Best CV result
            </h2>
          </div>
          <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
            {recommendations.length} ranked jobs
          </span>
        </div>
        {bestCvResult ? <BestCvResult result={bestCvResult} /> : <Empty msg="Find the best CV for the top job." />}
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
            </p>
          </div>
          <button
            className={`${ui.buttonCobalt} h-auto min-h-9 w-auto shrink-0 whitespace-normal px-3 py-2 leading-tight max-sm:w-full`}
            disabled={isBusy}
            type="button"
            onClick={calculateSuccessScore}
          >
            <FiTrendingUp size={14} strokeWidth={1.5} />
            {isBusy ? "Calculating…" : "Calculate score"}
          </button>
        </div>

        {successScore ? (
          <div className="grid gap-4">
            {/* Headline badge + summary */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center rounded-[4px] px-3 py-1 text-[12px] font-semibold"
                style={interviewPotentialStyle(successScore.interviewPotential)}
              >
                {successScore.interviewPotential} interview potential
              </span>
              <span className="text-[13px] text-[#3A3A40]">{successScore.summary}</span>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-4 gap-0 overflow-hidden rounded-[12px] border border-[#E8E3D7] max-lg:grid-cols-2">
              {[
                { label: "Success score",       value: `${successScore.successScore}%` },
                { label: "Match score",          value: `${successScore.matchScore}%` },
                { label: "Skill gaps",           value: successScore.skillGapCount },
                { label: "Experience alignment", value: `${successScore.experienceAlignment}%` },
              ].map(({ label, value }) => (
                <div key={label} className={ui.metric}>
                  <span className={ui.metricLabel}>{label}</span>
                  <strong className={ui.metricValue}>{value}</strong>
                </div>
              ))}
            </div>

            {/* Score breakdown */}
            {successScore.breakdown && (
              <div className="rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] p-3">
                <p className={ui.miniLabel}>Score calculation</p>
                <div className="grid gap-1 text-[12px] text-[#3A3A40]"
                     style={{ fontFamily: "var(--font-mono)" }}>
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

            {/* Suggestions */}
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
          <Empty msg="No success score yet. Calculate one using your selected CV and top job." />
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
