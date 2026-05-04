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

export function MatchExplanation({ result }) {
  return (
    <div className={ui.insightStack}>
      <div className={ui.insightMetrics}>
        <Metric label="Match score" value={`${result.matchScore}%`} />
        <Metric label="Level" value={result.level} />
      </div>
      <SkillBlock label="Matching skills" skills={result.matchingSkills} />
      <SkillBlock label="Missing skills" skills={result.missingSkills} tone="warning" />
      <p className={ui.explanation}>{result.explanation}</p>
    </div>
  );
}

export function BestCvResult({ result }) {
  if (!result.bestCv) {
    return <p className={ui.muted}>No suitable CV found for the selected job.</p>;
  }

  return (
    <div className={ui.insightStack}>
      <div className={ui.sectionHead}>
        <div>
          <p className={ui.eyebrow}>Best match</p>
          <h3 className="min-w-0 break-words text-xl font-black">{result.bestCv.title}</h3>
        </div>
        <ScoreBadge value={result.score} />
      </div>
      <SkillBlock label="CV skills" skills={result.bestCv.skills || []} />
    </div>
  );
}

export function SkillBlock({ label, skills = [], tone = "neutral" }) {
  return (
    <div>
      <p className={ui.miniLabel}>{label}</p>
      <div className={ui.chips}>
        {skills.length ? (
          skills.map((skill) => (
            <span
              className={`${ui.chip} ${tone === "warning" ? "bg-amber-100 text-amber-800" : ""}`}
              key={skill}
            >
              {skill}
            </span>
          ))
        ) : (
          <span className={ui.chip}>None</span>
        )}
      </div>
    </div>
  );
}

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
              labels: {
                boxWidth: 14,
                color: "#475569",
                font: { size: 11 },
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: "#475569",
                maxRotation: 35,
                minRotation: 0,
              },
            },
            y: {
              beginAtZero: true,
              ticks: { precision: 0 },
            },
          },
        }}
      />
    </div>
  );
}

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
        <Metric label="Jobs" value={data.totalCount || 0} />
        <Metric label="Avg min salary" value={data.averageSalaryMin || "N/A"} />
        <Metric label="Avg max salary" value={data.averageSalaryMax || "N/A"} />
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
                    boxWidth: 12,
                    color: "#475569",
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
