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
const Job = require("../../models/Job");
const Application = require("../../models/Application");
const { hashPassword, signToken } = require("../../services/authService");

let httpServer;
let port;
let token;
let userId;
let cvId;

before(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const app = require("../../server");
  httpServer = createServer(app);
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  port = httpServer.address().port;
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    CV.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
  ]);

  const user = await User.create({
    firstName: "Test",
    lastName: "User",
    email: "test@integration.example.com",
    passwordHash: hashPassword("password123"),
  });
  userId = user._id;
  token = signToken({ sub: userId.toString() });

  const cv = await CV.create({
    owner: userId,
    title: "My Test CV",
    skills: ["React", "JavaScript"],
  });
  cvId = cv._id;
});

after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
});

// ── GET /api/applications/similar-roles ──────────────────────────────────────

describe("GET /api/applications/similar-roles", () => {
  const path = "/api/applications/similar-roles";

  it("returns an empty array when the user has no applications", async () => {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.data, []);
  });

  it("returns scored similar jobs excluding already-applied jobs", async () => {
    // Seed: one applied job and one candidate job sharing a skill
    const appliedJob = await Job.create({
      title: "Frontend Engineer",
      company: "Acme Corp",
      skills: ["React", "JavaScript"],
    });
    const candidateJob = await Job.create({
      title: "React Developer",
      company: "Beta Inc",
      skills: ["React", "TypeScript"],
    });

    await Application.create({
      owner: userId,
      job: appliedJob._id,
      cv: cvId,
      status: "Under Review",
    });

    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);

    // Applied job must not appear in results
    const resultIds = body.data.map((j) => j._id.toString());
    assert.ok(!resultIds.includes(appliedJob._id.toString()), "applied job must be excluded");

    // Candidate job should appear with a positive score
    const match = body.data.find((j) => j._id.toString() === candidateJob._id.toString());
    assert.ok(match, "candidate job must appear in results");
    assert.ok(match.matchScore > 0, "matchScore must be positive");
    assert.ok(Array.isArray(match.whySimilar), "whySimilar must be an array");
    assert.ok(match.whySimilar.length > 0, "whySimilar must have at least one reason");
  });

  it("returns 401 with no auth token", async () => {
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    const body = await res.json();

    assert.equal(res.status, 401);
    assert.ok(body.error);
  });
});
