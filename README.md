# AI Career API

AI Career API, Express + MongoDB backend ve Vite + React frontend kullanan AI-assisted career matching demo uygulamasidir. Uygulama; Career Passport, CV profilleri, is filtreleme, job matching, skill gap analizi, roadmap, application tracker, market signals ve AI insights akislari etrafinda kuruludur.

Frontend artik Lattice Career design system ile calisir. Yeni UI veya design degisikligi yaparken once `frontend/DESIGN_SYSTEM.md` okunmalidir.

## Project Layout

```text
ai-career-api/
  backend/
    config/
    middleware/
    models/
    routes/
    scripts/
    services/
    server.js
  frontend/
    src/
      components/
      constants/
      pages/
      services/
      styles/
    DESIGN_SYSTEM.md
    index.html
  docs/
    Lattice Career Design System/
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
- MongoDB tabanli job listesi, filtreleme ve Adzuna import/fetch akisi
- CV context ile recommendations
- Weighted match scoring and explainability (Skill×0.60 + Experience×0.25 + Role×0.15)
- Missing skill analysis and learning roadmap generation
- Growth Plan with skill selection — Skill Map gap'leri → kullanici 1-4 skill secer → milestone roadmap uretilir
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

`OPENAI_API_KEY` is optional. When set it powers: AI-assisted Career Matrix, CV draft generation from passport, and certificate data extraction from uploaded PDFs/images.

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
```

Script mapping:

- `npm run server` → `backend/server.js`
- `npm run client` → Vite dev server using `frontend/`
- `npm run build` → production frontend build into `frontend/dist`
- `npm run build:prod` → build + copy `frontend/dist` to `backend/public` (Vercel deployment)
- `npm run check:db` → `backend/scripts/checkDb.js`
- `npm run seed:demo` → `backend/scripts/seedDemo.js`
- `npm run seed:test` → `backend/scripts/seedFullTestData.js`
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
- `POST /api/cvs/:id/version`
- `POST /api/cvs/compare`
- `POST /api/cvs/best-cv`
- `POST /api/cvs/generate`
- `POST /api/cvs/rank-for-job`

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
| `OPENAI_API_KEY` | Optional | Career Matrix + certificate AI extraction |
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

## Reference Documents

- `frontend/DESIGN_SYSTEM.md`
- `docs/Lattice Career Design System/`
- `docs/API_Spec_ve_TechStack.pdf`
- `docs/Backend.pdf`
- `docs/AI-Career-Matching-Project-Summary.docx`
- `docs/ai-career-api-summary.html`
