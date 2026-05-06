/* pdf-parse may export the function directly or wrap it — handle both */
let pdfParse = null;
try {
  const mod = require("pdf-parse");
  pdfParse = typeof mod === "function" ? mod : (mod?.default ?? null);
} catch {
  /* pdf-parse unavailable — extractFromPdf will degrade gracefully */
}

const KNOWN_ISSUERS = [
  "google", "amazon", "microsoft", "aws", "azure", "coursera", "udemy",
  "linkedin", "credly", "oracle", "ibm", "salesforce", "cisco", "comptia",
  "pmi", "scrum.org", "scrum alliance", "mongodb", "hashicorp", "docker",
  "red hat", "vmware", "adobe", "atlassian", "datacamp", "pluralsight",
];

/* ── Text extraction helpers ────────────────────────────────────────────── */

function extractDate(text) {
  const patterns = [
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/i,
    /\b\d{4}-\d{2}-\d{2}\b/,
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function extractCredentialId(text) {
  const patterns = [
    /credential\s+id[:\s]+([A-Z0-9\-_]{6,})/i,
    /certificate\s+(?:id|number)[:\s]+([A-Z0-9\-_]{6,})/i,
    /verification\s+(?:code|id)[:\s]+([A-Z0-9\-_]{6,})/i,
    /badge\s+id[:\s]+([A-Z0-9\-_]{6,})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractUrl(text) {
  const match = text.match(/https?:\/\/[^\s\n<>]+/);
  if (!match) return null;
  return match[0].replace(/[.,;)\]]+$/, "");
}

function extractTitle(text) {
  const patterns = [
    /certificate\s+of\s+(?:completion|achievement|proficiency)\s+(?:in\s+)?([^\n]{5,80})/i,
    /certif(?:ied|ication)\s+(?:in\s+)?([^\n]{5,80})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].slice(0, 90).trim();
  }
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 5);
  return lines[0] ? lines[0].slice(0, 90) : null;
}

function extractIssuer(text) {
  const lower = text.toLowerCase();
  for (const issuer of KNOWN_ISSUERS) {
    if (lower.includes(issuer)) {
      const idx = lower.indexOf(issuer);
      return text.slice(idx, idx + issuer.length);
    }
  }
  const issued = text.match(/issued\s+by[:\s]+([^\n]{3,60})/i);
  if (issued) return issued[1].trim();
  const provider = text.match(/(?:provider|platform|organization)[:\s]+([^\n]{3,60})/i);
  if (provider) return provider[1].trim();
  return null;
}

function calcConfidence(extracted) {
  const coreFields = ["title", "issuer", "issueDate"];
  const bonusFields = ["credentialId", "url"];
  const coreFound = coreFields.filter((f) => extracted[f]).length;
  const bonusFound = bonusFields.filter((f) => extracted[f]).length;
  return Math.min(1, Math.round(((coreFound * 0.28) + (bonusFound * 0.08)) * 100) / 100);
}

/* ── JSON parsing (same pattern as cvGeneratorService) ──────────────────── */

function extractResponseText(body) {
  if (typeof body.output_text === "string") return body.output_text;
  return (body.output || [])
    .flatMap((item) => item.content || [])
    .map((c) => c.text || "")
    .join("");
}

function parseJsonSafe(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      const s = cleaned.indexOf("{");
      const e = cleaned.lastIndexOf("}");
      if (s === -1 || e <= s) return null;
      return JSON.parse(cleaned.slice(s, e + 1));
    } catch {
      return null;
    }
  }
}

/* ── AI enhancement (text → Chat API) ──────────────────────────────────── */

async function enhanceWithAI(text, fallback, apiKey) {
  try {
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.05,
        input: [
          {
            role: "system",
            content:
              "Extract certificate information from the text. Return ONLY valid JSON. Use null for missing fields. Never invent data.",
          },
          {
            role: "user",
            content: `Return JSON with: title, issuer, issueDate ("Month YYYY"), credentialId, skills (array), url, confidence (0–1).\n\nText:\n${text.slice(0, 3000)}`,
          },
        ],
      }),
    });
    if (!response.ok) return fallback;
    const body = await response.json();
    const parsed = parseJsonSafe(extractResponseText(body));
    if (!parsed || !parsed.title) return fallback;
    return {
      title:        parsed.title        || fallback.title,
      issuer:       parsed.issuer       || fallback.issuer,
      issueDate:    parsed.issueDate    || fallback.issueDate,
      credentialId: parsed.credentialId || fallback.credentialId,
      skills:       Array.isArray(parsed.skills) ? parsed.skills.slice(0, 8) : [],
      url:          parsed.url          || fallback.url,
      confidence:   typeof parsed.confidence === "number" ? parsed.confidence : fallback.confidence,
    };
  } catch {
    return fallback;
  }
}

/* ── Public extraction functions ────────────────────────────────────────── */

async function extractFromPdf(buffer) {
  if (typeof pdfParse !== "function") {
    return {
      title: null, issuer: null, issueDate: null,
      credentialId: null, skills: [], url: null, confidence: 0,
      message: "PDF text extraction is unavailable. Please fill in the certificate details manually.",
    };
  }
  const { text } = await pdfParse(buffer);

  const fallback = {
    title:        extractTitle(text),
    issuer:       extractIssuer(text),
    issueDate:    extractDate(text),
    credentialId: extractCredentialId(text),
    skills:       [],
    url:          extractUrl(text),
  };
  fallback.confidence = calcConfidence(fallback);

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && text.length > 20) {
    return enhanceWithAI(text, fallback, apiKey);
  }
  return fallback;
}

async function extractFromImage(buffer, mimetype) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      title: null, issuer: null, issueDate: null,
      credentialId: null, skills: [], url: null, confidence: 0,
      message: "AI not configured. Please fill in the certificate details manually.",
    };
  }

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.05,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_image",
                source: { type: "base64", media_type: mimetype, data: buffer.toString("base64") },
              },
              {
                type: "input_text",
                text: "Extract certificate info. Return ONLY valid JSON: { title, issuer, issueDate (\"Month YYYY\"), credentialId, skills (array), url, confidence (0-1) }. Null for missing fields.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
    const body = await response.json();
    const parsed = parseJsonSafe(extractResponseText(body));
    if (!parsed) throw new Error("Could not parse AI response");

    return {
      title:        parsed.title        || null,
      issuer:       parsed.issuer       || null,
      issueDate:    parsed.issueDate    || null,
      credentialId: parsed.credentialId || null,
      skills:       Array.isArray(parsed.skills) ? parsed.skills.slice(0, 8) : [],
      url:          parsed.url          || null,
      confidence:   typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
    };
  } catch (err) {
    return {
      title: null, issuer: null, issueDate: null,
      credentialId: null, skills: [], url: null, confidence: 0,
      message: `Extraction failed: ${err.message}. Please fill in manually.`,
    };
  }
}

module.exports = { extractFromPdf, extractFromImage };
