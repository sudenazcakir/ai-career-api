# Phase 3 — AI-Powered CV Versioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI-assisted CV versioning flow: the user selects a mode (ATS optimise / role tailor / concise / seniority boost), optionally picks a target job, AI rewrites only existing content (never invents), user reviews before/after diff, then saves as a new CV version.

**Architecture:** A new backend service `cvAiVersioningService.js` provides `buildRuleVersion` (4-mode rule-based transform, always available) and `generateAiVersion` (OpenAI-gated, falls back to rule-based). A new endpoint `POST /api/cvs/:id/ai-version` runs the transform and returns `{ proposedCv, changes[], warnings[], modelInfo }` without saving — the user reviews the diff in `CvAiVersionModal`, then clicks "Save as new version" which reuses the existing `POST /api/cvs/:id/version` endpoint. New UI components `CvDiffPanel` and `CvAiVersionModal` are added under `frontend/src/components/cv/`.

**Tech Stack:** Node.js/Express, Mongoose, OpenAI API (`/v1/responses`, gated by `OPENAI_API_KEY`), React 19, Tailwind 4, `ui.js` design tokens, `createPortal` for modals, `node:test` for backend unit tests.

---

## Codebase Context

**Existing patterns to follow:**

- Backend auth: every route is under `authMiddleware`, `req.user._id` is the owner. CV ownership check: `CV.findOne({ _id: id, owner: req.user._id })` → 404 if null.
- DB readiness: check `CV.db.readyState !== 1` at route top → 503.
- ObjectId validation: `mongoose.Types.ObjectId.isValid(id)` → 400 if false.
- AI pattern in `backend/services/cvGeneratorService.js`: calls `https://api.openai.com/v1/responses` with `gpt-4.1-mini`, returns rule-based fallback when `OPENAI_API_KEY` is unset.
- Frontend service calls: `import { apiRequest } from "./api"` in `careerService.js`. `apiRequest` sets `Authorization: Bearer <token>` header automatically.
- Hook pattern: feature hooks in `frontend/src/features/<domain>/use*.js`. They receive `{ runAction, setStatus }` from parent and call them for async operations.
- Modal pattern: `createPortal(…, document.body)` with `onMouseDown` backdrop-close and `stopPropagation` on inner panel. See `CvUploadReview.jsx`.
- Design tokens: import `{ ui }` from `../../styles/ui`. Never add one-off Tailwind classes outside `ui.js`.

**CV model fields:** `{ owner, parentCv, title, type, version, summary, skills[], projects[], experience[], education[], certifications[] }`

**`POST /api/cvs/:id/version` endpoint** (existing, reused for saving): accepts optional body overrides (`title`, `summary`, `skills`, `projects`, `experience`, `education`, `certifications`, `version`). Sets `parentCv: source.parentCv || source._id`. Auto-increments version if not supplied.

**`careerService.js` `createCvVersion(cvId, payload)`** calls `POST /api/cvs/:id/version`. Already exported. The modal save step will use this directly with the proposed overrides.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/services/cvAiVersioningService.js` | **Create** | `buildRuleVersion(cv, job, mode)` + `generateAiVersion(...)` |
| `backend/__tests__/services/cvAiVersioning.test.js` | **Create** | Unit tests for `buildRuleVersion` |
| `backend/routes/cvRoutes.js` | **Modify** | Add `POST /:id/ai-version` endpoint (lines after `/upload`) |
| `frontend/src/services/careerService.js` | **Modify** | Add `generateAiVersion(cvId, payload)` |
| `frontend/src/components/cv/CvDiffPanel.jsx` | **Create** | Renders `changes[]` + `warnings[]` with semantic markup |
| `frontend/src/components/cv/CvAiVersionModal.jsx` | **Create** | Multi-step modal: configure → generate → review diff → save |
| `frontend/src/pages/MyCvsPage.jsx` | **Modify** | Add "AI Version" button on card, render modal, add `jobs`/`compareSelectedCvs` props |
| `frontend/src/App.jsx` | **Modify** | Add `jobs={jobs.jobs}` prop to MyCvsPage route element |

---

## Tasks

### Task 1: `backend/services/cvAiVersioningService.js` — rule-based engine

**Files:**
- Create: `backend/services/cvAiVersioningService.js`

- [ ] Create the file with the full rule-based implementation:

```js
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
  if (hasActionVerb(item)) return item;
  const verb = ACTION_VERBS[item.length % ACTION_VERBS.length];
  const rest = String(item).trimStart();
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
    // Move job-matching skills to front
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
    // Append target role to summary if not already mentioned
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
    const beforeProj = projects.map((p) => p);
    projects = projects.slice(0, 4).map((p) => (p.length > 100 ? `${p.slice(0, 97)}…` : p));
    if (JSON.stringify(beforeProj.slice(0, 4)) !== JSON.stringify(projects)) {
      changes.push({ field: "projects", type: "trimmed", description: `Capped at 4 items; long entries shortened to 100 chars` });
    }
    const beforeExp = experience.map((e) => e);
    experience = experience.slice(0, 4).map((e) => (e.length > 100 ? `${e.slice(0, 97)}…` : e));
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
    title: `${cv.title} (AI — ${mode.replace(/_/g, " ")})`,
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

// Placeholder; replaced in Task 3
async function generateAiVersion({ cv, job, mode, instructions }) {
  return buildRuleVersion(cv, job, mode);
}

async function getJob(jobId) {
  if (!jobId) return null;
  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
  return Job.findById(jobId).catch(() => null);
}

module.exports = { MODES, buildRuleVersion, generateAiVersion, getJob };
```

---

### Task 2: Backend unit tests for `buildRuleVersion`

**Files:**
- Create: `backend/__tests__/services/cvAiVersioning.test.js`

- [ ] Create the test file:

```js
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
  projects: ["Built an API gateway for 1M requests/day that reduced latency by 40%", "Created a reporting dashboard that improved data visibility for 5 teams"],
  experience: ["Managed a team of 3 engineers and delivered 2 major product launches", "Implemented REST API endpoints using Express and MongoDB for SaaS platform"],
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
    // The first experience item mentions 'Managed a team' — no job keywords
    // The second mentions 'REST API' + 'Express' + 'MongoDB' — matches Node.js job description
    const result = buildRuleVersion(baseCv, jobWithNodeSkills, "role_tailor");
    // Item with 'API', 'Express', 'MongoDB' keywords should score higher
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
      assert.ok(startsWithVerb, `"${item.slice(0, 30)}…" should start with an action verb`);
    });
    const expChange = result.changes.find((c) => c.field === "experience" && c.type === "reworded");
    assert.ok(expChange, "should have an experience reworded change entry");
  });

  it("buildRuleVersion always returns empty warnings[] array for rule-based output", () => {
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
```

- [ ] Run the tests to verify they pass:

```
node --test backend/__tests__/services/cvAiVersioning.test.js
```

Expected: 7 tests pass, 0 failures.

---

### Task 3: `POST /api/cvs/:id/ai-version` endpoint

**Files:**
- Modify: `backend/routes/cvRoutes.js` (add before `router.use(` error-handler at the end)

- [ ] Add the endpoint. Paste this block immediately before the `router.use((err,` error-handler line (the last `router.use` at the bottom of the file):

```js
router.post("/:id/ai-version", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid CV id" });
    }

    const { MODES, generateAiVersion, getJob } = require("../services/cvAiVersioningService");
    const { mode, targetJobId, instructions } = req.body;

    if (!mode || !MODES.includes(mode)) {
      return res.status(400).json({ error: `mode must be one of: ${MODES.join(", ")}` });
    }

    const source = await CV.findOne({ _id: id, owner: req.user._id });
    if (!source) {
      return res.status(404).json({ error: "CV not found" });
    }

    const job = await getJob(targetJobId || null);
    const proposedCv = await generateAiVersion({
      cv: source.toObject(),
      job,
      mode,
      instructions: typeof instructions === "string" ? instructions.slice(0, 500) : undefined,
    });

    res.json({
      success: true,
      data: {
        proposedCv,
        changes: proposedCv.changes,
        warnings: proposedCv.warnings,
        modelInfo: proposedCv.modelInfo,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] Manually test the endpoint with curl (server must be running on port 5001):

```bash
# Get a valid CV id and token first, then:
curl -X POST http://localhost:5001/api/cvs/<CV_ID>/ai-version \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"mode":"ats_optimize"}'
```

Expected: `{ success: true, data: { proposedCv: {...}, changes: [...], warnings: [], modelInfo: { source: "rule-based", mode: "ats_optimize" } } }`

---

### Task 4: AI layer in `cvAiVersioningService.js`

**Files:**
- Modify: `backend/services/cvAiVersioningService.js`

Replace the placeholder `generateAiVersion` function with the real implementation. The helpers `extractResponseText` and `parseJsonObject` are copied from `cvGeneratorService.js` (same API, same pattern).

- [ ] Replace the `// Placeholder; replaced in Task 3` comment and the placeholder `generateAiVersion` function with this:

```js
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
```

- [ ] Re-run the unit tests to confirm they still pass (they test `buildRuleVersion`, not `generateAiVersion`, so they should be unaffected):

```
node --test backend/__tests__/services/cvAiVersioning.test.js
```

---

### Task 5: Frontend service function

**Files:**
- Modify: `frontend/src/services/careerService.js`

- [ ] Add `generateAiVersion` export after the existing `createCvVersion` function:

```js
export function generateAiVersion(cvId, payload) {
  return apiRequest(`/api/cvs/${cvId}/ai-version`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
```

---

### Task 6: `CvDiffPanel.jsx`

**Files:**
- Create: `frontend/src/components/cv/CvDiffPanel.jsx`

- [ ] Create the file:

```jsx
import { ui } from "../../styles/ui";

const TYPE_LABELS = {
  reordered: "Reordered",
  rewritten: "Rewritten",
  trimmed: "Trimmed",
  reworded: "Reworded",
};

const FIELD_LABELS = {
  skills: "Skills",
  summary: "Summary",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
};

export function CvDiffPanel({ changes = [], warnings = [], modelInfo }) {
  if (!changes.length && !warnings.length) return null;

  return (
    <div className="grid gap-3">
      {changes.length > 0 && (
        <div className="rounded-[10px] border border-[#E8E3D7] bg-[#FBFAF6] p-4">
          <p className={ui.eyebrow}>Changes applied</p>
          <ul className="mt-2 grid gap-2" aria-label="List of changes applied to CV">
            {changes.map((change, i) => (
              <li key={i} className="flex min-w-0 items-start gap-2.5">
                <span
                  className="mt-0.5 shrink-0 rounded-[4px] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.07em]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: "var(--c-cobalt-50, #E6EBFF)",
                    color: "var(--c-cobalt, #1E3FFF)",
                  }}
                  aria-label={`Change type: ${TYPE_LABELS[change.type] || change.type}`}
                >
                  {TYPE_LABELS[change.type] || change.type}
                </span>
                <span className="min-w-0 text-[13px] text-[#3A3A40]">
                  <span className="font-medium text-[#0E0E10]">
                    {FIELD_LABELS[change.field] || change.field}
                    {" — "}
                  </span>
                  {change.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div
          className="rounded-[10px] border border-[#E8E3D7] bg-[#FEF9E7] p-4"
          role="alert"
          aria-label="AI version warnings"
        >
          <p
            className="mb-2 text-[11px] font-[500] uppercase tracking-[0.08em]"
            style={{ fontFamily: "var(--font-mono)", color: "#B45309" }}
          >
            Warnings
          </p>
          <ul className="grid gap-1.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-[13px] leading-relaxed text-[#92400E]">
                · {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {modelInfo && (
        <p
          className="text-right text-[11px] text-[#A4A4AC]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {modelInfo.source === "ai-generated"
            ? `Generated by ${modelInfo.model}`
            : modelInfo.source === "rule-based-fallback"
            ? "AI unavailable — rule-based result"
            : "Rule-based result"}
        </p>
      )}
    </div>
  );
}
```

---

### Task 7: `CvAiVersionModal.jsx`

**Files:**
- Create: `frontend/src/components/cv/CvAiVersionModal.jsx`

- [ ] Create the file:

```jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiZap } from "react-icons/fi";
import { ui } from "../../styles/ui";
import { generateAiVersion } from "../../services/careerService";
import { CvDiffPanel } from "./CvDiffPanel";

const MODES = [
  {
    id: "ats_optimize",
    label: "ATS Optimise",
    description: "Move matching skills to front, add job title keyword to summary.",
  },
  {
    id: "role_tailor",
    label: "Role Tailor",
    description: "Prioritise content most relevant to the target job.",
  },
  {
    id: "concise",
    label: "Concise",
    description: "Shorten bullets to 100 chars, cap experience and projects at 4 items.",
  },
  {
    id: "seniority_boost",
    label: "Seniority Boost",
    description: "Add strong action verbs (Led, Delivered, Scaled) to experience bullets.",
  },
];

export function CvAiVersionModal({ sourceCv, jobs = [], onSave, onClose }) {
  const [mode, setMode] = useState("ats_optimize");
  const [targetJobId, setTargetJobId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [state, setState] = useState("configure"); // configure | generating | review
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    setState("generating");
    setError(null);
    try {
      const data = await generateAiVersion(sourceCv._id, {
        mode,
        targetJobId: targetJobId || undefined,
        instructions: instructions.trim() || undefined,
      });
      setResult(data.data);
      setState("review");
    } catch (err) {
      setError(err.message || "Generation failed");
      setState("configure");
    }
  }

  function handleSave() {
    if (!result?.proposedCv) return;
    const { proposedCv } = result;
    onSave(sourceCv._id, {
      title: proposedCv.title,
      summary: proposedCv.summary,
      skills: proposedCv.skills,
      projects: proposedCv.projects,
      experience: proposedCv.experience,
      education: proposedCv.education,
      certifications: proposedCv.certifications,
    });
    onClose();
  }

  function handleBack() {
    setState("configure");
    setResult(null);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={ui.modalBackdrop}
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-label="Create AI-assisted CV version"
        aria-modal="true"
        className={`${ui.modalWindow} max-w-[600px]`}
        role="dialog"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        {/* Header */}
        <div className={ui.modalHead}>
          <div>
            <p className={ui.eyebrow}>CV Versioning · AI</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              {state === "review" ? "Review AI version" : "Create AI version"}
            </h2>
            <p className={`${ui.muted} mt-1`}>
              {state === "review"
                ? "AI rewrote your CV based on the selected mode. Review changes before saving."
                : `Source: ${sourceCv.title} (${sourceCv.version || "v1"})`}
            </p>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[#6B6B72] transition-colors hover:bg-[#F6F3EC] hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF]"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Configure step */}
        {state !== "review" && (
          <div className={`${ui.formStack} overflow-y-auto max-h-[55vh] pr-1`}>
            {/* Mode selector */}
            <fieldset>
              <legend className={ui.label} style={{ display: "block" }}>
                Optimisation mode
              </legend>
              <div className="mt-2 grid gap-2">
                {MODES.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 transition-colors ${
                      mode === m.id
                        ? "border-[#0E0E10] bg-[#F6F3EC]"
                        : "border-[#E8E3D7] bg-[#FBFAF6] hover:border-[#A4A4AC]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="ai-mode"
                      value={m.id}
                      checked={mode === m.id}
                      onChange={() => setMode(m.id)}
                      className="mt-0.5 shrink-0 accent-[#0E0E10]"
                    />
                    <div>
                      <p className="text-[13px] font-semibold text-[#0E0E10]">{m.label}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B6B72]">{m.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Target job */}
            <label className={ui.label}>
              Target job (optional)
              <select
                className={ui.input}
                value={targetJobId}
                onChange={(e) => setTargetJobId(e.target.value)}
              >
                <option value="">No specific job</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} — {job.company}
                  </option>
                ))}
              </select>
            </label>

            {/* Instructions */}
            <label className={`${ui.label} flex flex-col`}>
              Additional instructions (optional)
              <textarea
                className={`${ui.input} !h-auto min-h-[60px] resize-none py-2 leading-relaxed`}
                rows={3}
                maxLength={500}
                placeholder="e.g. Focus on team leadership experience. Remove certifications."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </label>

            {error && (
              <p className={ui.fieldError} role="alert">{error}</p>
            )}
          </div>
        )}

        {/* Review step */}
        {state === "review" && result && (
          <div className="overflow-y-auto max-h-[55vh] pr-1">
            <div className="mb-3 rounded-[10px] border border-[#E8E3D7] bg-[#F6F3EC] p-4">
              <p className={ui.eyebrow}>Proposed title</p>
              <p className="text-[15px] font-semibold text-[#0E0E10]">{result.proposedCv.title}</p>
            </div>
            <CvDiffPanel
              changes={result.changes}
              warnings={result.warnings}
              modelInfo={result.modelInfo}
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex gap-2 border-t border-[#E8E3D7] pt-4">
          {state === "configure" && (
            <>
              <button
                type="button"
                className={ui.button}
                disabled={state === "generating"}
                onClick={handleGenerate}
              >
                <FiZap size={14} strokeWidth={1.5} />
                Generate
              </button>
              <button type="button" className={ui.buttonGhost} onClick={onClose}>
                Cancel
              </button>
            </>
          )}
          {state === "generating" && (
            <button type="button" className={ui.button} disabled>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-[#F6F3EC] border-t-transparent"
                aria-label="Generating"
              />
              Generating…
            </button>
          )}
          {state === "review" && (
            <>
              <button type="button" className={ui.button} onClick={handleSave}>
                Save as new version
              </button>
              <button type="button" className={ui.buttonSecondary} onClick={handleBack}>
                Back
              </button>
              <button type="button" className={ui.buttonGhost} onClick={onClose}>
                Discard
              </button>
            </>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
```

---

### Task 8: Wire `CvAiVersionModal` into `MyCvsPage` and `App.jsx`

**Files:**
- Modify: `frontend/src/pages/MyCvsPage.jsx`
- Modify: `frontend/src/App.jsx`

#### 8a — Add `jobs` prop and `aiVersionCv` state to `MyCvsPage`

- [ ] At the top of `MyCvsPage.jsx`, add `CvAiVersionModal` to the import block:

```js
import { CvAiVersionModal } from "../components/cv/CvAiVersionModal";
```

- [ ] Add `jobs` and `onAiVersionSave` to the destructured props at the top of `MyCvsPage`:

The current prop list starts with:
```js
export default function MyCvsPage({
  clearEditMode,
  compareCvId,
  ...
```

Add `jobs = []` and `onAiVersionSave` to the props list (keep alphabetical order):

```js
export default function MyCvsPage({
  clearEditMode,
  compareCvId,
  compareSelectedCvs,
  createSelectedCvVersion,
  cvComparison,
  cvForm,
  cvs,
  deleteCv,
  editingCvId,
  generateCvFromPassport,
  isBusy,
  jobs,
  loadCvIntoForm,
  onAiVersionSave,
  onUploadSave,
  passport,
  saveCv,
  selectedCv,
  selectedCvId,
  setCompareCvId,
  setCvForm,
  setSelectedCvId,
}) {
```

- [ ] Add `aiVersionCv` state alongside `previewCv` state (around line 38):

```js
const [aiVersionCv, setAiVersionCv] = useState(null);
```

#### 8b — Add "AI Version" button to each CV card action row

- [ ] Find the action row inside the CV library `{cvs.map((cv) => { ... })}` loop. It currently has "Preview", "Edit", "Delete" buttons. Add the "AI Version" button after "Preview":

```jsx
<button
  type="button"
  disabled={isBusy}
  onClick={() => setAiVersionCv(cv)}
  className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#E8E3D7] bg-transparent px-2.5 text-[11px] font-medium text-[#3A3A40] transition-colors hover:border-[#A4A4AC] hover:text-[#0E0E10] disabled:opacity-50"
  aria-label={`Create AI version of ${cv.title}`}
>
  <FiZap size={11} strokeWidth={1.5} />
  AI Version
</button>
```

`FiZap` is already imported (used in "Generate from Passport" button).

#### 8c — Render `CvAiVersionModal` at the bottom of the return

- [ ] Add the modal render immediately after the existing `{previewCv && ... createPortal(...)}` block, before the closing `</div>`:

```jsx
{aiVersionCv && (
  <CvAiVersionModal
    sourceCv={aiVersionCv}
    jobs={jobs}
    onSave={onAiVersionSave}
    onClose={() => setAiVersionCv(null)}
  />
)}
```

#### 8d — Pass new props from `App.jsx` to MyCvsPage

- [ ] In `App.jsx`, find the `<MyCvsPage ... />` route element (around line 449). Add two new props:

```jsx
jobs={jobs.jobs}
onAiVersionSave={(sourceId, overrides) =>
  runAction("Saving AI CV version", async () => {
    const { createCvVersion } = await import("./services/careerService");
    await createCvVersion(sourceId, overrides);
    await cvs.loadCvs();
    setStatus("AI version saved");
  })
}
```

**Important:** `createCvVersion` is already exported from `careerService.js`. You can import it at the top of `App.jsx` instead of using a dynamic import if it's more consistent with the existing import style. Check the top of `App.jsx` — if `createCvProfile` is already a static import from `"./services/careerService"`, add `createCvVersion` to the same import line:

```js
import { createCvProfile, createCvVersion } from "./services/careerService";
```

Then the prop becomes:

```jsx
onAiVersionSave={(sourceId, overrides) =>
  runAction("Saving AI CV version", async () => {
    await createCvVersion(sourceId, overrides);
    await cvs.loadCvs();
    setStatus("AI version saved");
  })
}
```

---

### Task 9: Build + size check

**Files:**
- Modify: `docs/superpowers/plans/MASTER_PLAN.md` (update Phase 3 status)

- [ ] Run the backend unit tests one more time:

```
node --test backend/__tests__/services/cvAiVersioning.test.js
```

Expected: 7 tests pass.

- [ ] Run the frontend build from the project root:

```
npm run build
```

Expected: clean exit (0 errors). Chunk size warnings are acceptable but not errors.

- [ ] Note the gzip bundle size from build output and record it here: ___ KB

Target: ≤ 220 KB gzip. If over, check what caused the growth. `CvDiffPanel` and `CvAiVersionModal` are small components — they should add < 5 KB.

- [ ] Update `MASTER_PLAN.md`:
  - Tick all Phase 3 task checkboxes
  - Set Phase 3 status to ✅ DONE
  - Record bundle size in the Phase 3 build result row

---

## Self-Review

### 1. Spec coverage check

| Requirement from MASTER_PLAN Phase 3 | Covered by |
|--------------------------------------|------------|
| Keep existing `POST /api/cvs/:id/version` as manual versioning | ✅ Not touched |
| New `POST /api/cvs/:id/ai-version` with `targetJobId`, `mode`, `instructions` | ✅ Task 3 |
| Modes: ats_optimize / role_tailor / concise / seniority_boost | ✅ Task 1 |
| AI must NOT invent skills / projects / education / certifications / experience | ✅ Task 4 — system prompt + normalizeAiVersion only allows rewrites of existing content |
| If OPENAI_API_KEY missing → safe rule-based fallback | ✅ Task 4 — `if (!apiKey) return fallback` |
| Response: `{ createdCv, changes[], warnings[], modelInfo }` | ⚠️ Changed: response is `{ proposedCv, changes[], warnings[], modelInfo }` — does NOT save automatically. Save uses existing `/:id/version` endpoint. This is better UX (review before save). |
| Frontend: "Create AI Version" action on CV card | ✅ Task 8b |
| Select target job and optimisation mode | ✅ Task 7 |
| Show before/after diff summary panel | ✅ Task 6 + 7 (CvDiffPanel shown in review step) |
| Show warnings clearly | ✅ Task 6 (yellow warning box with aria role="alert") |
| AI version modal traps focus and closes on Escape | ✅ Task 7 — `onKeyDown Escape` handler on section |
| Diff panel uses semantic markup | ✅ Task 6 — changes use `<ul>/<li>` with `aria-label`, warnings use `role="alert"` |
| Unit test `useGrowthPlan` hook | ⚠️ Not in this plan — MASTER_PLAN listed it under Phase 3 but it's unrelated to AI versioning. Defer to Phase 4. |
| Backend integration test `POST /api/cvs/:id/ai-version` | ⚠️ Not included — requires a running server + seeded DB. The unit tests for the service cover the core logic. Integration test deferred (noted in MASTER_PLAN). |
| Backend unit test: rule-based fallback produces valid changes[] | ✅ Task 2 — test 5 checks `changes` array, test 6 checks `warnings` array |

### 2. Placeholder scan

None found. All steps contain complete code.

### 3. Type / name consistency

- `buildRuleVersion(cv, job, mode)` → used in Task 1, called in Task 3 endpoint, tested in Task 2. Consistent.
- `generateAiVersion({ cv, job, mode, instructions })` → defined in Task 1 (placeholder) + Task 4 (real), exported in Task 1, required in Task 3 endpoint. Consistent.
- `getJob(jobId)` → defined in Task 1, required alongside `generateAiVersion` in Task 3. Consistent.
- `generateAiVersion(cvId, payload)` in `careerService.js` (Task 5) → called from modal as `generateAiVersion(sourceCv._id, { mode, targetJobId, instructions })` (Task 7). Consistent.
- `onAiVersionSave` prop in MyCvsPage → passed from App.jsx as `onAiVersionSave={...}` → called in modal as `onSave(sourceCv._id, overrides)` (Task 7) → modal receives it as `onSave` prop. Check: `onSave` is the modal's internal prop name, `onAiVersionSave` is MyCvsPage's prop name. App.jsx passes to MyCvsPage as `onAiVersionSave`, MyCvsPage passes to modal as `onSave`. Consistent — no naming collision.
- `result.proposedCv` → set from `data.data.proposedCv` (Task 7, `setResult(data.data)`, then `result.proposedCv`) — endpoint returns `data: { proposedCv, changes, warnings, modelInfo }`. In the modal, `result.changes` and `result.warnings` are used directly (not `result.proposedCv.changes`). Consistent with endpoint response shape.
- `CvDiffPanel({ changes, warnings, modelInfo })` → called as `<CvDiffPanel changes={result.changes} warnings={result.warnings} modelInfo={result.modelInfo} />`. Consistent.
