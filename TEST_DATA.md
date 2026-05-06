# TEST_DATA

This file is a practical test dataset and execution guide for the current `ai-career-api` implementation.

## 0. Scope And Model Constraints

Current backend model fields used by the test set:

- `User`: `firstName`, `lastName`, `email`, `passwordHash`, `countryCode`, `phoneNumber`, `phone`, `photo`, `passport`, `passportCompleted`
- `CV`: `owner`, `parentCv`, `title`, `type`, `version`, `summary`, `skills`, `projects`, `experience`, `education`, `certifications`
- `Job`: `title`, `description`, `skills`, `company`, `location`, `salaryMin`, `salaryMax`, `category`, `contractType`, `contractTime`, `redirectUrl`, `createdAt`
- `Application`: `owner`, `job`, `cv`, `status`, `notes`, `appliedAt`

Important runtime rules already enforced by the codebase:

- `countryCode = +90` requires a 10-digit `phoneNumber`.
- Register passwords must be at least 8 characters and contain uppercase, lowercase, number, and special character.
- `confirmPassword` is a frontend form field, not a backend model field.
- CV skills are arrays.
- Passport fields are strings in the current schema, so list-like values are stored as comma-separated text.
- `Job` has a unique compound index on `(title, company)`.
- `Application` has a unique compound index on `(owner, job)`.
- `/api/jobs/filter` requires `cvId` when using `minMatch` or `sort=score`.
- Frontend stores the JWT in `localStorage.authToken`.
- Frontend clears the token and redirects to login on 401.

## 1. Test Users

### 1.1 Valid Users

| Alias | firstName | lastName | email | countryCode | phoneNumber | password | Expected result | Main usage |
|---|---|---|---|---|---|---|---|---|
| strong-backend | Aylin | Kaya | aylin.kaya@demo.local | +90 | 5321112233 | Bknd!2026A | 201 register, token returned | Backend, CV, recommendations, best-cv, applications, analytics |
| frontend-heavy | Deniz | Arslan | deniz.arslan@demo.local | +90 | 5302223344 | Fnt@2026Dev | 201 register, token returned | Frontend, match, recommendation ranking |
| junior-gap | Mert | Yilmaz | mert.yilmaz@demo.local | +90 | 5553332211 | Jrn#2026Qa | 201 register, weak profile behavior | Low match, roadmap, analytics gaps |
| validation-user | Elif | Demir | elif.demir@demo.local | +90 | 5424448899 | Err0r!2026X | 201 register, edge-case user | Negative tests, profile update, access checks |

### 1.2 Valid Register Payloads

```json
[
  {
    "firstName": "Aylin",
    "lastName": "Kaya",
    "email": "aylin.kaya@demo.local",
    "countryCode": "+90",
    "phoneNumber": "5321112233",
    "password": "Bknd!2026A",
    "confirmPassword": "Bknd!2026A"
  },
  {
    "firstName": "Deniz",
    "lastName": "Arslan",
    "email": "deniz.arslan@demo.local",
    "countryCode": "+90",
    "phoneNumber": "5302223344",
    "password": "Fnt@2026Dev",
    "confirmPassword": "Fnt@2026Dev"
  },
  {
    "firstName": "Mert",
    "lastName": "Yilmaz",
    "email": "mert.yilmaz@demo.local",
    "countryCode": "+90",
    "phoneNumber": "5553332211",
    "password": "Jrn#2026Qa",
    "confirmPassword": "Jrn#2026Qa"
  },
  {
    "firstName": "Elif",
    "lastName": "Demir",
    "email": "elif.demir@demo.local",
    "countryCode": "+90",
    "phoneNumber": "5424448899",
    "password": "Err0r!2026X",
    "confirmPassword": "Err0r!2026X"
  }
]
```

### 1.3 Invalid Register Cases

| Case | Payload focus | Expected result |
|---|---|---|
| 9-digit phone | `phoneNumber: 532111223` | 400 validation error for phone |
| 11-digit phone | `phoneNumber: 53211122334` | 400 validation error for phone |
| letters in phone | `phoneNumber: 53211A2233` | 400 validation error for phone |
| weak password | `password: weak123` | 400 validation error for password |
| duplicate email | `email: aylin.kaya@demo.local` | 409 email already registered |
| password mismatch | `password !== confirmPassword` | frontend should block submit; if exposed to API, expected reject in UI layer |

```json
[
  {
    "case": "9-digit phone",
    "firstName": "Test",
    "lastName": "Phone9",
    "email": "phone9@demo.local",
    "countryCode": "+90",
    "phoneNumber": "532111223",
    "password": "Valid!2026A",
    "confirmPassword": "Valid!2026A"
  },
  {
    "case": "11-digit phone",
    "firstName": "Test",
    "lastName": "Phone11",
    "email": "phone11@demo.local",
    "countryCode": "+90",
    "phoneNumber": "53211122334",
    "password": "Valid!2026A",
    "confirmPassword": "Valid!2026A"
  },
  {
    "case": "letters in phone",
    "firstName": "Test",
    "lastName": "PhoneTxt",
    "email": "phonetxt@demo.local",
    "countryCode": "+90",
    "phoneNumber": "53211A2233",
    "password": "Valid!2026A",
    "confirmPassword": "Valid!2026A"
  },
  {
    "case": "weak password",
    "firstName": "Test",
    "lastName": "WeakPass",
    "email": "weak@demo.local",
    "countryCode": "+90",
    "phoneNumber": "5327778899",
    "password": "weak123",
    "confirmPassword": "weak123"
  },
  {
    "case": "duplicate email",
    "firstName": "Aylin",
    "lastName": "Dup",
    "email": "aylin.kaya@demo.local",
    "countryCode": "+90",
    "phoneNumber": "5329998877",
    "password": "Dup!2026Aa",
    "confirmPassword": "Dup!2026Aa"
  },
  {
    "case": "password mismatch",
    "firstName": "Test",
    "lastName": "Mismatch",
    "email": "mismatch@demo.local",
    "countryCode": "+90",
    "phoneNumber": "5324456677",
    "password": "Good!2026A",
    "confirmPassword": "Bad!2026B"
  }
]
```

## 2. Career Passport Test Data

Passport payload fields must be sent as strings in the current schema.

### 2.1 Passport Payloads

```json
[
  {
    "alias": "strong-backend",
    "passport": {
      "targetTitle": "Senior Backend Engineer",
      "school": "Istanbul Technical University",
      "department": "Computer Engineering",
      "graduationYear": "2023",
      "gpa": "3.62/4.00",
      "location": "Istanbul, Turkey",
      "interests": "Backend architecture, API design, distributed systems, cloud reliability",
      "skills": "Node.js, Express, TypeScript, REST APIs, MongoDB, PostgreSQL, Redis, JWT, Docker, AWS, Kubernetes",
      "languages": "Turkish, English",
      "tools": "Git, GitHub, Postman, Swagger, Docker, Kubernetes, AWS",
      "experience": "Built internal APIs for user management, improved response times, integrated auth and rate limiting",
      "projects": "Multi-tenant HR API, event-driven notification service, role-based access control service",
      "certificates": "AWS Cloud Practitioner, Node.js API Design",
      "achievements": "Dean's list, mentoring junior devs, hackathon finalist",
      "summary": "Backend engineer focused on scalable APIs, data consistency and cloud deployment.",
      "workStyle": "Hybrid, ownership-driven, async-friendly",
      "salaryExpectation": "90000-120000 TRY/month",
      "availability": "Immediate",
      "portfolio": "https://portfolio.example.com/aylin",
      "linkedin": "https://linkedin.com/in/aylinkaya",
      "github": "https://github.com/aylinkaya"
    }
  },
  {
    "alias": "frontend-heavy",
    "passport": {
      "targetTitle": "Frontend Engineer",
      "school": "Marmara University",
      "department": "Software Engineering",
      "graduationYear": "2024",
      "gpa": "3.45/4.00",
      "location": "Ankara, Turkey",
      "interests": "Product UI, design systems, accessibility, performance, component architecture",
      "skills": "React, TypeScript, JavaScript, HTML, CSS, Tailwind CSS, Next.js, Redux, Playwright, Figma",
      "languages": "Turkish, English",
      "tools": "Figma, Storybook, Vite, Playwright, Git, Chrome DevTools",
      "experience": "Built responsive dashboard screens and reusable component libraries",
      "projects": "Design system playground, analytics dashboard, onboarding wizard",
      "certificates": "Frontend Masters workshop, accessibility basics",
      "achievements": "Won internal UI challenge, shipped component audit improvements",
      "summary": "Frontend-focused developer specializing in React UI and polished interactions.",
      "workStyle": "Remote-friendly, collaborative, design-aware",
      "salaryExpectation": "70000-95000 TRY/month",
      "availability": "2 weeks notice",
      "portfolio": "https://portfolio.example.com/deniz",
      "linkedin": "https://linkedin.com/in/denizarslan",
      "github": "https://github.com/denizarslan"
    }
  },
  {
    "alias": "junior-gap",
    "passport": {
      "targetTitle": "Junior Software Developer",
      "school": "Self-taught / Bootcamp",
      "department": "Computer Programming",
      "graduationYear": "2025",
      "gpa": "3.00/4.00",
      "location": "Izmir, Turkey",
      "interests": "Learning basics, building small web apps, testing, clean code",
      "skills": "HTML, CSS, JavaScript, Git, basic React",
      "languages": "Turkish, English",
      "tools": "VS Code, GitHub, Postman",
      "experience": "Completed internship support tasks and small bug-fix assignments",
      "projects": "Todo app, portfolio site, simple calculator",
      "certificates": "Basic web development certificate",
      "achievements": "Completed first freelance landing page",
      "summary": "Junior candidate with limited production experience and visible skill gaps.",
      "workStyle": "Structured guidance, learning-oriented",
      "salaryExpectation": "45000-60000 TRY/month",
      "availability": "Immediate",
      "portfolio": "",
      "linkedin": "",
      "github": "https://github.com/mertyilmaz"
    }
  },
  {
    "alias": "validation-user",
    "passport": {
      "targetTitle": "Generalist Software Engineer",
      "school": "Open Education",
      "department": "Information Systems",
      "graduationYear": "2022",
      "gpa": "N/A",
      "location": "Bursa, Turkey",
      "interests": "Validation, debugging, edge cases, API reliability, QA",
      "skills": "JavaScript, SQL, Postman, Manual Testing, Git",
      "languages": "Turkish, English",
      "tools": "Swagger, Postman, Chrome DevTools",
      "experience": "Helped a small team test API error responses and form edge cases",
      "projects": "Validation checklist tool, bug triage spreadsheet",
      "certificates": "",
      "achievements": "Reduced recurring form errors during QA",
      "summary": "Used mainly for negative tests and profile edge-case coverage.",
      "workStyle": "Remote or hybrid, detail-oriented",
      "salaryExpectation": "50000-70000 TRY/month",
      "availability": "2 weeks notice",
      "portfolio": "",
      "linkedin": "",
      "github": ""
    }
  }
]
```

### 2.2 Expected Career Matrix Behavior

- `strong-backend`: Backend and DevOps & Cloud should rank high.
- `frontend-heavy`: Frontend should rank first by a clear margin.
- `junior-gap`: low to medium scores, with visible skill gaps.
- `validation-user`: mixed/general signals for negative and edge-case coverage.

## 3. CV Test Data

Current CV model fields are `owner`, `parentCv`, `title`, `type`, `version`, `summary`, `skills`, `projects`, `experience`, `education`, `certifications`.

### 3.1 CV Payloads

```json
[
  {
    "alias": "backend-cv",
    "ownerAlias": "strong-backend",
    "title": "Backend CV",
    "type": "Backend",
    "version": "v1",
    "summary": "Backend engineer with API, auth, and cloud deployment experience.",
    "skills": ["Node.js", "Express", "TypeScript", "REST APIs", "MongoDB", "PostgreSQL", "JWT", "Docker", "AWS", "Redis", "Jest"],
    "projects": ["Multi-tenant HR API", "Notification service", "Role-based auth service"],
    "experience": ["Built REST APIs with Node.js and Express", "Integrated MongoDB and PostgreSQL", "Deployed services to AWS"],
    "education": ["BSc Computer Engineering"],
    "certifications": ["AWS Cloud Practitioner"]
  },
  {
    "alias": "frontend-cv",
    "ownerAlias": "frontend-heavy",
    "title": "Frontend CV",
    "type": "Frontend",
    "version": "v1",
    "summary": "Frontend developer focused on React UI systems and accessibility.",
    "skills": ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS", "Next.js", "Redux", "Playwright", "Figma"],
    "projects": ["Design system playground", "Analytics dashboard", "Onboarding wizard"],
    "experience": ["Built responsive component libraries", "Implemented form validation and UI states"],
    "education": ["BSc Software Engineering"],
    "certifications": ["Frontend accessibility workshop"]
  },
  {
    "alias": "fullstack-cv",
    "ownerAlias": "strong-backend",
    "title": "Full Stack CV",
    "type": "Full Stack",
    "version": "v1",
    "summary": "Full stack engineer with balanced frontend and backend delivery.",
    "skills": ["React", "Node.js", "Express", "TypeScript", "MongoDB", "PostgreSQL", "Docker", "REST APIs", "Next.js", "Jest"],
    "projects": ["SaaS admin panel", "E-commerce API and UI", "Analytics portal"],
    "experience": ["Delivered end-to-end features", "Worked across UI and API layers"],
    "education": ["BSc Computer Engineering"],
    "certifications": ["TypeScript bootcamp"]
  },
  {
    "alias": "data-ai-cv",
    "ownerAlias": "validation-user",
    "title": "Data / AI CV",
    "type": "Data",
    "version": "v1",
    "summary": "Data and ML candidate with analytics and Python focus.",
    "skills": ["Python", "Pandas", "NumPy", "SQL", "Machine Learning", "Statistics", "scikit-learn", "Data Visualization", "PostgreSQL", "Jupyter"],
    "projects": ["Customer churn model", "Sales analytics notebook", "Recommendation prototype"],
    "experience": ["Built notebooks for data cleaning and analysis", "Created simple ML experiments"],
    "education": ["BSc Statistics"],
    "certifications": ["Machine Learning fundamentals"]
  },
  {
    "alias": "weak-junior-cv",
    "ownerAlias": "junior-gap",
    "title": "Weak Junior CV",
    "type": "Frontend",
    "version": "v1",
    "summary": "Entry-level candidate with limited project depth and few technical skills.",
    "skills": ["HTML", "CSS", "JavaScript", "Git", "Basic React"],
    "projects": ["Todo app", "Portfolio site"],
    "experience": ["Completed internship support tasks"],
    "education": ["Bootcamp graduate"],
    "certifications": ["Basic web development"]
  },
  {
    "alias": "devops-cv",
    "ownerAlias": "validation-user",
    "title": "DevOps CV",
    "type": "DevOps",
    "version": "v1",
    "summary": "DevOps-focused profile with cloud, container and CI/CD strength.",
    "skills": ["Docker", "Kubernetes", "AWS", "Linux", "CI/CD", "GitHub Actions", "Terraform", "Nginx", "Prometheus", "PostgreSQL"],
    "projects": ["CI/CD pipeline migration", "Kubernetes deployment setup", "Infrastructure automation"],
    "experience": ["Managed containerized deployments", "Built pipeline automation", "Configured observability dashboards"],
    "education": ["BSc Information Systems"],
    "certifications": ["AWS SysOps Associate"]
  }
]
```

### 3.2 Expected CV Match Behavior

- `backend-cv`: should rank highest for backend-heavy jobs and remain strong for full stack jobs.
- `frontend-cv`: should rank highest for frontend and React UI jobs.
- `fullstack-cv`: should rank highest for `Full Stack Engineer`.
- `data-ai-cv`: should rank highest for data and AI jobs.
- `weak-junior-cv`: should produce low scores and high missing-skill counts.
- `devops-cv`: should rank highest for DevOps jobs.

### 3.3 CV Test Sequence

1. Create CV.
2. List CVs.
3. Update CV.
4. Delete CV.
5. Try to access another user's CV.
6. Verify owner-based filtering returns only current user's CVs.

## 4. Job Test Data

Current Job model fields are already sufficient for the test set. Future model fields are listed separately below.

### 4.1 Job Payloads

```json
[
  {
    "alias": "junior-frontend-job",
    "title": "Junior Frontend Developer",
    "company": "PixelFlow Studio",
    "location": "Istanbul, Turkey",
    "description": "Build responsive user interfaces in React and TypeScript, work with design systems and accessibility.",
    "skills": ["React", "TypeScript", "HTML", "CSS", "Tailwind CSS", "Figma"],
    "salaryMin": 45000,
    "salaryMax": 70000,
    "category": "Frontend",
    "contractType": "Permanent",
    "contractTime": "Full-time",
    "redirectUrl": "https://jobs.example.com/pixelflow-frontend"
  },
  {
    "alias": "backend-node-job",
    "title": "Backend Node.js Developer",
    "company": "CloudStack Labs",
    "location": "Remote",
    "description": "Design REST APIs, build auth flows, work with MongoDB and PostgreSQL, deploy services to AWS.",
    "skills": ["Node.js", "Express", "REST APIs", "MongoDB", "PostgreSQL", "JWT", "Docker", "AWS", "TypeScript"],
    "salaryMin": 70000,
    "salaryMax": 110000,
    "category": "Backend",
    "contractType": "Permanent",
    "contractTime": "Full-time",
    "redirectUrl": "https://jobs.example.com/cloudstack-backend"
  },
  {
    "alias": "fullstack-job",
    "title": "Full Stack Engineer",
    "company": "NorthBridge Digital",
    "location": "Ankara, Turkey",
    "description": "Own both frontend and backend features using React, Node.js and SQL databases.",
    "skills": ["React", "Node.js", "Express", "TypeScript", "MongoDB", "PostgreSQL", "Docker", "REST APIs"],
    "salaryMin": 80000,
    "salaryMax": 130000,
    "category": "Full Stack",
    "contractType": "Permanent",
    "contractTime": "Full-time",
    "redirectUrl": "https://jobs.example.com/northbridge-fullstack"
  },
  {
    "alias": "java-backend-job",
    "title": "Java Spring Backend Developer",
    "company": "Enterprise Grid",
    "location": "Istanbul, Turkey",
    "description": "Build enterprise APIs with Java, Spring Boot, PostgreSQL and Docker.",
    "skills": ["Java", "Spring Boot", "REST APIs", "PostgreSQL", "Docker", "JWT", "AWS"],
    "salaryMin": 75000,
    "salaryMax": 120000,
    "category": "Backend",
    "contractType": "Permanent",
    "contractTime": "Full-time",
    "redirectUrl": "https://jobs.example.com/enterprise-spring"
  },
  {
    "alias": "devops-job",
    "title": "DevOps Engineer",
    "company": "InfraPilot",
    "location": "Remote",
    "description": "Run containerized workloads, Kubernetes clusters, CI/CD pipelines and cloud infrastructure.",
    "skills": ["Docker", "Kubernetes", "AWS", "Linux", "CI/CD", "GitHub Actions", "Terraform", "Nginx"],
    "salaryMin": 85000,
    "salaryMax": 140000,
    "category": "DevOps",
    "contractType": "Permanent",
    "contractTime": "Full-time",
    "redirectUrl": "https://jobs.example.com/infrapilot-devops"
  },
  {
    "alias": "data-analyst-job",
    "title": "Data Analyst",
    "company": "InsightWave",
    "location": "Izmir, Turkey",
    "description": "Analyze datasets using Python, SQL, dashboards and reporting workflows.",
    "skills": ["Python", "SQL", "PostgreSQL", "Data Visualization", "Statistics", "Pandas"],
    "salaryMin": 55000,
    "salaryMax": 90000,
    "category": "Data",
    "contractType": "Permanent",
    "contractTime": "Full-time",
    "redirectUrl": "https://jobs.example.com/insightwave-data"
  },
  {
    "alias": "ml-intern-job",
    "title": "AI/ML Intern",
    "company": "NeuronSeed",
    "location": "Remote",
    "description": "Support machine learning experiments, data preparation and model evaluation.",
    "skills": ["Python", "Machine Learning", "Pandas", "NumPy", "Statistics"],
    "salaryMin": 25000,
    "salaryMax": 40000,
    "category": "Data & AI",
    "contractType": "Internship",
    "contractTime": "Part-time",
    "redirectUrl": "https://jobs.example.com/neuronseed-ml-intern"
  },
  {
    "alias": "react-ui-job",
    "title": "React UI Engineer",
    "company": "Atlas UX",
    "location": "London, UK",
    "description": "Craft premium React user interfaces with TypeScript, accessibility and performance in mind.",
    "skills": ["React", "TypeScript", "HTML", "CSS", "Tailwind CSS", "Playwright", "Figma"],
    "salaryMin": 65000,
    "salaryMax": 100000,
    "category": "Frontend",
    "contractType": "Contract",
    "contractTime": "Full-time",
    "redirectUrl": "https://jobs.example.com/atlas-react-ui"
  }
]
```

### 4.2 Expected Job Match Behavior

- `Backend CV` should strongly match `Backend Node.js Developer` and `Java Spring Backend Developer`.
- `Frontend CV` should strongly match `Junior Frontend Developer` and `React UI Engineer`.
- `Full Stack CV` should strongly match `Full Stack Engineer`.
- `Data / AI CV` should strongly match `Data Analyst` and `AI/ML Intern`.
- `DevOps CV` should strongly match `DevOps Engineer`.
- `Weak Junior CV` should produce low match scores across most roles.

### 4.3 Future Model Fields

These fields are useful for future extensions but are not part of the current Job model:

- `seniority`
- `remoteType`
- `employmentType`
- `postedSource`
- `salaryCurrency`
- `postedAt`

## 5. Match Test Data

`POST /api/match` uses raw `cvSkills` and `jobSkills` arrays.

### 5.1 Test Matrix

| Scenario | Request body | Expected matchScore range | Expected matchingSkills | Expected missingSkills | Expected level |
|---|---|---:|---|---|---|
| high match | backend skills vs backend skills | 88-100 | Node.js, Express, REST APIs, MongoDB, PostgreSQL, JWT, Docker, AWS | very few or none | High |
| medium match | frontend skills vs partial frontend job | 50-74 | React, TypeScript, HTML | Tailwind CSS, Playwright, Figma or similar | Medium |
| low match | junior skills vs DevOps job | 0-49 | very few or none | Docker, Kubernetes, AWS, CI/CD, Terraform | Low |
| no match | unrelated skills | 0-10 | none | all job skills | Low |
| empty job skills | any CV with empty job skills | 50 | none | none | Medium |
| duplicate skills | repeated skills in arrays | depends on denominator | repeated matches should still be deduplicated in output | remaining skills | scenario-dependent |
| case sensitivity | mixed case vs lowercase | 88-100 | normalized overlaps | very few or none | High |

### 5.2 Example Payloads

```json
{
  "cvSkills": ["Node.js", "Express", "MongoDB", "PostgreSQL", "JWT", "Docker", "AWS"],
  "jobSkills": ["node.js", "express", "mongoDB", "postgresql", "jwt", "docker", "aws"]
}
```

```json
{
  "cvSkills": ["React", "TypeScript", "HTML", "CSS"],
  "jobSkills": ["React", "React", "TypeScript", "HTML", "Vue"]
}
```

```json
{
  "cvSkills": ["Python", "Pandas"],
  "jobSkills": []
}
```

## 6. Job Filter Test Data

`GET /api/jobs/filter` supports `keyword`, `skill`, `cvId`, `minMatch`, and `sort`.

| Test | Endpoint example | Data used | Expected result |
|---|---|---|---|
| keyword title search | `/api/jobs/filter?keyword=React&cvId={frontendCvId}` | React UI Engineer, Junior Frontend Developer | jobs with React in title/company/description return |
| keyword company search | `/api/jobs/filter?keyword=CloudStack&cvId={backendCvId}` | CloudStack Labs | matching company returns |
| keyword description search | `/api/jobs/filter?keyword=Kubernetes&cvId={devopsCvId}` | DevOps Engineer | description match returns |
| skill filter | `/api/jobs/filter?skill=Docker&cvId={backendCvId}` | Backend and DevOps jobs | jobs with Docker in skills return |
| cvId score | `/api/jobs/filter?cvId={backendCvId}` | backend CV | every job includes `matchScore` |
| minMatch | `/api/jobs/filter?cvId={backendCvId}&minMatch=70` | backend CV + backend jobs | only jobs at or above threshold |
| sort=newest | `/api/jobs/filter?cvId={backendCvId}&sort=newest` | all jobs | newest first by `createdAt` |
| sort=score | `/api/jobs/filter?cvId={backendCvId}&sort=score` | backend CV | highest score first |
| invalid cvId | `/api/jobs/filter?cvId=123&minMatch=50` | invalid id | 400 Invalid cvId |
| foreign cvId | `/api/jobs/filter?cvId={otherUserCvId}` | another user's CV | 404 CV not found |
| minMatch without cvId | `/api/jobs/filter?minMatch=60` | missing cvId | 400 cvId is required when using minMatch or sort=score |

## 7. Recommendation Test Data

`GET /api/recommendations?cvId=` ranks all jobs for the authenticated user's CV.

| CV | Expected top jobs | Expected behavior |
|---|---|---|
| Backend CV | Backend Node.js Developer, Java Spring Backend Developer, Full Stack Engineer | backend jobs should be at the top |
| Frontend CV | React UI Engineer, Junior Frontend Developer, Full Stack Engineer | frontend jobs should lead |
| Weak Junior CV | Junior Frontend Developer plus mostly low scores | overall low ranking quality |
| Data / AI CV | Data Analyst, AI/ML Intern | data jobs should lead |
| foreign CV | any CV owned by another user | 404 CV not found |

## 8. Best CV Test Data

`GET /api/best-cv/:jobId` should choose the best matching CV for the authenticated user.

| Job | Expected best CV | Expected response shape |
|---|---|---|
| Backend Node.js Developer | Backend CV | `cv` object, high `matchScore`, populated breakdown |
| React UI Engineer | Frontend CV | `cv` object, high `matchScore`, populated breakdown |
| Full Stack Engineer | Full Stack CV | `cv` object, high `matchScore`, populated breakdown |
| DevOps Engineer | DevOps CV | `cv` object, high `matchScore`, populated breakdown |
| no CVs available | null | `cv: null`, `matchScore: 0`, `reason: "No CVs found"` |

## 9. Analytics Test Data

`GET /api/analytics/skills` and `GET /api/analytics/trends` should see these skills across the jobs:

- Docker
- Kubernetes
- AWS
- TypeScript
- React
- MongoDB
- PostgreSQL
- Python
- Machine Learning

Expected analytics behavior:

- Weak Junior CV should surface high missing counts for Docker, Kubernetes, AWS, PostgreSQL.
- Frontend CV should still miss cloud and data skills like AWS, Kubernetes, Python, Machine Learning.
- Data / AI CV should miss React and Tailwind CSS more often.
- Backend and Full Stack CVs should have lower missing skill counts than the junior profile.
- If Adzuna analytics fallback is used, the stored jobs should still produce balanced category and contract distributions.

## 10. Application Tracker Test Data

Current Application model fields: `owner`, `job`, `cv`, `status`, `notes`.

### 10.1 Application Payloads

```json
[
  {
    "alias": "app-backend-saved",
    "ownerAlias": "strong-backend",
    "jobAlias": "backend-node-job",
    "cvAlias": "backend-cv",
    "status": "Saved for Later",
    "notes": "First-pass application for backend role."
  },
  {
    "alias": "app-frontend-review",
    "ownerAlias": "frontend-heavy",
    "jobAlias": "react-ui-job",
    "cvAlias": "frontend-cv",
    "status": "Under Review",
    "notes": "UI-focused application under review."
  },
  {
    "alias": "app-fullstack-accepted",
    "ownerAlias": "strong-backend",
    "jobAlias": "fullstack-job",
    "cvAlias": "fullstack-cv",
    "status": "Accepted",
    "notes": "Strong fit for end-to-end delivery."
  },
  {
    "alias": "app-junior-rejected",
    "ownerAlias": "junior-gap",
    "jobAlias": "junior-frontend-job",
    "cvAlias": "weak-junior-cv",
    "status": "Rejected",
    "notes": "Used for low-fit and rejection state checks."
  },
  {
    "alias": "app-devops-review",
    "ownerAlias": "validation-user",
    "jobAlias": "devops-job",
    "cvAlias": "devops-cv",
    "status": "Under Review",
    "notes": "DevOps flow with status patch coverage."
  },
  {
    "alias": "app-data-saved",
    "ownerAlias": "validation-user",
    "jobAlias": "data-analyst-job",
    "cvAlias": "data-ai-cv",
    "status": "Saved for Later",
    "notes": "Data/AI application for list and owner filtering."
  }
]
```

### 10.2 Application Test Sequence

| Test | Endpoint | Request body | Expected result |
|---|---|---|---|
| create | `POST /api/applications` | `jobId`, `cvId`, `notes`, `status` | 201 created or 200 updated if duplicate owner+job |
| same user + same job | `POST /api/applications` again | same `jobId`, new `cvId` or `notes` | 200 `Application updated` |
| status patch | `PATCH /api/applications/:id/status` | `status: Accepted` etc. | 200 updated application |
| list current user | `GET /api/applications` | auth token only | only current user's applications return |
| invalid jobId | `POST /api/applications` | invalid `jobId` | 400 Invalid jobId or cvId |
| invalid cvId | `POST /api/applications` | invalid `cvId` | 400 Invalid jobId or cvId |
| invalid status | `POST /api/applications` | `status: Pending` | 400 Invalid application status |
| missing required fields | `POST /api/applications` | missing `jobId` or `cvId` | 400 jobId and cvId are required |

Note: the current API is owner-based, not `userEmail`-based. For manual tests, switch accounts and call `GET /api/applications` under each user.

## 11. Auth, Token, And 401 Test Order

Frontend token behavior uses `localStorage.authToken`.

1. Call a protected endpoint without a token.
   - Expected API: 401 `Authentication required`
   - Expected UI: login redirect or auth screen

2. Call a protected endpoint with an invalid token.
   - Expected API: 401
   - Expected UI: token removed, user logged out, redirected to login

3. Simulate an expired or broken token.
   - Recommended method: write a malformed JWT into `authToken`
   - Expected API: 401, frontend clears session

4. Login successfully.
   - Expected UI: `authToken` is stored
   - Expected API: `/api/auth/login` returns a token and user object

5. Call protected endpoints with the token.
   - Expected API: `/api/me`, `/api/cvs`, `/api/jobs`, `/api/recommendations` succeed

6. Trigger a 401 from any protected endpoint.
   - Expected UI: logout handler fires, token cleared, redirect to `/login`

## 12. UI Test Order

Use the data above in this order for a new tester:

| Step | User/data | Page or endpoint | Expected UI | Expected API |
|---|---|---|---|---|
| 1 | strong-backend register | Register | account created | 201 + token |
| 2 | invalid register cases | Register | form error shown | 400 or 409 |
| 3 | strong-backend login | Login | session opened | 200 + token |
| 4 | strong-backend passport | Passport Onboarding / `PUT /api/me/passport` | matrix data becomes available | 200 |
| 5 | Dashboard | Dashboard | top fields and summary render | `/api/me`, `/api/career-matrix` succeed |
| 6 | Backend CV create/list/update/delete | My CVs | CV cards, edit, delete, version flow | `/api/cvs` CRUD works |
| 7 | Jobs fetch/import/filter | Jobs | list refreshes, filters update | `/api/jobs/fetch`, `/api/jobs/filter`, `/api/jobs/import-adzuna` |
| 8 | Recommendations | AI Insights / Recommendations | ranked jobs visible | `/api/recommendations?cvId=` |
| 9 | Match explanation | Skill Map | matching and missing skills visible | `/api/match` or `/api/match/full` |
| 10 | Roadmap | Growth Plan | roadmap items generated | `/api/analysis` |
| 11 | Analytics | Market Signals / Analytics | charts and skill gaps render | `/api/analytics/skills`, `/api/analytics/trends` |
| 12 | Application create | Application Tracker | new application card appears | `POST /api/applications` |
| 13 | Application status change | Application Tracker | status badge updates | `PATCH /api/applications/:id/status` |
| 14 | Profile update | Profile | profile values update | `PUT /api/me` |
| 15 | Logout then login | Any auth screen | logout works and login reopens session | token removed then restored |
| 16 | 401 invalid token test | Any protected page | auto logout and redirect | 401 handler fires |

## 13. Edge Case List

- `phoneNumber` must be exactly 10 digits when `countryCode` is `+90`.
- `phoneNumber` must not contain letters.
- Register password must satisfy all strength checks.
- `confirmPassword` is a frontend-only validation field.
- Duplicate email must return 409.
- `GET /api/jobs/filter` with `minMatch` or `sort=score` must include `cvId`.
- Invalid `cvId` must return 400.
- Another user's `cvId` must return 404.
- `POST /api/match` should deduplicate output arrays even if input arrays contain repeats.
- `POST /api/match` returns 50 and `Medium` when `jobSkills` is empty.
- `GET /api/best-cv/:jobId` should return a graceful null response when the user has no CVs.
- `POST /api/applications` with the same owner and job should update the existing application instead of creating a duplicate.
- Job duplicates with the same `(title, company)` should resolve to the existing record.

## 14. Seed Script Note

A runnable seed script is recommended at:

- `backend/scripts/seedFullTestData.js`

Recommended npm entry:

- `seed:test`

The script should be idempotent, upsert by email/title-company/owner-job, and print created aliases after seeding.
