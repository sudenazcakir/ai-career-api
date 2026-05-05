import { Bar, Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { ui } from "../../styles/ui";
import { Empty, Metric, ScoreBadge } from "../common/DataViews";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

// ─── Breakdown bar (skill / experience / role) ────────────────────────────
function BreakdownBar({ label, score, color = "bg-teal-700" }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-500">{label}</span>
        <span className="text-xs font-black text-slate-700">{score}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── MatchExplanation ─────────────────────────────────────────────────────
export function MatchExplanation({ result }) {
  const breakdown = result.breakdown;

  return (
    <div className={ui.insightStack}>
      {/* Score + level */}
      <div className={ui.insightMetrics}>
        <Metric label="Match score" value={`${result.matchScore}%`} />
        <Metric label="Level"       value={result.level || "—"} />
      </div>

      {/* Explanation sentence */}
      {result.explanation && (
        <p className={ui.explanation}>{result.explanation}</p>
      )}

      {/* Breakdown bars */}
      {breakdown && (
        <div className="grid gap-2 rounded-xl border border-[#d6dee2] bg-[#f8fafc] p-3">
          <p className={ui.miniLabel}>Score breakdown</p>
          <BreakdownBar label={`Skill coverage (60%)`}       score={breakdown.skillScore}      color="bg-teal-700" />
          <BreakdownBar label={`Experience alignment (25%)`} score={breakdown.experienceScore} color="bg-slate-700" />
          <BreakdownBar label={`Role fit (15%)`}             score={breakdown.roleScore}       color="bg-indigo-600" />
          {breakdown.experienceDetail && (
            <p className="mt-1 text-xs text-slate-500">{breakdown.experienceDetail}</p>
          )}
          {breakdown.roleDetail && (
            <p className="text-xs text-slate-500">{breakdown.roleDetail}</p>
          )}
        </div>
      )}

      {/* Skill chips */}
      <SkillBlock label="Matched skills"  skills={result.matchingSkills || result.matchedSkills}  tone="good" />
      <SkillBlock label="Partial matches" skills={result.partialSkills}  tone="warn" />
      <SkillBlock label="Missing skills"  skills={result.missingSkills}  tone="warning" />
    </div>
  );
}

// ─── BestCvResult ─────────────────────────────────────────────────────────
export function BestCvResult({ result }) {
  // Support both old shape (bestCv/score) and new shape (cv/matchScore/reason/breakdown)
  const cv        = result.cv || result.bestCv;
  const matchScore = result.matchScore ?? result.score;
  const reason    = result.reason || result.explanation;
  const breakdown = result.breakdown;

  if (!cv) {
    return <p className={ui.muted}>No suitable CV found for the selected job.</p>;
  }

  return (
    <div className={ui.insightStack}>
      <div className={ui.sectionHead}>
        <div>
          <p className={ui.eyebrow}>Best match</p>
          <h3 className="min-w-0 wrap-break-word text-xl font-black">{cv.title}</h3>
          {reason && <p className="mt-1 text-sm text-slate-500">{reason}</p>}
        </div>
        <ScoreBadge value={matchScore} />
      </div>

      {breakdown && (
        <div className="grid gap-2 rounded-xl border border-[#d6dee2] bg-[#f8fafc] p-3">
          <p className={ui.miniLabel}>Score breakdown</p>
          <BreakdownBar label="Skill coverage (60%)"       score={breakdown.skillScore}      color="bg-teal-700" />
          <BreakdownBar label="Experience alignment (25%)" score={breakdown.experienceScore} color="bg-slate-700" />
          <BreakdownBar label="Role fit (15%)"             score={breakdown.roleScore}       color="bg-indigo-600" />
        </div>
      )}

      <SkillBlock label="CV skills" skills={cv.skills || []} />
    </div>
  );
}

// ─── SkillBlock ───────────────────────────────────────────────────────────
export function SkillBlock({ label, skills = [], tone = "neutral" }) {
  if (!skills || !skills.length) return null;

  const toneClass = {
    good:    "bg-teal-100 text-teal-800",
    warn:    "bg-amber-100 text-amber-800",
    warning: "bg-red-100 text-red-800",
    neutral: "",
  }[tone] || "";

  return (
    <div>
      <p className={ui.miniLabel}>{label}</p>
      <div className={ui.chips}>
        {skills.map((skill) => (
          <span className={`${ui.chip} ${toneClass}`} key={skill}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── AnalyticsBar ─────────────────────────────────────────────────────────
export function AnalyticsBar({ data }) {
  const chartData = {
    labels: data.map((item) => item.skill),
    datasets: [
      {
        label: "Missing count",
        data: data.map((item) => item.missingCount),
        backgroundColor: "#0f766e",
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className={ui.chartBox}>
      <Bar
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { boxWidth: 14, color: "#475569", font: { size: 11 } },
            },
          },
          scales: {
            x: { ticks: { color: "#475569", maxRotation: 35, minRotation: 0 } },
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
        }}
      />
    </div>
  );
}

// ─── TrendSummary ─────────────────────────────────────────────────────────
export function TrendSummary({ data }) {
  const categories = data.categories?.slice(0, 6) || [];
  const chartData = {
    labels: categories.map((item) => item.label),
    datasets: [
      {
        data: categories.map((item) => item.count),
        backgroundColor: ["#0f766e", "#334155", "#2563eb", "#d97706", "#7c3aed", "#64748b"],
      },
    ],
  };

  return (
    <div className={ui.insightStack}>
      <div className={ui.insightMetrics}>
        <Metric label="Jobs"            value={data.totalCount || 0} />
        <Metric label="Avg min salary"  value={data.averageSalaryMin || "N/A"} />
        <Metric label="Avg max salary"  value={data.averageSalaryMax || "N/A"} />
      </div>
      {categories.length ? (
        <div className={ui.chartBoxShort}>
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { boxWidth: 12, color: "#475569", font: { size: 11 }, padding: 10 },
                },
              },
            }}
          />
        </div>
      ) : (
        <Empty />
      )}
    </div>
  );
}
