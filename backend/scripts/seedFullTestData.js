const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const { hashPassword } = require("../services/authService");
const User = require("../models/User");
const CV = require("../models/CV");
const Job = require("../models/Job");
const Application = require("../models/Application");

const seedUsers = [
  {
    alias: "strong-backend",
    firstName: "Aylin",
    lastName: "Kaya",
    email: "aylin.kaya@demo.local",
    countryCode: "+90",
    phoneNumber: "5321112233",
    password: "Bknd!2026A",
    passportCompleted: true,
    passport: {
      targetTitle: "Senior Backend Engineer",
      school: "Istanbul Technical University",
      department: "Computer Engineering",
      graduationYear: "2023",
      gpa: "3.62/4.00",
      location: "Istanbul, Turkey",
      interests: "Backend architecture, API design, distributed systems, cloud reliability",
      skills: "Node.js, Express, TypeScript, REST APIs, MongoDB, PostgreSQL, Redis, JWT, Docker, AWS, Kubernetes",
      languages: "Turkish, English",
      tools: "Git, GitHub, Postman, Swagger, Docker, Kubernetes, AWS",
      experience: "Built internal APIs for user management, improved response times, integrated auth and rate limiting",
      projects: "Multi-tenant HR API, event-driven notification service, role-based access control service",
      certificates: "AWS Cloud Practitioner, Node.js API Design",
      achievements: "Dean's list, mentoring junior devs, hackathon finalist",
      summary: "Backend engineer focused on scalable APIs, data consistency and cloud deployment.",
      workStyle: "Hybrid, ownership-driven, async-friendly",
      salaryExpectation: "90000-120000 TRY/month",
      availability: "Immediate",
      portfolio: "https://portfolio.example.com/aylin",
      linkedin: "https://linkedin.com/in/aylinkaya",
      github: "https://github.com/aylinkaya",
    },
  },
  {
    alias: "frontend-heavy",
    firstName: "Deniz",
    lastName: "Arslan",
    email: "deniz.arslan@demo.local",
    countryCode: "+90",
    phoneNumber: "5302223344",
    password: "Fnt@2026Dev",
    passportCompleted: true,
    passport: {
      targetTitle: "Frontend Engineer",
      school: "Marmara University",
      department: "Software Engineering",
      graduationYear: "2024",
      gpa: "3.45/4.00",
      location: "Ankara, Turkey",
      interests: "Product UI, design systems, accessibility, performance, component architecture",
      skills: "React, TypeScript, JavaScript, HTML, CSS, Tailwind CSS, Next.js, Redux, Playwright, Figma",
      languages: "Turkish, English",
      tools: "Figma, Storybook, Vite, Playwright, Git, Chrome DevTools",
      experience: "Built responsive dashboard screens and reusable component libraries",
      projects: "Design system playground, analytics dashboard, onboarding wizard",
      certificates: "Frontend Masters workshop, accessibility basics",
      achievements: "Won internal UI challenge, shipped component audit improvements",
      summary: "Frontend-focused developer specializing in React UI and polished interactions.",
      workStyle: "Remote-friendly, collaborative, design-aware",
      salaryExpectation: "70000-95000 TRY/month",
      availability: "2 weeks notice",
      portfolio: "https://portfolio.example.com/deniz",
      linkedin: "https://linkedin.com/in/denizarslan",
      github: "https://github.com/denizarslan",
    },
  },
  {
    alias: "junior-gap",
    firstName: "Mert",
    lastName: "Yilmaz",
    email: "mert.yilmaz@demo.local",
    countryCode: "+90",
    phoneNumber: "5553332211",
    password: "Jrn#2026Qa",
    passportCompleted: true,
    passport: {
      targetTitle: "Junior Software Developer",
      school: "Self-taught / Bootcamp",
      department: "Computer Programming",
      graduationYear: "2025",
      gpa: "3.00/4.00",
      location: "Izmir, Turkey",
      interests: "Learning basics, building small web apps, testing, clean code",
      skills: "HTML, CSS, JavaScript, Git, basic React",
      languages: "Turkish, English",
      tools: "VS Code, GitHub, Postman",
      experience: "Completed internship support tasks and small bug-fix assignments",
      projects: "Todo app, portfolio site, simple calculator",
      certificates: "Basic web development certificate",
      achievements: "Completed first freelance landing page",
      summary: "Junior candidate with limited production experience and visible skill gaps.",
      workStyle: "Structured guidance, learning-oriented",
      salaryExpectation: "45000-60000 TRY/month",
      availability: "Immediate",
      portfolio: "",
      linkedin: "",
      github: "https://github.com/mertyilmaz",
    },
  },
  {
    alias: "validation-user",
    firstName: "Elif",
    lastName: "Demir",
    email: "elif.demir@demo.local",
    countryCode: "+90",
    phoneNumber: "5424448899",
    password: "Err0r!2026X",
    passportCompleted: true,
    passport: {
      targetTitle: "Generalist Software Engineer",
      school: "Open Education",
      department: "Information Systems",
      graduationYear: "2022",
      gpa: "N/A",
      location: "Bursa, Turkey",
      interests: "Validation, debugging, edge cases, API reliability, QA",
      skills: "JavaScript, SQL, Postman, Manual Testing, Git",
      languages: "Turkish, English",
      tools: "Swagger, Postman, Chrome DevTools",
      experience: "Helped a small team test API error responses and form edge cases",
      projects: "Validation checklist tool, bug triage spreadsheet",
      certificates: "",
      achievements: "Reduced recurring form errors during QA",
      summary: "Used mainly for negative tests and profile edge-case coverage.",
      workStyle: "Remote or hybrid, detail-oriented",
      salaryExpectation: "50000-70000 TRY/month",
      availability: "2 weeks notice",
      portfolio: "",
      linkedin: "",
      github: "",
    },
  },
];

const seedCvs = [
  {
    alias: "backend-cv",
    ownerAlias: "strong-backend",
    title: "Backend CV",
    type: "Backend",
    version: "v1",
    summary: "Backend engineer with API, auth, and cloud deployment experience.",
    skills: ["Node.js", "Express", "TypeScript", "REST APIs", "MongoDB", "PostgreSQL", "JWT", "Docker", "AWS", "Redis", "Jest"],
    projects: ["Multi-tenant HR API", "Notification service", "Role-based auth service"],
    experience: ["Built REST APIs with Node.js and Express", "Integrated MongoDB and PostgreSQL", "Deployed services to AWS"],
    education: ["BSc Computer Engineering"],
    certifications: ["AWS Cloud Practitioner"],
  },
  {
    alias: "frontend-cv",
    ownerAlias: "frontend-heavy",
    title: "Frontend CV",
    type: "Frontend",
    version: "v1",
    summary: "Frontend developer focused on React UI systems and accessibility.",
    skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS", "Next.js", "Redux", "Playwright", "Figma"],
    projects: ["Design system playground", "Analytics dashboard", "Onboarding wizard"],
    experience: ["Built responsive component libraries", "Implemented form validation and UI states"],
    education: ["BSc Software Engineering"],
    certifications: ["Frontend accessibility workshop"],
  },
  {
    alias: "fullstack-cv",
    ownerAlias: "strong-backend",
    title: "Full Stack CV",
    type: "Full Stack",
    version: "v1",
    summary: "Full stack engineer with balanced frontend and backend delivery.",
    skills: ["React", "Node.js", "Express", "TypeScript", "MongoDB", "PostgreSQL", "Docker", "REST APIs", "Next.js", "Jest"],
    projects: ["SaaS admin panel", "E-commerce API and UI", "Analytics portal"],
    experience: ["Delivered end-to-end features", "Worked across UI and API layers"],
    education: ["BSc Computer Engineering"],
    certifications: ["TypeScript bootcamp"],
  },
  {
    alias: "data-ai-cv",
    ownerAlias: "validation-user",
    title: "Data / AI CV",
    type: "Data",
    version: "v1",
    summary: "Data and ML candidate with analytics and Python focus.",
    skills: ["Python", "Pandas", "NumPy", "SQL", "Machine Learning", "Statistics", "scikit-learn", "Data Visualization", "PostgreSQL", "Jupyter"],
    projects: ["Customer churn model", "Sales analytics notebook", "Recommendation prototype"],
    experience: ["Built notebooks for data cleaning and analysis", "Created simple ML experiments"],
    education: ["BSc Statistics"],
    certifications: ["Machine Learning fundamentals"],
  },
  {
    alias: "weak-junior-cv",
    ownerAlias: "junior-gap",
    title: "Weak Junior CV",
    type: "Frontend",
    version: "v1",
    summary: "Entry-level candidate with limited project depth and few technical skills.",
    skills: ["HTML", "CSS", "JavaScript", "Git", "Basic React"],
    projects: ["Todo app", "Portfolio site"],
    experience: ["Completed internship support tasks"],
    education: ["Bootcamp graduate"],
    certifications: ["Basic web development"],
  },
  {
    alias: "devops-cv",
    ownerAlias: "validation-user",
    title: "DevOps CV",
    type: "DevOps",
    version: "v1",
    summary: "DevOps-focused profile with cloud, container and CI/CD strength.",
    skills: ["Docker", "Kubernetes", "AWS", "Linux", "CI/CD", "GitHub Actions", "Terraform", "Nginx", "Prometheus", "PostgreSQL"],
    projects: ["CI/CD pipeline migration", "Kubernetes deployment setup", "Infrastructure automation"],
    experience: ["Managed containerized deployments", "Built pipeline automation", "Configured observability dashboards"],
    education: ["BSc Information Systems"],
    certifications: ["AWS SysOps Associate"],
  },
];

const seedJobs = [
  {
    alias: "junior-frontend-job",
    title: "Junior Frontend Developer",
    company: "PixelFlow Studio",
    location: "Istanbul, Turkey",
    description: "Build responsive user interfaces in React and TypeScript, work with design systems and accessibility.",
    skills: ["React", "TypeScript", "HTML", "CSS", "Tailwind CSS", "Figma"],
    salaryMin: 45000,
    salaryMax: 70000,
    category: "Frontend",
    contractType: "Permanent",
    contractTime: "Full-time",
    redirectUrl: "https://jobs.example.com/pixelflow-frontend",
    createdAt: "2026-05-01T10:00:00.000Z",
  },
  {
    alias: "backend-node-job",
    title: "Backend Node.js Developer",
    company: "CloudStack Labs",
    location: "Remote",
    description: "Design REST APIs, build auth flows, work with MongoDB and PostgreSQL, deploy services to AWS.",
    skills: ["Node.js", "Express", "REST APIs", "MongoDB", "PostgreSQL", "JWT", "Docker", "AWS", "TypeScript"],
    salaryMin: 70000,
    salaryMax: 110000,
    category: "Backend",
    contractType: "Permanent",
    contractTime: "Full-time",
    redirectUrl: "https://jobs.example.com/cloudstack-backend",
    createdAt: "2026-05-02T10:00:00.000Z",
  },
  {
    alias: "fullstack-job",
    title: "Full Stack Engineer",
    company: "NorthBridge Digital",
    location: "Ankara, Turkey",
    description: "Own both frontend and backend features using React, Node.js and SQL databases.",
    skills: ["React", "Node.js", "Express", "TypeScript", "MongoDB", "PostgreSQL", "Docker", "REST APIs"],
    salaryMin: 80000,
    salaryMax: 130000,
    category: "Full Stack",
    contractType: "Permanent",
    contractTime: "Full-time",
    redirectUrl: "https://jobs.example.com/northbridge-fullstack",
    createdAt: "2026-05-03T10:00:00.000Z",
  },
  {
    alias: "java-backend-job",
    title: "Java Spring Backend Developer",
    company: "Enterprise Grid",
    location: "Istanbul, Turkey",
    description: "Build enterprise APIs with Java, Spring Boot, PostgreSQL and Docker.",
    skills: ["Java", "Spring Boot", "REST APIs", "PostgreSQL", "Docker", "JWT", "AWS"],
    salaryMin: 75000,
    salaryMax: 120000,
    category: "Backend",
    contractType: "Permanent",
    contractTime: "Full-time",
    redirectUrl: "https://jobs.example.com/enterprise-spring",
    createdAt: "2026-05-04T10:00:00.000Z",
  },
  {
    alias: "devops-job",
    title: "DevOps Engineer",
    company: "InfraPilot",
    location: "Remote",
    description: "Run containerized workloads, Kubernetes clusters, CI/CD pipelines and cloud infrastructure.",
    skills: ["Docker", "Kubernetes", "AWS", "Linux", "CI/CD", "GitHub Actions", "Terraform", "Nginx"],
    salaryMin: 85000,
    salaryMax: 140000,
    category: "DevOps",
    contractType: "Permanent",
    contractTime: "Full-time",
    redirectUrl: "https://jobs.example.com/infrapilot-devops",
    createdAt: "2026-05-05T10:00:00.000Z",
  },
  {
    alias: "data-analyst-job",
    title: "Data Analyst",
    company: "InsightWave",
    location: "Izmir, Turkey",
    description: "Analyze datasets using Python, SQL, dashboards and reporting workflows.",
    skills: ["Python", "SQL", "PostgreSQL", "Data Visualization", "Statistics", "Pandas"],
    salaryMin: 55000,
    salaryMax: 90000,
    category: "Data",
    contractType: "Permanent",
    contractTime: "Full-time",
    redirectUrl: "https://jobs.example.com/insightwave-data",
    createdAt: "2026-05-06T10:00:00.000Z",
  },
  {
    alias: "ml-intern-job",
    title: "AI/ML Intern",
    company: "NeuronSeed",
    location: "Remote",
    description: "Support machine learning experiments, data preparation and model evaluation.",
    skills: ["Python", "Machine Learning", "Pandas", "NumPy", "Statistics"],
    salaryMin: 25000,
    salaryMax: 40000,
    category: "Data & AI",
    contractType: "Internship",
    contractTime: "Part-time",
    redirectUrl: "https://jobs.example.com/neuronseed-ml-intern",
    createdAt: "2026-05-07T10:00:00.000Z",
  },
  {
    alias: "react-ui-job",
    title: "React UI Engineer",
    company: "Atlas UX",
    location: "London, UK",
    description: "Craft premium React user interfaces with TypeScript, accessibility and performance in mind.",
    skills: ["React", "TypeScript", "HTML", "CSS", "Tailwind CSS", "Playwright", "Figma"],
    salaryMin: 65000,
    salaryMax: 100000,
    category: "Frontend",
    contractType: "Contract",
    contractTime: "Full-time",
    redirectUrl: "https://jobs.example.com/atlas-react-ui",
    createdAt: "2026-05-08T10:00:00.000Z",
  },
];

const seedApplications = [
  {
    alias: "app-backend-saved",
    ownerAlias: "strong-backend",
    jobAlias: "backend-node-job",
    cvAlias: "backend-cv",
    status: "Saved for Later",
    notes: "First-pass application for backend role.",
  },
  {
    alias: "app-frontend-review",
    ownerAlias: "frontend-heavy",
    jobAlias: "react-ui-job",
    cvAlias: "frontend-cv",
    status: "Under Review",
    notes: "UI-focused application under review.",
  },
  {
    alias: "app-fullstack-accepted",
    ownerAlias: "strong-backend",
    jobAlias: "fullstack-job",
    cvAlias: "fullstack-cv",
    status: "Accepted",
    notes: "Strong fit for end-to-end delivery.",
  },
  {
    alias: "app-junior-rejected",
    ownerAlias: "junior-gap",
    jobAlias: "junior-frontend-job",
    cvAlias: "weak-junior-cv",
    status: "Rejected",
    notes: "Used for low-fit and rejection state checks.",
  },
  {
    alias: "app-devops-review",
    ownerAlias: "validation-user",
    jobAlias: "devops-job",
    cvAlias: "devops-cv",
    status: "Under Review",
    notes: "DevOps flow with status patch coverage.",
  },
  {
    alias: "app-data-saved",
    ownerAlias: "validation-user",
    jobAlias: "data-analyst-job",
    cvAlias: "data-ai-cv",
    status: "Saved for Later",
    notes: "Data/AI application for list and owner filtering.",
  },
];

function normalizeList(value = []) {
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
}

function buildPhone(countryCode, phoneNumber) {
  return `${countryCode} ${phoneNumber}`.trim();
}

async function upsertUser(seed) {
  const updates = {
    firstName: seed.firstName,
    lastName: seed.lastName,
    email: seed.email,
    passwordHash: hashPassword(seed.password),
    countryCode: seed.countryCode,
    phoneNumber: seed.phoneNumber,
    phone: buildPhone(seed.countryCode, seed.phoneNumber),
    photo: "",
    passport: seed.passport,
    passportCompleted: Boolean(seed.passportCompleted),
  };

  const user = await User.findOneAndUpdate(
    { email: seed.email },
    { $set: updates },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  return user;
}

async function upsertCv(seed, user) {
  const updates = {
    owner: user._id,
    parentCv: null,
    title: seed.title,
    type: seed.type,
    version: seed.version,
    summary: seed.summary,
    skills: normalizeList(seed.skills),
    projects: normalizeList(seed.projects),
    experience: normalizeList(seed.experience),
    education: normalizeList(seed.education),
    certifications: normalizeList(seed.certifications),
  };

  return CV.findOneAndUpdate(
    { owner: user._id, title: seed.title, version: seed.version },
    { $set: updates },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function upsertJob(seed) {
  const updates = {
    title: seed.title,
    description: seed.description,
    skills: normalizeList(seed.skills),
    company: seed.company,
    location: seed.location,
    salaryMin: seed.salaryMin,
    salaryMax: seed.salaryMax,
    category: seed.category,
    contractType: seed.contractType,
    contractTime: seed.contractTime,
    redirectUrl: seed.redirectUrl,
    createdAt: new Date(seed.createdAt),
  };

  return Job.findOneAndUpdate(
    { title: seed.title, company: seed.company },
    { $set: updates },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function upsertApplication(seed, userMap, cvMap, jobMap) {
  const owner = userMap.get(seed.ownerAlias);
  const cv = cvMap.get(seed.cvAlias);
  const job = jobMap.get(seed.jobAlias);

  if (!owner) {
    throw new Error(`Missing owner for application seed: ${seed.alias}`);
  }
  if (!cv) {
    throw new Error(`Missing CV for application seed: ${seed.alias}`);
  }
  if (!job) {
    throw new Error(`Missing job for application seed: ${seed.alias}`);
  }

  const updates = {
    owner: owner._id,
    job: job._id,
    cv: cv._id,
    status: seed.status,
    notes: seed.notes,
  };

  return Application.findOneAndUpdate(
    { owner: owner._id, job: job._id },
    { $set: updates },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function main() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-career-api";
  await mongoose.connect(mongoUri);

  const resetMode = process.argv.includes("--reset");

  if (resetMode) {
    console.log("🗑️  Deleting all existing data...");
    await User.deleteMany({});
    await CV.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    console.log("✓ Database cleared.");
  }

  const userMap = new Map();
  const cvMap = new Map();
  const jobMap = new Map();
  const applicationMap = new Map();

  for (const seed of seedUsers) {
    const user = await upsertUser(seed);
    userMap.set(seed.alias, user);
  }

  for (const seed of seedCvs) {
    const user = userMap.get(seed.ownerAlias);
    if (!user) {
      throw new Error(`Missing owner for CV seed: ${seed.alias}`);
    }

    const cv = await upsertCv(seed, user);
    cvMap.set(seed.alias, cv);
  }

  for (const seed of seedJobs) {
    const job = await upsertJob(seed);
    jobMap.set(seed.alias, job);
  }

  for (const seed of seedApplications) {
    const application = await upsertApplication(seed, userMap, cvMap, jobMap);
    applicationMap.set(seed.alias, application);
  }

  console.log("\n✓ Full test data seed completed.");
  console.log(`📊 Summary:`);
  console.log(`   Users: ${userMap.size}`);
  console.log(`   CVs: ${cvMap.size}`);
  console.log(`   Jobs: ${jobMap.size}`);
  console.log(`   Applications: ${applicationMap.size}`);
  console.log(`\n📋 Seeded aliases:`);
  console.log(`   Users: ${[...userMap.keys()].join(", ")}`);
  console.log(`   CVs: ${[...cvMap.keys()].join(", ")}`);
  console.log(`   Jobs: ${[...jobMap.keys()].join(", ")}`);
  console.log(`   Applications: ${[...applicationMap.keys()].join(", ")}`);
  
  if (resetMode) {
    console.log(`\n✨ Reset mode: Database was cleared before seeding.`);
  } else {
    console.log(`\n💾 Upsert mode: Existing data was updated where applicable.`);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
