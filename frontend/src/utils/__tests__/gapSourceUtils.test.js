import { describe, it, expect } from "vitest";
import { getGapsForSource } from "../gapSourceUtils";

const makeJob = (id, skills) => ({ _id: id, skills });

describe("getGapsForSource", () => {
  const selectedCv = { skills: ["React", "Node.js"] };
  const jobs = [
    makeJob("j1", ["React", "Docker", "Kubernetes"]),
    makeJob("j2", ["Docker", "TypeScript"]),
  ];
  const recommendations = [makeJob("r1", ["AWS", "Docker"])];
  const uniqueJobs = jobs;
  const baseCtx = {
    jobs,
    uniqueJobs,
    recommendations,
    selectedCv,
    targetJob: null,
    skillAnalytics: null,
  };

  it("cv_gaps: returns skills from uniqueJobs missing in selectedCv", () => {
    const result = getGapsForSource("cv_gaps", baseCtx);
    const skills = result.map((r) => r.skill);
    expect(skills).toContain("Docker");
    expect(skills).toContain("Kubernetes");
    expect(skills).toContain("TypeScript");
    expect(skills).not.toContain("React");
    expect(skills).not.toContain("Node.js");
  });

  it("market_trends: uses skillAnalytics.data when provided", () => {
    const ctx = {
      ...baseCtx,
      skillAnalytics: {
        data: [
          { skill: "Kafka", missingCount: 8 },
          { skill: "Redis", missingCount: 5 },
        ],
      },
    };
    const result = getGapsForSource("market_trends", ctx);
    expect(result[0].skill).toBe("Kafka");
    expect(result[0].count).toBe(8);
    expect(result[1].skill).toBe("Redis");
    expect(result[1].count).toBe(5);
  });

  it("market_trends: falls back to jobs list when skillAnalytics is null", () => {
    const result = getGapsForSource("market_trends", baseCtx);
    const skills = result.map((r) => r.skill);
    expect(skills).toContain("Docker");
    expect(skills).not.toContain("React");
  });

  it("market_trends: falls back when skillAnalytics.data is empty array", () => {
    const ctx = { ...baseCtx, skillAnalytics: { data: [] } };
    const result = getGapsForSource("market_trends", ctx);
    const skills = result.map((r) => r.skill);
    expect(skills).toContain("Docker");
  });

  it("market_trends and cv_gaps: return different results when skillAnalytics present", () => {
    const ctx = {
      ...baseCtx,
      skillAnalytics: { data: [{ skill: "Kafka", missingCount: 9 }] },
    };
    const marketResult = getGapsForSource("market_trends", ctx);
    const cvResult = getGapsForSource("cv_gaps", ctx);
    expect(marketResult[0].skill).toBe("Kafka");
    expect(cvResult[0].skill).not.toBe("Kafka");
  });

  it("target_job: returns empty when targetJob is null", () => {
    expect(getGapsForSource("target_job", baseCtx)).toEqual([]);
  });

  it("target_job: returns job skills not present in cv", () => {
    const ctx = {
      ...baseCtx,
      targetJob: makeJob("t1", ["React", "GraphQL", "PostgreSQL"]),
    };
    const result = getGapsForSource("target_job", ctx);
    const skills = result.map((r) => r.skill);
    expect(skills).toContain("GraphQL");
    expect(skills).toContain("PostgreSQL");
    expect(skills).not.toContain("React");
  });

  it("similar_roles: returns skills from recommendations missing in cv", () => {
    const result = getGapsForSource("similar_roles", baseCtx);
    const skills = result.map((r) => r.skill);
    expect(skills).toContain("AWS");
    expect(skills).toContain("Docker");
    expect(skills).not.toContain("Node.js");
  });
});
