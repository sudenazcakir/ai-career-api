const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const CV = require("../models/CV");
const fetchAdzunaJobs = require("../services/adzunaService");
const extractSkills = require("../services/skillExtractor");

const router = express.Router();

function calculateMatchScore(jobSkills = [], userSkills = []) {
  if (!Array.isArray(jobSkills) || jobSkills.length === 0) {
    return 0;
  }

  const matches = jobSkills.filter((skill) => userSkills.includes(skill));
  return Math.round((matches.length / jobSkills.length) * 100);
}

function buildJobDocument(job) {
  const description = job.description || "";
  const title = job.title || "";

  return {
    title,
    description,
    skills: extractSkills(`${title} ${description}`),
    company: job.company?.display_name || "",
    location: job.location?.display_name || "",
    createdAt: job.created ? new Date(job.created) : new Date(),
  };
}

async function saveAdzunaJobs(adzunaJobs) {
  let imported = 0;
  let updated = 0;
  const saved = [];

  for (const job of adzunaJobs) {
    const doc = buildJobDocument(job);

    const existing = await Job.findOne({
      title: doc.title,
      company: doc.company,
    });

    let record;

    if (existing) {
      updated += 1;
      record = await Job.findByIdAndUpdate(existing._id, doc, { new: true });
    } else {
      imported += 1;
      record = await Job.create(doc);
    }

    saved.push(record);
  }

  return { imported, updated, saved };
}

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Job list
 */
router.get("/jobs", async (req, res) => {
  try {
    if (Job.db.readyState === 1) {
      const all = await Job.find().sort({ createdAt: -1 });
      return res.json({ success: true, data: all });
    }

    return res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /jobs/filter:
 *   get:
 *     summary: Filter jobs from DB with real CV
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: cvId
 *         schema:
 *           type: string
 *         description: CV ID for match score calculation
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search by job title
 *       - in: query
 *         name: skill
 *         schema:
 *           type: string
 *         description: Filter by skill
 *       - in: query
 *         name: minMatch
 *         schema:
 *           type: number
 *         description: Minimum match score
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [score, newest]
 *         description: Sort results
 *     responses:
 *       200:
 *         description: Filtered jobs
 */
router.get("/jobs/filter", async (req, res) => {
  try {
    const { keyword, skill, minMatch, sort, cvId } = req.query;

    if (Job.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const needsCvContext = Boolean(cvId || minMatch !== undefined || sort === "score");

    if (needsCvContext && !cvId) {
      return res.status(400).json({
        error: "cvId is required when using minMatch or sort=score",
      });
    }

    let minMatchValue;
    if (minMatch !== undefined) {
      minMatchValue = Number(minMatch);
      if (Number.isNaN(minMatchValue)) {
        return res.status(400).json({ error: "minMatch must be a number" });
      }
    }

    let jobs = await Job.find();

    if (keyword) {
      const normalizedKeyword = keyword.toLowerCase();
      jobs = jobs.filter((job) =>
        (job.title || "").toLowerCase().includes(normalizedKeyword)
      );
    }

    if (skill) {
      const normalizedSkill = skill.toLowerCase();
      jobs = jobs.filter((job) =>
        (job.skills || []).some(
          (jobSkill) => jobSkill.toLowerCase() === normalizedSkill
        )
      );
    }

    let userSkills = [];
    if (cvId) {
      if (!mongoose.Types.ObjectId.isValid(cvId)) {
        return res.status(400).json({ error: "Invalid cvId" });
      }

      const cv = await CV.findById(cvId);
      if (!cv) {
        return res.status(404).json({ error: "CV not found" });
      }

      userSkills = cv.skills || [];
      jobs = jobs.map((job) => ({
        ...job.toObject(),
        matchScore: calculateMatchScore(job.skills, userSkills),
      }));
    }

    if (minMatchValue !== undefined) {
      jobs = jobs.filter((job) => job.matchScore >= minMatchValue);
    }

    if (sort === "score") {
      jobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (sort === "newest") {
      jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a job
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               company:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created job
 */
router.post("/jobs", async (req, res) => {
  try {
    const { title, company, skills = [] } = req.body;

    if (Job.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    if (!title || !company) {
      return res.status(400).json({ error: "title and company are required" });
    }

    const existing = await Job.findOne({ title, company });
    if (existing) {
      return res.status(200).json({
        success: true,
        data: existing,
        message: "Job already exists",
      });
    }

    const created = await Job.create({ title, company, skills });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /jobs/import-adzuna:
 *   post:
 *     summary: Import jobs from Adzuna and save to database
 *     tags: [Jobs]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keyword:
 *                 type: string
 *               location:
 *                 type: string
 *               country:
 *                 type: string
 *               page:
 *                 type: number
 *     responses:
 *       201:
 *         description: Imported jobs
 */
router.post("/jobs/import-adzuna", async (req, res) => {
  try {
    if (Job.db.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: "Database is not connected",
      });
    }

    const adzunaJobs = await fetchAdzunaJobs(req.body);
    const { imported, updated, saved } = await saveAdzunaJobs(adzunaJobs);

    res.status(201).json({ success: true, imported, updated, jobs: saved });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /jobs/fetch:
 *   get:
 *     summary: Fetch jobs from Adzuna and save to DB
 *     tags: [Jobs]
 */
router.get("/jobs/fetch", async (req, res) => {
  try {
    if (Job.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const adzunaJobs = await fetchAdzunaJobs();
    const { imported, updated, saved } = await saveAdzunaJobs(adzunaJobs);

    res.json({
      success: true,
      imported,
      updated,
      jobs: saved,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
