/**
 * Phase 10.2 — Application Tracker Test Runner
 *
 * Runs the full test sequence against a live API server.
 * Requires: backend server running + test data seeded (npm run seed:test)
 *
 * Usage:
 *   npm run test:applications
 *   API_URL=https://your-app.vercel.app npm run test:applications
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");

const API_URL = process.env.API_URL || "http://localhost:5001";

// Test users — must be seeded first (npm run seed:test)
const TEST_USERS = {
  "strong-backend": { email: "aylin.kaya@demo.local", password: "Bknd!2026A" },
  "frontend-heavy":  { email: "deniz.arslan@demo.local", password: "Fnt@2026Dev" },
  "validation-user": { email: "elif.demir@demo.local", password: "Err0r!2026X" },
};

let passed = 0;
let failed = 0;
const failures = [];

// ─── helpers ─────────────────────────────────────────────────────────────────

async function request(method, path, body, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

async function login(userAlias) {
  const creds = TEST_USERS[userAlias];
  const { status, data } = await request("POST", "/api/auth/login", creds);
  if (status !== 200 || !data.token) {
    throw new Error(`Login failed for ${userAlias}: ${JSON.stringify(data)}`);
  }
  return data.token;
}

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.log(`  ✗  ${label}${detail ? `  →  ${detail}` : ""}`);
    failed++;
    failures.push({ label, detail });
  }
}

// ─── db helpers to resolve aliases → real IDs ─────────────────────────────

async function resolveIds() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-career-api";
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

  const User = require("../models/User");
  const Job  = require("../models/Job");
  const CV   = require("../models/CV");

  const [backendUser, frontendUser, validationUser, juniorUser] = await Promise.all([
    User.findOne({ email: "aylin.kaya@demo.local" }),
    User.findOne({ email: "deniz.arslan@demo.local" }),
    User.findOne({ email: "elif.demir@demo.local" }),
    User.findOne({ email: "mert.yilmaz@demo.local" }),
  ]);

  const [backendJob, reactJob, fullstackJob, juniorJob, devopsJob, dataJob] = await Promise.all([
    Job.findOne({ title: "Backend Node.js Developer" }),
    Job.findOne({ title: "React UI Engineer" }),
    Job.findOne({ title: "Full Stack Engineer" }),
    Job.findOne({ title: "Junior Frontend Developer" }),
    Job.findOne({ title: "DevOps Engineer" }),
    Job.findOne({ title: "Data Analyst" }),
  ]);

  const [backendCv, frontendCv, fullstackCv, juniorCv, devopsCv, dataCv] = await Promise.all([
    CV.findOne({ title: "Backend CV" }),
    CV.findOne({ title: "Frontend CV" }),
    CV.findOne({ title: "Full Stack CV" }),
    CV.findOne({ title: "Weak Junior CV" }),
    CV.findOne({ title: "DevOps CV" }),
    CV.findOne({ title: "Data / AI CV" }),
  ]);

  const missing = [];
  if (!backendUser)  missing.push("User: strong-backend");
  if (!frontendUser) missing.push("User: frontend-heavy");
  if (!validationUser) missing.push("User: validation-user");
  if (!juniorUser)   missing.push("User: junior-gap");
  if (!backendJob)   missing.push("Job: backend-node-job");
  if (!reactJob)     missing.push("Job: react-ui-job");
  if (!fullstackJob) missing.push("Job: fullstack-job");
  if (!juniorJob)    missing.push("Job: junior-frontend-job");
  if (!devopsJob)    missing.push("Job: devops-job");
  if (!dataJob)      missing.push("Job: data-analyst-job");
  if (!backendCv)    missing.push("CV: backend-cv");
  if (!frontendCv)   missing.push("CV: frontend-cv");
  if (!fullstackCv)  missing.push("CV: fullstack-cv");
  if (!juniorCv)     missing.push("CV: weak-junior-cv");
  if (!devopsCv)     missing.push("CV: devops-cv");
  if (!dataCv)       missing.push("CV: data-ai-cv");

  if (missing.length > 0) {
    throw new Error(
      `Missing seed data. Run: npm run seed:test\nMissing:\n  ${missing.join("\n  ")}`
    );
  }

  return {
    users: { backendUser, frontendUser, validationUser, juniorUser },
    jobs:  { backendJob, reactJob, fullstackJob, juniorJob, devopsJob, dataJob },
    cvs:   { backendCv, frontendCv, fullstackCv, juniorCv, devopsCv, dataCv },
  };
}

// ─── test suites ─────────────────────────────────────────────────────────────

async function testCreate(token, jobId, cvId) {
  console.log("\n[1] Create application");

  const { status, data } = await request("POST", "/api/applications", {
    jobId,
    cvId,
    notes: "Test create",
    status: "Saved for Later",
  }, token);

  assert("POST /api/applications → 201 or 200", [201, 200].includes(status), `got ${status}`);
  assert("response.success === true", data.success === true);
  assert("response.data has _id", Boolean(data.data?._id));
  assert("response.data.status === 'Saved for Later'", data.data?.status === "Saved for Later");

  return data.data?._id;
}

async function testUpsert(token, jobId, cvId) {
  console.log("\n[2] Same user + same job → upsert");

  const { status, data } = await request("POST", "/api/applications", {
    jobId,
    cvId,
    notes: "Updated notes",
    status: "Under Review",
  }, token);

  assert("POST same jobId again → 200", status === 200, `got ${status}`);
  assert("message contains 'updated'", data.message?.toLowerCase().includes("updated"), data.message);
  assert("status updated to Under Review", data.data?.status === "Under Review");
}

async function testStatusPatch(token, applicationId) {
  console.log("\n[3] Status patch");

  const { status, data } = await request(
    "PATCH",
    `/api/applications/${applicationId}/status`,
    { status: "Accepted" },
    token
  );

  assert("PATCH /status → 200", status === 200, `got ${status}`);
  assert("status updated to Accepted", data.data?.status === "Accepted");
}

async function testListOwnerOnly(token1, token2, jobId) {
  console.log("\n[4] List — owner isolation");

  const { data: d1 } = await request("GET", "/api/applications", null, token1);
  const { data: d2 } = await request("GET", "/api/applications", null, token2);

  assert("GET /api/applications → success", d1.success === true);

  const user1Ids = (d1.data || []).map((a) => a.job?._id?.toString() || a.job?.toString());
  const user2Ids = (d2.data || []).map((a) => a.job?._id?.toString() || a.job?.toString());

  // The job we created with token1 should NOT appear in token2's list
  const leaked = user2Ids.includes(jobId.toString()) && user1Ids.includes(jobId.toString());
  assert("Other user cannot see first user's application", !leaked || user2Ids.length === 0,
    "Applications may be leaking across users");
}

async function testValidation(token, validJobId, validCvId) {
  console.log("\n[5–8] Validation errors");

  // Invalid jobId format
  const { status: s1, data: d1 } = await request("POST", "/api/applications", {
    jobId: "not-a-valid-id",
    cvId: validCvId,
    status: "Under Review",
  }, token);
  assert("Invalid jobId → 400", s1 === 400, `got ${s1}`);
  assert("Invalid jobId error message", d1.error?.toLowerCase().includes("invalid"), d1.error);

  // Invalid cvId format
  const { status: s2, data: d2 } = await request("POST", "/api/applications", {
    jobId: validJobId,
    cvId: "not-a-valid-id",
    status: "Under Review",
  }, token);
  assert("Invalid cvId → 400", s2 === 400, `got ${s2}`);
  assert("Invalid cvId error message", d2.error?.toLowerCase().includes("invalid"), d2.error);

  // Invalid status
  const { status: s3, data: d3 } = await request("POST", "/api/applications", {
    jobId: validJobId,
    cvId: validCvId,
    status: "Pending",
  }, token);
  assert("Invalid status → 400", s3 === 400, `got ${s3}`);
  assert("Invalid status error message", d3.error?.toLowerCase().includes("status"), d3.error);

  // Missing jobId
  const { status: s4, data: d4 } = await request("POST", "/api/applications", {
    cvId: validCvId,
    status: "Under Review",
  }, token);
  assert("Missing jobId → 400", s4 === 400, `got ${s4}`);
  assert("Missing fields error message", d4.error?.toLowerCase().includes("required"), d4.error);

  // Missing cvId
  const { status: s5, data: d5 } = await request("POST", "/api/applications", {
    jobId: validJobId,
    status: "Under Review",
  }, token);
  assert("Missing cvId → 400", s5 === 400, `got ${s5}`);
  assert("Missing fields error message (cvId)", d5.error?.toLowerCase().includes("required"), d5.error);
}

async function testSimilarRoles(token) {
  console.log("\n[9] Similar roles");

  const { status, data } = await request("GET", "/api/applications/similar-roles", null, token);

  assert("GET /similar-roles → 200", status === 200, `got ${status}`);
  assert("response.success === true", data.success === true);
  assert("data is an array", Array.isArray(data.data));
  if (Array.isArray(data.data) && data.data.length > 0) {
    assert("similar roles have matchScore", typeof data.data[0].matchScore === "number");
  }
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${"─".repeat(56)}`);
  console.log(`Phase 10 — Application Tracker Test Suite`);
  console.log(`API: ${API_URL}`);
  console.log(`${"─".repeat(56)}`);

  // 1. Resolve IDs from DB
  let ids;
  try {
    ids = await resolveIds();
  } catch (err) {
    console.error(`\n✗ Setup failed: ${err.message}\n`);
    process.exitCode = 1;
    await mongoose.disconnect().catch(() => {});
    return;
  }
  await mongoose.disconnect().catch(() => {});

  const { jobs, cvs } = ids;

  // 2. Login
  let backendToken, frontendToken;
  try {
    [backendToken, frontendToken] = await Promise.all([
      login("strong-backend"),
      login("frontend-heavy"),
    ]);
    console.log("\n✓ Logged in as strong-backend and frontend-heavy");
  } catch (err) {
    console.error(`\n✗ Login failed: ${err.message}`);
    console.error("  Is the backend server running? Try: npm run server");
    process.exitCode = 1;
    return;
  }

  // 3. Run test suites
  const applicationId = await testCreate(
    backendToken,
    jobs.dataJob._id.toString(),
    cvs.backendCv._id.toString()
  );

  await testUpsert(
    backendToken,
    jobs.dataJob._id.toString(),
    cvs.fullstackCv._id.toString()
  );

  if (applicationId) {
    await testStatusPatch(backendToken, applicationId);
  } else {
    console.log("\n[3] Status patch — SKIPPED (no applicationId)");
  }

  await testListOwnerOnly(
    backendToken,
    frontendToken,
    jobs.dataJob._id.toString()
  );

  await testValidation(
    backendToken,
    jobs.backendJob._id.toString(),
    cvs.backendCv._id.toString()
  );

  await testSimilarRoles(backendToken);

  // 4. Summary
  const total = passed + failed;
  console.log(`\n${"─".repeat(56)}`);
  console.log(`Results: ${passed}/${total} passed  (${failed} failed)`);
  if (failures.length > 0) {
    console.log("\nFailed tests:");
    for (const f of failures) {
      console.log(`  ✗ ${f.label}${f.detail ? `  →  ${f.detail}` : ""}`);
    }
  }
  console.log(`${"─".repeat(56)}\n`);

  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Test runner error:", err.message);
  process.exitCode = 1;
});
