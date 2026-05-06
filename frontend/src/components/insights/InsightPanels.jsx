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

/* Lattice chart palette — Cobalt-first, then Ink/Slate/Plum/Warning/Success */
const CHART_COLORS = ["#1E3FFF", "#0E0E10", "#6B6B72", "#5B2A86", "#9A6712", "#0E7C4A"];

/* ── Breakdown bar (skill / experience / role) ───────────────────────────── */
function BreakdownBar({ label, score, color = "var(--c-cobalt)" }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#6B6B72]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {label}
        </span>
        <span
          className="text-[11px] font-medium text-[#3A3A40]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {score}%
        </span>
      </div>
      <div className="h-[4px] w-full overflow-hidden rounded-[2px] bg-[#E8E3D7]">
        <div
          className="h-full rounded-[2px] transition-all"
          style={{ width: `${Math.min(score, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ── MatchExplanation ────────────────────────────────────────────────────── */
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
        <div className="grid gap-2.5 rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] p-3">
          <p className={ui.miniLabel}>Score breakdown</p>
          <BreakdownBar label="Skill coverage (60%)"       score={breakdown.skillScore}      color="var(--c-ink)" />
          <BreakdownBar label="Experience alignment (25%)" score={breakdown.experienceScore} color="var(--c-cobalt)" />
          <BreakdownBar label="Role fit (15%)"             score={breakdown.roleScore}       color="var(--c-slate)" />
          {breakdown.experienceDetail && (
            <p className="mt-1 text-[12px] text-[#6B6B72]">{breakdown.experienceDetail}</p>
          )}
          {breakdown.roleDetail && (
            <p className="text-[12px] text-[#6B6B72]">{breakdown.roleDetail}</p>
          )}
        </div>
      )}

      {/* Skill chips */}
      <SkillBlock label="Matched skills"  skills={result.matchingSkills || result.matchedSkills} tone="matched" />
      <SkillBlock label="Partial matches" skills={result.partialSkills}  tone="partial" />
      <SkillBlock label="Missing skills"  skills={result.missingSkills}  tone="missing" />
    </div>
  );
}

/* ── BestCvResult ────────────────────────────────────────────────────────── */
export function BestCvResult({ result }) {
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
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-[#0E0E10]">
            {cv.title}
          </h3>
          {reason && <p className="mt-1 text-[13px] text-[#6B6B72]">{reason}</p>}
        </div>
        <ScoreBadge value={matchScore} />
      </div>

      {breakdown && (
        <div className="grid gap-2.5 rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] p-3">
          <p className={ui.miniLabel}>Score breakdown</p>
          <BreakdownBar label="Skill coverage (60%)"       score={breakdown.skillScore}      color="var(--c-ink)" />
          <BreakdownBar label="Experience alignment (25%)" score={breakdown.experienceScore} color="var(--c-cobalt)" />
          <BreakdownBar label="Role fit (15%)"             score={breakdown.roleScore}       color="var(--c-slate)" />
        </div>
      )}

      <SkillBlock label="CV skills" skills={cv.skills || []} tone="neutral" />
    </div>
  );
}

/* ── SkillBlock ──────────────────────────────────────────────────────────── */
export function SkillBlock({ label, skills = [], tone = "neutral" }) {
  if (!skills || !skills.length) return null;

  const chipClass = {
    matched: ui.chipMatched,
    partial: ui.chipPartial,
    missing: ui.chipMissing,
    neutral: ui.chip,
  }[tone] ?? ui.chip;

  return (
    <div>
      <p className={ui.miniLabel}>{label}</p>
      <div className={ui.chips}>
        {skills.map((skill) => (
          <span className={chipClass} key={skill}>{skill}</span>
        ))}
      </div>
    </div>
  );
}

/* ── AnalyticsBar ────────────────────────────────────────────────────────── */
export function AnalyticsBar({ data }) {
  const chartData = {
    labels: data.map((item) => item.skill),
    datasets: [
      {
        label: "Missing count",
        data: data.map((item) => item.missingCount),
        backgroundColor: "#1E3FFF",
        borderRadius: 4,
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
              labels: { boxWidth: 12, color: "#6B6B72", font: { size: 11 } },
            },
          },
          scales: {
            x: { ticks: { color: "#6B6B72", maxRotation: 35, minRotation: 0 } },
            y: { beginAtZero: true, ticks: { precision: 0, color: "#6B6B72" } },
          },
        }}
      />
    </div>
  );
}

/* ── TrendSummary ────────────────────────────────────────────────────────── */
function formatSalary(value) {
  if (!value || value <= 0) return "No data";
  return `£${Number(value).toLocaleString("en-GB")}`;
}

export function TrendSummary({ data }) {
  const categories = data.categories?.slice(0, 6) || [];
  const chartData = {
    labels: categories.map((item) => item.label),
    datasets: [
      {
        data: categories.map((item) => item.count),
        backgroundColor: CHART_COLORS,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className={ui.insightStack}>
      <div className={ui.insightMetrics}>
        <Metric label="Jobs"            value={data.totalCount || 0} />
        <Metric label="Avg min salary"  value={formatSalary(data.averageSalaryMin)} />
        <Metric label="Avg max salary"  value={formatSalary(data.averageSalaryMax)} />
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
                  labels: {
                    boxWidth: 10,
                    color: "#6B6B72",
                    font: { size: 11 },
                    padding: 10,
                  },
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
