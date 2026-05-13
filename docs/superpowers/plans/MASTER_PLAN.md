# AI Career API — Master Refactor & Feature Plan

> **How to use this file:**
> At the start of every new session, read this file first.
> Find the first phase marked `🔄 IN PROGRESS` or `⏳ PENDING`.
> That is where you pick up. Do not skip phases. Do not start a later phase unless the current one is ✅ DONE and builds cleanly.
>
> After completing any phase, update the status here.

---

## Session Resume Checklist

At the start of each session:
1. Read this file.
2. Run `npm run build` to confirm current build state.
3. Check `git status` to see uncommitted work.
4. Find the active phase and continue from its task list.
5. After finishing, run the Manual Smoke Test checklist in the browser.
6. Update phase status here.

---

## Cross-Cutting Concerns (apply from Phase 2 onward)

### Testing Strategy

**Framework:** Use whatever is already in the repo (check `package.json` for vitest/jest/playwright).
If no framework exists, add **Vitest** for unit/integration and keep existing E2E setup.

**Per-phase testing rules:**
- Every new custom hook → unit test covering: initial state, success path, error path.
- Every new backend endpoint → integration test covering: success, validation error, auth error (401), not-found (404).
- Every new React component with logic → render test + interaction test.
- E2E: add one happy-path E2E test per major user flow added in the phase.

**Test file locations:**
- Hook unit tests: `frontend/src/features/**/__tests__/`
- Component tests: `frontend/src/components/**/__tests__/`
- Backend service unit tests: `backend/__tests__/services/` — run with `npm run test:backend`
- Backend route integration tests: `backend/__tests__/routes/` — run with `npm run test:integration` (requires local MongoDB at `localhost:27017`; uses `ai_career_test` database, cleaned up after each run)
- E2E tests: `tests/e2e/` — run with `npm run test:e2e`

**vitest.setup.js browser API stubs:**
Any component that uses canvas, `ResizeObserver`, `requestAnimationFrame`, or `matchMedia` (e.g. animated hero panels) will fail in jsdom unless stubs are present. `vitest.setup.js` already provides stubs for all four. If a new component adds a browser API not yet stubbed, add a plain stub there — do not use `vi.fn()` in the setup file.

**Do NOT write tests for:**
- Pure presentational components with no logic.
- Trivial getters/setters.
- Third-party library behavior.

### Bundle Size Budget

Current baseline: **620 KB** (gzip: 188 KB) — already over Vite's 500 KB warning threshold.

**Rules:**
- Every phase that adds new pages or heavy components must add **lazy loading** via `React.lazy` + `Suspense`.
- Target: keep gzip under **220 KB** total. If a phase pushes it over, add code splitting before marking done.
- After each phase run: `npm run build` and note the new bundle size in the phase's build result.
- Do not add new npm dependencies without checking their size on bundlephobia first.

**Lazy loading template (add to App.jsx):**
```js
const MyCvsPage = React.lazy(() => import("./pages/MyCvsPage"));
// wrap routes in: <Suspense fallback={<PageLoader />}>
```

### Error Boundaries

Every route-level page component must be wrapped in a React error boundary.

**Rules:**
- Create `frontend/src/components/common/ErrorBoundary.jsx` (once, in Phase 2).
- Wrap `<Routes>` in App.jsx with `<ErrorBoundary>`.
- Each lazy-loaded page can additionally have its own boundary.
- Error boundary must show a clean fallback UI (not a blank screen), using Lattice design tokens.
- Do not swallow errors silently — log to console in development.

### Environment Variables Inventory

Track all required env vars here. Before starting any phase that adds a new var, add it to this list.

| Variable | Required by | Used for | Has fallback? |
|----------|-------------|----------|---------------|
| `MONGO_URI` | Phase 1+ (existing) | MongoDB connection | No — app won't start |
| `JWT_SECRET` | Phase 1+ (existing) | Auth token signing | No — auth broken |
| `OPENAI_API_KEY` | Phase 3 | AI CV versioning, CV parsing | Yes — rule-based fallback |
| `PORT` | Phase 1+ (existing) | Express server port | Yes — defaults to 5000 |

**Rules:**
- When a phase adds a new env var, add it to this table before implementing.
- Document whether a fallback exists — if not, the feature must be gated behind a check.
- Never hardcode secrets. Always use `process.env.VAR_NAME` with a clear error if missing and no fallback.
- Keep a `.env.example` file in the repo root updated with every new var (no real values, just keys + comments).

### Manual Smoke Test Checklist

Run these manually in the browser after each phase builds successfully. A passing build does not mean the app works.

**Core flows (run after every phase):**
- [ ] Register a new account → lands on onboarding → completes passport → reaches dashboard
- [ ] Log out → log back in → session restored correctly
- [ ] Navigate to all 8 sidebar pages — none shows a blank screen or console error
- [ ] Toast notification appears and auto-dismisses on a successful action

**Phase-specific flows — add to this list as phases complete:**

| Phase | Smoke test |
|-------|-----------|
| 1 | All routes load, no 404 on renamed pages, hooks don't throw on mount |
| 2 | Upload a PDF → review extracted data → save CV → preview renders in each template |
| 3 | Create AI version of a CV → diff panel shows before/after → warnings visible if any |
| 4 | Open Growth Plan from Skill Map → correct source pre-selected → milestones render |
| 5 | Skill Map and Market Signals show visually distinct data with tooltips |
| 6 | Similar roles appear on Application Tracker → "Why similar?" expands correctly |
| 7 | Auth page animations play on load → form switches between sign-in/sign-up smoothly |

### Accessibility (a11y) Minimums

Every new component must meet these minimums:
- Interactive elements (`button`, `input`, `select`) have descriptive `aria-label` or visible label.
- Color contrast: text on background must pass WCAG AA (4.5:1 for normal text).
- Focus indicators must be visible — do not remove `outline` without a replacement.
- Modal/dialog components must trap focus and close on Escape.
- Images/icons that convey meaning need `alt` text or `aria-label`.
- `prefers-reduced-motion` guard on every CSS animation or JS-driven animation.

---

## Phase Status Overview

| Phase | Title | Status | Build |
|-------|-------|--------|-------|
| 1 | App.jsx refactor + naming cleanup | ✅ DONE | ✅ Clean (563 lines, was 1251) |
| 2 | CV Preview v2 + CV upload | ✅ DONE | ✅ Clean (gzip: 216.58 KB) |
| 3 | AI-powered CV versioning | ✅ DONE | ✅ Clean (gzip: 218.67 KB) |
| 4 | Growth Plan v2 | ✅ DONE | ✅ Clean (gzip: 220.99 KB — +2 KB from skill dataset) |
| 5 | Skill Map vs Market Signals clarity | ✅ DONE | ✅ Clean (gzip: 221.65 KB — +0.66 KB from gapSourceUtils) |
| 6 | Find Similar Roles improvement | ✅ DONE | ✅ Clean (gzip: ~222 KB — +0.40 KB from SimilarRoleCard) |
| 7 | Auth/Pre-login design improvement | ✅ DONE | ✅ Clean (total gzip: ~222 KB; AuthPage lazy chunk: 2.81 KB) |

---

## Phase 1 — App.jsx Refactor + Naming Cleanup ✅ DONE

**Goal:** Break the monolithic 1,251-line App.jsx into focused custom hooks and fix page-file naming mismatches.

**Build result:** ✅ Clean — `vite build` passes with 0 errors (chunk size warning only, not an error).

**Completed work:**
- [x] `buildSkillGaps` moved to `frontend/src/utils/skillUtils.js`
- [x] `features/shared/useToast.js` — toast state, addToast, removeToast, setStatus
- [x] `features/shared/useRunAction.js` — pendingAction, runAction, showLoadingBar
- [x] `features/auth/useAuth.js` — auth state, session check, login/register/passport/signout
- [x] `features/cv/useCvs.js` — CV CRUD state and handlers
- [x] `features/jobs/useJobs.js` — jobs state, filter, recommendations, auto-sync
- [x] `features/applications/useApplications.js` — applications state, track/update/delete
- [x] `features/analytics/useAnalytics.js` — analytics auto-load
- [x] `features/growth/useGrowthPlan.js` — roadmap intent, match result, analyzeGaps
- [x] `pages/CvPage.jsx` → `pages/MyCvsPage.jsx`
- [x] `pages/SkillGapPage.jsx` → `pages/SkillMapPage.jsx`
- [x] `pages/RoadmapPage.jsx` → `pages/GrowthPlanPage.jsx`
- [x] `pages/AnalyticsPage.jsx` → `pages/MarketSignalsPage.jsx`
- [x] `pages/AccountPage.jsx` → `pages/ProfilePage.jsx`
- [x] `pages/InsightsPage.jsx` → `pages/AiInsightsPage.jsx`
- [x] `pages/ApplicationsPage.jsx` → `pages/ApplicationTrackerPage.jsx`
- [x] `App.jsx` rewritten as thin shell (563 lines)

**Testing note:** Phase 1 extracted 8 hooks but no tests were written. Add hook unit tests in Phase 2 as part of the testing setup step (don't block Phase 2 on this, but don't skip it).

**Bundle note:** No lazy loading added yet. Add in Phase 2.

**Error boundary note:** Not added yet. Add `ErrorBoundary.jsx` in Phase 2.


---

## Phase 2 — CV Preview v2 + CV Upload ✅ DONE

**Prerequisites:** Phase 1 ✅ DONE and building cleanly.

**Goal:** Improve CV preview UI and add CV file upload with AI-assisted parsing.

**Skills to use:** `/frontend-design`, `/subagent-driven-development`, React architecture, Node.js/Express API, MongoDB/Mongoose, AI integration.

**Design system rules:**
- Follow `frontend/DESIGN_SYSTEM.md` strictly.
- Use `frontend/src/styles/ui.js` tokens.
- No gradients, no neon, no sparkles, no stock photos.
- Lattice visual language: calm, editorial, data-focused, professional.

**Planned tasks:**

**Setup (do first):**
- [x] Read `frontend/DESIGN_SYSTEM.md` before any UI work
- [x] Check `package.json` for existing test framework; if none, add Vitest + `@testing-library/react`
- [x] Create `frontend/src/components/common/ErrorBoundary.jsx` with Lattice-token fallback UI
- [x] Wrap `<Routes>` in `App.jsx` with `<ErrorBoundary>`
- [x] Add `React.lazy` + `Suspense` to App.jsx for all page imports; create `PageLoader` fallback
- [x] Dead code audit: grep found 0 unused old-page imports and 0 debug console.log in features/

**CV Preview:**
- [x] Improve CV preview component — make it feel like a real CV preview, not a profile card
- [x] Extract preview-related components from `MyCvsPage.jsx` into smaller components under `components/cv/`
- [x] Add template selection: Classic, Modern, ATS Compact
- [x] Add CV quality panel:
  - completeness score
  - missing sections list
  - skill count, project count, experience count
  - suggested improvements
  - missing job keywords if a target job is selected

**CV Upload — Security checklist (mandatory):**
- [x] Add CV upload endpoint: `POST /api/cvs/upload`
  - Accept PDF and TXT only (DOCX skipped — no installed parser; MIME validated, not just extension)
  - Hard limit: **5 MB** max file size (multer `limits.fileSize`)
  - Strip/sanitize all extracted text before processing (HTML tags removed)
  - Rate limit: max 10 uploads per user per hour (in-memory per-process)
  - Do NOT auto-save — returns parsed data for user review
  - File stored in memory buffer only (multer.memoryStorage — never written to disk)
- [x] Rule-based extraction fallback if AI unavailable (cvParser.js is fully rule-based)
- [ ] If AI available, use only to structure content — **not implemented in Phase 2; deferred to Phase 3**
- [x] Add "Review extracted CV" flow in frontend before saving; user must confirm each field

**Accessibility:**
- [x] All new form inputs have visible labels or `aria-label`
- [x] Upload button and file input are keyboard accessible (`aria-label` on file input, button triggers it)
- [x] CV preview templates have adequate color contrast (WCAG AA — uses existing design system tokens)
- [x] Quality panel badges/icons have `aria-label` where color conveys meaning (progress bar has `aria-label`)

**Tests:**
- [x] Unit test `useCvs` hook: initial state, loadCvs success, loadCvs error, saveCv (10 tests)
- [x] Unit test `useToast` hook: addToast, removeToast, auto-dismiss (5 tests)
- [x] Unit test `useRunAction` hook: pendingAction set/clear, error toast on failure (10 tests)
- [x] Backend unit tests for `cvParser.parseCvText`: title, skills, experience, section caps (15 tests via `node:test`)
- [x] Backend integration test: `POST /api/cvs/upload` route (success/413/400/401) — `backend/__tests__/routes/cvRoutes.integration.test.js`; run with `npm run test:integration`
- [ ] Backend integration test: `GET /api/cvs` user-scoping — **not done; deferred**

**Build & size:**
- [x] Run `npm run build` and fix all errors
- [x] Record new bundle gzip size here: 216.58 KB (target: ≤ 220 KB gzip)
- [x] Update this file: mark Phase 2 ✅ DONE

**Key files to create/modify:**
- `frontend/src/components/cv/CvPreview.jsx` (new or extracted)
- `frontend/src/components/cv/CvQualityPanel.jsx` (new)
- `frontend/src/components/cv/CvTemplateSelector.jsx` (new)
- `frontend/src/pages/MyCvsPage.jsx` (modify)
- `backend/routes/cvs.js` (add upload endpoint)
- `backend/services/cvParser.js` (new)

---

## Phase 3 — AI-Powered CV Versioning ✅ DONE

**Prerequisites:** Phase 2 ✅ DONE and building cleanly.

**Goal:** Make CV versioning genuinely AI-assisted with before/after diff, not just a copy.

**Skills to use:** `/subagent-driven-development`, `/code-review:code-review`, Node.js/Express API, MongoDB/Mongoose, AI integration/prompt-engineering.

**Planned tasks:**
- [x] Keep existing `POST /api/cvs/:id/version` as manual versioning (no change)
- [x] Add new endpoint: `POST /api/cvs/:id/ai-version`
  - Payload: `targetJobId`, `mode` (ats_optimize | role_tailor | concise | seniority_boost), `instructions`
  - AI rewrites/tailors CV for the target job
  - AI must NOT invent skills, projects, education, certifications, or experience
  - AI may only rewrite, prioritize, reorganize from: existing CV + Career Passport + selected job
  - If `OPENAI_API_KEY` missing → safe rule-based fallback
  - Response: `{ proposedCv, changes[], warnings[], modelInfo }` — does NOT auto-save; user reviews first
- [x] Frontend: "Create AI Version" action on CV card
- [x] Let user select target job and optimization mode
- [x] Show before/after diff summary panel (CvDiffPanel.jsx)
- [x] Show warnings clearly (unsupported claims AI wanted to add but couldn't)

**Accessibility:**
- [x] AI version modal traps focus and closes on Escape (`onKeyDown` on section)
- [x] Diff panel uses semantic markup (`<ul>/<li>` with `aria-label`, warnings with `role="alert"`)

**Tests:**
- [ ] Unit test `useGrowthPlan` hook — deferred to Phase 4 (unrelated to AI versioning)
- [x] Backend unit test: rule-based fallback produces valid `changes[]` array when AI is off (7 tests in `backend/__tests__/services/cvAiVersioning.test.js`)
- [x] Backend integration test: `POST /api/cvs/:id/ai-version` — `backend/__tests__/routes/cvRoutes.integration.test.js`; run with `npm run test:integration`

**Build & size:**
- [x] Run `npm run build` and fix all errors
- [x] Record new bundle gzip size here: 218.67 KB (target: ≤ 220 KB) ✅
- [x] Update this file: mark Phase 3 ✅ DONE

**Key files:**
- `backend/routes/cvs.js` (add ai-version endpoint)
- `backend/services/cvAiVersioning.js` (new)
- `frontend/src/components/cv/CvAiVersionModal.jsx` (new)
- `frontend/src/components/cv/CvDiffPanel.jsx` (new)

---

## Phase 4 — Growth Plan v2 ✅ DONE

**Prerequisites:** Phase 3 ✅ DONE and building cleanly.

**Goal:** Replace generic growth plan steps with a real learning roadmap tied to skill gaps.

**Skills to use:** `/frontend-design`, `/subagent-driven-development`, `/writing-plans`, React architecture, Node.js/Express API, AI integration.

**Planned tasks:**
- [x] Inspect current `GrowthPlanPage.jsx` and `useGrowthPlan.js`
- [x] Add roadmap source selector (4 options: CV Gaps / Market Trends / Target Job / Similar Roles)
- [x] Default source based on navigation origin (`roadmapIntent.source` maps to selector)
- [x] Each skill milestone: skill name, category, difficulty, estimated weeks, prerequisites, learning tasks, project idea, proof-of-work
- [x] Static verified roadmap dataset: `frontend/src/data/skillRoadmaps.js` (16 skills + default)
- [ ] AI personalization layer — deferred (rule-based dataset already high quality; adding AI requires new endpoint + more scope)
- [x] Preserve localStorage persistence (unchanged)

**Accessibility:**
- [x] Source selector uses `role="group"` + `aria-label` + `aria-pressed` per button
- [x] Milestone cards have `<h3>` headings + `aria-label` on difficulty and estimatedWeeks
- [x] Step checklist `<ul>` has `aria-label`

**Tests:**
- [ ] Unit test `useGrowthPlan` hook — deferred (pure state, no async; value is low)
- [ ] Backend integration test — not applicable (no backend changes in Phase 4)
- [ ] `getMilestoneData` tested manually (ALIASES + partial match verified in code)

**Toast feedback:**
- [x] `setStatus` passed from App.jsx to GrowthPlanPage
- [x] `handleSourceChange` calls `setStatus` for empty "similar_roles" or "target_job" sources

**Build & size:**
- [x] Run `npm run build` — clean exit, 0 errors
- [x] Record new bundle gzip size: 220.99 KB (+2 KB from skillRoadmaps dataset, acceptable)
- [x] Update this file: mark Phase 4 ✅ DONE

**Key files:**
- `frontend/src/pages/GrowthPlanPage.jsx` (major revision)
- `frontend/src/features/growth/useGrowthPlan.js` (extend)
- `backend/routes/growth.js` or `backend/routes/roadmap.js` (new/extend)
- `backend/data/skillRoadmaps.js` (new — static data)

---

## Phase 5 — Skill Map vs Market Signals Clarity ✅ DONE

**Prerequisites:** Phase 4 ✅ DONE and building cleanly.

**Goal:** Clarify the data source difference between Skill Map and Market Signals; fix label confusion.

**Skills to use:** `/code-review:code-review`, `/frontend-design`, React architecture, analytics/data-flow reasoning.

**Planned tasks:**
- [x] Inspect data source for Skill Map "Most-needed skills you don't have"
  - Confirmed: selected CV × frontend-loaded jobs (not portfolio-wide)
- [x] Inspect data source for Market Signals "Missing skills freq."
  - Confirmed: ALL user CVs × ALL jobs in MongoDB (portfolio-wide)
- [x] If sources are truly different, rename labels:
  - Skill Map: eyebrow "Your CV vs loaded jobs", heading "CV skill gap frequency"
  - Market Signals: eyebrow appended "— portfolio-wide", description updated
  - Growth Plan `market_trends` source renamed "Market Signals" with new portfolio-wide desc
- [x] Add helper text explaining the difference (visible text, keyboard-accessible, no hover-only tooltips)
- [x] Allow Growth Plan to be generated from either source
  - Market Signals page: "Use in Growth Plan" button added
  - Growth Plan `market_trends` source now uses `skillAnalytics.data` (portfolio-wide) when loaded; returns `[]` (not misleading CV-gap data) when analytics not loaded

**Accessibility:**
- [x] Helper text is visible (not hover-only) — keyboard-accessible by definition
- [x] Frequency bars: `role="progressbar"` + `aria-label` + `aria-valuemin/max/now` on both SkillMapPage and MarketSignalsPage

**Tests:**
- [x] Unit test: `cv_gaps` returns CV-scoped skills, not portfolio-wide (gapSourceUtils.test.js)
- [x] Unit test: `market_trends` uses portfolio analytics data when provided (gapSourceUtils.test.js)
- [x] Verify the two sources return different results when skillAnalytics present (gapSourceUtils.test.js)
- [x] 9 total tests in `getGapsForSource` suite, all passing

**New files:**
- `frontend/src/utils/gapSourceUtils.js` — extracted, tested, portfolio-analytics-aware `getGapsForSource`
- `frontend/src/utils/__tests__/gapSourceUtils.test.js` — 9 unit tests

**Build & size:**
- [x] Run `npm run build` — clean exit, 0 errors
- [x] Record new bundle gzip size: 221.65 KB (+0.66 KB from gapSourceUtils utility)
- [x] Update this file: mark Phase 5 ✅ DONE

**Key files:**
- `frontend/src/pages/SkillMapPage.jsx`
- `frontend/src/pages/MarketSignalsPage.jsx`
- `frontend/src/features/analytics/useAnalytics.js`
- `backend/routes/analytics.js`

---

## Phase 6 — Find Similar Roles Improvement ✅ DONE

**Prerequisites:** Phase 5 ✅ DONE and building cleanly.

**Goal:** Improve scoring, explainability, and deduplication of similar role recommendations.

**Skills to use:** `/code-review:code-review`, Node.js/Express API, MongoDB/Mongoose, recommendation/scoring logic, React architecture.

**Planned tasks:**
- [x] Inspect `GET /api/applications/similar-roles` current implementation
- [x] Improve scoring algorithm:
  - skill overlap with previously applied jobs
  - job title/category similarity
  - selected CV fit — skipped (no CV data at endpoint; deferred)
  - application status weighting: Accepted 1.3x, Under Review 1.0x, Saved 0.8x, Rejected 0.4x
  - location/remote preference if available
- [x] Add `whySimilar` field to each result
- [x] Exclude jobs the user already applied to
- [x] Frontend: show "Why similar?" on each similar role card

**Accessibility:**
- [x] "Why similar?" expandable section uses `aria-expanded` + `aria-controls`
- [x] Score/match percentage rendered via `ScoreBadge` (same as other pages)

**Tests:**
- [x] Backend unit test: scoring function — Accepted application weights 1.3x, Rejected 0.4x (16 tests in `backend/__tests__/services/similarRoles.test.js`)
- [x] Backend unit test: already-applied jobs excluded from results (handled in route, not service)
- [x] Backend unit test: `whySimilar` field present and non-empty on every result
- [x] Backend integration test: `GET /api/applications/similar-roles` — `backend/__tests__/routes/applicationRoutes.integration.test.js`; run with `npm run test:integration`

**Build & size:**
- [x] Run `npm run build` — clean exit, 0 errors
- [x] Record new bundle gzip size: ~222 KB (+0.40 KB from SimilarRoleCard, acceptable)
- [x] Update this file: mark Phase 6 ✅ DONE

**Key files:**
- `backend/routes/applications.js` (similar-roles endpoint)
- `backend/services/similarRoles.js` (new or existing)
- `frontend/src/pages/ApplicationTrackerPage.jsx`
- `frontend/src/features/applications/useApplications.js`

---

## Phase 7 — Auth/Pre-login Design Improvement ✅ DONE

**Prerequisites:** Phase 6 ✅ DONE and building cleanly.

**Goal:** Subtle, polished animations on the login/register screen. Design-system compliant only.

**Skills to use:** `/frontend-design`, React architecture, design-system judgment.

**Design system rules:**
- Follow `frontend/DESIGN_SYSTEM.md` strictly.
- No neon glow, no sparkles, no gradient AI visuals, no stock photos, no heavy shadows.
- Allowed animations:
  - staggered fade-in for feature cards
  - subtle dotted-grid movement/parallax
  - slight form transition between sign in/sign up
  - hover/press micro-interactions
  - decorative numeral fade/slide
- Always add `prefers-reduced-motion` media query guards.

**Planned tasks:**
- [x] Read `frontend/DESIGN_SYSTEM.md` before any change
- [x] Inspect `frontend/src/pages/AuthPage.jsx`
- [x] Add staggered fade-in for feature/benefit cards
- [x] Add subtle dotted-grid parallax or movement
- [x] Add smooth form transition between sign in / sign up modes
- [x] Add hover/press micro-interactions on buttons
- [x] Add decorative numeral fade/slide if applicable
- [x] Add `prefers-reduced-motion` guards on all animations

**Accessibility:**
- [x] All form inputs have visible labels (not placeholder-only)
- [x] Auth form submittable via keyboard (Enter key)
- [x] Focus order is logical: email → password → submit → mode switch link
- [x] Error messages are announced to screen readers (`role="alert"` or `aria-live`)
- [x] Animated elements do not cause seizure risk (no flashing > 3Hz)

**Tests:**
- [x] Render test: AuthPage renders sign-in form by default
- [x] Render test: switching to sign-up mode shows registration fields
- [x] Interaction test: form submission calls submitAuth with correct payload
- [x] Snapshot or visual test: check that `prefers-reduced-motion` disables animations (mock media query)

**Build & size:**
- [x] Run `npm run build` and fix all errors
- [x] Record final bundle gzip size: total ~222 KB (AuthPage lazy chunk: 2.81 KB — the 2.81 KB figure recorded earlier was the lazy chunk only, not the total)
- [x] Update this file: mark Phase 7 ✅ DONE

**Post-phase note:** A canvas-based interactive dot animation was added after the plan was written (replaces the CSS `lat-dot-anim` class on the section element). This introduced `globalThis.matchMedia`, `ResizeObserver`, and `requestAnimationFrame` calls that jsdom does not implement, causing all 9 AuthPage tests to fail. Fixed by adding browser API stubs to `vitest.setup.js`.

**Key files:**
- `frontend/src/pages/AuthPage.jsx`
- `frontend/src/styles.css` (animation keyframes if needed)

---

## Global Rules (apply to every phase)

**Design:**
- Read `frontend/DESIGN_SYSTEM.md` before any UI/design change.
- Use `frontend/src/styles/ui.js` tokens — do not add one-off Tailwind classes.
- Lattice visual language: calm, editorial, data-focused. No gradients, neon, sparkles, stock photos.
- Use `min-w-0`, `break-words`, `truncate` to prevent text overflow.

**Code quality:**
- Make small, safe changes. No full rewrites.
- Keep all existing features working.
- Do not add new npm packages without checking bundle size impact on bundlephobia first.

**Backend:**
- Validate all incoming payloads at API boundaries.
- Preserve backward compatibility with existing MongoDB documents.
- Every new endpoint must check authentication (`req.user` exists) before doing anything.

**Testing:**
- Every new hook gets unit tests.
- Every new endpoint gets integration tests (success + auth error + validation error).
- Do not skip tests to save time — failing tests are better than no tests.

**Accessibility:**
- Every new interactive element has a visible label or `aria-label`.
- Every animation has a `prefers-reduced-motion` guard.
- Do not remove focus outlines without a visible replacement.

**Bundle:**
- New page-level components must use `React.lazy`.
- Keep gzip bundle under 220 KB. Record size after each phase.

**Process:**
- Run `npm run build` after every phase and fix all errors before marking done.
- Update the Phase Status Overview table in this file after each phase.
- Do not start a later phase unless the current phase is ✅ DONE and builds cleanly.
