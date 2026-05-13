// frontend/src/components/roadmap/TimelineRow.jsx
import { ui } from "../../styles/ui";

function circleClass(isActive, isCompleted) {
  if (isCompleted) return "bg-[#E5F4EC] text-[#0E7C4A]";
  if (isActive)    return "bg-[#1E3FFF] text-white shadow-[0_6px_18px_rgba(30,63,255,0.18)]";
  return "border border-[#E8E3D7] bg-white text-[#A4A4AC]";
}

const DIFFICULTY_STYLES = {
  beginner:     "bg-[#E5F4EC] text-[#0E7C4A]",
  intermediate: "bg-[#E6EBFF] text-[#1E3FFF]",
  advanced:     "bg-[#FEF9E7] text-[#B45309]",
};

export default function TimelineRow({
  stage,
  index,
  weekLabel,
  stepsCompleted,
  onToggleStep,
  isActive,
  isCompleted,
}) {
  return (
    <div className="relative grid grid-cols-[140px_56px_1fr] items-start gap-4 max-sm:grid-cols-[36px_1fr] max-sm:gap-3">

      {/* Week label — hidden on mobile */}
      <div className="pt-2 max-sm:hidden">
        <span
          className="inline-flex items-center rounded-[4px] bg-[#E6EBFF] px-2 py-1 text-[11px] font-medium text-[#1E3FFF]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {weekLabel}
        </span>
      </div>

      {/* Circle indicator */}
      <div className="relative self-stretch flex justify-center pt-2 max-sm:justify-start">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 max-sm:hidden"
          style={{ left: "50%", width: 0, borderLeft: "2px dotted var(--c-hairline)", zIndex: 0 }}
        />
        <div
          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${circleClass(isActive, isCompleted)}`}
        >
          {isCompleted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" stroke="#0E7C4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="text-[13px] font-semibold">{index + 1}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pb-6">
        {/* Week label — mobile only */}
        <div className="mb-2 hidden max-sm:block">
          <span
            className="inline-flex items-center rounded-[4px] bg-[#E6EBFF] px-2 py-0.5 text-[10px] font-medium text-[#1E3FFF]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {weekLabel}
          </span>
        </div>

        {/* Skill title + frequency badge */}
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-[#0E0E10]">
            {stage.skill}
          </h3>
          {stage.freq > 0 && (
            <span className={`shrink-0 ${ui.chipMissing}`}>
              {stage.freq}×
            </span>
          )}
        </div>

        {/* Category + difficulty */}
        {(stage.category || stage.difficulty) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {stage.category && (
              <span
                className="rounded-[4px] bg-[#F6F3EC] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-[#6B6B72]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {stage.category}
              </span>
            )}
            {stage.difficulty && (
              <span
                className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] ${DIFFICULTY_STYLES[stage.difficulty] || DIFFICULTY_STYLES.intermediate}`}
                style={{ fontFamily: "var(--font-mono)" }}
                aria-label={`Difficulty: ${stage.difficulty}`}
              >
                {stage.difficulty}
              </span>
            )}
          </div>
        )}

        {/* Prerequisites */}
        {stage.prerequisites?.length > 0 && (
          <p className="mt-2 text-[12px] leading-relaxed text-[#6B6B72]">
            <span className="font-medium text-[#3A3A40]">Requires:</span>{" "}
            {stage.prerequisites.join(", ")}
          </p>
        )}

        {/* Step checklist */}
        <ul className="mt-3 grid gap-2" aria-label={`Learning steps for ${stage.skill}`}>
          {stage.steps.map((step, si) => {
            const done = !!stepsCompleted[si];
            return (
              <li
                key={si}
                className={`flex items-center justify-between gap-3 rounded-[8px] border border-[#E8E3D7] px-3 py-2 ${
                  done ? "bg-[#F6F3EC]" : "bg-white"
                }`}
              >
                <button
                  aria-pressed={done}
                  className="flex min-w-0 items-center gap-3 text-left"
                  onClick={() => onToggleStep(si)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border ${
                      done
                        ? "border-transparent bg-[#0E7C4A] text-white"
                        : "border-[#E8E3D7] text-[#A4A4AC]"
                    }`}
                  >
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>
                        {si + 1}
                      </span>
                    )}
                  </span>
                  <span className={`text-[13px] ${done ? "line-through text-[#A4A4AC]" : "text-[#0E0E10]"}`}>
                    {step}
                  </span>
                </button>
                <span
                  className="shrink-0 text-[10px] font-medium text-[#A4A4AC]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {si + 1}/{stage.steps.length}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Project idea */}
        {stage.projectIdea && (
          <div className="mt-4 rounded-[8px] border border-dashed border-[#E8E3D7] bg-[#F6F3EC] px-3 py-2.5">
            <p
              className="text-[10px] font-medium uppercase tracking-[0.07em] text-[#6B6B72]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Project idea
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[#3A3A40]">{stage.projectIdea}</p>
          </div>
        )}

        {/* Proof of work */}
        {stage.proofOfWork && (
          <p className="mt-2.5 text-[12px] leading-relaxed text-[#6B6B72]">
            <span className="font-medium text-[#0E0E10]">Proof of work:</span>{" "}
            {stage.proofOfWork}
          </p>
        )}
      </div>
    </div>
  );
}
