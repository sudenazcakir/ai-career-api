import { ui } from "../../styles/ui";

export function CvPreview({ cv, template = "classic" }) {
  if (template === "modern") return <ModernTemplate cv={cv} />;
  if (template === "ats") return <AtsTemplate cv={cv} />;
  return <ClassicTemplate cv={cv} />;
}

function ClassicTemplate({ cv }) {
  const hasContent =
    (cv.projects?.length || 0) +
    (cv.experience?.length || 0) +
    (cv.education?.length || 0) +
    (cv.certifications?.length || 0) > 0;

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E8E3D7] bg-[#F6F3EC]">
      <div className="grid gap-5 border-b border-[#E8E3D7] bg-[#FBFAF6] p-6 md:grid-cols-[minmax(0,1fr)_200px]">
        <div className="min-w-0">
          <p className={ui.eyebrow}>Professional CV · Classic</p>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px,4vw,48px)",
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
              color: "var(--c-ink)",
              fontWeight: 400,
            }}
          >
            {cv.title}
          </h3>
          <p className="mt-2 text-[13px] uppercase tracking-[0.08em] text-[#6B6B72] font-mono">
            {cv.type || "General"} · {cv.version || "v1"}
          </p>
          {cv.summary && (
            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#3A3A40]">
              {cv.summary}
            </p>
          )}
        </div>
        <aside className="grid content-start gap-3 rounded-[10px] border border-[#E8E3D7] bg-[#F6F3EC] p-4">
          <StatRow label="Skills" value={(cv.skills || []).length} />
          <StatRow label="Experience" value={(cv.experience || []).length} />
          <StatRow label="Projects" value={(cv.projects || []).length} />
        </aside>
      </div>
      <div className="grid gap-5 p-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <p className={ui.miniLabel}>Core skills</p>
          {(cv.skills || []).length > 0 ? (
            <div className={`${ui.chips} mt-2`}>
              {cv.skills.map((s) => <span className={ui.chip} key={s}>{s}</span>)}
            </div>
          ) : (
            <p className={ui.muted}>No skills added.</p>
          )}
        </aside>
        <div className="grid min-w-0 gap-4">
          {(cv.experience || []).length > 0 && <SectionList title="Experience" items={cv.experience} />}
          {(cv.projects || []).length > 0 && <SectionList title="Projects" items={cv.projects} />}
          <div className="grid gap-4 md:grid-cols-2">
            {(cv.education || []).length > 0 && <SectionList title="Education" items={cv.education} />}
            {(cv.certifications || []).length > 0 && <SectionList title="Certifications" items={cv.certifications} />}
          </div>
          {!cv.summary && (cv.skills || []).length === 0 && !hasContent && (
            <p className={ui.muted}>No content yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ModernTemplate({ cv }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E8E3D7]">
      <div className="bg-[#0E0E10] p-6 text-[#F6F3EC]">
        <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-[#A4A4AC] font-mono">
          Professional CV · Modern
        </p>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px,4vw,44px)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "#F6F3EC",
            fontWeight: 400,
            marginTop: 8,
          }}
        >
          {cv.title}
        </h3>
        <p className="mt-2 text-[12px] uppercase tracking-[0.08em] text-[#A4A4AC] font-mono">
          {cv.type || "General"} · {cv.version || "v1"}
        </p>
        {cv.summary && (
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#A4A4AC]">
            {cv.summary}
          </p>
        )}
      </div>
      <div className="grid bg-[#FBFAF6] md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 border-r border-[#E8E3D7] bg-[#F6F3EC] p-5">
          <div className="mb-5 grid grid-cols-3 overflow-hidden rounded-[8px] border border-[#E8E3D7]">
            <ModernStat label="Skills" value={(cv.skills || []).length} />
            <ModernStat label="Exp." value={(cv.experience || []).length} />
            <ModernStat label="Proj." value={(cv.projects || []).length} />
          </div>
          <p className={`${ui.miniLabel} mb-2`}>Skills</p>
          {(cv.skills || []).length > 0 ? (
            <div className={ui.chips}>
              {cv.skills.map((s) => <span className={ui.chip} key={s}>{s}</span>)}
            </div>
          ) : (
            <p className={ui.muted}>No skills.</p>
          )}
        </aside>
        <div className="min-w-0 grid gap-4 p-5">
          {(cv.experience || []).length > 0 && <SectionList title="Experience" items={cv.experience} />}
          {(cv.projects || []).length > 0 && <SectionList title="Projects" items={cv.projects} />}
          <div className="grid gap-4 md:grid-cols-2">
            {(cv.education || []).length > 0 && <SectionList title="Education" items={cv.education} />}
            {(cv.certifications || []).length > 0 && <SectionList title="Certifications" items={cv.certifications} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernStat({ label, value }) {
  return (
    <div className="grid min-w-0 gap-1 border-r border-[#E8E3D7] px-2 py-2 text-center last:border-r-0">
      <strong className="text-[18px] font-semibold leading-none text-[#0E0E10]">{value}</strong>
      <span className="text-[9px] font-[500] uppercase tracking-[0.06em] text-[#6B6B72] font-mono">{label}</span>
    </div>
  );
}

function AtsTemplate({ cv }) {
  return (
    <div className="rounded-[14px] border border-[#E8E3D7] bg-[#FBFAF6] p-6 font-mono">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6B72]">ATS Compact · {cv.type || "General"} · {cv.version || "v1"}</p>
      <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.01em] text-[#0E0E10]">{cv.title}</h3>
      {cv.summary && (
        <p className="mt-3 text-[13px] leading-relaxed text-[#3A3A40] border-t border-[#E8E3D7] pt-3">{cv.summary}</p>
      )}
      {(cv.skills || []).length > 0 && (
        <div className="mt-3 border-t border-[#E8E3D7] pt-3">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6B72] mb-1">Skills</p>
          <p className="text-[13px] text-[#3A3A40]">{cv.skills.join(", ")}</p>
        </div>
      )}
      {(cv.experience || []).length > 0 && <AtsSection title="Experience" items={cv.experience} />}
      {(cv.projects || []).length > 0 && <AtsSection title="Projects" items={cv.projects} />}
      {(cv.education || []).length > 0 && <AtsSection title="Education" items={cv.education} />}
      {(cv.certifications || []).length > 0 && <AtsSection title="Certifications" items={cv.certifications} />}
    </div>
  );
}

function AtsSection({ title, items }) {
  return (
    <div className="mt-3 border-t border-[#E8E3D7] pt-3">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6B72] mb-1">{title}</p>
      <ul className="grid gap-1">
        {items.map((item, i) => (
          <li key={i} className="text-[13px] text-[#3A3A40] leading-relaxed">— {item}</li>
        ))}
      </ul>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#E8E3D7] pb-2 last:border-b-0 last:pb-0">
      <span className={ui.metricLabel}>{label}</span>
      <strong className="text-[18px] font-semibold text-[#0E0E10]">{value}</strong>
    </div>
  );
}

function SectionList({ title, items }) {
  return (
    <article className="min-w-0 rounded-[10px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
      <p className={ui.miniLabel}>{title}</p>
      <ul className="mt-2 grid gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex min-w-0 gap-2 text-[13px] text-[#3A3A40]">
            <span aria-hidden="true" className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#A4A4AC]" />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
