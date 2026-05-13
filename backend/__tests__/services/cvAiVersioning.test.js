// backend/__tests__/services/cvAiVersioning.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { buildRuleVersion, MODES } = require("../../services/cvAiVersioningService");

const baseCv = {
  title: "Backend CV",
  type: "Backend",
  version: "v2",
  summary: "Experienced backend engineer.",
  skills: ["Node", "Python", "React", "Docker"],
  projects: [
    "Built an API gateway for 1M requests/day that reduced latency by 40%",
    "Created a reporting dashboard that improved data visibility for 5 teams",
  ],
  experience: [
    "Managed a team of 3 engineers and delivered 2 major product launches",
    "Implemented REST API endpoints using Express and MongoDB for SaaS platform",
  ],
  education: ["B.Sc. Computer Science — Istanbul University, 2022"],
  certifications: ["AWS Certified Developer"],
};

const jobWithNodeSkills = {
  title: "Senior Node.js Developer",
  company: "Acme",
  skills: ["Node", "Docker"],
  description: "Looking for an experienced Node.js developer.",
};

describe("buildRuleVersion", () => {
  it("MODES exports the four expected mode strings", () => {
    assert.deepStrictEqual(MODES, ["ats_optimize", "role_tailor", "concise", "seniority_boost"]);
  });

  it("ats_optimize: moves job-matching skills to front", () => {
    const result = buildRuleVersion(baseCv, jobWithNodeSkills, "ats_optimize");
    assert.strictEqual(result.skills[0], "Node", "Node should be first");
    assert.strictEqual(result.skills[1], "Docker", "Docker should be second");
    const skillChange = result.changes.find((c) => c.field === "skills");
    assert.ok(skillChange, "should have a skills change entry");
    assert.strictEqual(skillChange.type, "reordered");
  });

  it("ats_optimize: appends target role to summary when not already present", () => {
    const result = buildRuleVersion(baseCv, jobWithNodeSkills, "ats_optimize");
    assert.ok(result.summary.includes("Senior Node.js Developer"), "summary should mention job title");
    const summaryChange = result.changes.find((c) => c.field === "summary");
    assert.ok(summaryChange, "should have a summary change entry");
  });

  it("role_tailor: sorts experience by job keyword relevance", () => {
    const jobWithExpressKeywords = {
      title: "Senior Node.js Developer",
      company: "Acme",
      skills: ["Node", "Docker", "Express", "MongoDB"],
      description: "Looking for a developer with REST API endpoints using Express and MongoDB for SaaS platform.",
    };
    const result = buildRuleVersion(baseCv, jobWithExpressKeywords, "role_tailor");
    assert.ok(result.experience[0].includes("REST API"), "most relevant experience should come first");
  });

  it("concise: caps projects and experience at 4 and trims long items", () => {
    const longCv = {
      ...baseCv,
      projects: Array.from({ length: 6 }, (_, i) => `Project ${i + 1} — ${"x".repeat(120)}`),
      experience: Array.from({ length: 5 }, (_, i) => `Experience ${i + 1} — ${"y".repeat(110)}`),
    };
    const result = buildRuleVersion(longCv, null, "concise");
    assert.strictEqual(result.projects.length, 4, "should cap at 4 projects");
    assert.ok(result.projects.every((p) => p.length <= 101), "items should be shortened");
    assert.strictEqual(result.experience.length, 4, "should cap at 4 experience items");
  });

  it("seniority_boost: adds action verbs to items that lack them", () => {
    const result = buildRuleVersion(baseCv, null, "seniority_boost");
    const ACTION_VERBS = ["Led","Built","Delivered","Architected","Improved","Drove","Launched","Designed","Scaled","Automated"];
    result.experience.forEach((item) => {
      const startsWithVerb = ACTION_VERBS.some((v) => item.startsWith(v));
      assert.ok(startsWithVerb, `"${item.slice(0, 40)}…" should start with an action verb`);
    });
    const expChange = result.changes.find((c) => c.field === "experience" && c.type === "reworded");
    assert.ok(expChange, "should have an experience reworded change entry");
  });

  it("buildRuleVersion always returns empty warnings[] for rule-based output", () => {
    MODES.forEach((mode) => {
      const result = buildRuleVersion(baseCv, null, mode);
      assert.ok(Array.isArray(result.warnings), "warnings should be an array");
      assert.strictEqual(result.warnings.length, 0, `warnings should be empty for mode: ${mode}`);
    });
  });

  it("throws for an unknown mode", () => {
    assert.throws(() => buildRuleVersion(baseCv, null, "invalid_mode"), /Unknown mode/);
  });
});
