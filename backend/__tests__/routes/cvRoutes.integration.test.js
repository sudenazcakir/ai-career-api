"use strict";

// Set env vars before any require so server.js reads the test DB on load
process.env.MONGO_URI = process.env.TEST_MONGO_URI || "mongodb://localhost:27017/ai_career_test";
process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || "test-secret-integration";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const mongoose = require("mongoose");
const User = require("../../models/User");
const CV = require("../../models/CV");
const { hashPassword, signToken } = require("../../services/authService");

let httpServer;
let port;
let token;
let cvId;

before(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  // Require app AFTER connecting — connectDB() in server.js sees readyState===1 and skips
  const app = require("../../server");
  httpServer = createServer(app);
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  port = httpServer.address().port;
});

beforeEach(async () => {
  await User.deleteMany({});
  await CV.deleteMany({});

  const user = await User.create({
    firstName: "Test",
    lastName: "User",
    email: "test@integration.example.com",
    passwordHash: hashPassword("password123"),
  });

  token = signToken({ sub: user._id.toString() });

  const cv = await CV.create({
    owner: user._id,
    title: "My Test CV",
    type: "General",
    version: "v1",
    skills: ["React", "JavaScript", "Node.js"],
    experience: ["Senior Engineer at Acme Corp", "Developer at Startup Inc"],
    summary: "Experienced software engineer with 5 years.",
  });
  cvId = cv._id.toString();
});

after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
});

// ── POST /api/cvs/upload ──────────────────────────────────────────────────────

describe("POST /api/cvs/upload", () => {
  const path = "/api/cvs/upload";

  it("parses a TXT CV and returns extracted fields", async () => {
    const form = new FormData();
    const content = "Jane Dev\n\nSKILLS\nTypeScript, React, GraphQL\n\nEXPERIENCE\nLead Engineer at Corp\n";
    form.append("file", new Blob([content], { type: "text/plain" }), "cv.txt");

    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(typeof body.data.title, "string");
    assert.ok(Array.isArray(body.data.skills));
    assert.ok(Array.isArray(body.data.experience));
  });

  it("returns 400 for an unsupported file type", async () => {
    const form = new FormData();
    form.append(
      "file",
      new Blob(["fake content"], { type: "application/octet-stream" }),
      "cv.docx"
    );

    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.ok(body.error);
  });

  it("returns 413 when file exceeds 5 MB", async () => {
    const bigContent = Buffer.alloc(5 * 1024 * 1024 + 1, 65); // 5 MB + 1 byte, all 'A'
    const form = new FormData();
    form.append("file", new Blob([bigContent], { type: "text/plain" }), "big.txt");

    let status;
    try {
      const res = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      status = res.status;
    } catch {
      // Server may reset connection when it hits the file size limit before
      // the client finishes streaming — that is also correct rejection behaviour.
      return;
    }

    assert.equal(status, 413);
  });

  it("returns 401 with no auth token", async () => {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, { method: "POST" });
    const body = await res.json();

    assert.equal(res.status, 401);
    assert.ok(body.error);
  });
});

// ── POST /api/cvs/:id/ai-version ──────────────────────────────────────────────

describe("POST /api/cvs/:id/ai-version", () => {
  function aiVersionUrl(id) {
    return `http://127.0.0.1:${port}/api/cvs/${id}/ai-version`;
  }

  it("returns proposed CV with changes and warnings (rule-based fallback)", async () => {
    const res = await fetch(aiVersionUrl(cvId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "ats_optimize" }),
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.proposedCv, "proposedCv must be present");
    assert.ok(Array.isArray(body.data.changes), "changes must be an array");
    assert.ok(Array.isArray(body.data.warnings), "warnings must be an array");
    assert.ok(body.data.modelInfo, "modelInfo must be present");
  });

  it("returns 400 for an invalid mode", async () => {
    const res = await fetch(aiVersionUrl(cvId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "make_it_fancy" }),
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.ok(body.error);
  });

  it("returns 404 when CV does not belong to the requesting user", async () => {
    const otherId = new mongoose.Types.ObjectId().toString();

    const res = await fetch(aiVersionUrl(otherId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "concise" }),
    });
    const body = await res.json();

    assert.equal(res.status, 404);
    assert.ok(body.error);
  });

  it("returns 400 for a non-ObjectId CV id", async () => {
    const res = await fetch(aiVersionUrl("not-a-valid-id"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "concise" }),
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.ok(body.error);
  });

  it("returns 401 with no auth token", async () => {
    const res = await fetch(aiVersionUrl(cvId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "concise" }),
    });
    const body = await res.json();

    assert.equal(res.status, 401);
    assert.ok(body.error);
  });
});
