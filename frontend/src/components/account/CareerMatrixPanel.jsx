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
import { ui } from "../../styles/ui";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function CareerMatrixPanel({ careerMatrix, status }) {
  const chartFields = careerMatrix?.chartFields || [];
  const topFields = careerMatrix?.fields?.slice(0, 3) || [];
  const sourceLabel = careerMatrix?.source === "ai" ? "AI-assisted" : "Rule-based fallback";

  const chartData = {
    labels: chartFields.map((field) => field.label),
    datasets: [
      {
        label: "Career fit",
        data: chartFields.map((field) => field.score),
        backgroundColor: "rgba(15, 118, 110, 0.18)",
        borderColor: "#0f766e",
        borderWidth: 2,
        pointBackgroundColor: "#0f766e",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 25,
          backdropColor: "transparent",
        },
        pointLabels: {
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
    },
  };

  return (
    <section className={ui.panel}>
      <div className={ui.sectionHead}>
        <div>
          <p className={ui.eyebrow}>Career Matrix</p>
          <h2 className="text-2xl font-black">AI-assisted career fit</h2>
          <p className={ui.muted}>
            Scores your Career Passport against common software career directions.
          </p>
        </div>
        <span className={ui.score}>{careerMatrix?.average || 0}%</span>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(280px,420px)] gap-4 max-lg:grid-cols-1">
        <div className="grid min-w-0 gap-3">
          <div className="rounded-xl border border-[#d6dee2] bg-[#fbfcfc] p-4">
            <p className={ui.miniLabel}>Top direction</p>
            <h3 className="break-words text-xl font-black">
              {careerMatrix?.topField?.label || "Not enough profile data"}
            </h3>
            <p className="mt-2 break-words text-sm font-medium text-slate-500">
              {careerMatrix?.topField?.description ||
                "Fill in your Career Passport to calculate a stronger score."}
            </p>
          </div>

          <div className="grid gap-2">
            {topFields.map((field) => (
              <article
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl border border-[#d6dee2] bg-white p-3 max-sm:grid-cols-1"
                key={field.label}
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <strong className="break-words">{field.label}</strong>
                    <span className="shrink-0 text-xs font-black text-teal-700">
                      {field.score}%
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm text-slate-500">
                    {field.evidence?.length
                      ? `Evidence: ${field.evidence.join(", ")}`
                      : "No matching evidence yet."}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <p className="break-words text-sm font-bold text-slate-500">
            {status || sourceLabel}
          </p>
        </div>

        <div className={ui.chartBox}>
          <Radar data={chartData} options={chartOptions} />
        </div>
      </div>
    </section>
  );
}
