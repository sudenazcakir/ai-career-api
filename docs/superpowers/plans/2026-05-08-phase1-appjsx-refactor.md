# Phase 1 — App.jsx Refactor + Naming Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break the monolithic 1,251-line App.jsx into focused custom hooks and fix page-file naming mismatches so the codebase is readable, maintainable, and consistent — without changing any user-visible behavior.

**Architecture:** Extract domain state and handlers from App.jsx into 8 custom hooks under `frontend/src/features/`. App.jsx becomes a thin shell of ~350 lines that calls all hooks, wires their outputs together, and renders the route tree. A utility function `buildSkillGaps` is relocated from a page file to `utils/skillUtils.js` so hooks can import it without a circular page dependency.

**Tech Stack:** React 19, React Router 7, Vite 8, Tailwind 4, TypeScript-free JS

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Import chain broken by page renames | Only App.jsx imports page files; update all at once in the final App.jsx rewrite |
| `buildSkillGaps` imported by both App.jsx and RoadmapPage | Move to `utils/skillUtils.js` first; update both importers |
| `runAction` / `pendingAction` shared across all hooks | Keep in `useRunAction`; pass `runAction` + `setStatus` into feature hooks |
| `submitAuth` has field-level error handling that bypasses `runAction` | `useAuth` manages its own `isSubmitting` boolean; App.jsx computes `isBusy = Boolean(pendingAction) \|\| isSubmitting` |
| `openRoadmap` touches state from 2 different hooks + navigate | Keep in App.jsx as a cross-domain coordinator that calls `cvs.setSelectedCvId` + `growth.setRoadmapIntent` + `smoothNavigate` |
| Ref flags (`jobsAutoSyncDoneRef`, `similarApplicationsLoadedRef`) tied to lifecycle | Move each ref into its owning hook |

---

## File Map

### New files (created)
| File | Responsibility |
|------|---------------|
| `frontend/src/utils/skillUtils.js` | `buildSkillGaps` utility (moved from SkillGapPage) |
| `frontend/src/features/shared/useToast.js` | Toast state, `addToast`, `removeToast`, `setStatus` |
| `frontend/src/features/shared/useRunAction.js` | `runAction`, `pendingAction`, `showLoadingBar` |
| `frontend/src/features/auth/useAuth.js` | Auth state, session check, login/register/passport/signout |
| `frontend/src/features/cv/useCvs.js` | CV CRUD state and handlers |
| `frontend/src/features/jobs/useJobs.js` | Jobs state, filter, recommendations, auto-sync |
| `frontend/src/features/applications/useApplications.js` | Applications state, track/update/delete, similar roles |
| `frontend/src/features/analytics/useAnalytics.js` | Analytics state, auto-load on /trends and /insights |
| `frontend/src/features/growth/useGrowthPlan.js` | Roadmap intent, match result, best CV, success score, analyzeGaps |

### Renamed files
| Old name | New name | Reason |
|----------|----------|--------|
| `pages/CvPage.jsx` | `pages/MyCvsPage.jsx` | Matches "My CVs" nav label and `/cvs` route |
| `pages/SkillGapPage.jsx` | `pages/SkillMapPage.jsx` | Matches "Skill Map" nav label |
| `pages/RoadmapPage.jsx` | `pages/GrowthPlanPage.jsx` | Matches "Growth Plan" nav label |
| `pages/AnalyticsPage.jsx` | `pages/MarketSignalsPage.jsx` | Matches "Market Signals" nav label |
| `pages/AccountPage.jsx` | `pages/ProfilePage.jsx` | Matches "Profile" nav label |
| `pages/InsightsPage.jsx` | `pages/AiInsightsPage.jsx` | Matches "AI Insights" nav label |
| `pages/ApplicationsPage.jsx` | `pages/ApplicationTrackerPage.jsx` | Matches "Application Tracker" nav label |

### Modified files
| File | Changes |
|------|---------|
| `frontend/src/pages/SkillMapPage.jsx` | Import `buildSkillGaps` from `utils/skillUtils` instead of self-export |
| `frontend/src/pages/GrowthPlanPage.jsx` | Import `buildSkillGaps` from `utils/skillUtils` instead of `./SkillGapPage` |
| `frontend/src/App.jsx` | Rewritten: calls hooks, renders shell + route tree, ~350 lines |

---

## Hook API Contracts

### `useToast()`
Returns: `{ toasts, addToast(msg, type), removeToast(id), setStatus(msg) }`
- `setStatus` classifies messages and calls `addToast` with the right type

### `useRunAction({ addToast })`
Returns: `{ pendingAction, runAction(label, action), showLoadingBar }`
- `runAction` wraps async actions: sets `pendingAction`, shows error toast on failure

### `useAuth({ runAction, setStatus })`
Returns: `{ authChecked, user, setUser, authForm, setAuthForm, authErrors, setAuthErrors, showOnboarding, passport, setPassport, isSubmitting, currentAuthMode, destinationPath, submitAuth(e), updateUser(u), savePassport(p?), skipPassport(), signOut(), changeAuthMode(mode) }`
- Calls `useLocation`, `useNavigate`, `useSearchParams` internally
- Owns session-check effect and unauthorized-handler effect
- `isSubmitting` is a separate boolean for the auth form only

### `useCvs({ user, passport, runAction, setStatus })`
Returns: `{ cvs, selectedCvId, setSelectedCvId, compareCvId, setCompareCvId, editingCvId, cvForm, setCvForm, cvComparison, selectedCv, loadCvs(), saveCv(e), handleDeleteCv(id), generateCvFromPassport(), loadCvIntoForm(cv), clearEditMode(), compareSelectedCvs(), createSelectedCvVersion() }`
- Auto-loads CVs when `user` changes

### `useJobs({ user, selectedCvId, runAction, setStatus })`
Returns: `{ jobs, setJobs, recommendations, setRecommendations, filterForm, setFilterForm, jobsSyncedAt, fetchJobs(), filterJobs(e?), loadRecommendations(), resetJobFilters() }`
- Auto-syncs jobs from DB on first authenticated session load

### `useApplications({ user, selectedCvId, runAction, setStatus })`
Returns: `{ applications, loadApplications(), similarApplications, loadSimilarApplications(), handleTrackApplication(job, cvIdOrStatus, status?), handleUpdateApplicationStatus(id, status), handleDeleteApplication(id) }`
- Auto-loads similar roles on first visit to `/applications`

### `useAnalytics({ user, runAction, setStatus })`
Returns: `{ skillAnalytics, trendAnalytics, loadAnalytics() }`
- Auto-loads on first visit to `/trends` or `/insights`

### `useGrowthPlan({ selectedCv, jobs, recommendations, runAction, setStatus })`
Returns: `{ roadmapIntent, setRoadmapIntent, matchResult, bestCvResult, successScore, analyzeGaps(skills?), findBestCv(jobId?), runInsightMatch(cvId, jobId) }`

---

## Tasks

### Task 1: Extract `buildSkillGaps` to `utils/skillUtils.js`

**Files:**
- Create: `frontend/src/utils/skillUtils.js`
- Modify: `frontend/src/pages/SkillGapPage.jsx` (remove export, import from utils)
- Modify: `frontend/src/pages/RoadmapPage.jsx` (update import path)

- [ ] Copy `buildSkillGaps` function body from `SkillGapPage.jsx` lines 18-51 to `utils/skillUtils.js` as a named export
- [ ] In `SkillGapPage.jsx`: replace `export function buildSkillGaps` with a regular import from `../utils/skillUtils`
- [ ] In `RoadmapPage.jsx`: update import from `./SkillGapPage` to `../utils/skillUtils`
- [ ] Verify no other file imports `buildSkillGaps` from `SkillGapPage`

### Task 2: Create `features/shared/useToast.js`

**Files:**
- Create: `frontend/src/features/shared/useToast.js`

- [ ] Extract toast state, `addToast`, `removeToast`, cleanup effect from App.jsx lines 167, 173-185
- [ ] Add `setStatus` (lines 187-198) as a method on the hook
- [ ] Return `{ toasts, addToast, removeToast, setStatus }`

### Task 3: Create `features/shared/useRunAction.js`

**Files:**
- Create: `frontend/src/features/shared/useRunAction.js`

- [ ] Extract `pendingAction` state, `showLoadingBar` state, `loadingBarTimerRef`
- [ ] Extract `runAction` function (lines 581-593)
- [ ] Extract loading-bar effect (lines 508-516)
- [ ] Return `{ pendingAction, runAction, showLoadingBar }`

### Task 4: Create `features/auth/useAuth.js`

**Files:**
- Create: `frontend/src/features/auth/useAuth.js`

- [ ] Move auth state: `authChecked`, `user`, `authForm`, `authErrors`, `showOnboarding`, `passport`
- [ ] Add own `isSubmitting` boolean for auth form pending state (replaces setPendingAction in submitAuth)
- [ ] Move session-check effect (lines 368-388)
- [ ] Move unauthorized-handler effect (lines 497-505) — hook calls `useLocation`/`useNavigate` internally
- [ ] Move `applyAuthSession`, `submitAuth`, `updateUser` (using runAction), `savePassport` (using runAction), `skipPassport`, `signOut`, `changeAuthMode`
- [ ] Compute `currentAuthMode`, `redirectPath`, `destinationPath` inside hook
- [ ] Export `getLoginPathFor` as a named export from this file (used by App.jsx render)
- [ ] Return full auth API

### Task 5: Create `features/cv/useCvs.js`

**Files:**
- Create: `frontend/src/features/cv/useCvs.js`

- [ ] Move CV state: `cvs`, `selectedCvId`, `compareCvId`, `editingCvId`, `cvComparison`, `cvForm`
- [ ] Add auto-load effect when `user` changes
- [ ] Move `loadCvs`, `saveCv`, `handleDeleteCv`, `generateCvFromPassport`, `loadCvIntoForm`, `clearEditMode`, `compareSelectedCvs`, `createSelectedCvVersion`
- [ ] Compute `selectedCv` from `cvs + selectedCvId`
- [ ] Return full CV API

### Task 6: Create `features/jobs/useJobs.js`

**Files:**
- Create: `frontend/src/features/jobs/useJobs.js`

- [ ] Move jobs state: `jobs`, `recommendations`, `filterForm`, `jobsSyncedAt`, `jobsAutoSyncDoneRef`
- [ ] Move auto-sync effect (lines 547-567) — hook calls `useLocation` internally
- [ ] Move `fetchJobs`, `filterJobs`, `loadRecommendations`, `resetJobFilters`
- [ ] Return full jobs API

### Task 7: Create `features/applications/useApplications.js`

**Files:**
- Create: `frontend/src/features/applications/useApplications.js`

- [ ] Move application state: `applications`, `similarApplications`, `similarApplicationsLoadedRef`
- [ ] Move `loadApplications` (called by useCvs effect too — expose it)
- [ ] Move auto-load similar roles effect (lines 569-579) — hook calls `useLocation` internally
- [ ] Move `loadSimilarApplications`, `handleTrackApplication`, `handleUpdateApplicationStatus`, `handleDeleteApplication`
- [ ] Return full applications API

### Task 8: Create `features/analytics/useAnalytics.js`

**Files:**
- Create: `frontend/src/features/analytics/useAnalytics.js`

- [ ] Move analytics state: `skillAnalytics`, `trendAnalytics`
- [ ] Move auto-load effect (lines 531-543) — hook calls `useLocation` internally
- [ ] Move `loadAnalytics`
- [ ] Return `{ skillAnalytics, trendAnalytics, loadAnalytics }`

### Task 9: Create `features/growth/useGrowthPlan.js`

**Files:**
- Create: `frontend/src/features/growth/useGrowthPlan.js`

- [ ] Move growth state: `roadmapIntent`, `matchResult`, `bestCvResult`, `successScore`
- [ ] Move `analyzeGaps` (import `buildSkillGaps` from `utils/skillUtils`)
- [ ] Move `findBestCv`, `runInsightMatch`
- [ ] Expose `setRoadmapIntent` so App.jsx can call `setRoadmapIntent(null)` in `navigatePage`
- [ ] Return full growth API

### Task 10: Rename page files

**Files — rename all 7:**

- [ ] `Move-Item pages/CvPage.jsx → pages/MyCvsPage.jsx`
- [ ] `Move-Item pages/SkillGapPage.jsx → pages/SkillMapPage.jsx`
- [ ] `Move-Item pages/RoadmapPage.jsx → pages/GrowthPlanPage.jsx`
- [ ] `Move-Item pages/AnalyticsPage.jsx → pages/MarketSignalsPage.jsx`
- [ ] `Move-Item pages/AccountPage.jsx → pages/ProfilePage.jsx`
- [ ] `Move-Item pages/InsightsPage.jsx → pages/AiInsightsPage.jsx`
- [ ] `Move-Item pages/ApplicationsPage.jsx → pages/ApplicationTrackerPage.jsx`

### Task 11: Update cross-page imports in renamed files

**Files:**
- Modify: `frontend/src/pages/SkillMapPage.jsx`
- Modify: `frontend/src/pages/GrowthPlanPage.jsx`

- [ ] In `SkillMapPage.jsx`: confirm `buildSkillGaps` is imported from `../utils/skillUtils` (done in Task 1)
- [ ] In `GrowthPlanPage.jsx`: confirm import is from `../utils/skillUtils` (done in Task 1)
- [ ] Rename default export in each file to match new file name (e.g. `export default function SkillMapPage`)

### Task 12: Rewrite App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] Replace all inline state/handlers with calls to the 8 hooks
- [ ] Keep: `mobileSidebarOpen`, `smoothNavigate`, `handleRouteClick`, `navigatePage`, `openRoadmap` (as coordinator), `renderAvatar`
- [ ] Compute `isBusy = Boolean(pendingAction) || auth.isSubmitting`
- [ ] Update all page imports to new filenames
- [ ] Update route elements to pass hook outputs as props
- [ ] Target: ~350 lines

### Task 13: Run build and fix errors

- [ ] Run `npm run build` from project root
- [ ] Fix all TypeScript / Vite / React errors
- [ ] Re-run build until clean exit
