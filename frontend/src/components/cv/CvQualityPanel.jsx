import { ui } from "../../styles/ui";

function computeQuality(cv) {
  let score = 0;
  const missing = [];

  if (cv.title?.trim()) score += 10;

  if ((cv.summary || "").trim().length >= 50) {
    score += 20;
  } else {
    missing.push(`Professional summary (${(cv.summary || "").trim().length}/50 chars min)`);
  }

  const skillCount = (cv.skills || []).length;
  if (skillCount >= 5) {
    score += 20;
  } else {
    missing.push(`At least 5 skills (have ${skillCount})`);
  }

  if ((cv.experience || []).length >= 1) {
    score += 20;
  } else {
    missing.push("Work experience");
  }

  if ((cv.projects || []).length >= 1) {
    score += 15;
  } else {
    missing.push("Projects");
  }

  if ((cv.education || []).length >= 1) {
    score += 10;
  } else {
    missing.push("Education");
  }

  if ((cv.certifications || []).length >= 1) {
    score += 5;
  } else {
    missing.push("Certifications (optional +5 pts)");
  }

  return { score, missing };
}

function scoreColor(score) {
  if (score >= 75) return { bar: "#D7E25C", text: "#0E0E10" };
  if (score >= 50) return { bar: "#1E3FFF", text: "#1E3FFF" };
  return { bar: "#A4A4AC", text: "#6B6B72" };
}

export function CvQualityPanel({ cv }) {
  const { score, missing } = computeQuality(cv);
  const colors = scoreColor(score);

  return (
    <div className={ui.panel}>
      <div className={ui.sectionHead}>
        <div>
          <p className={ui.eyebrow}>CV Quality</p>
          <h3 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
            Completeness score
          </h3>
        </div>
        <strong
          className="text-[32px] font-semibold leading-none tracking-[-0.015em]"
          style={{ color: colors.text }}
          aria-label={`${score} out of 100`}
        >
          {score}
          <span className="text-[16px] text-[#6B6B72]">/100</span>
        </strong>
      </div>

      <div
        className="mb-4 h-[6px] w-full overflow-hidden rounded-full bg-[#E8E3D7]"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`CV completeness: ${score}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: colors.bar }}
        />
      </div>

      <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-[8px] border border-[#E8E3D7]">
        {[
          { label: "Skills", value: (cv.skills || []).length },
          { label: "Experience", value: (cv.experience || []).length },
          { label: "Projects", value: (cv.projects || []).length },
        ].map(({ label, value }) => (
          <div key={label} className="grid min-w-0 gap-1 border-r border-[#E8E3D7] px-3 py-2 text-center last:border-r-0">
            <strong className="text-[20px] font-semibold leading-none text-[#0E0E10]">{value}</strong>
            <span className={ui.metricLabel}>{label}</span>
          </div>
        ))}
      </div>

      {missing.length > 0 && (
        <div>
          <p className={`${ui.miniLabel} mb-2`}>To improve</p>
          <ul className="grid gap-1.5">
            {missing.map((item) => (
              <li key={item} className="flex min-w-0 gap-2 text-[13px] text-[#3A3A40]">
                <span aria-hidden="true" className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#5B2A86]" />
                <span className="min-w-0 break-words">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {missing.length === 0 && (
        <p className={ui.muted}>All recommended sections are complete.</p>
      )}
    </div>
  );
}
