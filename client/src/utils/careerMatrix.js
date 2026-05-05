const careerFields = [
  {
    label: "Frontend",
    description: "User interfaces, components, responsive web apps",
    keywords: [
      "frontend",
      "front end",
      "react",
      "vue",
      "angular",
      "javascript",
      "typescript",
      "html",
      "css",
      "tailwind",
      "responsive",
      "component",
      "ui",
      "ux",
      "figma",
    ],
  },
  {
    label: "Backend",
    description: "APIs, databases, auth, server-side systems",
    keywords: [
      "backend",
      "back end",
      "node",
      "express",
      "java",
      "spring",
      "api",
      "rest",
      "graphql",
      "mongodb",
      "postgresql",
      "mysql",
      "sql",
      "auth",
      "jwt",
    ],
  },
  {
    label: "Data & AI",
    description: "Data analysis, ML concepts, analytics workflows",
    keywords: [
      "data",
      "ai",
      "artificial intelligence",
      "machine learning",
      "python",
      "pandas",
      "numpy",
      "analytics",
      "statistics",
      "visualization",
      "model",
      "prediction",
    ],
  },
  {
    label: "DevOps & Cloud",
    description: "Deployment, containers, CI/CD, cloud operations",
    keywords: [
      "devops",
      "docker",
      "kubernetes",
      "ci",
      "cd",
      "github actions",
      "deployment",
      "linux",
      "nginx",
      "aws",
      "azure",
      "gcp",
      "cloud",
    ],
  },
  {
    label: "Mobile",
    description: "Native and cross-platform mobile development",
    keywords: [
      "mobile",
      "react native",
      "flutter",
      "swift",
      "kotlin",
      "android",
      "ios",
      "xcode",
      "app store",
      "play store",
    ],
  },
  {
    label: "QA & Automation",
    description: "Testing strategy, automation, quality workflows",
    keywords: [
      "qa",
      "quality",
      "test",
      "testing",
      "automation",
      "jest",
      "cypress",
      "playwright",
      "selenium",
      "unit test",
      "integration test",
      "postman",
    ],
  },
];

function normalizeCareerText(value = "") {
  return value
    .toString()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ä±/g, "i");
}

function getPassportText(passport, fields) {
  return normalizeCareerText(fields.map((field) => passport[field] || "").join(" "));
}

function scoreCareerField(field, passport) {
  const weightedSources = [
    { fields: ["skills", "tools"], weight: 11 },
    { fields: ["projects", "experience", "certificates"], weight: 8 },
    { fields: ["targetTitle", "summary", "achievements", "interests"], weight: 6 },
    { fields: ["department", "workStyle", "languages"], weight: 3 },
  ];

  const evidence = [];
  let score = 18;

  weightedSources.forEach((source) => {
    const text = getPassportText(passport, source.fields);

    field.keywords.forEach((keyword) => {
      const normalizedKeyword = normalizeCareerText(keyword);
      if (text.includes(normalizedKeyword)) {
        score += source.weight;
        if (!evidence.includes(keyword)) evidence.push(keyword);
      }
    });
  });

  const hasPassportData = Object.values(passport).some((value) =>
    value?.toString().trim()
  );

  return {
    ...field,
    evidence: evidence.slice(0, 6),
    score: hasPassportData ? Math.min(96, score) : 0,
  };
}

export function buildCareerMatrix(passport = {}) {
  const fields = careerFields
    .map((field) => scoreCareerField(field, passport))
    .sort((a, b) => b.score - a.score);

  const average = Math.round(
    fields.reduce((total, field) => total + field.score, 0) / fields.length
  );

  return {
    average,
    fields,
    topField: fields[0],
    chartFields: careerFields.map((field) =>
      fields.find((scoredField) => scoredField.label === field.label)
    ),
    source: "rule",
  };
}
