const CV = require("../models/CV");
const Job = require("../models/Job");

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalize(value = "") {
  return value.toString().toLowerCase();
}

function getCvText(cv) {
  return normalize(
    [
      cv.title,
      cv.type,
      cv.summary,
      ...(cv.skills || []),
      ...(cv.projects || []),
      ...(cv.experience || []),
      ...(cv.education || []),
      ...(cv.certifications || []),
    ].join(" ")
  );
}

function scoreRuleMatch(cv, job) {
  const jobSkills = job.skills || [];
  const cvSkills = cv.skills || [];
  const cvSkillSet = cvSkills.map((skill) => normalize(skill));
  const matchedSkills = jobSkills.filter((skill) =>
    cvSkillSet.includes(normalize(skill))
  );

  const skillScore = jobSkills.length
    ? Math.round((matchedSkills.length / jobSkills.length) * 70)
    : 25;

  const cvText = getCvText(cv);
  const jobText = normalize(`${job.title || ""} ${job.description || ""}`);
  const roleBonus = normalize(cv.type || cv.title)
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .some((word) => jobText.includes(word))
    ? 18
    : 0;
  const summaryBonus = (cv.summary || "").trim() ? 8 : 0;
  const projectBonus = (cv.projects || []).some((project) =>
    normalize(project)
      .split(/\s+/)
      .some((word) => word.length > 4 && jobText.includes(word))
  )
    ? 4
    : 0;

  return {
    cv,
    matchScore: Math.min(96, skillScore + roleBonus + summaryBonus + projectBonus),
    reason: matchedSkills.length
      ? `Matches required skills: ${matchedSkills.join(", ")}`
      : "No direct skill overlap found; ranked by profile context.",
    matchedSkills,
    source: "rule",
  };
}

function buildRuleCvRankings(cvs, job) {
  return cvs
    .map((cv) => scoreRuleMatch(cv, job))
    .sort((a, b) => b.matchScore - a.matchScore);
}

function extractResponseText(responseBody) {
  if (typeof responseBody.output_text === "string") return responseBody.output_text;

  return (responseBody.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("");
}

function parseJsonObject(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw error;
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function normalizeAiRankings(aiPayload, cvs, fallbackRankings) {
  const aiRankings = Array.isArray(aiPayload?.rankings) ? aiPayload.rankings : [];

  return cvs
    .map((cv) => {
      const aiRanking = aiRankings.find((item) => item.cvId === cv._id.toString());
      const fallback = fallbackRankings.find(
        (item) => item.cv._id.toString() === cv._id.toString()
      );
      const score = Number(aiRanking?.matchScore ?? fallback?.matchScore ?? 0);

      return {
        cv,
        matchScore: Math.max(0, Math.min(100, Math.round(score))),
        reason: String(aiRanking?.reason || fallback?.reason || "Ranked by CV fit."),
        matchedSkills: Array.isArray(aiRanking?.matchedSkills)
          ? unique(aiRanking.matchedSkills.map(String)).slice(0, 8)
          : fallback?.matchedSkills || [],
        source: aiRanking ? "ai" : "rule",
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

async function rankCvsForJob({ jobId }) {
  const [job, cvs] = await Promise.all([Job.findById(jobId), CV.find()]);
  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  const fallbackRankings = buildRuleCvRankings(cvs, job);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || cvs.length === 0) {
    return {
      job,
      rankings: fallbackRankings,
      source: apiKey ? "rule" : "rule",
      message: apiKey ? "No CVs available" : "OPENAI_API_KEY is not configured",
    };
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        input: [
          {
            role: "system",
            content:
              "Rank saved CVs for a job posting. Return only valid JSON. Scores must be 0-100 and grounded in the CV/job text. Do not invent experience.",
          },
          {
            role: "user",
            content: JSON.stringify({
              job: {
                title: job.title,
                company: job.company,
                description: job.description,
                skills: job.skills,
                location: job.location,
              },
              cvs: cvs.map((cv) => ({
                cvId: cv._id.toString(),
                title: cv.title,
                type: cv.type,
                summary: cv.summary,
                skills: cv.skills,
                projects: cv.projects,
                experience: cv.experience,
                education: cv.education,
                certifications: cv.certifications,
              })),
              requiredShape: {
                rankings: [
                  {
                    cvId: "string",
                    matchScore: "0-100 integer",
                    reason: "short explanation",
                    matchedSkills: ["string"],
                  },
                ],
              },
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}`);
    }

    const parsed = parseJsonObject(extractResponseText(await response.json()));

    return {
      job,
      rankings: normalizeAiRankings(parsed, cvs, fallbackRankings),
      source: "ai",
      model,
    };
  } catch (error) {
    return {
      job,
      rankings: fallbackRankings,
      source: "rule",
      message: `AI fallback used: ${error.message}`,
    };
  }
}

module.exports = {
  rankCvsForJob,
};
