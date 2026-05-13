# AI Career API

AI Career API, Express + MongoDB backend ve Vite + React frontend kullanan AI-assisted career matching demo uygulamasidir. Uygulama; Career Passport, CV profilleri, is filtreleme, job matching, skill gap analizi, roadmap, application tracker, market signals ve AI insights akislari etrafinda kuruludur.

Frontend artik Lattice Career design system ile calisir. Yeni UI veya design degisikligi yaparken once `frontend/DESIGN_SYSTEM.md` okunmalidir.

## Project Layout

```text
ai-career-api/
  backend/
    __tests__/
      routes/          # backend integration tests
      services/        # backend unit tests (cvAiVersioning, cvParser, …)
    config/
    middleware/
    models/
    routes/
    scripts/
    services/
      cvAiVersioningService.js   # AI CV versioning — 4 modes + OpenAI fallback
      cvGeneratorService.js      # CV draft generation from passport
      cvParser.js                # rule-based PDF/TXT parser
    server.js
  frontend/
    src/
      components/
        common/        # ErrorBoundary, Toast
        cv/            # CvPreview, CvQualityPanel, CvTemplateSelector,
                       # CvUploadReview, CvDiffPanel, CvAiVersionModal
      constants/
      features/        # custom hooks: useAuth, useCvs, useJobs, …
      pages/
      services/
      styles/
      utils/
    DESIGN_SYSTEM.md
    index.html
  docs/
    Lattice Career Design System/
    superpowers/plans/ # implementation plans (MASTER_PLAN.md, phase plans)
    API_Spec_ve_TechStack.pdf
    Backend.pdf
  package.json
  vite.config.js
```

Important local URLs:

- API base URL: `http://localhost:5001/api`
- Swagger UI: `http://localhost:5001/api-docs`
- Frontend URL: `http://localhost:5173`

## Live Demo

- Production: <https://ai-career-api-eight.vercel.app>
- API Docs: <https://ai-career-api-eight.vercel.app/api-docs>

Deployed on Vercel (Node.js serverless + SPA static). `npm run build:prod` builds the frontend and copies the output to `backend/public/`, which Vercel bundles into the serverless function.

## Features

- JWT tabanli register/login akisi
- Protected frontend routes with redirect back to the originally requested page
- User profile and Career Passport persistence
- Passport onboarding before the authenticated workspace
- CV create/list/update/delete/version flows
- CV compare and best-CV flows
- **CV file upload** — PDF and TXT files parsed server-side (rule-based, regex-based `cvParser.js`); user reviews extracted fields before saving; 5 MB limit, 10 uploads/hour per user
- **CV preview** — three templates (Classic, Modern, ATS Compact) with live quality panel (completeness score, missing sections, suggested improvements)
- **AI CV versioning** — four optimisation modes applied to existing content only (no hallucinations): ATS Optimise, Role Tailor, Concise, Seniority Boost; before/after diff panel; user reviews changes before saving; graceful rule-based fallback when `OPENAI_API_KEY` is not set
- MongoDB tabanli job listesi, filtreleme ve Adzuna import/fetch akisi
- CV context ile recommendations
- Weighted match scoring and explainability (Skill×0.60 + Experience×0.25 + Role×0.15)
- Missing skill analysis and learning roadmap generation
- **Growth Plan v2** — four roadmap sources (CV Gaps / Market Trends / Target Job / Similar Roles); each milestone includes category, difficulty level, estimated weeks, prerequisites, a concrete project idea, and a proof-of-work requirement; milestones served from a static verified dataset (`skillRoadmaps.js`, 16 skills); plan persists per user+CV in localStorage. AI personalization of milestones is planned (see AI Enhancement Roadmap)
- Application tracker with Saved, Under Review, Accepted and Rejected statuses
- Similar roles recommendation based on application history
- Certificate management — PDF/image upload, AI-powered extraction (OpenAI Vision + regex fallback)
- Analytics / Market Signals charts with Chart.js
- Career Matrix panel with optional OpenAI-assisted fit analysis
- Application success score / interview predictor with auto-recalculate on CV or job change
- Toast notification system — bottom-right auto-dismiss toasts replace the old header status pill
- Lattice Career design system across the frontend

## Frontend Routes

Public routes:

- `/login`
- `/register`

Protected routes:

- `/dashboard` - Dashboard
- `/jobs` - Jobs
- `/cvs` - My CVs
- `/skill-gaps` - Skill Map
- `/roadmap` - Growth Plan
- `/applications` - Application Tracker
- `/trends` - Market Signals
- `/insights` - AI Insights
- `/profile` - Profile

Route behavior:

- `/` redirects based on auth state.
- Unauthenticated protected routes redirect to `/login?redirect=<path>`.
- Login/register returns the user to the intended protected route.
- Unknown frontend URLs render the Not Found page.

## Design System

The implementation source of truth is:

- `frontend/DESIGN_SYSTEM.md`
- `frontend/src/styles.css`
- `frontend/src/styles/ui.js`

The generated/reference design artifact is:

- `docs/Lattice Career Design System/`

Use `frontend/DESIGN_SYSTEM.md` for future frontend changes. It documents the Lattice rules for colors, typography, layout, buttons, panels, empty states, score badges, status pills, page patterns and do/don't rules.

Important rules:

- Use `ui.js` tokens before writing one-off Tailwind classes.
- Use Bone/Paper surfaces, Ink text, Hairline borders and Cobalt actions.
- Do not reintroduce the old teal/slate gradient style.
- Do not use stock photo backgrounds in product chrome.
- Use `react-icons/fi`, which is the current icon dependency in the app.
- Run `npm run build` before finishing frontend work.

## Requirements

- Node.js 20+ recommended
- `npm`
- Local MongoDB or MongoDB Atlas

## Setup

Run commands from the project root:

```powershell
cd ai-career-api
npm install
Copy-Item .env.example .env
```

Check `.env`:

```env
PORT=5001
JWT_SECRET=replace_this_local_dev_secret
MONGO_URI=mongodb://127.0.0.1:27017/ai-career-api
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
OPENAI_API_KEY=your_openai_api_key   # optional — Career Matrix + certificate AI extraction
OPENAI_MODEL=gpt-4.1-mini            # optional — defaults to gpt-4.1-mini
VITE_BACKEND_ORIGIN=http://localhost:5001  # omit in production (same-origin on Vercel)
```

`.env.example` defaults to local MongoDB. For Atlas, replace only `MONGO_URI`:

```text
mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/ai-career-api?retryWrites=true&w=majority
```

`OPENAI_API_KEY` is optional. When set it powers: AI-assisted Career Matrix, CV draft generation from passport, AI CV versioning (all 4 modes), and certificate data extraction from uploaded PDFs/images. All AI features have rule-based fallbacks and work without the key.

## Local Development

All commands run from `ai-career-api/`. You do not need to `cd backend` or `cd frontend`.

Optional DB check:

```powershell
npm run check:db
```

Optional demo seed:

```powershell
npm run seed:demo
```

Recommended local startup:

1. Prepare `.env`
2. Run `npm run check:db` if DB configuration changed
3. Run `npm run seed:demo` if demo data is needed
4. Start backend
5. Start frontend in a second terminal

Backend:

```powershell
npm run server
```

Frontend:

```powershell
npm run client
```

Build:

```powershell
npm run build
```

## Useful Commands

```powershell
npm run check:db
npm run seed:demo
npm run seed:test          # full test dataset (4 users, 6 CVs, 8 jobs, 6 applications)
npm run seed:test:reset    # wipe DB then seed
npm run server
npm run client
npm run build
npm run build:prod         # production build — used by Vercel
npm run test               # Vitest unit tests (frontend hooks, components, utils)
npm run test:backend       # node:test backend unit tests (cvParser route file)
npm run test:integration   # node:test route integration tests — requires local MongoDB at localhost:27017
```

Script mapping:

- `npm run server` → `backend/server.js`
- `npm run client` → Vite dev server using `frontend/`
- `npm run build` → production frontend build into `frontend/dist`
- `npm run build:prod` → build + copy `frontend/dist` to `backend/public` (Vercel deployment)
- `npm run check:db` → `backend/scripts/checkDb.js`
- `npm run seed:demo` → `backend/scripts/seedDemo.js`
- `npm run seed:test` → `backend/scripts/seedFullTestData.js`
- `npm run test` → Vitest (frontend unit tests — hooks, components, utils; browser API stubs in `vitest.setup.js`)
- `npm run test:backend` → `node --test backend/__tests__/routes/cvUpload.test.js` (cvParser unit tests)
- `npm run test:integration` → `node --test` on `cvRoutes.integration.test.js` + `applicationRoutes.integration.test.js`; connects to `mongodb://localhost:27017/ai_career_test`, drops DB after each file
- `npm run test:e2e` → Playwright E2E tests

## Available API Surface

Public:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api-docs`

Authenticated/user routes:

- `GET /api/health`
- `GET /api/me`
- `PUT /api/me`
- `PUT /api/me/passport`

CV routes:

- `GET /api/cvs`
- `POST /api/cvs`
- `PUT /api/cvs/:id`
- `DELETE /api/cvs/:id`
- `POST /api/cvs/:id/version` — manual version copy (auto-increments version label)
- `POST /api/cvs/:id/ai-version` — AI-assisted version; body: `{ mode, targetJobId?, instructions? }`; returns `{ proposedCv, changes[], warnings[], modelInfo }` without saving; modes: `ats_optimize | role_tailor | concise | seniority_boost`
- `POST /api/cvs/compare`
- `POST /api/cvs/best-cv`
- `POST /api/cvs/generate`
- `POST /api/cvs/rank-for-job`
- `POST /api/cvs/upload` — parse PDF or TXT file; returns extracted CV fields for user review before saving; 5 MB max, 10/hour rate limit

Job routes:

- `GET /api/jobs`
- `GET /api/jobs/filter`
- `POST /api/jobs`
- `POST /api/jobs/import-adzuna`
- `GET /api/jobs/fetch`

Matching and recommendation routes:

- `POST /api/match`
- `POST /api/match/full`
- `GET /api/best-cv/:jobId`
- `POST /api/success-score`
- `GET /api/recommendations?cvId=...`

Application routes:

- `GET /api/applications`
- `POST /api/applications`
- `PATCH /api/applications/:id/status`
- `GET /api/applications/similar-roles`

Analytics and AI-assisted routes:

- `POST /api/analysis`
- `GET /api/analytics/skills`
- `GET /api/analytics/trends`
- `POST /api/career-matrix`

Certificate routes:

- `POST /api/certificates/extract` — upload PDF or image, returns extracted certificate fields

## Vercel Deployment

1. MongoDB Atlas'ta free cluster olustur, connection string al
2. Kodu GitHub'a push yap
3. Vercel'de yeni proje olustur — root directory: `ai-career-api`
4. Environment Variables ekle:

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secure random string (min 32 chars) |
| `ADZUNA_APP_ID` | Yes | Adzuna API app ID |
| `ADZUNA_APP_KEY` | Yes | Adzuna API app key |
| `OPENAI_API_KEY` | Optional | Career Matrix, CV draft generation, AI CV versioning, certificate AI extraction |
| `NODE_ENV` | Yes | Set to `production` |

5. Deploy — `build:prod` script otomatik calisir, frontend `backend/public/` altina kopyalanir

`VITE_BACKEND_ORIGIN` Vercel'de ayarlanmaz: frontend ve backend ayni domain'de (same-origin).

## Notes

- `MONGO_URI` yoksa backend acilir, ancak DB gerektiren endpointler `503` donebilir.
- `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` only matter for Adzuna import/fetch flows.
- Swagger backend tarafinda servis edilir: `http://localhost:5001/api-docs` (local) ve `https://ai-career-api-eight.vercel.app/api-docs` (production).
- Sign-in/sign-up JWT tabanlidir. Frontend token'i `localStorage` icinde saklar.
- `POST /api/auth/register`, `POST /api/auth/login` and `/api-docs` are public; the rest of `/api/*` is protected by JWT.
- CV, application and recommendation data user-scoped olarak tutulur.
- Frontend SPA routing uses React Router. Production static hosting needs SPA fallback support (vercel.json handles this with a catch-all route).
- Certificate upload limiti 5 MB'dir (multer). Vercel Hobby plan'da request body limiti 4.5 MB olabilir.
- Toast notification system: action feedback bottom-right kose toasts ile gosterilir (header status pill kaldirildi).
- `frontend/DESIGN_SYSTEM.md` is the source of truth for future UI/design changes.

## AI Enhancement Roadmap

Most visible features are either already AI-powered or have a rule-based implementation waiting to be replaced. This section tracks what still runs on rules and what new AI flows are planned.

### Rule-based features to upgrade with AI

| Feature | Current implementation | Planned AI upgrade |
|---|---|---|
| **Growth Plan milestones** | Static `skillRoadmaps.js` dataset (16 pre-defined skill paths). Source selector (CV Gaps / Market Trends / Target Job / Similar Roles) works but all milestones come from the same static data regardless of source. | `POST /api/roadmap/ai-generate` — generate a personalized learning path from user's actual experience level, target job skills, and selected source. Each milestone: steps, project idea, and proof-of-work tailored to the user, not generic. |
| **Similar roles scoring** | Weighted math: skill overlap + title token overlap + location match. `whySimilar` explanations are templated strings assembled from matched skills. | Replace or augment scoring with semantic role similarity so that e.g. "Platform Engineer" matches "DevOps Engineer" even without exact skill overlap. AI-generated `whySimilar` text instead of templates. |
| **Application success score** | Formula: `matchScore × 0.6 + completenessScore × 0.25 + experienceBonus`. `interviewPotential` is a threshold label (High/Medium/Low). | AI reads the full CV narrative + job description + passport together. Returns a nuanced score with specific weaknesses ("your summary doesn't mention the required 3 years of cloud experience") instead of just a number. |
| **Skill gap prioritization** | Sorted by frequency count across all jobs. No context about which gaps matter most for the user's actual target role. | AI ranks gaps by relevance to target job, explains *why* each gap blocks the user specifically, and suggests an order to close them. `POST /api/skill-gaps/ai-prioritize`. |
| **Job match explainability** | `matchService.js` returns a templated explanation string (`"X of Y skills matched"`). | AI writes a genuine 2–3 sentence explanation of why this job is or isn't a good fit — covering skills, experience depth, role expectations, and what the user should do to close the gap. |
| **CV upload parsing** | Rule-based regex (`cvParser.js`). Works well for structured CVs; misses sections in free-form or non-standard formats. | After rule-based extraction, pass the raw text to AI to fill in missing sections and clean up malformed entries. Already planned (was deferred from Phase 2). |
| **Market signals interpretation** | Frequency aggregation — shows which skills appear most in job postings. No explanation of *why* a skill is trending or what it means for the user. | AI generates a 2–3 sentence interpretation per signal: "Docker appears in 78% of Backend roles this month — this is driven by containerisation requirements in your target category." |

### New AI features

| Feature | Description | Backend endpoint |
|---|---|---|
| **Cover letter generator** | Per-application cover letter using CV + job description + passport. User selects tone (formal / direct / brief). Returns a draft for review — never auto-sends. | `POST /api/cvs/:id/cover-letter` — payload: `{ jobId, tone }` |
| **Interview preparation** | Generates 8–10 likely interview questions for a CV + job pair, with talking-point hints per question based on the user's actual experience. | `POST /api/interview-prep` — payload: `{ cvId, jobId }` |
| **Job description analyser** | Paste a raw job description → AI extracts: required skills (explicit + implied), seniority signals, red flags, culture hints, and salary negotiation data. Useful before applying. | `POST /api/jobs/analyse-jd` — payload: `{ description }` |
| **Passport bio generator** | Turn Career Passport fields into a polished professional summary / LinkedIn-style bio the user can copy. | `POST /api/me/generate-bio` — payload: `{ tone?, targetTitle? }` |

### AI features already implemented

| Feature | Service | Notes |
|---|---|---|
| CV versioning (4 modes) | `cvAiVersioningService.js` | Full OpenAI + rule-based fallback |
| CV draft from passport | `cvGeneratorService.js` | Full OpenAI + rule-based fallback |
| CV ranking for job | `cvRankingService.js` | OpenAI explains ranking; rule-based score used as fallback |
| Career Matrix | `careerMatrixService.js` | OpenAI fits passport to career domains; works without key |
| Certificate extraction | `certificateExtractorService.js` | OpenAI Vision for PDFs/images; regex fallback |

All AI features use `process.env.OPENAI_API_KEY`. When the key is absent, every feature falls back to a rule-based implementation — nothing breaks.

---

## Reference Documents

- `frontend/DESIGN_SYSTEM.md`
- `docs/Lattice Career Design System/`
- `docs/API_Spec_ve_TechStack.pdf`
- `docs/Backend.pdf`
- `docs/AI-Career-Matching-Project-Summary.docx`
- `docs/ai-career-api-summary.html`
