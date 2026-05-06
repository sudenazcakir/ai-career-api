import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { getScoreClass, ui } from "../../styles/ui";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function CareerMatrixPanel({ careerMatrix, status }) {
  const chartFields  = careerMatrix?.chartFields || [];
  const topFields    = careerMatrix?.fields?.slice(0, 3) || [];
  const sourceLabel  = careerMatrix?.source === "ai" ? "AI-assisted" : "Rule-based fallback";

  const chartData = {
    labels: chartFields.map((f) => f.label),
    datasets: [
      {
        label: "Career fit",
        data: chartFields.map((f) => f.score),
        backgroundColor: "rgba(30, 63, 255, 0.10)",
        borderColor: "#1E3FFF",
        borderWidth: 1.5,
        pointBackgroundColor: "#1E3FFF",
        pointRadius: 3,
        pointHoverRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio:
      typeof window === "undefined" ? 2 : Math.max(window.devicePixelRatio || 1, 2),
    elements: { line: { tension: 0 } },
    plugins: { legend: { display: false } },
    scales: {
      r: {
        alignToPixels: true,
        suggestedMin: 0,
        suggestedMax: 100,
        angleLines:   { color: "rgba(232, 227, 215, 0.8)" },
        grid:         { color: "rgba(232, 227, 215, 0.8)" },
        ticks: {
          stepSize: 25,
          backdropColor: "transparent",
          color: "#A4A4AC",
          font: { size: 10, family: "var(--font-mono)" },
        },
        pointLabels: {
          color: "#6B6B72",
          font: { size: 12, family: "var(--font-sans)", weight: "500" },
        },
      },
    },
  };

  return (
    <section className={ui.panel}>
      <div className={ui.sectionHead}>
        <div>
          <p className={ui.eyebrow}>Career matrix</p>
          <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
            AI-assisted career fit
          </h2>
          <p className={ui.muted}>
            Scores your Career Passport against common software career directions.
          </p>
        </div>
        <strong className={getScoreClass(careerMatrix?.average || 0)}>
          {careerMatrix?.average || 0}%
        </strong>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(260px,400px)] gap-4 max-lg:grid-cols-1">
        <div className="grid min-w-0 gap-3">

          {/* Top direction card */}
          <div className="rounded-[8px] border border-[#E8E3D7] bg-[#F6F3EC] p-4">
            <p className={ui.miniLabel}>Top direction</p>
            <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-[#0E0E10]">
              {careerMatrix?.topField?.label || "Not enough profile data"}
            </h3>
            <p className="mt-1.5 text-[13px] text-[#6B6B72]">
              {careerMatrix?.topField?.description ||
                "Fill in your Career Passport to calculate a stronger score."}
            </p>
          </div>

          {/* Top 3 fields */}
          <div className="grid gap-2">
            {topFields.map((field) => (
              <article
                key={field.label}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] p-3 max-sm:grid-cols-1"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <strong className="text-[13px] font-semibold text-[#0E0E10]">
                      {field.label}
                    </strong>
                    <span
                      className="shrink-0 text-[11px] font-medium text-[#1E3FFF]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {field.score}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-[#6B6B72]">
                    {field.evidence?.length
                      ? `Evidence: ${field.evidence.join(", ")}`
                      : "No matching evidence yet."}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* Source label */}
          <p className={ui.muted}>{status || sourceLabel}</p>
        </div>

        {/* Radar chart */}
        <div className={ui.chartBox}>
          <Radar data={chartData} options={chartOptions} />
        </div>
      </div>
    </section>
  );
}
