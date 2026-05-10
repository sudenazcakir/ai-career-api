import { buildSkillGaps, categorizeSkill } from "./skillUtils";

export function getGapsForSource(source, { jobs, uniqueJobs, recommendations, selectedCv, targetJob, skillAnalytics }) {
  const cvSkills = selectedCv?.skills;
  switch (source) {
    case "market_trends": {
      if (skillAnalytics?.data?.length) {
        return skillAnalytics.data.map((item) => ({
          skill: item.skill,
          count: item.missingCount,
          cat: categorizeSkill(item.skill),
        }));
      }
      return buildSkillGaps(jobs.filter((j) => j?._id), cvSkills);
    }
    case "target_job": {
      if (!targetJob) return [];
      const cvSet = new Set((cvSkills || []).map((s) => s.toLowerCase()));
      return (targetJob.skills || [])
        .filter((s) => !cvSet.has(s.toLowerCase()))
        .map((skill) => ({ skill, count: 1, cat: categorizeSkill(skill) }));
    }
    case "similar_roles":
      return buildSkillGaps(recommendations.filter((r) => r?._id), cvSkills);
    case "cv_gaps":
    default:
      return buildSkillGaps(uniqueJobs, cvSkills);
  }
}
