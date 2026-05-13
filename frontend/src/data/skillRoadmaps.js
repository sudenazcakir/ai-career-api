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
