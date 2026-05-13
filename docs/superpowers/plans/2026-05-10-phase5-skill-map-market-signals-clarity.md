# Phase 5 — Skill Map vs Market Signals Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the data-source difference between Skill Map (selected CV × loaded frontend jobs) and Market Signals (all CVs × all MongoDB jobs) explicit through clear labels, helper text, and a working "Use in Growth Plan" flow from Market Signals that feeds real portfolio analytics into the roadmap.

**Architecture:** Extract `getGapsForSource` from GrowthPlanPage into a testable pure utility (`gapSourceUtils.js`). Update it to use backend `skillAnalytics.data` when available for the `market_trends` source. Wire a new "Use in Growth Plan" button in MarketSignalsPage through the existing `openRoadmap` callback. Update SkillMapPage section labels for clarity. No backend changes.

**Tech Stack:** React 19, Vitest (globals: true, jsdom env), react-icons/fi, Tailwind via Lattice `ui.js` tokens, existing `openRoadmap` callback in App.jsx.

---

## Context for implementers

### Data source difference (confirmed by code inspection)

| Feature | Source |
|---------|--------|
| **Skill Map** | `buildSkillGaps([...jobs, ...recommendations], selectedCv.skills)` — **selected CV × jobs currently in frontend state** |
| **Market Signals "Missing skill frequency"** | `GET /api/analytics/skills` → backend iterates **all user CVs × all jobs in MongoDB** |
| **Growth Plan `market_trends`** | Currently `buildSkillGaps(jobs, cvSkills)` — **same as Skill Map**, which is wrong |

### Key existing wiring to preserve

- `openRoadmap({ source: "market", ... })` → GrowthPlanPage line 211 maps this to `setSource("market_trends")` ✅
- `openRoadmap({ source: "skill-map", ... })` → GrowthPlanPage line 209 maps this to `setSource("cv_gaps")` ✅
- `analytics.skillAnalytics` is already available in App.jsx (from `useAnalytics` hook)
- `MarketSignalsPage` already receives `skillAnalytics={analytics.skillAnalytics}` from App.jsx

### Files to read before touching

- `frontend/src/utils/skillUtils.js` — `buildSkillGaps` and `categorizeSkill` are exported here
- `frontend/src/pages/GrowthPlanPage.jsx` — `getGapsForSource` is currently inline (lines 20-38)
- `frontend/src/App.jsx` — GrowthPlanPage route (lines 519-534), MarketSignalsPage route (lines 551-563)
- `frontend/src/styles/ui.js` — all Lattice tokens; use these, not raw Tailwind

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/utils/gapSourceUtils.js` | **CREATE** | Pure `getGapsForSource(source, ctx)` — maps source + context → gap array |
| `frontend/src/utils/__tests__/gapSourceUtils.test.js` | **CREATE** | Unit tests: all 4 sources, analytics fallback |
| `frontend/src/pages/GrowthPlanPage.jsx` | **MODIFY** | Import from gapSourceUtils, add `skillAnalytics` prop, update SOURCE_OPTIONS label |
| `frontend/src/pages/SkillMapPage.jsx` | **MODIFY** | Update section eyebrow + helper text; add aria-labels to bars |
| `frontend/src/pages/MarketSignalsPage.jsx` | **MODIFY** | Add `openRoadmap` prop, clearer description, aria-labels, "Use in Growth Plan" button |
| `frontend/src/App.jsx` | **MODIFY** | Add `skillAnalytics` to GrowthPlanPage route; add `openRoadmap` to MarketSignalsPage route |
| `docs/superpowers/plans/MASTER_PLAN.md` | **MODIFY** | Mark Phase 5 ✅ DONE, record bundle gzip size |

---

## Task 1: Create and test `getGapsForSource` utility (TDD)

**Files:**
- Create: `frontend/src/utils/gapSourceUtils.js`
- Create: `frontend/src/utils/__tests__/gapSourceUtils.test.js`

---

- [ ] **Step 1: Create the test file with failing tests**

Create `frontend/src/utils/__tests__/gapSourceUtils.test.js` with this content:

```js
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
```

- [ ] **Step 2: Run tests — confirm all fail**

```powershell
npm run test -- --reporter=verbose 2>&1 | Select-String -Pattern "gapSourceUtils|FAIL|PASS|Cannot find"
```

Expected: FAIL with `Cannot find module '../gapSourceUtils'`

- [ ] **Step 3: Create the utility file**

Create `frontend/src/utils/gapSourceUtils.js` with this content:

```js
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
```

- [ ] **Step 4: Run tests — confirm all pass**

```powershell
npm run test -- --reporter=verbose 2>&1 | Select-String -Pattern "gapSourceUtils|✓|✗|FAIL|PASS"
```

Expected: 8 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/utils/gapSourceUtils.js frontend/src/utils/__tests__/gapSourceUtils.test.js
git commit -m "feat: extract getGapsForSource utility with portfolio analytics support (8 tests)"
```

---

## Task 2: Update GrowthPlanPage to use portfolio analytics for market_trends

**Files:**
- Modify: `frontend/src/pages/GrowthPlanPage.jsx`

**What changes:**
1. Remove inline `getGapsForSource` (lines 20-38) — import from `gapSourceUtils` instead
2. Add `skillAnalytics` to the destructured props
3. Pass `skillAnalytics` into `getGapsForSource` call
4. Rename `market_trends` label in `SOURCE_OPTIONS` from "Market Trends" → "Market Signals" and update desc
5. Add toast in `handleSourceChange` when user picks `market_trends` with no analytics loaded

---

- [ ] **Step 1: Replace the inline `getGapsForSource` with the import**

In `frontend/src/pages/GrowthPlanPage.jsx`, replace lines 20-38:

```js
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

with this import at the top of the file (after existing imports):

```js
import { getGapsForSource } from "../utils/gapSourceUtils";
```

- [ ] **Step 2: Update SOURCE_OPTIONS**

Find:
```js
const SOURCE_OPTIONS = [
  { id: "cv_gaps",       label: "CV Gaps",       desc: "Skills your CV is missing from loaded jobs" },
  { id: "market_trends", label: "Market Trends",  desc: "Top skills by demand across all jobs" },
  { id: "target_job",    label: "Target Job",     desc: "Gap between your CV and a specific job" },
  { id: "similar_roles", label: "Similar Roles",  desc: "Skills missing from your recommended jobs" },
];
```

Replace with:
```js
const SOURCE_OPTIONS = [
  { id: "cv_gaps",       label: "CV Gaps",        desc: "Skills your CV is missing from loaded jobs" },
  { id: "market_trends", label: "Market Signals",  desc: "Portfolio-wide missing skills across all your CVs" },
  { id: "target_job",    label: "Target Job",      desc: "Gap between your CV and a specific job" },
  { id: "similar_roles", label: "Similar Roles",   desc: "Skills missing from your recommended jobs" },
];
```

- [ ] **Step 3: Add `skillAnalytics` to the component props**

Find the destructured props block:
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

Replace with:
```js
export default function GrowthPlanPage({
  analyzeGaps,
  jobs,
  onRoadmapIntentConsumed,
  recommendations,
  roadmapIntent,
  roadmapStorageUserId,
  selectedCv,
  setStatus,
  skillAnalytics,
}) {
```

- [ ] **Step 4: Pass `skillAnalytics` into `getGapsForSource` call**

Find:
```js
const sourceGaps = getGapsForSource(source, { jobs, uniqueJobs, recommendations, selectedCv, targetJob });
```

Replace with:
```js
const sourceGaps = getGapsForSource(source, { jobs, uniqueJobs, recommendations, selectedCv, targetJob, skillAnalytics });
```

- [ ] **Step 5: Add toast in `handleSourceChange` for unloaded analytics**

Find the `handleSourceChange` function body. After the existing `similar_roles` toast block, add:

```js
if (newSource === "market_trends" && !skillAnalytics?.data?.length) {
  setStatus("Market Signals not loaded yet. Visit the Market Signals page and click Refresh analytics.");
}
```

The full `handleSourceChange` should look like:

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

  if (newSource === "similar_roles" && recommendations.filter((r) => r?._id).length === 0) {
    setStatus("No recommended jobs loaded. Go to Jobs and load recommendations first.");
  }
  if (newSource === "target_job" && uniqueJobs.length === 0) {
    setStatus("No jobs loaded. Fetch jobs from the Jobs page first.");
  }
  if (newSource === "market_trends" && !skillAnalytics?.data?.length) {
    setStatus("Market Signals not loaded yet. Visit the Market Signals page and click Refresh analytics.");
  }
}
```

- [ ] **Step 6: Remove `buildSkillGaps` from GrowthPlanPage imports if no longer used**

Check the import line:
```js
import { buildSkillGaps, categorizeSkill } from "../utils/skillUtils";
```

After removing `getGapsForSource`, `buildSkillGaps` and `categorizeSkill` are no longer used directly in GrowthPlanPage. Remove them from the import:

```js
import { ui } from "../styles/ui";
import { getMilestoneData } from "../data/skillRoadmaps";
import { getGapsForSource } from "../utils/gapSourceUtils";
import TimelineRow from "../components/roadmap/TimelineRow";
```

Keep the other imports (`useEffect`, `useMemo`, etc.) as-is.

- [ ] **Step 7: Confirm build passes**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|warning|built in"
```

Expected: no errors (chunk size warning is acceptable).

- [ ] **Step 8: Commit**

```powershell
git add frontend/src/pages/GrowthPlanPage.jsx
git commit -m "feat: wire portfolio analytics into Growth Plan market_trends source"
```

---

## Task 3: Clarify Skill Map section labels and add a11y

**Files:**
- Modify: `frontend/src/pages/SkillMapPage.jsx`

**What changes:**
1. Update the eyebrow on the frequency bars section: "Most-needed skills you don't have" → "Your CV vs loaded jobs"
2. Add a helper text line explaining the data source
3. Add `aria-label` to each progress bar `div` so screen readers can read the bar value

---

- [ ] **Step 1: Update the frequency bars section eyebrow and add helper text**

Find this block in `SkillMapPage.jsx` (around line 201-210):

```jsx
<section className={ui.panel}>
  <div className={ui.sectionHead}>
    <div>
      <p className={ui.eyebrow}>Most-needed skills you don't have</p>
      <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
        Market frequency
      </h2>
    </div>
    <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
      {gaps.length} gaps
    </span>
  </div>
```

Replace with:

```jsx
<section className={ui.panel}>
  <div className={ui.sectionHead}>
    <div>
      <p className={ui.eyebrow}>Your CV vs loaded jobs</p>
      <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
        CV skill gap frequency
      </h2>
      <p className="mt-0.5 text-[13px] text-[#6B6B72]">
        Skills required by the {uniqueJobs.length} job{uniqueJobs.length === 1 ? "" : "s"} you have loaded, filtered to those missing from &ldquo;{selectedCv?.title || "your CV"}&rdquo;.
      </p>
    </div>
    <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
      {gaps.length} gaps
    </span>
  </div>
```

- [ ] **Step 2: Add `aria-label` to frequency bar progress elements**

In the same section, find each progress bar `div`:

```jsx
<div className="h-[4px] overflow-hidden rounded-[2px] bg-[#E8E3D7]">
  <div
    className="h-full rounded-[2px] transition-all"
    style={{
      width: `${Math.round((g.count / maxCount) * 100)}%`,
      background: CAT_COLORS[g.cat]?.bar || "#5B2A86",
    }}
  />
</div>
```

Replace with:

```jsx
<div
  className="h-[4px] overflow-hidden rounded-[2px] bg-[#E8E3D7]"
  role="img"
  aria-label={`${g.skill}: missing from ${g.count} job${g.count === 1 ? "" : "s"}`}
>
  <div
    className="h-full rounded-[2px] transition-all"
    style={{
      width: `${Math.round((g.count / maxCount) * 100)}%`,
      background: CAT_COLORS[g.cat]?.bar || "#5B2A86",
    }}
  />
</div>
```

- [ ] **Step 3: Verify build**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|warning|built in"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```powershell
git add frontend/src/pages/SkillMapPage.jsx
git commit -m "feat: clarify Skill Map section labels and add a11y to frequency bars"
```

---

## Task 4: Clarify Market Signals labels, add a11y, add "Use in Growth Plan" button

**Files:**
- Modify: `frontend/src/pages/MarketSignalsPage.jsx`

**What changes:**
1. Add `openRoadmap` to props
2. Improve the "Missing skill frequency" section description to make portfolio-wide nature explicit
3. Add `role="img"` + `aria-label` to each frequency bar
4. Add "Use in Growth Plan" button when analytics data is present

---

- [ ] **Step 1: Add `FiMap` to the react-icons import**

Find:
```js
import { FiRefreshCw } from "react-icons/fi";
```

Replace with:
```js
import { FiMap, FiRefreshCw } from "react-icons/fi";
```

- [ ] **Step 2: Add `openRoadmap` to destructured props**

Find:
```js
export default function MarketSignalsPage({
  applications,
  jobs,
  recommendations,
  skillAnalytics,
  trendAnalytics,
  loadAnalytics,
}) {
```

Replace with:
```js
export default function MarketSignalsPage({
  applications,
  jobs,
  loadAnalytics,
  openRoadmap,
  recommendations,
  skillAnalytics,
  trendAnalytics,
}) {
```

- [ ] **Step 3: Update the "Missing skill frequency" section description and add button**

Find the `sectionHead` div inside the "Missing skill frequency" section:

```jsx
<div className={ui.sectionHead}>
  <div>
    <p className={ui.eyebrow}>
      {meta
        ? `${meta.cvCount} CV${meta.cvCount === 1 ? "" : "s"} × ${meta.jobCount} job${meta.jobCount === 1 ? "" : "s"}`
        : "All CVs × all jobs"}
    </p>
    <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
      Missing skill frequency
    </h2>
    <p className="mt-0.5 text-[13px] text-[#6B6B72]">
      {meta
        ? `Skills your CVs are missing across ${meta.comparisons} CV–job comparisons.`
        : "Skills required by jobs that your CVs don't currently cover."}
    </p>
  </div>
  {meta && (
    <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
      {skillFrequency.length} skills
    </span>
  )}
</div>
```

Replace with:

```jsx
<div className={ui.sectionHead}>
  <div>
    <p className={ui.eyebrow}>
      {meta
        ? `${meta.cvCount} CV${meta.cvCount === 1 ? "" : "s"} × ${meta.jobCount} job${meta.jobCount === 1 ? "" : "s"} — portfolio-wide`
        : "All CVs × all jobs — portfolio-wide"}
    </p>
    <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
      Missing skill frequency
    </h2>
    <p className="mt-0.5 text-[13px] text-[#6B6B72]">
      {meta
        ? `All ${meta.cvCount} of your CVs compared against ${meta.jobCount} jobs in the database — ${meta.comparisons} CV–job pair${meta.comparisons === 1 ? "" : "s"}.`
        : "All your CVs compared against every job in the database."}
    </p>
  </div>
  <div className="flex shrink-0 items-center gap-2">
    {meta && (
      <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
        {skillFrequency.length} skills
      </span>
    )}
    {typeof openRoadmap === "function" && skillFrequency.length > 0 && (
      <button
        className={ui.buttonSecondary}
        type="button"
        onClick={() => {
          const topSkills = skillFrequency.slice(0, 3);
          openRoadmap({
            source: "market",
            selectedSkills: topSkills.map((s) => s.skill),
            recommendedSkills: topSkills.map((s) => ({ skill: s.skill, count: s.missingCount, cat: "technical" })),
            label: "Based on portfolio-wide Market Signals",
          });
        }}
      >
        <FiMap size={14} strokeWidth={1.5} />
        Use in Growth Plan
      </button>
    )}
  </div>
</div>
```

- [ ] **Step 4: Add `aria-label` to Market Signals frequency bars**

Find the frequency bar render loop in the "Missing skill frequency" section:

```jsx
<div className="h-[4px] overflow-hidden rounded-[2px] bg-[#E8E3D7]">
  <div
    className="h-full rounded-[2px] transition-all"
    style={{
      width: `${Math.round((item.missingCount / maxMissing) * 100)}%`,
      background: "var(--c-cobalt)",
    }}
  />
</div>
```

Replace with:

```jsx
<div
  className="h-[4px] overflow-hidden rounded-[2px] bg-[#E8E3D7]"
  role="img"
  aria-label={`${item.skill}: missing from ${item.missingCount} CV–job comparison${item.missingCount === 1 ? "" : "s"}`}
>
  <div
    className="h-full rounded-[2px] transition-all"
    style={{
      width: `${Math.round((item.missingCount / maxMissing) * 100)}%`,
      background: "var(--c-cobalt)",
    }}
  />
</div>
```

- [ ] **Step 5: Verify build**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|warning|built in"
```

Expected: no errors.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/pages/MarketSignalsPage.jsx
git commit -m "feat: clarify Market Signals labels, add a11y, add Use in Growth Plan button"
```

---

## Task 5: Wire new props in App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

**What changes:**
1. Add `skillAnalytics={analytics.skillAnalytics}` to the `GrowthPlanPage` route element
2. Add `openRoadmap={openRoadmap}` to the `MarketSignalsPage` route element

---

- [ ] **Step 1: Add `skillAnalytics` to GrowthPlanPage route**

Find the GrowthPlanPage route element (around line 519-534):

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

Replace with:

```jsx
<GrowthPlanPage
  analyzeGaps={growth.analyzeGaps}
  jobs={jobs.jobs}
  matchResult={growth.matchResult}
  onRoadmapIntentConsumed={() => growth.setRoadmapIntent(null)}
  recommendations={jobs.recommendations}
  roadmapIntent={growth.roadmapIntent}
  roadmapStorageUserId={auth.user?.email || auth.user?._id || auth.user?.id}
  selectedCv={cvs.selectedCv}
  setStatus={setStatus}
  skillAnalytics={analytics.skillAnalytics}
/>
```

- [ ] **Step 2: Add `openRoadmap` to MarketSignalsPage route**

Find the MarketSignalsPage route element (around line 551-563):

```jsx
<MarketSignalsPage
  applications={applications.applications}
  jobs={jobs.jobs}
  recommendations={jobs.recommendations}
  skillAnalytics={analytics.skillAnalytics}
  trendAnalytics={analytics.trendAnalytics}
  loadAnalytics={analytics.loadAnalytics}
/>
```

Replace with:

```jsx
<MarketSignalsPage
  applications={applications.applications}
  jobs={jobs.jobs}
  loadAnalytics={analytics.loadAnalytics}
  openRoadmap={openRoadmap}
  recommendations={jobs.recommendations}
  skillAnalytics={analytics.skillAnalytics}
  trendAnalytics={analytics.trendAnalytics}
/>
```

- [ ] **Step 3: Verify full build**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|warning|built in"
```

Expected: no errors. Note the new gzip size from the output line that says `dist/assets/index-*.js`.

- [ ] **Step 4: Run all tests to confirm nothing regressed**

```powershell
npm run test -- --reporter=verbose 2>&1 | Select-String -Pattern "✓|✗|FAIL|PASS|Tests"
```

Expected: all tests pass (including the 8 new gapSourceUtils tests).

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/App.jsx
git commit -m "feat: pass skillAnalytics to GrowthPlanPage and openRoadmap to MarketSignalsPage"
```

---

## Task 6: Build verification and MASTER_PLAN update

**Files:**
- Modify: `docs/superpowers/plans/MASTER_PLAN.md`

---

- [ ] **Step 1: Run final build and capture size**

```powershell
npm run build 2>&1 | Select-String -Pattern "gzip|built in|error"
```

Note the gzip KB from the output.

- [ ] **Step 2: Run all tests one final time**

```powershell
npm run test 2>&1 | Select-String -Pattern "Tests|FAIL|PASS"
```

Expected: all tests pass.

- [ ] **Step 3: Update MASTER_PLAN.md Phase Status Overview**

In `docs/superpowers/plans/MASTER_PLAN.md`, find:

```markdown
| 5 | Skill Map vs Market Signals clarity | ⏳ PENDING | — |
```

Replace with:

```markdown
| 5 | Skill Map vs Market Signals clarity | ✅ DONE | ✅ Clean (gzip: ___ KB) |
```

Fill in the actual gzip KB from Step 1.

- [ ] **Step 4: Update Phase 5 task checklist in MASTER_PLAN.md**

Find the Phase 5 section tasks and mark each completed item with `[x]`:

```markdown
- [x] Inspect data source for Skill Map "Most-needed skills you don't have"
- [x] Inspect data source for Market Signals "Missing skills freq."
- [x] If sources are truly different, rename labels
- [x] Add tooltips/helper text explaining the difference
- [x] Allow Growth Plan to be generated from either source
```

Also fill in the build size in the Build & size block:

```markdown
- [x] Run `npm run build` and fix all errors
- [x] Record new bundle gzip size here: ___ KB
- [x] Update this file: mark Phase 5 ✅ DONE
```

- [ ] **Step 5: Commit**

```powershell
git add docs/superpowers/plans/MASTER_PLAN.md
git commit -m "docs: mark Phase 5 done in MASTER_PLAN"
```

---

## Self-Review

### Spec coverage check

| Requirement | Task | Status |
|-------------|------|--------|
| Inspect Skill Map data source | Confirmed: selected CV × frontend jobs | ✅ |
| Inspect Market Signals data source | Confirmed: ALL CVs × ALL MongoDB jobs | ✅ |
| Rename labels if different | Task 2 (SOURCE_OPTIONS), Task 3 (SkillMap eyebrow) | ✅ |
| Add helper text explaining difference | Task 3 (SkillMap), Task 4 (MarketSignals) | ✅ |
| Allow Growth Plan from either source | Task 1-2 (market_trends wired to analytics), Task 4 (button) | ✅ |
| Tooltips keyboard-triggerable | Used plain visible text (WCAG-compliant, no hover-only) | ✅ |
| Chart elements have aria-label | Task 3 + Task 4 (bars get role="img" + aria-label) | ✅ |
| Unit test: Skill Map returns CV-scoped | `cv_gaps` test in gapSourceUtils.test.js | ✅ |
| Unit test: Market Signals portfolio-wide | `market_trends` tests with skillAnalytics | ✅ |
| Verify two sources differ with seed data | `market_trends and cv_gaps: return different results` test | ✅ |

### Placeholder scan

No TBDs, no "add appropriate" phrases, no "similar to Task N" references.

### Type consistency

- `getGapsForSource` signature in gapSourceUtils.js matches calls in GrowthPlanPage and tests
- `openRoadmap` receives `{ source, selectedSkills, recommendedSkills, label }` — same shape used in SkillMapPage's existing call
- `skillAnalytics.data` shape `{ skill: string, missingCount: number }` matches the backend `GET /api/analytics/skills` response (confirmed in `analyticsRoutes.js`)
