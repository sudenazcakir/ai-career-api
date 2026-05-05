import { FiMap } from "react-icons/fi";
import { Empty } from "../components/shared";

const SKILL_CATEGORIES = {
  tools:  ["docker","kubernetes","aws","ci/cd","terraform","linux","git","github","jenkins","nginx","redis","kafka","elasticsearch"],
  domain: ["agile","scrum","microservices","rest api","graphql","oauth","jwt","tdd","ddd","solid"],
};

function categorizeSkill(skill) {
  const lower = skill.toLowerCase();
  if (SKILL_CATEGORIES.tools.some((t) => lower.includes(t)))  return "tools";
  if (SKILL_CATEGORIES.domain.some((d) => lower.includes(d))) return "domain";
  return "technical";
}

export function buildSkillGaps(jobs, cvSkills) {
  const cvSet = new Set((cvSkills || []).map((s) => s.toLowerCase()));
  const freq = {};
  for (const job of jobs) {
    for (const skill of job.skills || []) {
      if (!cvSet.has(skill.toLowerCase())) {
        freq[skill] = (freq[skill] || 0) + 1;
      }
    }
  }
  return Object.entries(freq)
    .map(([skill, count]) => ({ skill, count, cat: categorizeSkill(skill) }))
    .sort((a, b) => b.count - a.count);
}

const CAT_LABELS = { technical: "Technical", tools: "Tools & platforms", domain: "Domain knowledge" };

export default function SkillGapPage({ jobs, recommendations, selectedCv, setActivePage }) {
  const allJobs    = [...jobs, ...recommendations].filter((j) => j?._id);
  const uniqueJobs = [...new Map(allJobs.map((j) => [j._id, j])).values()];
  const gaps       = buildSkillGaps(uniqueJobs, selectedCv?.skills);
  const maxCount   = gaps[0]?.count || 1;

  const byCategory = {
    technical: gaps.filter((g) => g.cat === "technical"),
    tools:     gaps.filter((g) => g.cat === "tools"),
    domain:    gaps.filter((g) => g.cat === "domain"),
  };

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-2xl border border-teal-200/25 bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.18),transparent_30%),linear-gradient(135deg,#0f172a,#12343b_52%,#111827)] p-6 text-white shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-300">
              Growth
            </p>
            <h2 className="text-[clamp(32px,5vw,54px)] font-black leading-none">
              Skill gap analyzer
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Across your {uniqueJobs.length} matched jobs, here's what you're
              missing — and what to learn next.
            </p>
          </div>
          <button
            type="button"
            className="!bg-teal-400 !text-slate-950 hover:!bg-teal-300 shrink-0"
            onClick={() => setActivePage("roadmap")}
          >
            <FiMap style={{ display: "inline", marginRight: 6 }} />
            View Roadmap
          </button>
        </div>
      </section>

      {gaps.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-500">
            {selectedCv
              ? "No skill gaps found — your CV covers all job requirements!"
              : "Select a CV and load jobs to see your skill gaps."}
          </p>
        </div>
      )}

      {gaps.length > 0 && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-normal text-teal-700">
                  Most-needed skills you don't have
                </p>
                <h2 className="text-2xl font-black text-slate-950">Market frequency</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">
                {gaps.length} gaps
              </span>
            </div>
            <div className="skill-freq-list">
              {gaps.slice(0, 12).map((g, i) => (
                <div key={g.skill} className="skill-freq-row">
                  <span className="skill-freq-rank">#{i + 1}</span>
                  <span className="skill-freq-name">{g.skill}</span>
                  <div className="skill-freq-bar-wrap">
                    <div
                      className="skill-freq-bar"
                      style={{ width: `${Math.round((g.count / maxCount) * 100)}%` }}
                    />
                  </div>
                  <span className="skill-freq-count">
                    {g.count} job{g.count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(byCategory).map(([cat, items]) =>
              items.length === 0 ? null : (
                <section
                  key={cat}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="mb-1 text-xs font-black uppercase tracking-normal text-teal-700">
                    {CAT_LABELS[cat]}
                  </p>
                  <h3 className="mb-4 text-xl font-black text-slate-950">
                    {items.length} skill{items.length !== 1 ? "s" : ""}
                  </h3>
                  <div className="chips">
                    {items.map((g) => (
                      <span key={g.skill} className="chip">
                        {g.skill}
                        <span className="ml-1 text-slate-400 text-xs">{g.count}×</span>
                      </span>
                    ))}
                  </div>
                </section>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
