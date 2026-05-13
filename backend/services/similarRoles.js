const STATUS_WEIGHTS = {
  Accepted: 1.3,
  "Under Review": 1.0,
  "Saved for Later": 0.8,
  Rejected: 0.4,
};

const TITLE_STOP_WORDS = new Set([
  "and", "or", "the", "a", "an", "of", "for", "in", "at", "to", "with",
  "jr", "sr", "ii", "iii", "lead", "senior", "junior", "associate",
]);

function tokenizeTitle(title = "") {
  return title
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2 && !TITLE_STOP_WORDS.has(t));
}

function buildSkillProfile(applications) {
  const freq = {};
  for (const app of applications) {
    const weight = STATUS_WEIGHTS[app.status] ?? 1.0;
    for (const skill of app.job?.skills || []) {
      const key = skill.toLowerCase();
      freq[key] = (freq[key] || 0) + weight;
    }
  }
  return freq;
}

function buildTitleProfile(applications) {
  const freq = {};
  for (const app of applications) {
    const weight = STATUS_WEIGHTS[app.status] ?? 1.0;
    for (const token of tokenizeTitle(app.job?.title)) {
      freq[token] = (freq[token] || 0) + weight;
    }
  }
  return freq;
}

function scoreJob(job, skillProfile, titleProfile) {
  const jobSkillsLower = (job.skills || []).map((s) => s.toLowerCase());
  const jobSkillsSet = new Set(jobSkillsLower);

  const topSkills = Object.entries(skillProfile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([s]) => s);

  if (topSkills.length === 0) return null;

  // Skill overlap (0–70 pts)
  const matchingSkills = topSkills.filter((s) => jobSkillsSet.has(s));
  const skillScore = Math.round((matchingSkills.length / topSkills.length) * 70);

  // Title similarity (0–20 pts)
  const jobTitleTokens = new Set(tokenizeTitle(job.title));
  const topTitleTokens = Object.entries(titleProfile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([t]) => t);
  const matchingTitleTokens = topTitleTokens.filter((t) => jobTitleTokens.has(t));
  const titleScore =
    topTitleTokens.length > 0
      ? Math.round((matchingTitleTokens.length / topTitleTokens.length) * 20)
      : 0;

  // Location/remote bonus (0–10 pts)
  const isRemote = (job.location || "").toLowerCase().includes("remote");
  const locationScore = isRemote ? 10 : 0;

  const matchScore = Math.min(skillScore + titleScore + locationScore, 100);
  if (matchScore === 0) return null;

  const whySimilar = [];

  if (matchingSkills.length > 0) {
    const displaySkills = matchingSkills.slice(0, 3).map(
      (s) => job.skills?.find((js) => js.toLowerCase() === s) || s
    );
    const extra = matchingSkills.length > 3 ? ` +${matchingSkills.length - 3} more` : "";
    whySimilar.push(
      `${matchingSkills.length} matching skill${matchingSkills.length > 1 ? "s" : ""}: ${displaySkills.join(", ")}${extra}`
    );
  }

  if (matchingTitleTokens.length > 0) {
    whySimilar.push(`Similar role type: ${matchingTitleTokens.join(", ")}`);
  }

  if (isRemote) {
    whySimilar.push("Remote-friendly role");
  }

  return { matchScore, whySimilar };
}

function findSimilarRoles(applications, candidates) {
  if (applications.length === 0 || candidates.length === 0) return [];

  const skillProfile = buildSkillProfile(applications);
  const titleProfile = buildTitleProfile(applications);

  if (Object.keys(skillProfile).length === 0) return [];

  const scored = [];
  for (const job of candidates) {
    const result = scoreJob(job, skillProfile, titleProfile);
    if (!result) continue;
    const jobObj = job.toObject ? job.toObject() : { ...job };
    scored.push({ ...jobObj, matchScore: result.matchScore, whySimilar: result.whySimilar });
  }

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 6);
}

module.exports = {
  STATUS_WEIGHTS,
  buildSkillProfile,
  buildTitleProfile,
  scoreJob,
  findSimilarRoles,
};
