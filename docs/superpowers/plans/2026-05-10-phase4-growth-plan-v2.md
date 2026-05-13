# Phase 4 — Growth Plan v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static 4-step milestone data with a rich skill roadmap dataset (category, difficulty, estimated weeks, prerequisites, project idea, proof-of-work) and add a source selector (CV Gaps / Market Trends / Target Job / Similar Roles) that controls which skill gaps feed the roadmap.

**Architecture:** A new `frontend/src/data/skillRoadmaps.js` file holds all skill milestone data and a `getMilestoneData(skillName)` lookup helper. `skillUtils.js` gains a `categorizeSkill` export. `TimelineRow.jsx` gains new optional display slots. `GrowthPlanPage.jsx` adds a `source` state, a `selectedJobId` state, a `getGapsForSource` helper, and a source-selector segment control above the skill chips. No new backend endpoints.

**Tech Stack:** React 19, Vite 8, Tailwind 4, `ui.js` design tokens, `localStorage` for plan persistence, existing `buildSkillGaps` from `skillUtils.js`.

---

## Codebase Context

- **`GrowthPlanPage.jsx`** (`frontend/src/pages/`) — 580 lines. Has `STAGE_STEPS` (simple 4-step arrays per skill), `ALIASES`, `getSteps()`, `STAGE_TIMELINE`, skill-selection UI, localStorage persistence, `roadmapIntent` handling. **`STAGE_STEPS`, `ALIASES`, `getSteps` will be removed and replaced by imports from `skillRoadmaps.js`.**
- **`TimelineRow.jsx`** (`frontend/src/components/roadmap/`) — 132 lines. Receives `stage` (has `skill`, `steps`, `freq`, `label`) and renders a checklist row. **New fields will be added to `stage` and displayed.**
- **`skillUtils.js`** (`frontend/src/utils/`) — exports `buildSkillGaps`. Has private `categorizeSkill` function. **`categorizeSkill` will be exported.**
- **`useGrowthPlan.js`** — not modified.
- **`App.jsx`** — modified only to add `setStatus` prop to the GrowthPlanPage route element. `setStatus` is already available in App.jsx (from `useToast`). Calling it fires a bottom-right auto-dismiss toast — this is the **only** user-feedback mechanism in this codebase; do not use `alert()`, `console.log()`, or inline error `<p>` tags for action feedback.

**Current GrowthPlanPage props:**
```js
{ jobs, recommendations, selectedCv, analyzeGaps, onRoadmapIntentConsumed, roadmapIntent, roadmapStorageUserId }
```

**Updated GrowthPlanPage props (after Phase 4):**
```js
{ jobs, recommendations, selectedCv, analyzeGaps, onRoadmapIntentConsumed, roadmapIntent, roadmapStorageUserId, setStatus }
```

`setStatus` is needed so the page can fire toasts when a source switch yields no usable data (e.g. "similar_roles" with no loaded recommendations). These are the only new toast call-sites in Phase 4.

**`roadmapIntent.source` values used:**
- `"skill-map"` → map to `"cv_gaps"` source
- `"insights"` → map to `"target_job"` source
- anything else → `"cv_gaps"`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/data/skillRoadmaps.js` | **Create** | `SKILL_ROADMAPS` dataset + `getMilestoneData(skillName)` |
| `frontend/src/utils/skillUtils.js` | **Modify** | Export `categorizeSkill`; add `buildTopSkills` |
| `frontend/src/components/roadmap/TimelineRow.jsx` | **Modify** | Render category, difficulty, estimatedWeeks, prerequisites, projectIdea, proofOfWork |
| `frontend/src/pages/GrowthPlanPage.jsx` | **Modify** | Source selector, source-aware gap computation, use new milestone data, toast feedback |
| `frontend/src/App.jsx` | **Modify** | Add `setStatus` prop to GrowthPlanPage route element |

---

## Tasks

### Task 1: Create `frontend/src/data/skillRoadmaps.js`

**Files:**
- Create: `frontend/src/data/skillRoadmaps.js`

- [ ] Create the file with the full skill roadmap dataset and lookup helper:

```js
// frontend/src/data/skillRoadmaps.js

export const SKILL_ROADMAPS = {
  docker: {
    category: "devops",
    difficulty: "intermediate",
    estimatedWeeks: 8,
    prerequisites: ["Linux basics", "Command line proficiency"],
    steps: [
      "Complete a Docker basics course",
      "Dockerize an existing project",
      "Push an image to Docker Hub",
      "Write multi-stage builds",
    ],
    projectIdea: "Containerise a personal API with Docker Compose (app + db + reverse proxy)",
    proofOfWork: "GitHub repo with Dockerfile + Docker Hub image link + README setup guide",
  },
  kubernetes: {
    category: "devops",
    difficulty: "advanced",
    estimatedWeeks: 12,
    prerequisites: ["Docker", "Linux basics", "Networking basics"],
    steps: [
      "Learn Kubernetes fundamentals",
      "Deploy a containerised app to a cluster",
      "Configure ingress and services",
      "Set up health checks and monitoring",
    ],
    projectIdea: "Deploy a 2-service app (API + DB) on local Minikube with ingress",
    proofOfWork: "Working k8s manifests in GitHub with a recorded demo or screenshots",
  },
  aws: {
    category: "devops",
    difficulty: "intermediate",
    estimatedWeeks: 10,
    prerequisites: ["Linux basics", "Networking basics"],
    steps: [
      "Cover EC2, S3 and IAM basics",
      "Deploy a project on the free tier",
      "Study for AWS Cloud Practitioner",
      "Use CloudWatch for observability",
    ],
    projectIdea: "Host a static site on S3 + CloudFront; deploy a backend on EC2",
    proofOfWork: "AWS Cloud Practitioner badge or live project URL on AWS",
  },
  postgresql: {
    category: "backend",
    difficulty: "intermediate",
    estimatedWeeks: 6,
    prerequisites: ["Basic SQL", "Any backend language"],
    steps: [
      "Study indexes and query plans",
      "Run migrations with a migration tool",
      "Practice backup and restore",
      "Tune a slow-running query",
    ],
    projectIdea: "Build a CRUD API with PostgreSQL; add full-text search on one entity",
    proofOfWork: "SQL migration files + EXPLAIN ANALYZE screenshots in GitHub",
  },
  redis: {
    category: "backend",
    difficulty: "intermediate",
    estimatedWeeks: 5,
    prerequisites: ["Basic backend API experience"],
    steps: [
      "Understand caching patterns",
      "Integrate Redis into an existing project",
      "Handle cache invalidation logic",
      "Use pub/sub for event-driven messaging",
    ],
    projectIdea: "Add Redis caching to an existing API; implement a simple job queue",
    proofOfWork: "Before/after latency benchmarks + GitHub code",
  },
  graphql: {
    category: "backend",
    difficulty: "intermediate",
    estimatedWeeks: 6,
    prerequisites: ["REST API experience", "Any backend language"],
    steps: [
      "Learn GraphQL schema design",
      "Build a resolver and query",
      "Add authentication to a schema",
      "Write integration tests",
    ],
    projectIdea: "Build a GraphQL API for a blog or task app with auth",
    proofOfWork: "GraphQL API repo with schema, resolvers, and tests on GitHub",
  },
  typescript: {
    category: "frontend",
    difficulty: "intermediate",
    estimatedWeeks: 6,
    prerequisites: ["JavaScript proficiency"],
    steps: [
      "Enable strict mode in an existing project",
      "Type all props and return values",
      "Write utility and mapped types",
      "Migrate a JS module to TS",
    ],
    projectIdea: "Migrate a personal JavaScript project to TypeScript strict mode",
    proofOfWork: "Before/after PR showing TS migration + 0 `any` types",
  },
  python: {
    category: "backend",
    difficulty: "beginner",
    estimatedWeeks: 8,
    prerequisites: ["Basic programming concepts"],
    steps: [
      "Complete a Python fundamentals course",
      "Build a focused CLI tool",
      "Write unit tests with pytest",
      "Deploy or publish a small project",
    ],
    projectIdea: "Build a data-fetching CLI tool with argparse and publish to PyPI",
    proofOfWork: "PyPI package or GitHub repo with pytest coverage > 80%",
  },
  react: {
    category: "frontend",
    difficulty: "intermediate",
    estimatedWeeks: 8,
    prerequisites: ["JavaScript", "HTML/CSS basics"],
    steps: [
      "Build a small CRUD app",
      "Add state management with Context or Zustand",
      "Write component tests with Vitest",
      "Deploy to Vercel or Netlify",
    ],
    projectIdea: "Build a personal dashboard app (notes / tasks / finance tracker)",
    proofOfWork: "Live Vercel URL + GitHub repo with component tests",
  },
  node: {
    category: "backend",
    difficulty: "beginner",
    estimatedWeeks: 6,
    prerequisites: ["JavaScript basics"],
    steps: [
      "Build a REST API with Express",
      "Add JWT authentication",
      "Write integration tests",
      "Deploy to a cloud provider",
    ],
    projectIdea: "Build an authenticated notes or task REST API and deploy it",
    proofOfWork: "Live API URL + GitHub repo with integration tests",
  },
  java: {
    category: "backend",
    difficulty: "intermediate",
    estimatedWeeks: 10,
    prerequisites: ["OOP concepts", "Basic programming experience"],
    steps: [
      "Review OOP concepts and collections",
      "Build a Spring Boot service",
      "Add persistence with JPA",
      "Write unit tests with JUnit",
    ],
    projectIdea: "Build a CRUD REST API with Spring Boot + JPA + PostgreSQL",
    proofOfWork: "GitHub repo with JUnit tests and API documentation",
  },
  spring: {
    category: "backend",
    difficulty: "intermediate",
    estimatedWeeks: 8,
    prerequisites: ["Java proficiency", "Basic REST API knowledge"],
    steps: [
      "Set up a Spring Boot project",
      "Implement REST endpoints",
      "Add database integration",
      "Write integration tests",
    ],
    projectIdea: "Build a multi-entity CRUD app with Spring Data and PostgreSQL",
    proofOfWork: "GitHub repo with integration test suite + Swagger docs",
  },
  kafka: {
    category: "backend",
    difficulty: "advanced",
    estimatedWeeks: 8,
    prerequisites: ["Backend experience", "Docker"],
    steps: [
      "Understand topics, producers and consumers",
      "Run Kafka locally with Docker",
      "Implement a producer/consumer app",
      "Handle offset management",
    ],
    projectIdea: "Build an event-driven order system with Kafka producers and consumers",
    proofOfWork: "GitHub repo with Docker Compose setup + throughput test results",
  },
  terraform: {
    category: "devops",
    difficulty: "intermediate",
    estimatedWeeks: 6,
    prerequisites: ["Cloud basics (AWS/GCP/Azure)", "Linux basics"],
    steps: [
      "Learn HCL syntax and providers",
      "Provision cloud resources with a plan",
      "Use modules for reusable infra",
      "Set up remote state",
    ],
    projectIdea: "Provision a VPC + EC2 + RDS stack on AWS with Terraform modules",
    proofOfWork: "GitHub repo with Terraform modules + terraform plan output screenshot",
  },
  linux: {
    category: "devops",
    difficulty: "beginner",
    estimatedWeeks: 4,
    prerequisites: [],
    steps: [
      "Learn file system navigation",
      "Write basic shell scripts",
      "Configure systemd services",
      "Harden a server with basic security",
    ],
    projectIdea: "Set up a personal VPS from scratch with Nginx, SSL, and systemd services",
    proofOfWork: "Live domain or VPS + shell scripts in GitHub",
  },
  git: {
    category: "tools",
    difficulty: "beginner",
    estimatedWeeks: 3,
    prerequisites: [],
    steps: [
      "Master branching strategies",
      "Learn interactive rebase",
      "Set up pre-commit hooks",
      "Contribute to an open source project",
    ],
    projectIdea: "Contribute a bug fix or docs update to an open source project",
    proofOfWork: "Merged PR link to an open source repository",
  },
  default: {
    category: "technical",
    difficulty: "intermediate",
    estimatedWeeks: 6,
    prerequisites: ["Basic programming experience"],
    steps: [
      "Learn core concepts",
      "Build a focused practice project",
      "Integrate into an existing codebase",
      "Add to CV and portfolio",
    ],
    projectIdea: "Build a focused project demonstrating this skill end-to-end",
    proofOfWork: "GitHub repo with the project and README explaining the implementation",
  },
};

const ALIASES = {
  "react.js":   "react",
  "reactjs":    "react",
  "vue.js":     "vue",
  "node.js":    "node",
  "nodejs":     "node",
  "express.js": "node",
  "postgres":   "postgresql",
  "pg":         "postgresql",
  "k8s":        "kubernetes",
  "ci/cd":      "ci",
  "cicd":       "ci",
  "ts":         "typescript",
};

export function getMilestoneData(skillName) {
  const lower = String(skillName || "").toLowerCase().trim();
  if (SKILL_ROADMAPS[lower]) return SKILL_ROADMAPS[lower];
  const resolved = ALIASES[lower];
  if (resolved && SKILL_ROADMAPS[resolved]) return SKILL_ROADMAPS[resolved];
  const words = lower.split(/[\s./\-+]+/).filter(Boolean);
  for (const word of words) {
    if (SKILL_ROADMAPS[word]) return SKILL_ROADMAPS[word];
    const wordAlias = ALIASES[word];
    if (wordAlias && SKILL_ROADMAPS[wordAlias]) return SKILL_ROADMAPS[wordAlias];
  }
  const partialKey = Object.keys(SKILL_ROADMAPS).find(
    (k) => k !== "default" && lower.includes(k)
  );
  return SKILL_ROADMAPS[partialKey] || SKILL_ROADMAPS.default;
}
```

- [ ] Verify the file was created and spot-check that `getMilestoneData("node.js")` would return the `node` entry (trace through the ALIASES logic mentally: `ALIASES["node.js"] = "node"` → `SKILL_ROADMAPS["node"]` ✓).

---

### Task 2: Update `frontend/src/utils/skillUtils.js`

**Files:**
- Modify: `frontend/src/utils/skillUtils.js`

- [ ] Read the current file and add `export` to `categorizeSkill` and add `buildTopSkills`:

Replace the current file with:

```js
// frontend/src/utils/skillUtils.js

const SKILL_CATEGORIES = {
  tools:  ["docker","kubernetes","aws","ci/cd","terraform","linux","git","github","jenkins","nginx","redis","kafka","elasticsearch"],
  domain: ["agile","scrum","microservices","rest api","graphql","oauth","jwt","tdd","ddd","solid"],
};

export function categorizeSkill(skill) {
  const lower = skill.toLowerCase();
  if (SKILL_CATEGORIES.tools.some((t) => lower.includes(t)))  return "tools";
  if (SKILL_CATEGORIES.domain.some((d) => lower.includes(d))) return "domain";
  return "technical";
}

export function buildSkillGaps(jobs, cvSkills) {
  const cvSet = new Set((cvSkills || []).map((s) => s.toLowerCase()));
  const freq = {};
  for (const job of jobs) {
    for (const skill of job.skills || []) {
      if (!cvSet.has(skill.toLowerCase())) {
        freq[skill] = (freq[skill] || 0) + 1;
      }
    }
  }
  return Object.entries(freq)
    .map(([skill, count]) => ({ skill, count, cat: categorizeSkill(skill) }))
    .sort((a, b) => b.count - a.count);
}

export function buildTopSkills(jobs, cvSkills = []) {
  return buildSkillGaps(jobs, cvSkills);
}
```

Note: `buildTopSkills` is a thin alias of `buildSkillGaps` — it exists so call sites are semantically clear about intent ("top market skills" vs "CV gaps").

- [ ] Verify the file. Confirm `categorizeSkill` is now exported.

---

### Task 3: Update `frontend/src/components/roadmap/TimelineRow.jsx`

**Files:**
- Modify: `frontend/src/components/roadmap/TimelineRow.jsx`

`TimelineRow` receives a `stage` object. Currently `stage` has `{ skill, steps, freq, label }`. After Phase 4, `stage` also has `{ category, difficulty, estimatedWeeks, prerequisites, projectIdea, proofOfWork }`. All new fields are optional — the component must work with or without them.

- [ ] Read `frontend/src/components/roadmap/TimelineRow.jsx` and replace its content with:

```jsx
// frontend/src/components/roadmap/TimelineRow.jsx
import { ui } from "../../styles/ui";

function circleClass(isActive, isCompleted) {
  if (isCompleted) return "bg-[#E5F4EC] text-[#0E7C4A]";
  if (isActive)    return "bg-[#1E3FFF] text-white shadow-[0_6px_18px_rgba(30,63,255,0.18)]";
  return "border border-[#E8E3D7] bg-white text-[#A4A4AC]";
}

const DIFFICULTY_STYLES = {
  beginner:     "bg-[#E5F4EC] text-[#0E7C4A]",
  intermediate: "bg-[#E6EBFF] text-[#1E3FFF]",
  advanced:     "bg-[#FEF9E7] text-[#B45309]",
};

export default function TimelineRow({
  stage,
  index,
  weekLabel,
  stepsCompleted,
  onToggleStep,
  isActive,
  isCompleted,
}) {
  return (
    <div className="relative grid grid-cols-[140px_56px_1fr] items-start gap-4 max-sm:grid-cols-[36px_1fr] max-sm:gap-3">

      {/* Week label — hidden on mobile */}
      <div className="pt-2 max-sm:hidden">
        <span
          className="inline-flex items-center rounded-[4px] bg-[#E6EBFF] px-2 py-1 text-[11px] font-medium text-[#1E3FFF]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {weekLabel}
        </span>
      </div>

      {/* Circle indicator */}
      <div className="relative self-stretch flex justify-center pt-2 max-sm:justify-start">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 max-sm:hidden"
          style={{ left: "50%", width: 0, borderLeft: "2px dotted var(--c-hairline)", zIndex: 0 }}
        />
        <div
          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${circleClass(isActive, isCompleted)}`}
        >
          {isCompleted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" stroke="#0E7C4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="text-[13px] font-semibold">{index + 1}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pb-6">
        {/* Week label — mobile only */}
        <div className="mb-2 hidden max-sm:block">
          <span
            className="inline-flex items-center rounded-[4px] bg-[#E6EBFF] px-2 py-0.5 text-[10px] font-medium text-[#1E3FFF]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {weekLabel}
          </span>
        </div>

        {/* Skill title + frequency badge */}
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-[#0E0E10]">
            {stage.skill}
          </h3>
          {stage.freq > 0 && (
            <span className={`shrink-0 ${ui.chipMissing}`}>
              {stage.freq}×
            </span>
          )}
        </div>

        {/* Category + difficulty + estimated weeks */}
        {(stage.category || stage.difficulty || stage.estimatedWeeks) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {stage.category && (
              <span
                className="rounded-[4px] bg-[#F6F3EC] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-[#6B6B72]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {stage.category}
              </span>
            )}
            {stage.difficulty && (
              <span
                className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] ${DIFFICULTY_STYLES[stage.difficulty] || DIFFICULTY_STYLES.intermediate}`}
                style={{ fontFamily: "var(--font-mono)" }}
                aria-label={`Difficulty: ${stage.difficulty}`}
              >
                {stage.difficulty}
              </span>
            )}
            {stage.estimatedWeeks && (
              <span
                className="text-[11px] text-[#6B6B72]"
                style={{ fontFamily: "var(--font-mono)" }}
                aria-label={`Estimated ${stage.estimatedWeeks} weeks`}
              >
                ~{stage.estimatedWeeks}w
              </span>
            )}
          </div>
        )}

        {/* Prerequisites */}
        {stage.prerequisites?.length > 0 && (
          <p className="mt-2 text-[12px] leading-relaxed text-[#6B6B72]">
            <span className="font-medium text-[#3A3A40]">Requires:</span>{" "}
            {stage.prerequisites.join(", ")}
          </p>
        )}

        {/* Step checklist */}
        <ul className="mt-3 grid gap-2" aria-label={`Learning steps for ${stage.skill}`}>
          {stage.steps.map((step, si) => {
            const done = !!stepsCompleted[si];
            return (
              <li
                key={si}
                className={`flex items-center justify-between gap-3 rounded-[8px] border border-[#E8E3D7] px-3 py-2 ${
                  done ? "bg-[#F6F3EC]" : "bg-white"
                }`}
              >
                <button
                  aria-pressed={done}
                  className="flex min-w-0 items-center gap-3 text-left"
                  onClick={() => onToggleStep(si)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border ${
                      done
                        ? "border-transparent bg-[#0E7C4A] text-white"
                        : "border-[#E8E3D7] text-[#A4A4AC]"
                    }`}
                  >
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>
                        {si + 1}
                      </span>
                    )}
                  </span>
                  <span className={`text-[13px] ${done ? "line-through text-[#A4A4AC]" : "text-[#0E0E10]"}`}>
                    {step}
                  </span>
                </button>
                <span
                  className="shrink-0 text-[10px] font-medium text-[#A4A4AC]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {si + 1}/{stage.steps.length}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Project idea */}
        {stage.projectIdea && (
          <div className="mt-4 rounded-[8px] border border-dashed border-[#E8E3D7] bg-[#F6F3EC] px-3 py-2.5">
            <p
              className="text-[10px] font-medium uppercase tracking-[0.07em] text-[#6B6B72]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Project idea
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[#3A3A40]">{stage.projectIdea}</p>
          </div>
        )}

        {/* Proof of work */}
        {stage.proofOfWork && (
          <p className="mt-2.5 text-[12px] leading-relaxed text-[#6B6B72]">
            <span className="font-medium text-[#0E0E10]">Proof of work:</span>{" "}
            {stage.proofOfWork}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] Verify the file. All new fields (`category`, `difficulty`, `estimatedWeeks`, `prerequisites`, `projectIdea`, `proofOfWork`) are rendered conditionally — component still works if they are absent.

---

### Task 4: Update `frontend/src/pages/GrowthPlanPage.jsx`

**Files:**
- Modify: `frontend/src/pages/GrowthPlanPage.jsx`

This task makes four targeted changes to the existing 580-line file. Read it first, then apply each change.

#### 4a — Update imports and add `setStatus` prop

- [ ] Find the current import block at the top of the file (lines 1-8). Replace it with:

```js
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiBarChart2, FiTarget, FiX, FiZap } from "react-icons/fi";
import { ui } from "../styles/ui";
import { buildSkillGaps, categorizeSkill } from "../utils/skillUtils";
import { getMilestoneData } from "../data/skillRoadmaps";
import TimelineRow from "../components/roadmap/TimelineRow";
```

(`FiBarChart2` is added for the Market Trends source icon.)

- [ ] Find the component signature and add `setStatus` to the destructured props:

```js
export default function GrowthPlanPage({
  jobs,
  recommendations,
  selectedCv,
  analyzeGaps,
  onRoadmapIntentConsumed,
  roadmapIntent,
  roadmapStorageUserId,
  setStatus,
}) {
```

#### 4b — Remove old static data, add source constants

- [ ] Find and **delete** the following blocks (they are replaced by `skillRoadmaps.js`):
  - `const STAGE_STEPS = { ... }` (lines 9-27)
  - `const STAGE_TIMELINE = [...]` (line 29) — keep this one, it's still used
  - `const ALIASES = { ... }` (lines 32-45)
  - `function getSteps(skillName) { ... }` (lines 47-68)

- [ ] After the remaining constants (`ROADMAP_STORAGE_PREFIX`) and before the `buildHeroText` function, add:

```js
const STAGE_TIMELINE = ["Week 1-2", "Week 3-5", "Week 6-8", "Week 9-10"];
const ROADMAP_STORAGE_PREFIX = "lattice:growth-plan";

const SOURCE_OPTIONS = [
  { id: "cv_gaps",       label: "CV Gaps",        icon: "target",  desc: "Skills your CV is missing from loaded jobs" },
  { id: "market_trends", label: "Market Trends",  icon: "chart",   desc: "Top skills by demand across all jobs" },
  { id: "target_job",    label: "Target Job",     icon: "job",     desc: "Gap between your CV and a specific job" },
  { id: "similar_roles", label: "Similar Roles",  icon: "zap",     desc: "Skills missing from your recommended jobs" },
];

function getGapsForSource(source, { jobs, uniqueJobs, recommendations, selectedCv, targetJob }) {
  const cvSkills = selectedCv?.skills;
  switch (source) {
    case "market_trends":
      return buildSkillGaps(jobs.filter((j) => j?._id), cvSkills);
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
```

**Important:** In this file `STAGE_TIMELINE` and `ROADMAP_STORAGE_PREFIX` are currently defined separately. Find and remove the old definitions to avoid duplicates after you add the new block. Verify there is exactly one definition of each constant.

#### 4c — Add `source` and `selectedJobId` state; update gap computation

- [ ] Find the component body. Currently these lines compute the gaps:

```js
const allJobs    = [...jobs, ...recommendations].filter((j) => j?._id);
const uniqueJobs = [...new Map(allJobs.map((j) => [j._id, j])).values()];
const gaps       = buildSkillGaps(uniqueJobs, selectedCv?.skills);
const topGaps    = gaps.slice(0, 3);

const marketRecommendations = gaps.slice(0, 8);
const intentRecommended = Array.isArray(roadmapIntent?.recommendedSkills)
  ? roadmapIntent.recommendedSkills
  : [];
const intentSelectedSkills = Array.isArray(roadmapIntent?.selectedSkills)
  ? roadmapIntent.selectedSkills.map(normalizeSkillName).filter(Boolean).slice(0, 4)
  : [];
const recommendedGaps = uniqueSkillItems(
  intentRecommended.length ? intentRecommended : marketRecommendations,
  marketRecommendations
);
const defaultSelectedSkills = (
  intentSelectedSkills.length
    ? intentSelectedSkills
    : topGaps.map((gap) => gap.skill)
).slice(0, 4);
```

Replace that entire block with:

```js
const allJobs    = [...jobs, ...recommendations].filter((j) => j?._id);
const uniqueJobs = [...new Map(allJobs.map((j) => [j._id, j])).values()];

const intentSelectedSkills = Array.isArray(roadmapIntent?.selectedSkills)
  ? roadmapIntent.selectedSkills.map(normalizeSkillName).filter(Boolean).slice(0, 4)
  : [];

const targetJob = uniqueJobs.find((j) => j._id === selectedJobId) || null;
const sourceGaps = getGapsForSource(source, { jobs, uniqueJobs, recommendations, selectedCv, targetJob });
const recommendedGaps = uniqueSkillItems(sourceGaps.slice(0, 8));
const defaultSelectedSkills = (
  intentSelectedSkills.length
    ? intentSelectedSkills
    : recommendedGaps.slice(0, 3).map((gap) => gap.skill)
).slice(0, 4);
```

- [ ] Find the `useState` declarations. Currently:

```js
const [showRoadmap, setShowRoadmap] = useState(false);
const [generating, setGenerating]   = useState(false);
const [showResetConfirm, setShowResetConfirm] = useState(false);
const [savedPlan, setSavedPlan]     = useState(null);
const [selectedSkillNames, setSelectedSkillNames] = useState([]);
const [completion, setCompletion]   = useState([]);
```

Add two new states at the top of this block:

```js
const [source, setSource]           = useState("cv_gaps");
const [selectedJobId, setSelectedJobId] = useState("");
const [showRoadmap, setShowRoadmap] = useState(false);
const [generating, setGenerating]   = useState(false);
const [showResetConfirm, setShowResetConfirm] = useState(false);
const [savedPlan, setSavedPlan]     = useState(null);
const [selectedSkillNames, setSelectedSkillNames] = useState([]);
const [completion, setCompletion]   = useState([]);
```

#### 4d — Map `roadmapIntent.source` to UI source; update `computedStages`

- [ ] Find the main `useEffect` that handles `roadmapIntent` (currently starting with `setGenerating(false);`). Inside the `if (hasIncomingIntent)` branch, after the `if (storageKey) localStorage.removeItem(storageKey);` line, add source mapping:

```js
// Map roadmapIntent.source to UI source selector
if (roadmapIntent.source === "skill-map") setSource("cv_gaps");
else if (roadmapIntent.source === "insights") setSource("target_job");
else if (roadmapIntent.source === "market") setSource("market_trends");
else setSource("cv_gaps");
```

- [ ] Find `computedStages`. Currently:

```js
const computedStages = selectedSkillItems.map((g, i) => ({
  id:    `s${i}`,
  label: STAGE_TIMELINE[i] || `Phase ${i + 1}`,
  skill: g.skill,
  steps: getSteps(g.skill),
  freq:  g.count,
}));
```

Replace with:

```js
const computedStages = selectedSkillItems.map((g, i) => {
  const milestone = getMilestoneData(g.skill);
  return {
    id:             `s${i}`,
    label:          STAGE_TIMELINE[i] || `Phase ${i + 1}`,
    skill:          g.skill,
    steps:          milestone.steps,
    freq:           g.count,
    category:       milestone.category,
    difficulty:     milestone.difficulty,
    estimatedWeeks: milestone.estimatedWeeks,
    prerequisites:  milestone.prerequisites,
    projectIdea:    milestone.projectIdea,
    proofOfWork:    milestone.proofOfWork,
  };
});
```

Also update `selectedSkillItems` to fall back to `sourceGaps` (replacing the old `gaps` reference):

Find:
```js
const selectedSkillItems = selectedSkillNames.map((skill) => {
  const key = skillKey(skill);
  return recommendedGaps.find((item) => skillKey(item.skill) === key)
    || gaps.find((item) => skillKey(item.skill) === key)
    || { skill, count: 0, cat: "technical" };
});
```

Replace with:
```js
const selectedSkillItems = selectedSkillNames.map((skill) => {
  const key = skillKey(skill);
  return recommendedGaps.find((item) => skillKey(item.skill) === key)
    || sourceGaps.find((item) => skillKey(item.skill) === key)
    || { skill, count: 0, cat: "technical" };
});
```

#### 4e — Add `handleSourceChange` with toast feedback

- [ ] Add `handleSourceChange` near the other handler functions (`toggleSkillSelection`, `handleGenerate`, etc.):

```js
function handleSourceChange(newSource) {
  if (newSource === source) return;
  if (storageKey) localStorage.removeItem(storageKey);
  setSource(newSource);
  setSelectedJobId("");
  setSavedPlan(null);
  setSelectedSkillNames([]);
  setCompletion([]);
  setShowRoadmap(false);

  // Toast feedback when the selected source has no data available.
  // setStatus routes to the bottom-right auto-dismiss toast system.
  if (newSource === "similar_roles" && recommendations.filter((r) => r?._id).length === 0) {
    setStatus("No recommended jobs loaded. Go to Jobs and load recommendations first.");
  }
  if (newSource === "target_job" && uniqueJobs.length === 0) {
    setStatus("No jobs loaded. Fetch jobs from the Jobs page first.");
  }
}
```

Note: `uniqueJobs` is already computed above this function (from `jobs + recommendations`). `recommendations` is a prop. These are synchronous checks — no `runAction` wrapper needed.

#### 4f — Add source selector UI

- [ ] Find the skill selection `<section>` that starts with:

```jsx
{hasCv && recommendedGaps.length > 0 && (
  <section className={ui.panel}>
    <div className={ui.sectionHead}>
      <div>
        <p className={ui.eyebrow}>Recommended skill gaps</p>
```

Inside this section, immediately BEFORE the `<div className="flex flex-wrap gap-2">` that renders the skill chips, add the source selector and job picker:

```jsx
{/* Source selector */}
<div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Roadmap source">
  {SOURCE_OPTIONS.map((opt) => (
    <button
      key={opt.id}
      type="button"
      className={`inline-flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-medium transition-colors ${
        source === opt.id
          ? "border-[#0E0E10] bg-[#0E0E10] text-[#F6F3EC]"
          : "border-[#E8E3D7] bg-[#FBFAF6] text-[#3A3A40] hover:border-[#A4A4AC]"
      }`}
      aria-pressed={source === opt.id}
      title={opt.desc}
      onClick={() => handleSourceChange(opt.id)}
    >
      {opt.label}
    </button>
  ))}
</div>

{/* Job picker — only when source = "target_job" */}
{source === "target_job" && (
  <div className="mb-4">
    <label className={ui.label}>
      Select target job
      <select
        className={ui.input}
        value={selectedJobId}
        onChange={(e) => {
          setSelectedJobId(e.target.value);
          setSavedPlan(null);
          setSelectedSkillNames([]);
          setShowRoadmap(false);
        }}
      >
        <option value="">Choose a job…</option>
        {uniqueJobs.map((job) => (
          <option key={job._id} value={job._id}>
            {job.title} — {job.company}
          </option>
        ))}
      </select>
    </label>
    {!selectedJobId && (
      <p className="mt-1 text-[12px] text-[#6B6B72]">
        Select a job to see which skills you need to add.
      </p>
    )}
  </div>
)}
```

- [ ] Verify that the section now renders: source selector → (optional job picker) → skill chips.

- [ ] Also update the section description `<p>` to reflect the active source. Find:

```jsx
{roadmapIntent?.label || "These are your most frequent missing skills from Skill Map. Select up to 4 skills for a focused growth plan. Changing your selection while a roadmap is active will reset the current plan."}
```

Replace with:

```jsx
{roadmapIntent?.label || SOURCE_OPTIONS.find((o) => o.id === source)?.desc || "Select up to 4 skills for a focused growth plan."}
```

---

### Task 5: Wire `setStatus` in App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] Find the `<Route path="/roadmap">` element in App.jsx (currently around line 511). Find `<GrowthPlanPage` and add `setStatus` to its props:

```jsx
<GrowthPlanPage
  jobs={jobs.jobs}
  recommendations={jobs.recommendations}
  selectedCv={cvs.selectedCv}
  analyzeGaps={growth.analyzeGaps}
  matchResult={growth.matchResult}
  onRoadmapIntentConsumed={() => growth.setRoadmapIntent(null)}
  roadmapIntent={growth.roadmapIntent}
  roadmapStorageUserId={auth.user?.email || auth.user?._id || auth.user?.id}
  setStatus={setStatus}
/>
```

`setStatus` is already available in App.jsx scope (from `useToast`). No import changes needed.

---

### Task 6: Build check + MASTER_PLAN update

**Files:**
- Modify: `docs/superpowers/plans/MASTER_PLAN.md`

- [ ] Run the frontend build from the project root:

```
npm run build
```

Expected: clean exit (0 errors). Fix any import errors before proceeding.

**Common errors to watch for:**
- `categorizeSkill is not exported from skillUtils` → verify Task 2 wrote `export function categorizeSkill`
- `getMilestoneData is not a function` → verify Task 1 has `export function getMilestoneData`
- `FiBarChart2 is not exported from react-icons/fi` → it is — verify the import line is correct

- [ ] Note the gzip bundle size from build output. Record here: ___ KB (target ≤ 220 KB)

- [ ] Update `MASTER_PLAN.md`:
  - Change Phase 4 status from `⏳ PENDING` to `✅ DONE`
  - Add build result to the Phase Status Overview table
  - Tick all Phase 4 task checkboxes

---

## Self-Review

### 1. Spec coverage

| Requirement from MASTER_PLAN Phase 4 | Covered by |
|--------------------------------------|------------|
| Inspect current GrowthPlanPage and useGrowthPlan | ✅ Done pre-plan (context section above) |
| Source selector: CV gaps | ✅ Task 4f — `"cv_gaps"` option |
| Source selector: Portfolio-wide market gaps | ✅ Task 4f — `"market_trends"` option (uses raw `jobs` prop) |
| Source selector: Selected job missing skills | ✅ Task 4f — `"target_job"` option + job picker |
| Source selector: Similar roles trend | ✅ Task 4f — `"similar_roles"` option (uses `recommendations`) |
| Default source from navigation origin | ✅ Task 4d — `roadmapIntent.source` maps to source selector |
| Each milestone: skill name | ✅ existing `stage.skill` |
| Each milestone: category | ✅ Task 1 + Task 3 + Task 4d |
| Each milestone: difficulty | ✅ Task 1 + Task 3 + Task 4d |
| Each milestone: estimated weeks | ✅ Task 1 + Task 3 + Task 4d |
| Each milestone: prerequisites | ✅ Task 1 + Task 3 + Task 4d |
| Each milestone: learning tasks | ✅ existing `stage.steps` (kept) |
| Each milestone: project idea | ✅ Task 1 + Task 3 + Task 4d |
| Each milestone: proof-of-work requirement | ✅ Task 1 + Task 3 + Task 4d |
| Static verified roadmap dataset | ✅ Task 1 — 16 skills + default fallback |
| AI personalization layer | ⚠️ Not implemented — deferred. Rule-based milestone data already works well and adding OpenAI here would require a new endpoint + more scope. Noted in MASTER_PLAN. |
| Preserve localStorage persistence | ✅ Not broken — existing persistence code unchanged |
| Toast feedback on empty source | ✅ Task 4e — `setStatus` called in `handleSourceChange` for "similar_roles" with no recommendations and "target_job" with no jobs |
| Toast system compatibility | ✅ Uses `setStatus` prop (→ `addToast` → bottom-right auto-dismiss toast) — no `alert()` or console.log |

### 2. Placeholder scan

None found. All code blocks are complete.

### 3. Type / name consistency

- `getMilestoneData(skillName)` — defined in Task 1, imported in Task 4a, called in Task 4d. Consistent.
- `categorizeSkill` — exported in Task 2, imported in Task 4a, called inside `getGapsForSource`. Consistent.
- `getGapsForSource(source, { jobs, uniqueJobs, recommendations, selectedCv, targetJob })` — defined in Task 4b, called in Task 4c as `getGapsForSource(source, { jobs, uniqueJobs, recommendations, selectedCv, targetJob })`. Consistent.
- `sourceGaps` — computed in Task 4c, used in Task 4d (`selectedSkillItems` fallback). Consistent — replaces old `gaps` variable.
- `SOURCE_OPTIONS` — defined in Task 4b, rendered in Task 4f. Consistent.
- `handleSourceChange(newSource)` — defined in Task 4e, called in Task 4f's `onClick`. Consistent.
- `stage.projectIdea` and `stage.proofOfWork` — added to stage in Task 4d, rendered in Task 3. Consistent.
- `STAGE_TIMELINE` — still used in Task 4d's `computedStages`. Old definition removed (Task 4b), new definition added (Task 4b). Verify only one definition exists after edits.
