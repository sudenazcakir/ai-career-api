const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  STATUS_WEIGHTS,
  buildSkillProfile,
  scoreJob,
  findSimilarRoles,
} = require("../../services/similarRoles");

// ── helpers ───────────────────────────────────────────────────────────────────

function makeApp(title, skills, status) {
  return { job: { title, skills }, status };
}

function makeJob(id, title, skills, location = "") {
  return { _id: id, title, skills, location };
}

// ── buildSkillProfile ─────────────────────────────────────────────────────────

describe("buildSkillProfile", () => {
  it("weights Accepted apps 1.3×", () => {
    const apps = [makeApp("Engineer", ["React"], "Accepted")];
    const profile = buildSkillProfile(apps);
    assert.equal(profile["react"], STATUS_WEIGHTS.Accepted);
  });

  it("weights Rejected apps 0.4×", () => {
    const apps = [makeApp("Engineer", ["Vue"], "Rejected")];
    const profile = buildSkillProfile(apps);
    assert.equal(profile["vue"], STATUS_WEIGHTS.Rejected);
  });

  it("accumulates skills across multiple apps", () => {
    const apps = [
      makeApp("Dev", ["React", "Node"], "Under Review"),
      makeApp("Dev", ["React"], "Accepted"),
    ];
    const profile = buildSkillProfile(apps);
    assert.ok(profile["react"] > profile["node"]);
  });

  it("returns empty object when no applications", () => {
    assert.deepEqual(buildSkillProfile([]), {});
  });
});

// ── scoreJob ──────────────────────────────────────────────────────────────────

describe("scoreJob", () => {
  const skillProfile = { react: 2.3, node: 1.3, typescript: 1.0, python: 0.8, docker: 0.8 };
  const titleProfile = { software: 2.0, engineer: 2.0, frontend: 1.0 };

  it("returns null for a job with zero matching skills", () => {
    const job = makeJob("j1", "Data Analyst", ["SQL", "Tableau"]);
    assert.equal(scoreJob(job, skillProfile, titleProfile), null);
  });

  it("whySimilar is present and non-empty for every scored result", () => {
    const job = makeJob("j2", "Frontend Engineer", ["React", "TypeScript", "CSS"]);
    const result = scoreJob(job, skillProfile, titleProfile);
    assert.ok(result !== null);
    assert.ok(Array.isArray(result.whySimilar));
    assert.ok(result.whySimilar.length > 0);
  });

  it("includes skill count in whySimilar", () => {
    const job = makeJob("j3", "Node Engineer", ["React", "Node", "Docker"]);
    const result = scoreJob(job, skillProfile, titleProfile);
    assert.ok(result.whySimilar.some((r) => r.startsWith("3 matching skills:")));
  });

  it("includes role type hint when title tokens match", () => {
    const job = makeJob("j4", "Software Engineer", ["React"]);
    const result = scoreJob(job, skillProfile, titleProfile);
    assert.ok(result.whySimilar.some((r) => r.startsWith("Similar role type:")));
  });

  it("adds remote-friendly hint for remote jobs", () => {
    const job = makeJob("j5", "Developer", ["React"], "Remote");
    const result = scoreJob(job, skillProfile, titleProfile);
    assert.ok(result.whySimilar.some((r) => r === "Remote-friendly role"));
  });

  it("matchScore is higher for more overlapping skills", () => {
    const few = makeJob("jA", "Dev", ["React"]);
    const many = makeJob("jB", "Dev", ["React", "Node", "TypeScript", "Python", "Docker"]);
    const scoreFew  = scoreJob(few,  skillProfile, titleProfile).matchScore;
    const scoreMany = scoreJob(many, skillProfile, titleProfile).matchScore;
    assert.ok(scoreMany > scoreFew);
  });
});

// ── findSimilarRoles ──────────────────────────────────────────────────────────

describe("findSimilarRoles", () => {
  it("returns empty array when no applications", () => {
    const jobs = [makeJob("j1", "Dev", ["React"])];
    assert.deepEqual(findSimilarRoles([], jobs), []);
  });

  it("returns empty array when no candidate jobs", () => {
    const apps = [makeApp("Dev", ["React"], "Under Review")];
    assert.deepEqual(findSimilarRoles(apps, []), []);
  });

  it("excludes zero-score jobs", () => {
    const apps = [makeApp("Dev", ["React"], "Under Review")];
    const jobs = [makeJob("j1", "Chef", ["Cooking", "Baking"])];
    assert.deepEqual(findSimilarRoles(apps, jobs), []);
  });

  it("returns at most 6 results", () => {
    const apps = [makeApp("Engineer", ["React", "Node", "TypeScript"], "Accepted")];
    const jobs = Array.from({ length: 10 }, (_, i) =>
      makeJob(`j${i}`, `Engineer ${i}`, ["React", "Node"])
    );
    const results = findSimilarRoles(apps, jobs);
    assert.ok(results.length <= 6);
  });

  it("results are sorted by matchScore descending", () => {
    const apps = [makeApp("Dev", ["React", "Node", "TypeScript", "Docker"], "Accepted")];
    const jobs = [
      makeJob("jA", "Dev", ["React"]),
      makeJob("jB", "Dev", ["React", "Node", "TypeScript"]),
      makeJob("jC", "Dev", ["React", "Node"]),
    ];
    const results = findSimilarRoles(apps, jobs);
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i - 1].matchScore >= results[i].matchScore);
    }
  });

  it("every result has a non-empty whySimilar array", () => {
    const apps = [makeApp("Frontend Engineer", ["React", "TypeScript"], "Accepted")];
    const jobs = [makeJob("j1", "React Developer", ["React", "TypeScript"])];
    const results = findSimilarRoles(apps, jobs);
    for (const r of results) {
      assert.ok(Array.isArray(r.whySimilar) && r.whySimilar.length > 0,
        `whySimilar missing or empty for job ${r._id}`);
    }
  });
});
