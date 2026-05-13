import { useState } from "react";
import {
  buildRoadmap,
  calculateFullMatch,
  getBestCv,
  getSuccessScore,
} from "../../services/careerService";
import { buildSkillGaps } from "../../utils/skillUtils";

export function useGrowthPlan({ selectedCv, jobs, recommendations, runAction, setStatus }) {
  const [roadmapIntent, setRoadmapIntent] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [bestCvResult, setBestCvResult] = useState(null);
  const [successScore, setSuccessScore] = useState(null);

  function analyzeGaps(selectedSkills = []) {
    const allJobs = [...jobs, ...recommendations].filter((job) => job?._id);
    const uniqueJobs = [...new Map(allJobs.map((job) => [job._id, job])).values()];
    const marketMissingSkills = buildSkillGaps(uniqueJobs, selectedCv?.skills).map(
      (gap) => gap.skill
    );
    const explicitSkills = Array.isArray(selectedSkills)
      ? selectedSkills.map((skill) => String(skill || "").trim()).filter(Boolean)
      : [];
    const missingSkills = explicitSkills.length
      ? explicitSkills
      : matchResult?.missingSkills?.length
      ? matchResult.missingSkills
      : marketMissingSkills;

    if (!selectedCv) {
      setStatus("Select a CV first");
      return;
    }
    if (!explicitSkills.length && !uniqueJobs.length) {
      setStatus("Load jobs before building a roadmap");
      return;
    }
    if (!missingSkills.length) {
      setStatus("No skill gaps found for this CV");
      return;
    }

    runAction("Building learning roadmap", async () => {
      await buildRoadmap({ missingSkills });
      const visibleMilestones = Math.min(missingSkills.length, 4);
      const visibleTasks = visibleMilestones * 4;
      setStatus(`Roadmap ready: ${visibleMilestones} skills, ${visibleTasks} tasks`);
    });
  }

  function findBestCv(jobId) {
    if (!jobId) {
      setStatus("Select a job first");
      return;
    }
    runAction("Finding best CV for selected job", async () => {
      const data = await getBestCv(jobId);
      setBestCvResult(data);
      setStatus("Best CV calculated");
    });
  }

  function runInsightMatch(cvId, jobId) {
    if (!cvId || !jobId) {
      setStatus("Select a CV and a job first");
      return;
    }
    runAction("Calculating match", async () => {
      const [matchData, scoreData] = await Promise.all([
        calculateFullMatch({ cvId, jobId }),
        getSuccessScore({ cvId, jobId }),
      ]);
      setMatchResult(matchData);
      setSuccessScore(scoreData);
      setStatus("Match ready");
    });
  }

  return {
    roadmapIntent,
    setRoadmapIntent,
    matchResult,
    bestCvResult,
    successScore,
    analyzeGaps,
    findBestCv,
    runInsightMatch,
  };
}
