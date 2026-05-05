const express = require("express");
const mongoose = require("mongoose");
const CV = require("../models/CV");
const { generateCvDraft } = require("../services/cvGeneratorService");
const { rankCvsForJob } = require("../services/cvRankingService");

const router = express.Router();

const CV_FIELDS = [
  "title",
  "type",
  "summary",
  "skills",
  "projects",
  "experience",
  "education",
  "certifications",
  "source",
  "targetJobTitle",
  "targetCompany",
];

function pickCvPayload(body = {}) {
  return CV_FIELDS.reduce((payload, field) => {
    if (body[field] !== undefined) payload[field] = body[field];
    return payload;
  }, {});
}

/**
 * @swagger
 * /cvs:
 *   get:
 *     summary: Get all CVs
 *     tags: [CVs]
 *     responses:
 *       200:
 *         description: CV list
 */
router.get("/", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const cvs = await CV.find().sort({ _id: -1 });

    res.json({ success: true, data: cvs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /cvs:
 *   post:
 *     summary: Create a CV
 *     tags: [CVs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created CV
 */
router.post("/", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const cv = await CV.create(pickCvPayload(req.body));

    res.status(201).json({ success: true, data: cv });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /cvs/generate:
 *   post:
 *     summary: Generate an AI-assisted CV draft from Career Passport and target job
 *     tags: [CVs]
 *     responses:
 *       200:
 *         description: Generated CV draft
 */
router.post("/generate", async (req, res) => {
  try {
    const draft = await generateCvDraft({
      passport: req.body.passport || {},
      targetField: req.body.targetField || "Backend",
      jobId: req.body.jobId,
    });

    res.json({ success: true, data: draft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /cvs/rank-for-job:
 *   post:
 *     summary: Rank saved CVs for a job with AI-assisted scoring
 *     tags: [CVs]
 *     responses:
 *       200:
 *         description: Ranked CVs
 */
router.post("/rank-for-job", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const { jobId } = req.body;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: "Valid jobId is required" });
    }

    const result = await rankCvsForJob({ jobId });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /cvs/{id}:
 *   put:
 *     summary: Update a CV
 *     tags: [CVs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CV ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated CV
 */
router.put("/:id", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid CV id" });
    }

    const updates = pickCvPayload(req.body);

    const cv = await CV.findByIdAndUpdate(id, updates, { new: true });
    if (!cv) {
      return res.status(404).json({ error: "CV not found" });
    }

    res.json({ success: true, data: cv });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /cvs/{id}:
 *   delete:
 *     summary: Delete a CV
 *     tags: [CVs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CV ID
 *     responses:
 *       200:
 *         description: Deleted CV
 */
router.delete("/:id", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid CV id" });
    }

    const deleted = await CV.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "CV not found" });
    }

    res.json({
      success: true,
      message: "CV deleted",
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /cvs/best-cv:
 *   post:
 *     summary: Legacy manual best-CV flow
 *     description: Manual non-DB helper kept for compatibility. Current app flow uses GET /api/best-cv/{jobId}.
 *     tags: [CVs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cvs:
 *                 type: array
 *               jobSkills:
 *                 type: array
 *     responses:
 *       200:
 *         description: Best CV result
 */
router.post("/best-cv", (req, res) => {
  const { cvs, jobSkills } = req.body;

  if (!cvs || !jobSkills) {
    return res.status(400).json({ error: "Missing data" });
  }

  let bestCv = null;
  let bestScore = 0;

  cvs.forEach((cv) => {
    const matching = jobSkills.filter((skill) => cv.skills.includes(skill));
    const score = Math.round((matching.length / jobSkills.length) * 100);

    if (score > bestScore) {
      bestScore = score;
      bestCv = cv;
    }
  });

  res.json({
    bestCv,
    score: bestScore,
  });
});

module.exports = router;
