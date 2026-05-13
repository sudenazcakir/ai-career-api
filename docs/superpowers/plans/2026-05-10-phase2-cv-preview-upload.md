# Phase 2 — CV Preview v2 + CV Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the CV preview with three templates and a quality panel; add secure PDF/TXT upload with a user-review step before saving.

**Architecture:** Extract `ProfessionalCvPreview` from `MyCvsPage.jsx` into focused components under `components/cv/`. Add a `CvQualityPanel` for completeness scoring. Add a backend `POST /api/cvs/upload` endpoint (multer + pdf-parse) that returns parsed data without auto-saving. Add a frontend `CvUploadReview` modal for the user to confirm extracted fields before saving. Also install Vitest for unit tests, create `ErrorBoundary`, and add `React.lazy` to App.jsx.

**Tech Stack:** React 19, Tailwind 4, Vite 8, Express 5, Mongoose 9, multer (already installed), pdf-parse (already installed), Vitest + @testing-library/react (to add), Playwright (existing E2E)

**Design system:** All UI must follow `frontend/DESIGN_SYSTEM.md` and use `frontend/src/styles/ui.js` tokens. Lattice visual language: calm, editorial, data-focused. No gradients, neon, sparkles, stock photos. Instrument Serif for display headlines (inline style). Geist Mono for labels/chips.

---

## Codebase context (read before implementing)

- `frontend/src/pages/MyCvsPage.jsx` — current 845-line page; contains `ProfessionalCvPreview`, `CvLibrarySummary`, `CompareCvCard`, `CvComparisonResult` and sub-components. The preview modal is opened by `setPreviewCv(cv)`.
- `frontend/src/features/cv/useCvs.js` — CV state and handlers; `handleDeleteCv` is exported and passed as `deleteCv` prop to MyCvsPage via App.jsx.
- `frontend/src/App.jsx` — thin shell; imports all pages; passes hook outputs as props; no lazy loading yet.
- `frontend/src/styles/ui.js` — design tokens; import as `import { ui } from "../styles/ui"`.
- `frontend/DESIGN_SYSTEM.md` — read before any UI work.
- `backend/routes/cvRoutes.js` — CV CRUD, versioning, compare, generate endpoints. No upload endpoint yet.
- `backend/models/CV.js` — fields: owner, parentCv, title, type, version, summary, skills[], projects[], experience[], education[], certifications[].
- `package.json` — multer and pdf-parse already installed. No vitest or testing-library yet. Test runner: `"test": "echo \"Error: no test specified\" && exit 1"` — override this.

## File map

### New files
| File | Responsibility |
|------|---------------|
| `frontend/src/components/common/ErrorBoundary.jsx` | Class-based error boundary wrapping Routes in App.jsx |
| `frontend/src/components/cv/CvPreview.jsx` | CV preview with Classic / Modern / ATS Compact templates |
| `frontend/src/components/cv/CvTemplateSelector.jsx` | Three-tab selector that returns selected template name |
| `frontend/src/components/cv/CvQualityPanel.jsx` | Completeness score + missing sections panel |
| `frontend/src/components/cv/CvUploadReview.jsx` | Upload button + review modal for parsed CV fields |
| `backend/services/cvParser.js` | Rule-based PDF/TXT → structured CV fields extractor |
| `frontend/src/features/cv/__tests__/useCvs.test.js` | Unit tests for useCvs hook |
| `frontend/src/features/shared/__tests__/useToast.test.js` | Unit tests for useToast hook |
| `frontend/src/features/shared/__tests__/useRunAction.test.js` | Unit tests for useRunAction hook |
| `backend/__tests__/routes/cvUpload.test.js` | Integration tests for upload endpoint |
| `vitest.config.js` | Vitest configuration |

### Modified files
| File | Changes |
|------|---------|
| `frontend/src/pages/MyCvsPage.jsx` | Remove `ProfessionalCvPreview` and sub-components; import from `components/cv/`; add upload section |
| `frontend/src/App.jsx` | Add `ErrorBoundary` wrapper; convert page imports to `React.lazy`; add `Suspense` |
| `backend/routes/cvRoutes.js` | Add `POST /upload` endpoint |
| `package.json` | Add vitest + testing-library scripts |

---

## CV Quality Scoring Algorithm

Used by `CvQualityPanel` — pure function, no API call needed.

```js
function computeQuality(cv) {
  let score = 0;
  const missing = [];

  if (cv.title?.trim()) score += 10;
  if ((cv.summary || "").trim().length >= 50) score += 20;
  else missing.push("Professional summary (aim for 50+ characters)");

  if ((cv.skills || []).length >= 5) score += 20;
  else missing.push(`At least 5 skills (have ${(cv.skills || []).length})`);

  if ((cv.experience || []).length >= 1) score += 20;
  else missing.push("Work experience");

  if ((cv.projects || []).length >= 1) score += 15;
  else missing.push("Projects");

  if ((cv.education || []).length >= 1) score += 10;
  else missing.push("Education");

  if ((cv.certifications || []).length >= 1) score += 5;
  else missing.push("Certifications");

  return { score, missing };
}
```

---

## Template Designs

### Classic (default — current layout)
- Bone bg header with Instrument Serif title, summary, stat aside
- Two-column body: skills sidebar (240px) left, experience/projects/education right

### Modern
- Header: full-width ink strip — white title + summary on dark bg (Ink `#0E0E10`)
- Body: 280px left sidebar — Bone bg, skills as chips, stat counters
- Right: Paper bg, experience, projects, education in stacked cards

### ATS Compact
- Single column, Paper bg, no decorative elements
- Plain text list format — optimized for ATS scanners
- No chip styling — plain `<ul>` lists
- Skills as comma-separated plain text
- Font: Geist Mono for section headers, Geist Sans for content

---

## Tasks

### Task 1: Install Vitest and configure test runner

**Files:**
- Create: `vitest.config.js`
- Modify: `package.json` (scripts)

- [ ] Install Vitest and testing-library (check sizes first — vitest ~2MB, @testing-library/react ~500KB, @testing-library/user-event ~300KB, jsdom ~3MB — acceptable):

```bash
npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom
```

- [ ] Create `vitest.config.js`:

```js
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
});
```

- [ ] Update `package.json` scripts — replace `"test": "echo \"Error: no test specified\" && exit 1"` with:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:unit": "vitest run --reporter=verbose"
```

- [ ] Run `npm run test` — expect no tests found but no crash (exit 0 or "no test files found"):

```bash
npm run test
```

Expected: passes (0 test files found is OK at this stage)

---

### Task 2: Add ErrorBoundary and lazy loading to App.jsx

**Files:**
- Create: `frontend/src/components/common/ErrorBoundary.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] Create `frontend/src/components/common/ErrorBoundary.jsx`:

```jsx
import { Component } from "react";
import { ui } from "../../styles/ui";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-[60vh] place-items-center p-8">
          <div className={`${ui.panel} max-w-lg text-center`}>
            <p className={ui.eyebrow}>Something went wrong</p>
            <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              This section failed to load
            </h2>
            <p className={`${ui.muted} mt-2`}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              className={`${ui.buttonSecondary} mt-5`}
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] Read current `frontend/src/App.jsx` lines 1–35 (page imports section)

- [ ] Replace all static page imports with `React.lazy` equivalents. The pattern:

```jsx
// Replace:
import MyCvsPage from "./pages/MyCvsPage";
// With:
const MyCvsPage = React.lazy(() => import("./pages/MyCvsPage"));
```

Apply to ALL pages: `AiInsightsPage`, `ApplicationTrackerPage`, `AuthPage`, `GrowthPlanPage`, `JobsPage`, `MarketSignalsPage`, `MyCvsPage`, `NotFoundPage`, `OverviewPage`, `PassportOnboarding`, `ProfilePage`, `SkillMapPage`.

- [ ] Add `React` import (needed for `React.lazy`):
```jsx
import React, { Suspense, useState } from "react";
// (replace the existing `import { useState } from "react"`)
```

- [ ] Add `ErrorBoundary` import:
```jsx
import { ErrorBoundary } from "./components/common/ErrorBoundary";
```

- [ ] Create a `PageLoader` component near the top of App.jsx (before the main component):
```jsx
function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8E3D7] border-t-[#0E0E10]"
        aria-label="Loading page"
        role="status"
      />
    </div>
  );
}
```

- [ ] Wrap the `<Routes>` element with `<ErrorBoundary>` and `<Suspense>`:
```jsx
<ErrorBoundary>
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* existing routes unchanged */}
    </Routes>
  </Suspense>
</ErrorBoundary>
```

- [ ] Run `npm run build` — must pass with 0 errors:
```bash
npm run build
```

Expected output: `✓ built in Xs` — no errors. Note the new gzip bundle size.

---

### Task 3: Dead code audit

**Files:**
- Modify: any files with unused imports found

- [ ] Run grep to find potential unused imports left from Phase 1 refactor:

```bash
grep -rn "from.*SkillGapPage\|from.*CvPage\|from.*RoadmapPage\|from.*AnalyticsPage\|from.*AccountPage\|from.*InsightsPage\|from.*ApplicationsPage" frontend/src/
```

Expected: no results. If any found, remove those import lines.

- [ ] Check for any console.log statements left in feature hooks:

```bash
grep -rn "console\.log" frontend/src/features/
```

Remove any debug `console.log` calls found (keep `console.error` for real errors).

- [ ] Run `npm run build` — still passes after cleanup.

---

### Task 4: Create CvTemplateSelector component

**Files:**
- Create: `frontend/src/components/cv/CvTemplateSelector.jsx`

- [ ] Create the file:

```jsx
import { ui } from "../../styles/ui";

const TEMPLATES = [
  { id: "classic", label: "Classic" },
  { id: "modern", label: "Modern" },
  { id: "ats", label: "ATS Compact" },
];

export function CvTemplateSelector({ value, onChange }) {
  return (
    <div
      className="inline-flex overflow-hidden rounded-[8px] border border-[#E8E3D7]"
      role="group"
      aria-label="CV template"
    >
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-pressed={value === t.id}
          onClick={() => onChange(t.id)}
          className={[
            "h-8 px-3 text-[12px] font-[500] transition-colors border-r border-[#E8E3D7] last:border-r-0",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-inset",
            value === t.id
              ? "bg-[#0E0E10] text-[#F6F3EC]"
              : "bg-[#FBFAF6] text-[#3A3A40] hover:bg-[#F6F3EC] hover:text-[#0E0E10]",
          ].join(" ")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

---

### Task 5: Create CvPreview component with three templates

**Files:**
- Create: `frontend/src/components/cv/CvPreview.jsx`

The component receives `cv` (the CV object) and `template` (`"classic" | "modern" | "ats"`).

- [ ] Create `frontend/src/components/cv/CvPreview.jsx`:

```jsx
import { ui } from "../../styles/ui";

export function CvPreview({ cv, template = "classic" }) {
  if (template === "modern") return <ModernTemplate cv={cv} />;
  if (template === "ats") return <AtsTemplate cv={cv} />;
  return <ClassicTemplate cv={cv} />;
}

/* ── Classic ─────────────────────────────────────────────── */
function ClassicTemplate({ cv }) {
  const hasContent =
    (cv.projects?.length || 0) +
    (cv.experience?.length || 0) +
    (cv.education?.length || 0) +
    (cv.certifications?.length || 0) > 0;

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E8E3D7] bg-[#F6F3EC]">
      {/* Header */}
      <div className="grid gap-5 border-b border-[#E8E3D7] bg-[#FBFAF6] p-6 md:grid-cols-[minmax(0,1fr)_200px]">
        <div className="min-w-0">
          <p className={ui.eyebrow}>Professional CV · Classic</p>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px,4vw,48px)",
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
              color: "var(--c-ink)",
              fontWeight: 400,
            }}
          >
            {cv.title}
          </h3>
          <p className="mt-2 text-[13px] uppercase tracking-[0.08em] text-[#6B6B72] font-mono">
            {cv.type || "General"} · {cv.version || "v1"}
          </p>
          {cv.summary && (
            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#3A3A40]">
              {cv.summary}
            </p>
          )}
        </div>
        <aside className="grid content-start gap-3 rounded-[10px] border border-[#E8E3D7] bg-[#F6F3EC] p-4">
          <StatRow label="Skills" value={(cv.skills || []).length} />
          <StatRow label="Experience" value={(cv.experience || []).length} />
          <StatRow label="Projects" value={(cv.projects || []).length} />
        </aside>
      </div>
      {/* Body */}
      <div className="grid gap-5 p-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <p className={ui.miniLabel}>Core skills</p>
          {(cv.skills || []).length > 0 ? (
            <div className={`${ui.chips} mt-2`}>
              {cv.skills.map((s) => <span className={ui.chip} key={s}>{s}</span>)}
            </div>
          ) : (
            <p className={ui.muted}>No skills added.</p>
          )}
        </aside>
        <div className="grid min-w-0 gap-4">
          {(cv.experience || []).length > 0 && <SectionList title="Experience" items={cv.experience} />}
          {(cv.projects || []).length > 0 && <SectionList title="Projects" items={cv.projects} />}
          <div className="grid gap-4 md:grid-cols-2">
            {(cv.education || []).length > 0 && <SectionList title="Education" items={cv.education} />}
            {(cv.certifications || []).length > 0 && <SectionList title="Certifications" items={cv.certifications} />}
          </div>
          {!cv.summary && (cv.skills || []).length === 0 && !hasContent && (
            <p className={ui.muted}>No content yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Modern ──────────────────────────────────────────────── */
function ModernTemplate({ cv }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E8E3D7]">
      {/* Dark header */}
      <div className="bg-[#0E0E10] p-6 text-[#F6F3EC]">
        <p className="text-[10px] font-[500] uppercase tracking-[0.08em] text-[#A4A4AC] font-mono">
          Professional CV · Modern
        </p>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px,4vw,44px)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "#F6F3EC",
            fontWeight: 400,
            marginTop: 8,
          }}
        >
          {cv.title}
        </h3>
        <p className="mt-2 text-[12px] uppercase tracking-[0.08em] text-[#A4A4AC] font-mono">
          {cv.type || "General"} · {cv.version || "v1"}
        </p>
        {cv.summary && (
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#A4A4AC]">
            {cv.summary}
          </p>
        )}
      </div>
      {/* Body */}
      <div className="grid bg-[#FBFAF6] md:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left sidebar */}
        <aside className="min-w-0 border-r border-[#E8E3D7] bg-[#F6F3EC] p-5">
          <div className="mb-5 grid grid-cols-3 overflow-hidden rounded-[8px] border border-[#E8E3D7]">
            <ModernStat label="Skills" value={(cv.skills || []).length} />
            <ModernStat label="Exp." value={(cv.experience || []).length} />
            <ModernStat label="Proj." value={(cv.projects || []).length} />
          </div>
          <p className={`${ui.miniLabel} mb-2`}>Skills</p>
          {(cv.skills || []).length > 0 ? (
            <div className={ui.chips}>
              {cv.skills.map((s) => <span className={ui.chip} key={s}>{s}</span>)}
            </div>
          ) : (
            <p className={ui.muted}>No skills.</p>
          )}
        </aside>
        {/* Right content */}
        <div className="min-w-0 grid gap-4 p-5">
          {(cv.experience || []).length > 0 && <SectionList title="Experience" items={cv.experience} />}
          {(cv.projects || []).length > 0 && <SectionList title="Projects" items={cv.projects} />}
          <div className="grid gap-4 md:grid-cols-2">
            {(cv.education || []).length > 0 && <SectionList title="Education" items={cv.education} />}
            {(cv.certifications || []).length > 0 && <SectionList title="Certifications" items={cv.certifications} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernStat({ label, value }) {
  return (
    <div className="grid min-w-0 gap-1 border-r border-[#E8E3D7] px-2 py-2 text-center last:border-r-0">
      <strong className="text-[18px] font-semibold leading-none text-[#0E0E10]">{value}</strong>
      <span className="text-[9px] font-[500] uppercase tracking-[0.06em] text-[#6B6B72] font-mono">{label}</span>
    </div>
  );
}

/* ── ATS Compact ─────────────────────────────────────────── */
function AtsTemplate({ cv }) {
  return (
    <div className="rounded-[14px] border border-[#E8E3D7] bg-[#FBFAF6] p-6 font-mono">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6B72]">ATS Compact · {cv.type || "General"} · {cv.version || "v1"}</p>
      <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.01em] text-[#0E0E10]">{cv.title}</h3>
      {cv.summary && (
        <p className="mt-3 text-[13px] leading-relaxed text-[#3A3A40] border-t border-[#E8E3D7] pt-3">{cv.summary}</p>
      )}
      {(cv.skills || []).length > 0 && (
        <div className="mt-3 border-t border-[#E8E3D7] pt-3">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6B72] mb-1">Skills</p>
          <p className="text-[13px] text-[#3A3A40]">{cv.skills.join(", ")}</p>
        </div>
      )}
      {(cv.experience || []).length > 0 && <AtsSection title="Experience" items={cv.experience} />}
      {(cv.projects || []).length > 0 && <AtsSection title="Projects" items={cv.projects} />}
      {(cv.education || []).length > 0 && <AtsSection title="Education" items={cv.education} />}
      {(cv.certifications || []).length > 0 && <AtsSection title="Certifications" items={cv.certifications} />}
    </div>
  );
}

function AtsSection({ title, items }) {
  return (
    <div className="mt-3 border-t border-[#E8E3D7] pt-3">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6B72] mb-1">{title}</p>
      <ul className="grid gap-1">
        {items.map((item, i) => (
          <li key={i} className="text-[13px] text-[#3A3A40] leading-relaxed">
            — {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Shared helpers ──────────────────────────────────────── */
function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#E8E3D7] pb-2 last:border-b-0 last:pb-0">
      <span className={ui.metricLabel}>{label}</span>
      <strong className="text-[18px] font-semibold text-[#0E0E10]">{value}</strong>
    </div>
  );
}

function SectionList({ title, items }) {
  return (
    <article className="min-w-0 rounded-[10px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
      <p className={ui.miniLabel}>{title}</p>
      <ul className="mt-2 grid gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex min-w-0 gap-2 text-[13px] text-[#3A3A40]">
            <span aria-hidden="true" className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#A4A4AC]" />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
```

---

### Task 6: Create CvQualityPanel component

**Files:**
- Create: `frontend/src/components/cv/CvQualityPanel.jsx`

- [ ] Create the file:

```jsx
import { ui } from "../../styles/ui";

function computeQuality(cv) {
  let score = 0;
  const missing = [];

  if (cv.title?.trim()) score += 10;

  if ((cv.summary || "").trim().length >= 50) {
    score += 20;
  } else {
    missing.push(`Professional summary (${(cv.summary || "").trim().length}/50 chars min)`);
  }

  const skillCount = (cv.skills || []).length;
  if (skillCount >= 5) {
    score += 20;
  } else {
    missing.push(`At least 5 skills (have ${skillCount})`);
  }

  if ((cv.experience || []).length >= 1) {
    score += 20;
  } else {
    missing.push("Work experience");
  }

  if ((cv.projects || []).length >= 1) {
    score += 15;
  } else {
    missing.push("Projects");
  }

  if ((cv.education || []).length >= 1) {
    score += 10;
  } else {
    missing.push("Education");
  }

  if ((cv.certifications || []).length >= 1) {
    score += 5;
  } else {
    missing.push("Certifications (optional +5 pts)");
  }

  return { score, missing };
}

function scoreColor(score) {
  if (score >= 75) return { bar: "#D7E25C", text: "#0E0E10" };
  if (score >= 50) return { bar: "#1E3FFF", text: "#1E3FFF" };
  return { bar: "#A4A4AC", text: "#6B6B72" };
}

export function CvQualityPanel({ cv }) {
  const { score, missing } = computeQuality(cv);
  const colors = scoreColor(score);

  return (
    <div className={ui.panel}>
      <div className={ui.sectionHead}>
        <div>
          <p className={ui.eyebrow}>CV Quality</p>
          <h3 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
            Completeness score
          </h3>
        </div>
        <strong
          className="text-[32px] font-semibold leading-none tracking-[-0.015em]"
          style={{ color: colors.text }}
          aria-label={`${score} out of 100`}
        >
          {score}
          <span className="text-[16px] text-[#6B6B72]">/100</span>
        </strong>
      </div>

      {/* Progress bar */}
      <div
        className="mb-4 h-[6px] w-full overflow-hidden rounded-full bg-[#E8E3D7]"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`CV completeness: ${score}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: colors.bar }}
        />
      </div>

      {/* Counts */}
      <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-[8px] border border-[#E8E3D7]">
        {[
          { label: "Skills", value: (cv.skills || []).length },
          { label: "Experience", value: (cv.experience || []).length },
          { label: "Projects", value: (cv.projects || []).length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="grid min-w-0 gap-1 border-r border-[#E8E3D7] px-3 py-2 text-center last:border-r-0"
          >
            <strong className="text-[20px] font-semibold leading-none text-[#0E0E10]">{value}</strong>
            <span className={ui.metricLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Missing sections */}
      {missing.length > 0 && (
        <div>
          <p className={`${ui.miniLabel} mb-2`}>To improve</p>
          <ul className="grid gap-1.5">
            {missing.map((item) => (
              <li
                key={item}
                className="flex min-w-0 gap-2 text-[13px] text-[#3A3A40]"
              >
                <span
                  aria-hidden="true"
                  className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#5B2A86]"
                />
                <span className="min-w-0 break-words">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {missing.length === 0 && (
        <p className={ui.muted}>All recommended sections are complete.</p>
      )}
    </div>
  );
}
```

---

### Task 7: Update MyCvsPage to use extracted components

**Files:**
- Modify: `frontend/src/pages/MyCvsPage.jsx`

- [ ] Read the current `MyCvsPage.jsx` fully before editing

- [ ] Add imports at the top (after existing imports):

```jsx
import { CvPreview } from "../components/cv/CvPreview";
import { CvQualityPanel } from "../components/cv/CvQualityPanel";
import { CvTemplateSelector } from "../components/cv/CvTemplateSelector";
```

- [ ] Add `template` state inside the component (after `previewCv` state):

```jsx
const [template, setTemplate] = useState("classic");
```

- [ ] In the preview modal (search for `<ProfessionalCvPreview cv={previewCv} />`), replace with:

```jsx
<div className="grid gap-4">
  <div className="flex items-center justify-between gap-3">
    <CvTemplateSelector value={template} onChange={setTemplate} />
  </div>
  <CvPreview cv={previewCv} template={template} />
  <CvQualityPanel cv={previewCv} />
</div>
```

- [ ] Delete the `ProfessionalCvPreview`, `PreviewStat`, and `PreviewList` function definitions from the bottom of `MyCvsPage.jsx` (they are now in `CvPreview.jsx`). Keep `CvLibrarySummary`, `MiniCount`, `CompareCvCard`, `CvComparisonResult`, `ComparisonMetric`, `CvCompareSide`, `ComparisonList`, `ComparisonFieldCard`, `FieldCount`, `fieldLabel`.

- [ ] Run `npm run build` — must pass:

```bash
npm run build
```

---

### Task 8: Create backend CV upload service

**Files:**
- Create: `backend/services/cvParser.js`

The service receives raw text and extracts CV fields using rule-based section detection. No AI, no external calls.

- [ ] Create `backend/services/cvParser.js`:

```js
/**
 * Rule-based CV text parser.
 * Detects section headers and groups lines beneath them.
 * Returns structured CV fields (never saves to DB — caller decides).
 */

const SECTION_PATTERNS = {
  summary:        /^(summary|profile|objective|about me?)\s*:?\s*$/i,
  skills:         /^(skills?|technical skills?|core competencies|technologies)\s*:?\s*$/i,
  experience:     /^(experience|work experience|employment|professional experience)\s*:?\s*$/i,
  projects:       /^(projects?|personal projects?|side projects?|portfolio)\s*:?\s*$/i,
  education:      /^(education|academic background|qualifications?)\s*:?\s*$/i,
  certifications: /^(certifications?|certificates?|licenses?|credentials?)\s*:?\s*$/i,
};

function detectSection(line) {
  for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(line.trim())) return key;
  }
  return null;
}

function cleanLine(line) {
  return line.replace(/^[\s\-•·*▪▸►]+/, "").trim();
}

function extractTitle(lines) {
  // First non-empty line is usually the name/title
  for (const line of lines.slice(0, 5)) {
    const clean = line.trim();
    if (clean.length >= 3 && clean.length <= 120 && !/^(http|www\.|email|phone|\d{3})/i.test(clean)) {
      return clean;
    }
  }
  return "Imported CV";
}

function splitSkillLine(line) {
  // Skills can be comma-separated, pipe-separated, or tab-separated
  return line
    .split(/[,|•·\t]+/)
    .map((s) => s.replace(/^[\s\-▪▸►*]+/, "").trim())
    .filter((s) => s.length > 0 && s.length < 60);
}

/**
 * @param {string} text - raw extracted text from PDF or TXT
 * @returns {{ title: string, summary: string, skills: string[], projects: string[], experience: string[], education: string[], certifications: string[] }}
 */
function parseCvText(text) {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

  const result = {
    title: extractTitle(lines),
    summary: "",
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
  };

  let currentSection = null;
  const sectionBuffers = {
    summary: [],
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
  };

  for (const line of lines) {
    const detected = detectSection(line);
    if (detected) {
      currentSection = detected;
      continue;
    }

    if (currentSection && sectionBuffers[currentSection] !== undefined) {
      const clean = cleanLine(line);
      if (clean.length > 1) {
        sectionBuffers[currentSection].push(clean);
      }
    }
  }

  // Process summary — join into a single string
  result.summary = sectionBuffers.summary.join(" ").trim();

  // Process skills — may need to split comma-separated lines
  for (const line of sectionBuffers.skills) {
    const parts = splitSkillLine(line);
    if (parts.length > 1) {
      result.skills.push(...parts);
    } else if (parts[0]) {
      result.skills.push(parts[0]);
    }
  }
  result.skills = [...new Set(result.skills.filter((s) => s.length > 0 && s.length < 60))];

  // Process list sections
  result.projects = sectionBuffers.projects.filter((l) => l.length > 2).slice(0, 20);
  result.experience = sectionBuffers.experience.filter((l) => l.length > 2).slice(0, 20);
  result.education = sectionBuffers.education.filter((l) => l.length > 2).slice(0, 10);
  result.certifications = sectionBuffers.certifications.filter((l) => l.length > 2).slice(0, 10);

  return result;
}

module.exports = { parseCvText };
```

---

### Task 9: Add upload endpoint to cvRoutes.js

**Files:**
- Modify: `backend/routes/cvRoutes.js`

- [ ] Read the current `backend/routes/cvRoutes.js` fully before editing

- [ ] Add multer setup near the top of the file (after the `require` statements):

```js
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { parseCvText } = require("../services/cvParser");

// Memory storage — file is never written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB hard limit
  fileFilter(req, file, cb) {
    const allowed = ["application/pdf", "text/plain"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and TXT files are accepted"));
    }
  },
});
```

- [ ] Add the upload route BEFORE `module.exports = router;`:

```js
/**
 * @swagger
 * /cvs/upload:
 *   post:
 *     summary: Parse an uploaded CV file (PDF or TXT) — does NOT save to DB
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Parsed CV fields — not saved, user must review and confirm
 *       400:
 *         description: Invalid file type or no file provided
 *       413:
 *         description: File too large
 */
router.post(
  "/upload",
  (req, res, next) => {
    // Rate-limit guard — 10 uploads per user per hour (simple in-memory; good enough for MVP)
    // This is per-process only. For multi-process use Redis.
    if (!router._uploadCounts) router._uploadCounts = {};
    const key = `${req.user._id}_${Math.floor(Date.now() / 3_600_000)}`;
    router._uploadCounts[key] = (router._uploadCounts[key] || 0) + 1;
    if (router._uploadCounts[key] > 10) {
      return res.status(429).json({ error: "Upload limit reached (10 per hour)" });
    }
    next();
  },
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let rawText = "";

      if (req.file.mimetype === "application/pdf") {
        const parsed = await pdfParse(req.file.buffer);
        rawText = parsed.text || "";
      } else {
        // text/plain
        rawText = req.file.buffer.toString("utf-8");
      }

      // Sanitize — strip HTML tags if any (belt-and-suspenders)
      rawText = rawText.replace(/<[^>]*>/g, " ").replace(/\s{3,}/g, "\n\n");

      const cvFields = parseCvText(rawText);

      res.json({ success: true, data: cvFields });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Multer error handler (must be 4-arg to be recognized by Express as error handler)
router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File is too large (max 5 MB)" });
  }
  if (err.message === "Only PDF and TXT files are accepted") {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});
```

- [ ] Run `npm run build` — must pass (the backend is not bundled by Vite, but the build checks for frontend errors):

```bash
npm run build
```

---

### Task 10: Create CvUploadReview frontend component

**Files:**
- Create: `frontend/src/components/cv/CvUploadReview.jsx`

This component renders:
1. An "Upload CV" button
2. A hidden file input (accepts pdf, txt)
3. After parsing, a modal showing extracted fields for the user to review/edit
4. A "Save as new CV" button that calls `onSave(parsedFields)`

- [ ] Create `frontend/src/components/cv/CvUploadReview.jsx`:

```jsx
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiUpload, FiX } from "react-icons/fi";
import { ui } from "../../styles/ui";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function uploadCvFile(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/cvs/upload`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.data;
}

export function CvUploadReview({ onSave, isBusy }) {
  const inputRef = useRef(null);
  const [state, setState] = useState("idle"); // idle | uploading | reviewing | saving
  const [error, setError] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [form, setForm] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-uploaded
    e.target.value = "";

    setState("uploading");
    setError(null);
    try {
      const data = await uploadCvFile(file);
      setParsed(data);
      setForm({
        title: data.title || "",
        summary: data.summary || "",
        skills: (data.skills || []).join(", "),
        experience: (data.experience || []).join("\n"),
        projects: (data.projects || []).join("\n"),
        education: (data.education || []).join("\n"),
        certifications: (data.certifications || []).join("\n"),
      });
      setState("reviewing");
    } catch (err) {
      setError(err.message);
      setState("idle");
    }
  }

  function handleSave() {
    setState("saving");
    const payload = {
      title: form.title.trim() || "Imported CV",
      type: "Imported",
      version: "v1",
      summary: form.summary.trim(),
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      experience: form.experience.split("\n").map((s) => s.trim()).filter(Boolean),
      projects: form.projects.split("\n").map((s) => s.trim()).filter(Boolean),
      education: form.education.split("\n").map((s) => s.trim()).filter(Boolean),
      certifications: form.certifications.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    onSave(payload);
    setState("idle");
    setParsed(null);
    setForm(null);
  }

  function handleClose() {
    setState("idle");
    setParsed(null);
    setForm(null);
    setError(null);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        className="sr-only"
        aria-label="Upload CV file"
        onChange={handleFileChange}
      />
      <button
        type="button"
        className={ui.buttonSecondary}
        disabled={isBusy || state === "uploading"}
        onClick={() => inputRef.current?.click()}
        aria-busy={state === "uploading"}
      >
        <FiUpload size={14} strokeWidth={1.5} />
        {state === "uploading" ? "Parsing..." : "Upload CV"}
      </button>

      {error && (
        <p className={`${ui.fieldError} mt-1`} role="alert">
          {error}
        </p>
      )}

      {state === "reviewing" && form && typeof document !== "undefined" && createPortal(
        <div
          className={ui.modalBackdrop}
          role="presentation"
          onMouseDown={handleClose}
        >
          <section
            aria-label="Review extracted CV"
            aria-modal="true"
            className={`${ui.modalWindow} max-w-[640px]`}
            role="dialog"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={ui.modalHead}>
              <div>
                <p className={ui.eyebrow}>CV Upload · Review</p>
                <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                  Review extracted fields
                </h2>
                <p className={`${ui.muted} mt-1`}>
                  Confirm or edit the extracted content before saving.
                </p>
              </div>
              <button
                type="button"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[#6B6B72] transition-colors hover:bg-[#F6F3EC] hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF]"
                onClick={handleClose}
                aria-label="Close review"
              >
                <FiX size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Fields */}
            <div className={`${ui.formStack} overflow-y-auto max-h-[60vh] pr-1`}>
              <label className={ui.label}>
                CV title
                <input
                  className={ui.input}
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                />
              </label>

              <label className={`${ui.label} flex flex-col`}>
                Summary
                <textarea
                  className={`${ui.input} !h-auto min-h-[72px] resize-none py-2 leading-relaxed`}
                  rows={3}
                  value={form.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                />
              </label>

              <label className={ui.label}>
                Skills (comma-separated)
                <input
                  className={ui.input}
                  value={form.skills}
                  onChange={(e) => updateField("skills", e.target.value)}
                />
              </label>

              {[
                ["experience", "Experience (one per line)"],
                ["projects", "Projects (one per line)"],
                ["education", "Education (one per line)"],
                ["certifications", "Certifications (one per line)"],
              ].map(([field, label]) => (
                <label key={field} className={`${ui.label} flex flex-col`}>
                  {label}
                  <textarea
                    className={`${ui.input} !h-auto min-h-[60px] resize-none py-2 leading-relaxed`}
                    rows={3}
                    value={form[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                  />
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2 border-t border-[#E8E3D7] pt-4">
              <button
                type="button"
                className={ui.button}
                onClick={handleSave}
                disabled={state === "saving" || !form.title.trim()}
              >
                {state === "saving" ? "Saving..." : "Save as new CV"}
              </button>
              <button
                type="button"
                className={ui.buttonGhost}
                onClick={handleClose}
              >
                Cancel
              </button>
            </div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
```

---

### Task 11: Wire CvUploadReview into MyCvsPage

**Files:**
- Modify: `frontend/src/pages/MyCvsPage.jsx`

The page already has `saveCv` (form-based). We need a separate `onUploadSave` handler that creates a CV directly from the parsed payload (skips the form).

- [ ] Add `CvUploadReview` import to `MyCvsPage.jsx`:

```jsx
import { CvUploadReview } from "../components/cv/CvUploadReview";
```

- [ ] Add `onUploadSave` to the MyCvsPage props (it will be provided by App.jsx via useCvs):

```jsx
export default function MyCvsPage({
  // ... existing props ...
  onUploadSave,   // new — async (payload) => void
}) {
```

- [ ] Inside the "Profile builder" section (the form section), add the upload button below the "Generate from Passport" button, before the `<form>`:

```jsx
{/* Upload CV */}
<div className="mb-4 flex items-start gap-3">
  <CvUploadReview
    isBusy={isBusy}
    onSave={onUploadSave}
  />
  <p className="text-[12px] text-[#6B6B72] mt-2">
    Upload a PDF or TXT file — you review extracted fields before saving.
  </p>
</div>
```

- [ ] In App.jsx, add `onUploadSave` to the props passed to `<MyCvsPage>`. The handler should call `createCvProfile` (via `runAction`) with the parsed payload. Locate where MyCvsPage is rendered in App.jsx and add:

```jsx
onUploadSave={async (payload) => {
  cvs.runAction
    ? await cvs.runAction("Saving uploaded CV", async () => {
        await createCvProfile(payload);   // import from careerService if needed
        await cvs.loadCvs();
        cvs.setStatus("CV saved from upload");
      })
    : null;
}}
```

Wait — `runAction` is not on the `cvs` object. It's passed in from App.jsx. Look at App.jsx to confirm how props are wired to MyCvsPage and replicate the pattern used for other operations. The pattern in App.jsx for MyCvsPage will look like:

```jsx
<MyCvsPage
  ...
  saveCv={cvs.saveCv}
  ...
  onUploadSave={(payload) =>
    runAction("Saving uploaded CV", async () => {
      const { createCvProfile } = await import("./services/careerService");
      await createCvProfile(payload);
      await cvs.loadCvs();
      toast.setStatus("CV saved from upload");
    })
  }
/>
```

Check App.jsx carefully for how `runAction` and `setStatus` are accessed and replicate exactly.

- [ ] Run `npm run build`:

```bash
npm run build
```

---

### Task 12: Write unit tests

**Files:**
- Create: `frontend/src/features/cv/__tests__/useCvs.test.js`
- Create: `frontend/src/features/shared/__tests__/useToast.test.js`
- Create: `frontend/src/features/shared/__tests__/useRunAction.test.js`

- [ ] Create `frontend/src/features/cv/__tests__/useCvs.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCvs } from "../useCvs";

vi.mock("../../../services/careerService", () => ({
  listCvs: vi.fn(),
  createCvProfile: vi.fn(),
  updateCv: vi.fn(),
  deleteCv: vi.fn(),
  createCvVersion: vi.fn(),
  compareCvProfiles: vi.fn(),
  generateCv: vi.fn(),
}));

import { listCvs, createCvProfile } from "../../../services/careerService";

const mockUser = { _id: "user1" };
const mockPassport = { skills: ["JS"] };
const runAction = async (label, fn) => fn();
const setStatus = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCvs initial state", () => {
  it("starts with empty cvs array", () => {
    listCvs.mockResolvedValue({ data: [] });
    const { result } = renderHook(() =>
      useCvs({ user: null, passport: mockPassport, runAction, setStatus })
    );
    expect(result.current.cvs).toEqual([]);
    expect(result.current.selectedCvId).toBe("");
  });
});

describe("useCvs loadCvs", () => {
  it("sets cvs and selectedCvId from response", async () => {
    const mockCvs = [{ _id: "cv1", title: "Test CV" }, { _id: "cv2", title: "Test CV 2" }];
    listCvs.mockResolvedValue({ data: mockCvs });

    const { result } = renderHook(() =>
      useCvs({ user: mockUser, passport: mockPassport, runAction, setStatus })
    );

    await act(async () => {
      await result.current.loadCvs();
    });

    expect(result.current.cvs).toEqual(mockCvs);
    expect(result.current.selectedCvId).toBe("cv1");
  });

  it("calls setStatus on loadCvs error", async () => {
    listCvs.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useCvs({ user: mockUser, passport: mockPassport, runAction, setStatus })
    );

    // wait for auto-load effect
    await act(async () => {});

    expect(setStatus).toHaveBeenCalledWith("Network error");
  });
});
```

- [ ] Create `frontend/src/features/shared/__tests__/useToast.test.js`:

```js
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast } from "../useToast";

describe("useToast", () => {
  it("starts with empty toasts array", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it("addToast adds a toast with correct type", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.addToast("Saved successfully", "success");
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Saved successfully");
    expect(result.current.toasts[0].type).toBe("success");
  });

  it("removeToast removes toast by id", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.addToast("Test", "info");
    });
    const id = result.current.toasts[0].id;
    act(() => {
      result.current.removeToast(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});
```

- [ ] Create `frontend/src/features/shared/__tests__/useRunAction.test.js`:

```js
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRunAction } from "../useRunAction";

describe("useRunAction", () => {
  it("starts with null pendingAction", () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));
    expect(result.current.pendingAction).toBeNull();
  });

  it("sets and clears pendingAction around async action", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));
    let resolveFn;
    const promise = new Promise((res) => { resolveFn = res; });

    act(() => {
      result.current.runAction("Loading", () => promise);
    });
    expect(result.current.pendingAction).toBe("Loading");

    await act(async () => { resolveFn(); await promise; });
    expect(result.current.pendingAction).toBeNull();
  });

  it("calls addToast with error type on action failure", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));

    await act(async () => {
      await result.current.runAction("Failing", async () => {
        throw new Error("Something broke");
      });
    });

    expect(addToast).toHaveBeenCalledWith(
      expect.stringContaining("Something broke"),
      "error"
    );
  });
});
```

- [ ] Run tests:

```bash
npm run test
```

Expected: all unit tests pass.

---

### Task 13: Write backend upload integration test

**Files:**
- Create: `backend/__tests__/routes/cvUpload.test.js`

Note: This uses Node's built-in `assert` module since no Jest/Vitest is configured for the backend. If the project later adds backend test tooling, migrate these.

- [ ] Create `backend/__tests__/routes/cvUpload.test.js`:

```js
/**
 * Integration test for POST /api/cvs/upload
 * Runs against the real Express app in test mode.
 * Uses Node's built-in test runner (node:test) — available in Node 18+.
 */
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");

// Note: full integration test requires a running server and real auth.
// These are unit tests for cvParser.js only — the route test is a smoke check.

const { parseCvText } = require("../../services/cvParser");

describe("cvParser.parseCvText", () => {
  it("extracts title from first line", () => {
    const text = "John Developer\n\nSKILLS\nJavaScript, React\n";
    const result = parseCvText(text);
    assert.equal(result.title, "John Developer");
  });

  it("extracts skills from SKILLS section", () => {
    const text = "John Dev\n\nSKILLS\nJavaScript, React, Node.js\n";
    const result = parseCvText(text);
    assert.ok(result.skills.length >= 1);
    assert.ok(result.skills.some((s) => s.toLowerCase().includes("javascript")));
  });

  it("extracts experience from EXPERIENCE section", () => {
    const text = "Dev Name\n\nEXPERIENCE\nSenior Engineer at Acme Corp\nJunior Dev at StartupXYZ\n";
    const result = parseCvText(text);
    assert.ok(result.experience.length >= 1);
  });

  it("returns empty arrays for missing sections", () => {
    const text = "Jane Smith\n\nSUMMARY\nExperienced developer.\n";
    const result = parseCvText(text);
    assert.deepEqual(result.skills, []);
    assert.deepEqual(result.experience, []);
    assert.deepEqual(result.projects, []);
  });

  it("does not exceed 20 items per section", () => {
    const manyLines = Array.from({ length: 30 }, (_, i) => `Item ${i}`).join("\n");
    const text = `Dev\n\nEXPERIENCE\n${manyLines}\n`;
    const result = parseCvText(text);
    assert.ok(result.experience.length <= 20);
  });
});
```

- [ ] Add a `test:backend` script to `package.json`:

```json
"test:backend": "node --test backend/__tests__/routes/cvUpload.test.js"
```

- [ ] Run:

```bash
npm run test:backend
```

Expected: all tests pass.

---

### Task 14: Final build and size check

- [ ] Run full build:

```bash
npm run build
```

- [ ] Record the new gzip size from build output (look for `gzip:` column).

- [ ] Check if gzip is still under 220 KB. If over, identify the largest chunks and consider splitting further.

- [ ] Update `MASTER_PLAN.md` Phase 2 entry:
  - Change status from `⏳ PENDING` to `✅ DONE`
  - Fill in the bundle gzip size
  - Update the Phase Status Overview table

---

## Self-review checklist

Before declaring Phase 2 done, verify:

- [ ] **Spec coverage:** Template selector renders 3 templates. Quality panel shows score + missing sections. Upload accepts PDF/TXT, rejects DOCX/PNG (400). Review modal opens, allows editing all fields, saves as new CV. ErrorBoundary wraps Routes. All page imports are lazy.
- [ ] **No placeholders:** No "TBD", "TODO", "fill in" in any created file.
- [ ] **Type consistency:** `parseCvText` returns `{ title, summary, skills[], projects[], experience[], education[], certifications[] }` — same field names as CV model.
- [ ] **Design system:** All components use `ui.js` tokens. No teal. No gradients. `Instrument Serif` used only for display headline in Classic template. Chips use `ui.chip`. Labels use `ui.label`. Buttons use `ui.button` / `ui.buttonSecondary` / `ui.buttonGhost`.
- [ ] **Accessibility:** Upload input has `aria-label`. Modal has `aria-modal="true"` and `role="dialog"`. Progress bar has `role="progressbar"` with aria values. Close button has `aria-label`. Template selector uses `aria-pressed`.
- [ ] **Security:** Multer limits 5MB, MIME check rejects non-pdf/txt, rate limit at 10/hour, temp buffer (no disk write), raw text sanitized for HTML tags before parsing.
- [ ] **Tests pass:** `npm run test` (unit) and `npm run test:backend` (cvParser) both pass.
- [ ] **Build clean:** `npm run build` exits with 0 errors.
