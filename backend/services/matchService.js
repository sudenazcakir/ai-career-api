/**
 * Weighted matching engine
 *
 * Score breakdown:
 *   60% — Skill coverage   (exact + partial matches)
 *   25% — Experience alignment (CV experience bullets vs job description)
 *   15% — Role fit         (CV type vs job title/category)
 */

function normalize(str = "") {
  return str.toLowerCase().trim();
}

function tokenize(str = "") {
  return normalize(str)
    .split(/[\s,/|&+()[\]]+/)
    .filter((t) => t.length > 2);
}

// ─── Skill score (0–100) ───────────────────────────────────────────────────
function scoreSkills(cvSkills = [], jobSkills = []) {
  if (!jobSkills.length) return { score: 50, matched: [], missing: [], partial: [] };

  const cvNorm  = cvSkills.map(normalize);
  const jobNorm = jobSkills.map(normalize);

  const matched  = [];
  const partial  = [];
  const missing  = [];

  for (const job of jobNorm) {
    const exact = cvNorm.includes(job);
    if (exact) {
      matched.push(job);
      continue;
    }
    const part = cvNorm.some(
      (cv) => cv.includes(job) || job.includes(cv)
    );
    if (part) {
      partial.push(job);
    } else {
      missing.push(job);
    }
  }

  const raw = (matched.length + partial.length * 0.5) / jobSkills.length;
  return {
    score: Math.round(Math.min(raw, 1) * 100),
    matched,
    partial,
    missing,
  };
}

// ─── Experience score (0–100) ─────────────────────────────────────────────
function scoreExperience(cvExperience = [], jobDescription = "", jobTitle = "") {
  if (!cvExperience.length) return { score: 30, detail: "No experience entries in CV" };

  const jobTokens = new Set([
    ...tokenize(jobDescription),
    ...tokenize(jobTitle),
  ]);

  if (!jobTokens.size) return { score: 50, detail: "Job description empty" };

  let hits = 0;
  for (const entry of cvExperience) {
    const entryTokens = tokenize(entry);
    const overlap = entryTokens.filter((t) => jobTokens.has(t));
    if (overlap.length > 0) hits++;
  }

  const ratio = hits / cvExperience.length;

  // Scale: 0 hits → 25, all entries hit → 100
  const score = Math.round(25 + ratio * 75);
  const detail =
    hits === 0
      ? "No experience entries align with job description"
      : `${hits}/${cvExperience.length} experience entries align with job`;

  return { score, detail };
}

// ─── Role fit score (0–100) ───────────────────────────────────────────────
const ROLE_KEYWORDS = {
  frontend:    ["frontend", "front-end", "react", "vue", "angular", "ui", "ux", "css", "html"],
  backend:     ["backend", "back-end", "api", "server", "node", "java", "python", "django", "express", "spring"],
  fullstack:   ["fullstack", "full-stack", "full stack"],
  data:        ["data", "analyst", "analytics", "ml", "machine learning", "ai", "science", "scientist"],
  devops:      ["devops", "cloud", "infra", "infrastructure", "sre", "kubernetes", "docker", "ci/cd"],
  mobile:      ["mobile", "ios", "android", "react native", "flutter", "swift", "kotlin"],
  qa:          ["qa", "test", "testing", "quality", "automation", "sdet"],
};

function detectRole(text = "") {
  const lower = normalize(text);
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return role;
  }
  return "general";
}

function scoreRole(cvType = "", jobTitle = "", jobCategory = "") {
  const cvRole  = detectRole(cvType);
  const jobRole = detectRole(`${jobTitle} ${jobCategory}`);

  if (cvRole === "general" || jobRole === "general") {
    return { score: 55, detail: "Role alignment unclear — general profile" };
  }
  if (cvRole === jobRole) {
    return { score: 100, detail: `Strong role alignment (${cvRole})` };
  }

  // Related roles get partial credit
  const related = {
    fullstack: ["frontend", "backend"],
    frontend:  ["fullstack"],
    backend:   ["fullstack"],
  };
  if (related[cvRole]?.includes(jobRole) || related[jobRole]?.includes(cvRole)) {
    return { score: 65, detail: `Partial role alignment (${cvRole} ↔ ${jobRole})` };
  }

  return { score: 20, detail: `Role mismatch (CV: ${cvRole}, Job: ${jobRole})` };
}

// ─── Main scorer ──────────────────────────────────────────────────────────
function scoreMatch({ cv, job }) {
  const cvSkills     = cv.skills || [];
  const jobSkills    = job.skills || [];
  const cvExperience = cv.experience || [];
  const jobDesc      = job.description || "";
  const cvType       = cv.type || "";
  const jobTitle     = job.title || "";
  const jobCategory  = job.category || "";

  const skill = scoreSkills(cvSkills, jobSkills);
  const exp   = scoreExperience(cvExperience, jobDesc, jobTitle);
  const role  = scoreRole(cvType, jobTitle, jobCategory);

  const weighted = Math.round(skill.score * 0.60 + exp.score * 0.25 + role.score * 0.15);

  const level = weighted >= 75 ? "High" : weighted >= 50 ? "Medium" : "Low";

  // Rich explanation sentence
  const parts = [];
  if (skill.matched.length)  parts.push(`strong skill overlap (${skill.matched.slice(0, 3).join(", ")})`);
  if (skill.missing.length)  parts.push(`missing: ${skill.missing.slice(0, 3).join(", ")}`);
  if (exp.score >= 60)       parts.push("relevant experience signals");
  else if (exp.score < 40)   parts.push("limited experience alignment");
  if (role.score >= 80)      parts.push(`excellent role fit`);
  else if (role.score < 40)  parts.push(`role mismatch`);

  const explanation = `${weighted}% match — ${parts.join(", ") || "general profile match"}.`;

  return {
    matchScore:     weighted,
    level,
    explanation,
    matchedSkills:  skill.matched,
    partialSkills:  skill.partial,
    missingSkills:  skill.missing,
    breakdown: {
      skillScore:      skill.score,
      experienceScore: exp.score,
      roleScore:       role.score,
      experienceDetail: exp.detail,
      roleDetail:       role.detail,
    },
  };
}

// ─── Convenience: score raw skill arrays (used by /match endpoint) ─────────
function scoreSkillsOnly({ cvSkills = [], jobSkills = [] }) {
  const skill = scoreSkills(cvSkills, jobSkills);
  const level = skill.score >= 75 ? "High" : skill.score >= 50 ? "Medium" : "Low";

  const parts = [];
  if (skill.matched.length) parts.push(`matched: ${skill.matched.slice(0, 4).join(", ")}`);
  if (skill.missing.length) parts.push(`missing: ${skill.missing.slice(0, 4).join(", ")}`);

  return {
    matchScore:    skill.score,
    level,
    matchingSkills: skill.matched,
    partialSkills:  skill.partial,
    missingSkills:  skill.missing,
    explanation:   `${skill.score}% skill overlap — ${parts.join("; ") || "no overlap"}.`,
  };
}

module.exports = { scoreMatch, scoreSkillsOnly };
