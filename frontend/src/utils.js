// Shared utilities and constants

export const countryCodes = [
  { code: "+90", label: "TR +90" },
  { code: "+1",  label: "US +1" },
  { code: "+44", label: "UK +44" },
  { code: "+49", label: "DE +49" },
  { code: "+33", label: "FR +33" },
  { code: "+31", label: "NL +31" },
  { code: "+39", label: "IT +39" },
  { code: "+34", label: "ES +34" },
];

export const careerFields = [
  { label: "Frontend",        keywords: ["react","vue","angular","html","css","javascript","typescript","ui","tailwind","figma","next","gatsby","webpack"], description: "User interfaces, components, responsive web apps" },
  { label: "Backend",         keywords: ["node","express","java","spring","python","django","flask","fastapi","sql","postgresql","mongodb","redis","api","rest","graphql","microservices"], description: "APIs, databases, server-side logic" },
  { label: "Fullstack",       keywords: ["react","node","fullstack","next","nuxt","trpc","prisma","rest","graphql","typescript","postgresql"], description: "End-to-end product development" },
  { label: "Data & AI",       keywords: ["python","pandas","numpy","sql","tableau","power bi","machine learning","tensorflow","pytorch","scikit","analytics","data","etl","dbt","looker","spark"], description: "Data analysis, ML concepts, analytics workflows" },
  { label: "DevOps & Cloud",  keywords: ["docker","kubernetes","aws","azure","gcp","ci/cd","linux","terraform","ansible","jenkins","gitlab","nginx","monitoring","devops","cloud"], description: "Infrastructure, containers, deployment pipelines" },
  { label: "Mobile",          keywords: ["react native","flutter","android","ios","swift","kotlin","expo","mobile","app store"], description: "Cross-platform and native mobile apps" },
  { label: "QA & Automation", keywords: ["testing","jest","cypress","playwright","selenium","postman","qa","automation","tdd","bdd","vitest"], description: "Quality assurance and test automation" },
];

export function splitSkills(value) {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export function splitLines(value = "") {
  return value.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function listToText(items = []) {
  return Array.isArray(items) ? items.join("\n") : "";
}

export function normalizeCareerText(value = "") {
  return value
    .toString()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i");
}

export function getPassportText(passport, fields) {
  return normalizeCareerText(fields.map((f) => passport[f] || "").join(" "));
}

export function scoreCareerField(field, passport) {
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
      if (text.includes(normalizeCareerText(keyword))) {
        score += source.weight;
        if (!evidence.includes(keyword)) evidence.push(keyword);
      }
    });
  });

  const hasPassportData = Object.values(passport).some((v) => v?.toString().trim());
  return { ...field, evidence: evidence.slice(0, 6), score: hasPassportData ? Math.min(96, score) : 0 };
}

export function buildCareerMatrix(passport) {
  const fields = careerFields.map((f) => scoreCareerField(f, passport)).sort((a, b) => b.score - a.score);
  const average = Math.round(fields.reduce((t, f) => t + f.score, 0) / fields.length);
  return {
    average,
    fields,
    topField: fields[0],
    chartFields: careerFields.map((f) => fields.find((sf) => sf.label === f.label)),
  };
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
}

export function getBackendOrigin() {
  if (typeof window === "undefined") return "http://localhost:5001";
  return `${window.location.protocol}//${window.location.hostname}:5001`;
}
