// frontend/src/utils/skillUtils.js

const SKILL_CATEGORIES = {
  tools:  ["docker","kubernetes","aws","ci/cd","terraform","linux","git","github","jenkins","nginx","redis","kafka","elasticsearch"],
  domain: ["agile","scrum","microservices","rest api","graphql","oauth","jwt","tdd","ddd","solid"],
};

export function categorizeSkill(skill) {
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

export function buildTopSkills(jobs, cvSkills = []) {
  return buildSkillGaps(jobs, cvSkills);
}
