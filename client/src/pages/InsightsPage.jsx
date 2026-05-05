import { FiZap, FiCheck, FiX, FiBook, FiAward, FiThumbsUp } from "react-icons/fi";
import { ScoreBadge, Empty } from "../components/shared";

export default function InsightsPage({
  matchForm,
  setMatchForm,
  runMatch,
  analyzeGaps,
  findBestCv,
  matchResult,
  analysisResult,
  bestCvResult,
  recommendations,
  successScore,
  getSuccessScore,
}) {
  return (
    <div className="page-grid">
      <section className="overflow-hidden rounded-2xl border border-teal-200/25 bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.18),transparent_30%),linear-gradient(135deg,#0f172a,#12343b_52%,#111827)] p-6 text-white shadow-2xl full">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-300">
              Explainability Lab
            </p>
            <h2 className="text-[clamp(28px,4vw,48px)] font-black leading-none">
              Compare skills and generate next steps.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Enter CV and job skills to calculate match score, then build a personalized learning roadmap.
            </p>
          </div>
          <button
            type="button"
            className="!bg-white !text-slate-950 hover:!bg-teal-100 shrink-0"
            onClick={findBestCv}
          >
            <FiZap style={{ display: "inline", marginRight: 6 }} />
            Best CV for Top Job
          </button>
        </div>

        <form
          className="grid gap-3 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur md:grid-cols-[repeat(2,minmax(0,1fr))_max-content_max-content]"
          onSubmit={runMatch}
        >
          <label>
            CV skills
            <input
              className="!border-white/20 !bg-white/95 !text-slate-950"
              value={matchForm.cvSkills}
              onChange={(e) => setMatchForm({ ...matchForm, cvSkills: e.target.value })}
            />
          </label>
          <label>
            Job skills
            <input
              className="!border-white/20 !bg-white/95 !text-slate-950"
              value={matchForm.jobSkills}
              onChange={(e) => setMatchForm({ ...matchForm, jobSkills: e.target.value })}
            />
          </label>
          <button type="submit" className="self-end !bg-teal-400 !text-slate-950 hover:!bg-teal-300">
            Run Match
          </button>
          <button type="button" className="self-end !bg-white/20 hover:!bg-white/30" onClick={analyzeGaps}>
            <FiBook style={{ display: "inline", marginRight: 6 }} />
            Build Roadmap
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Match Explanation</p>
            <h2>Skill overlap analysis</h2>
          </div>
          <ScoreBadge value={matchResult?.matchScore} />
        </div>
        {matchResult ? (
          <div className="insights-result-grid">
            {matchResult.matchedSkills?.length > 0 && (
              <div className="insights-skill-group">
                <p className="insights-skill-label matched"><FiCheck /> Matched skills</p>
                <div className="chips">
                  {matchResult.matchedSkills.map((skill) => (
                    <span key={skill} className="chip-matched">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {matchResult.missingSkills?.length > 0 && (
              <div className="insights-skill-group">
                <p className="insights-skill-label missing"><FiX /> Missing skills</p>
                <div className="chips">
                  {matchResult.missingSkills.map((skill) => (
                    <span key={skill} className="chip-missing">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {matchResult.explanation && (
              <p className="insights-explanation">{matchResult.explanation}</p>
            )}
          </div>
        ) : <Empty />}
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Learning roadmap</p>
            <h2>Next steps</h2>
          </div>
          <span className="count">{analysisResult?.roadmap?.length || 0} steps</span>
        </div>
        {analysisResult ? (
          <div className="roadmap-list">
            {analysisResult.roadmap.map((item, index) => (
              <div key={item} className="roadmap-item">
                <span className="roadmap-step">{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        ) : <Empty />}
      </section>

      <section className="panel full">
        <div className="section-head">
          <div>
            <p className="eyebrow">Best CV finder</p>
            <h2>Top CV for your best job</h2>
          </div>
          <span className="count">{recommendations.length} ranked jobs</span>
        </div>
        {bestCvResult ? (
          <div className="best-cv-card">
            {bestCvResult.cv && (
              <div className="best-cv-info">
                <FiAward className="best-cv-icon" />
                <div>
                  <h3>{bestCvResult.cv.title}</h3>
                  <p className="muted">{bestCvResult.reason || "Best match for your top job"}</p>
                  <div className="chips" style={{ marginTop: 8 }}>
                    {(bestCvResult.cv.skills || []).slice(0, 6).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>
                <strong className="score" style={{ alignSelf: "flex-start" }}>
                  {bestCvResult.matchScore ?? bestCvResult.score ?? "—"}%
                </strong>
              </div>
            )}
            {!bestCvResult.cv && (
              <pre className="insights-pre">{JSON.stringify(bestCvResult, null, 2)}</pre>
            )}
          </div>
        ) : <Empty />}
      </section>

      <section className="panel full">
        <div className="section-head">
          <div>
            <p className="eyebrow">Success predictor</p>
            <h2>Application Success Score</h2>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Predicts interview potential based on match score, skill gaps, and experience.
            </p>
          </div>
          <button type="button" className="secondary" onClick={getSuccessScore}>
            <FiZap style={{ display: "inline", marginRight: 6 }} />
            Calculate Score
          </button>
        </div>
        {successScore ? (
          <div className="success-score-panel">
            <div className={`success-score-badge success-score-badge--${(successScore.interviewPotential || "medium").toLowerCase()}`}>
              <FiThumbsUp />
              <span>{successScore.interviewPotential || "Medium"} Potential</span>
            </div>
            <div className="success-score-breakdown">
              {successScore.matchScore !== undefined && (
                <div className="success-score-row">
                  <span>Match Score</span>
                  <strong>{successScore.matchScore}%</strong>
                </div>
              )}
              {successScore.skillGapCount !== undefined && (
                <div className="success-score-row">
                  <span>Skill Gaps</span>
                  <strong>{successScore.skillGapCount}</strong>
                </div>
              )}
              {successScore.experienceAlignment !== undefined && (
                <div className="success-score-row">
                  <span>Experience Alignment</span>
                  <strong>{successScore.experienceAlignment}%</strong>
                </div>
              )}
            </div>
            {successScore.summary && (
              <p className="insights-explanation">{successScore.summary}</p>
            )}
          </div>
        ) : <Empty />}
      </section>
    </div>
  );
}
