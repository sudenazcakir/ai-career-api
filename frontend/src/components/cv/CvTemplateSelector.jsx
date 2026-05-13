import { ui } from "../../styles/ui";

const TEMPLATES = [
  { id: "classic", label: "Classic" },
  { id: "modern", label: "Modern" },
  { id: "ats", label: "ATS Compact" },
];

export function CvTemplateSelector({ value, onChange }) {
  return (
    <div
      className="inline-flex overflow-hidden rounded-[8px] border border-[#E8E3D7]"
      role="group"
      aria-label="CV template"
    >
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-pressed={value === t.id}
          onClick={() => onChange(t.id)}
          className={[
            "h-8 px-3 text-[12px] font-[500] transition-colors border-r border-[#E8E3D7] last:border-r-0",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-inset",
            value === t.id
              ? "bg-[#0E0E10] text-[#F6F3EC]"
              : "bg-[#FBFAF6] text-[#3A3A40] hover:bg-[#F6F3EC] hover:text-[#0E0E10]",
          ].join(" ")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
