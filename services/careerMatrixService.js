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
    .replace(/ı/g, "i");
}

function getPassportText(passport, fields) {
  return normalizeCareerText(fields.map((field) => passport[field] || "").join(" "));
}

function hasPassportData(passport = {}) {
  return Object.values(passport).some((value) => value?.toString().trim());
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

  return {
    ...field,
    evidence: evidence.slice(0, 6),
    score: hasPassportData(passport) ? Math.min(96, score) : 0,
  };
}

// Rule-only scoring path used when AI is unavailable.
// It reads Career Passport text, looks for known role/tool keywords, applies
// simple source weights, and returns the exact same matrix shape as the AI path.
// This means OPENAI_API_KEY is optional: without it, the graph still works with
// deterministic scores based on skills, tools, projects, experience, and goals.
function buildRuleCareerMatrix(passport = {}) {
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
  };
}

function clampScore(value) {
  const score = Number(value);
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeAiMatrix(aiPayload, fallbackMatrix) {
  const aiFields = Array.isArray(aiPayload?.fields) ? aiPayload.fields : [];

  const fields = careerFields.map((field) => {
    const aiField = aiFields.find((item) => item?.label === field.label);
    const fallbackField = fallbackMatrix.fields.find((item) => item.label === field.label);

    return {
      ...field,
      score: clampScore(aiField?.score ?? fallbackField?.score),
      evidence: Array.isArray(aiField?.evidence)
        ? aiField.evidence.slice(0, 6).map(String)
        : fallbackField?.evidence || [],
    };
  });

  const sorted = [...fields].sort((a, b) => b.score - a.score);
  const average = Math.round(
    fields.reduce((total, field) => total + field.score, 0) / fields.length
  );

  return {
    average,
    fields: sorted,
    topField: sorted[0],
    chartFields: fields,
  };
}

function extractResponseText(responseBody) {
  if (typeof responseBody.output_text === "string") {
    return responseBody.output_text;
  }

  return (responseBody.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("");
}

function parseJsonObject(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw error;
    }

    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

async function buildAiCareerMatrix(passport = {}) {
  const fallbackMatrix = buildRuleCareerMatrix(passport);
  const apiKey = process.env.OPENAI_API_KEY;

  // Career Matrix is intentionally AI-assisted, not AI-only:
  // the rule-based matrix keeps the feature deterministic and usable when
  // OpenAI credentials are missing, the API is unavailable, or the passport is empty.
  // In the common "no AI key in .env" case, this early return is the full flow.
  if (!apiKey || !hasPassportData(passport)) {
    return {
      ...fallbackMatrix,
      source: "rule",
      message: apiKey ? "Passport data is empty" : "OPENAI_API_KEY is not configured",
    };
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const fieldLabels = careerFields.map((field) => field.label);

  try {
    // The model receives only Career Passport data and the fixed set of
    // allowed software fields. It must score those fields from 0-100 and cite
    // short evidence phrases that explain why each score was assigned.
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        input: [
          {
            role: "system",
            content:
              "You score career direction fit from a software career passport. Return only valid JSON. Use scores 0-100. Be conservative and evidence-based.",
          },
          {
            role: "user",
            content: JSON.stringify({
              allowedLabels: fieldLabels,
              requiredShape: {
                fields: [
                  {
                    label: "one allowed label",
                    score: "0-100 integer",
                    evidence: ["short phrases from the passport"],
                  },
                ],
              },
              passport,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}`);
    }

    const responseBody = await response.json();
    const text = extractResponseText(responseBody).trim();
    const parsed = parseJsonObject(text);

    // We still normalize the AI payload against the known field list. This
    // prevents unexpected labels or malformed scores from leaking into Chart.js.
    return {
      ...normalizeAiMatrix(parsed, fallbackMatrix),
      source: "ai",
      model,
    };
  } catch (error) {
    // Any AI failure falls back to deterministic scoring so the Account page
    // always has graph data instead of showing a broken or empty panel.
    return {
      ...fallbackMatrix,
      source: "rule",
      message: `AI fallback used: ${error.message}`,
    };
  }
}

module.exports = {
  buildAiCareerMatrix,
  buildRuleCareerMatrix,
  careerFields,
};
