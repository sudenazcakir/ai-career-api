// backend/services/cvAiVersioningService.js
const Job = require("../models/Job");

const MODES = ["ats_optimize", "role_tailor", "concise", "seniority_boost"];

const ACTION_VERBS = [
  "Led", "Built", "Delivered", "Architected", "Improved",
  "Drove", "Launched", "Designed", "Scaled", "Automated",
];

function hasActionVerb(item) {
  return ACTION_VERBS.some((v) => String(item).trimStart().startsWith(v));
}

function addActionVerb(item) {
  const rest = String(item).trimStart();
  if (hasActionVerb(rest)) return rest;
  const verb = ACTION_VERBS[rest.length % ACTION_VERBS.length];
  return `${verb} ${rest.charAt(0).toLowerCase()}${rest.slice(1)}`;
}

function scoreByJob(item, job) {
  if (!job) return 0;
  const haystack = `${job.title || ""} ${job.description || ""} ${(job.skills || []).join(" ")}`.toLowerCase();
  const words = String(item).toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  return words.filter((w) => haystack.includes(w)).length;
}

function nextVersionLabel(version = "v1") {
  const m = String(version || "").match(/v?(\d+)$/i);
  return `v${m ? Number(m[1]) + 1 : 2}`;
}

function buildRuleVersion(cv, job = null, mode) {
  if (!MODES.includes(mode)) throw new Error(`Unknown mode: ${mode}`);

  const changes = [];
  const warnings = [];

  let summary = cv.summary || "";
  let skills = [...(cv.skills || [])];
  let projects = [...(cv.projects || [])];
  let experience = [...(cv.experience || [])];
  const education = [...(cv.education || [])];
  const certifications = [...(cv.certifications || [])];

  if (mode === "ats_optimize") {
    const jobSkillSet = new Set((job?.skills || []).map((s) => s.toLowerCase()));
    const before = skills.join(",");
    skills = [
      ...skills.filter((s) => jobSkillSet.has(s.toLowerCase())),
      ...skills.filter((s) => !jobSkillSet.has(s.toLowerCase())),
    ];
    if (skills.join(",") !== before) {
      const moved = skills.filter((s) => jobSkillSet.has(s.toLowerCase())).length;
      changes.push({ field: "skills", type: "reordered", description: `Moved ${moved} job-matching skill${moved === 1 ? "" : "s"} to front` });
    }
    if (job?.title && !summary.toLowerCase().includes(job.title.toLowerCase())) {
      const oldSummary = summary;
      const suffix = `Targeting ${job.title}${job.company ? ` at ${job.company}` : ""}.`;
      summary = summary ? `${summary.trimEnd().replace(/\.$/, "")}. ${suffix}` : suffix;
      if (summary !== oldSummary) {
        changes.push({ field: "summary", type: "rewritten", description: "Added target role keyword to summary" });
      }
    }
  }

  if (mode === "role_tailor") {
    const beforeProj = [...projects];
    projects = [...projects].sort((a, b) => scoreByJob(b, job) - scoreByJob(a, job));
    if (JSON.stringify(beforeProj) !== JSON.stringify(projects)) {
      changes.push({ field: "projects", type: "reordered", description: "Prioritised projects most relevant to target role" });
    }
    const beforeExp = [...experience];
    experience = [...experience].sort((a, b) => scoreByJob(b, job) - scoreByJob(a, job));
    if (JSON.stringify(beforeExp) !== JSON.stringify(experience)) {
      changes.push({ field: "experience", type: "reordered", description: "Prioritised experience most relevant to target role" });
    }
  }

  if (mode === "concise") {
    const beforeProj = [...projects];
    projects = projects.slice(0, 4).map((p) => { const s = String(p); return s.length > 100 ? `${s.slice(0, 97)}…` : s; });
    if (JSON.stringify(beforeProj.slice(0, 4)) !== JSON.stringify(projects)) {
      changes.push({ field: "projects", type: "trimmed", description: `Capped at 4 items; long entries shortened to 100 chars` });
    }
    const beforeExp = [...experience];
    experience = experience.slice(0, 4).map((e) => { const s = String(e); return s.length > 100 ? `${s.slice(0, 97)}…` : s; });
    if (JSON.stringify(beforeExp.slice(0, 4)) !== JSON.stringify(experience)) {
      changes.push({ field: "experience", type: "trimmed", description: `Capped at 4 items; long entries shortened to 100 chars` });
    }
  }

  if (mode === "seniority_boost") {
    const beforeExp = [...experience];
    experience = experience.map(addActionVerb);
    const boostedExp = experience.filter((item, i) => item !== beforeExp[i]).length;
    if (boostedExp > 0) {
      changes.push({ field: "experience", type: "reworded", description: `Added strong action verb to ${boostedExp} experience item${boostedExp === 1 ? "" : "s"}` });
    }
    const beforeProj = [...projects];
    projects = projects.map(addActionVerb);
    const boostedProj = projects.filter((item, i) => item !== beforeProj[i]).length;
    if (boostedProj > 0) {
      changes.push({ field: "projects", type: "reworded", description: `Added strong action verb to ${boostedProj} project item${boostedProj === 1 ? "" : "s"}` });
    }
  }

  return {
    title: `${cv.title || "Untitled"} (AI — ${mode.replace(/_/g, " ")})`,
    type: cv.type || "General",
    version: nextVersionLabel(cv.version),
    summary,
    skills,
    projects,
    experience,
    education,
    certifications,
    changes,
    warnings,
    modelInfo: { source: "rule-based", mode },
  };
}

function extractResponseText(body) {
  if (typeof body.output_text === "string") return body.output_text;
  return (body.output || [])
    .flatMap((item) => item.content || [])
    .map((c) => c.text || "")
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
  } catch (err) {
    const s = cleaned.indexOf("{");
    const e = cleaned.lastIndexOf("}");
    if (s === -1 || e === -1 || e <= s) throw err;
    return JSON.parse(cleaned.slice(s, e + 1));
  }
}

function normalizeAiVersion(ai, fallback, model, mode) {
  return {
    title: String(ai?.title || fallback.title),
    type: fallback.type,
    version: fallback.version,
    summary: String(ai?.summary || fallback.summary),
    skills: Array.isArray(ai?.skills) ? ai.skills.map(String).slice(0, 20) : fallback.skills,
    projects: Array.isArray(ai?.projects) ? ai.projects.map(String).slice(0, 10) : fallback.projects,
    experience: Array.isArray(ai?.experience) ? ai.experience.map(String).slice(0, 10) : fallback.experience,
    education: Array.isArray(ai?.education) ? ai.education.map(String).slice(0, 6) : fallback.education,
    certifications: Array.isArray(ai?.certifications) ? ai.certifications.map(String).slice(0, 6) : fallback.certifications,
    changes: Array.isArray(ai?.changes) ? ai.changes : fallback.changes,
    warnings: Array.isArray(ai?.warnings) ? ai.warnings : [],
    modelInfo: { source: "ai-generated", model, mode },
  };
}

async function generateAiVersion({ cv, job, mode, instructions }) {
  const fallback = buildRuleVersion(cv, job, mode);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const modeDescriptions = {
    ats_optimize: "Move the most relevant skills to front, add job title keyword to summary, simplify bullet points for ATS keyword scanning. Do NOT invent any new skills.",
    role_tailor: "Prioritise projects and experience items most relevant to the target job. Rewrite summary to match the target role. Do NOT invent any new content.",
    concise: "Shorten all bullet points to under 100 characters. Cap projects and experience at 4 items each. Keep the most impactful items.",
    seniority_boost: "Rephrase experience and project bullets to start with strong action verbs (Led, Architected, Delivered, Scaled, Drove). Keep all existing content.",
  };

  const systemPrompt = `You are a professional CV editor applying the "${mode}" optimisation.
RULE: ${modeDescriptions[mode]}
STRICT CONSTRAINT: You MUST NOT invent, add, or fabricate any skills, projects, experience, education, or certifications that are not already present in the source CV. You may only rewrite, reprioritise, shorten, or rephrase existing content. If you wanted to add something but it was not in the CV, add it to warnings[].
Return ONLY valid JSON with this exact shape — no markdown, no prose:
{
  "title": "string",
  "summary": "string",
  "skills": ["string"],
  "projects": ["string"],
  "experience": ["string"],
  "education": ["string"],
  "certifications": ["string"],
  "changes": [{ "field": "string", "type": "reordered|rewritten|trimmed|reworded", "description": "string" }],
  "warnings": [{ "message": "string" }]
}`;

  const userContent = {
    mode,
    instructions: instructions || null,
    cv: {
      title: cv.title,
      summary: cv.summary,
      skills: cv.skills,
      projects: cv.projects,
      experience: cv.experience,
      education: cv.education,
      certifications: cv.certifications,
    },
    job: job
      ? {
          title: job.title,
          company: job.company,
          skills: job.skills,
          description: String(job.description || "").slice(0, 800),
        }
      : null,
  };

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
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userContent) },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI ${response.status}`);
    const body = await response.json();
    const parsed = parseJsonObject(extractResponseText(body));
    return normalizeAiVersion(parsed, fallback, model, mode);
  } catch (err) {
    return { ...fallback, modelInfo: { source: "rule-based-fallback", error: err.message, mode } };
  }
}

async function getJob(jobId) {
  if (!jobId) return null;
  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
  return Job.findById(jobId).catch(() => null);
}

module.exports = { MODES, buildRuleVersion, generateAiVersion, getJob };
