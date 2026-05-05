const Job = require("../models/Job");

const TARGET_SKILLS = {
  Backend: ["Node", "Express", "Java", "SQL", "MongoDB", "REST APIs", "JWT"],
  Frontend: ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind", "UI"],
  "Data & AI": ["Python", "SQL", "Analytics", "Machine Learning", "Pandas"],
  "DevOps & Cloud": ["Docker", "CI/CD", "Linux", "Cloud", "Deployment"],
  Mobile: ["React Native", "Flutter", "Android", "iOS"],
  "QA & Automation": ["Testing", "Automation", "Postman", "Cypress", "Playwright"],
};

function inferTargetField(job = null, passport = {}) {
  const text = `${job?.title || ""} ${job?.description || ""} ${(job?.skills || []).join(
    " "
  )} ${passport.targetTitle || ""}`.toLowerCase();

  const scores = Object.entries(TARGET_SKILLS).map(([field, skills]) => ({
    field,
    score: skills.filter((skill) => text.includes(skill.toLowerCase())).length,
  }));

  const best = scores.sort((a, b) => b.score - a.score)[0];
  return best?.score ? best.field : "Backend";
}

function splitList(value = "") {
  return value
    .toString()
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function extractPassportSkills(passport = {}) {
  return unique([
    ...splitList(passport.skills),
    ...splitList(passport.tools),
    ...splitList(passport.languages),
  ]);
}

function pickRelevantSkills(passport = {}, targetField = "Backend", job = null) {
  const passportSkills = extractPassportSkills(passport);
  const targetSkills = TARGET_SKILLS[targetField] || [];
  const jobSkills = job?.skills || [];
  const lowerPassportSkills = passportSkills.map((skill) => skill.toLowerCase());

  const matchedJobSkills = jobSkills.filter((skill) =>
    lowerPassportSkills.includes(skill.toLowerCase())
  );

  return unique([
    ...matchedJobSkills,
    ...passportSkills.filter((skill) =>
      targetSkills.some((targetSkill) =>
        skill.toLowerCase().includes(targetSkill.toLowerCase())
      )
    ),
    ...passportSkills.slice(0, 8),
  ]).slice(0, 14);
}

function buildRuleCvDraft({ passport = {}, targetField = "Backend", job = null }) {
  const skills = pickRelevantSkills(passport, targetField, job);
  const targetTitle = job?.title || passport.targetTitle || targetField;
  const company = job?.company || "";

  return {
    title: `${targetField} CV${job?.title ? ` - ${job.title}` : ""}`,
    type: targetField,
    summary:
      passport.summary ||
      `Career profile tailored for ${targetTitle}${company ? ` at ${company}` : ""}.`,
    skills,
    projects: splitList(passport.projects).slice(0, 4),
    experience: splitList(passport.experience).slice(0, 4),
    education: unique([
      passport.school,
      passport.department,
      passport.graduationYear && `Graduation: ${passport.graduationYear}`,
      passport.gpa && `GPA: ${passport.gpa}`,
    ]),
    certifications: splitList(passport.certificates).slice(0, 4),
    source: "rule-generated",
    targetJobTitle: job?.title || "",
    targetCompany: company,
  };
}

function extractResponseText(responseBody) {
  if (typeof responseBody.output_text === "string") {
    return responseBody.output_text;
  }

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

function normalizeCvDraft(aiDraft, fallbackDraft) {
  return {
    title: String(aiDraft?.title || fallbackDraft.title),
    type: String(aiDraft?.type || fallbackDraft.type),
    summary: String(aiDraft?.summary || fallbackDraft.summary),
    skills: Array.isArray(aiDraft?.skills)
      ? unique(aiDraft.skills.map(String)).slice(0, 14)
      : fallbackDraft.skills,
    projects: Array.isArray(aiDraft?.projects)
      ? aiDraft.projects.map(String).slice(0, 5)
      : fallbackDraft.projects,
    experience: Array.isArray(aiDraft?.experience)
      ? aiDraft.experience.map(String).slice(0, 5)
      : fallbackDraft.experience,
    education: Array.isArray(aiDraft?.education)
      ? aiDraft.education.map(String).slice(0, 4)
      : fallbackDraft.education,
    certifications: Array.isArray(aiDraft?.certifications)
      ? aiDraft.certifications.map(String).slice(0, 5)
      : fallbackDraft.certifications,
    source: "ai-generated",
    targetJobTitle: fallbackDraft.targetJobTitle,
    targetCompany: fallbackDraft.targetCompany,
  };
}

async function getJob(jobId) {
  if (!jobId) return null;
  return Job.findById(jobId).catch(() => null);
}

async function generateCvDraft({ passport = {}, targetField = "Backend", jobId }) {
  const job = await getJob(jobId);
  const resolvedTargetField =
    targetField === "Auto" ? inferTargetField(job, passport) : targetField;
  const fallbackDraft = buildRuleCvDraft({
    passport,
    targetField: resolvedTargetField,
    job,
  });
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      ...fallbackDraft,
      message: "OPENAI_API_KEY is not configured. Rule-based CV draft returned.",
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
        temperature: 0.15,
        input: [
          {
            role: "system",
            content:
              "You generate concise, truthful, job-tailored CV drafts from a user's Career Passport and a target job. Return only valid JSON. Do not invent skills or experience not supported by the passport.",
          },
          {
            role: "user",
            content: JSON.stringify({
              targetField: resolvedTargetField,
              job: job
                ? {
                    title: job.title,
                    company: job.company,
                    description: job.description,
                    skills: job.skills,
                    location: job.location,
                  }
                : null,
              passport,
              requiredShape: {
                title: "string",
                type: "string",
                summary: "2-3 sentence string",
                skills: ["string"],
                projects: ["achievement-oriented bullet strings"],
                experience: ["achievement-oriented bullet strings"],
                education: ["string"],
                certifications: ["string"],
              },
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}`);
    }

    const responseBody = await response.json();
    const parsed = parseJsonObject(extractResponseText(responseBody));

    return {
      ...normalizeCvDraft(parsed, fallbackDraft),
      model,
    };
  } catch (error) {
    return {
      ...fallbackDraft,
      message: `AI fallback used: ${error.message}`,
    };
  }
}

module.exports = {
  generateCvDraft,
};
