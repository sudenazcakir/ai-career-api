const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const CV = require("../models/CV");

const router = express.Router();

/**
 * @swagger
 * /recommendations:
 *   get:
 *     summary: Get recommended jobs from DB based on CV
 *     tags: [Recommendation]
 *     parameters:
 *       - in: query
 *         name: cvId
 *         required: true
 *         schema:
 *           type: string
 *         description: CV ID
 *     responses:
 *       200:
 *         description: Recommended jobs
 */
router.get("/recommendations", async (req, res) => {
  try {
    const { cvId } = req.query;

    if (!cvId) {
      return res.status(400).json({ error: "cvId is required" });
    }

    if (Job.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    if (!mongoose.Types.ObjectId.isValid(cvId)) {
      return res.status(400).json({ error: "Invalid cvId" });
    }

    const cv = await CV.findOne({ _id: cvId, owner: req.user._id });
    if (!cv) return res.status(404).json({ error: "CV not found" });

    const jobs = await Job.find();

    const scoredJobs = jobs.map((job) => {
      const jobSkills = job.skills || [];
      const match = jobSkills.filter((skill) => cv.skills.includes(skill));
      const score = jobSkills.length
        ? Math.round((match.length / jobSkills.length) * 100)
        : 0;

      return {
        ...job.toObject(),
        matchScore: score,
      };
    });

    const sorted = scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      recommendations: sorted.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /recommendations:
 *   post:
 *     summary: Legacy manual recommendation flow
 *     description: Manual non-DB helper kept for compatibility. Current app flow uses GET /api/recommendations with cvId.
 *     tags: [Recommendation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cvSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               jobs:
 *                 type: array
 *     responses:
 *       200:
 *         description: Recommended jobs
 */
router.post("/recommendations", (req, res) => {
  const { cvSkills, jobs } = req.body;

  if (!cvSkills || !jobs) {
    return res.status(400).json({ error: "Missing data" });
  }

  const scoredJobs = jobs.map((job) => {
    const matching = job.skills.filter((skill) => cvSkills.includes(skill));
    const score = Math.round((matching.length / job.skills.length) * 100);

    return {
      ...job,
      matchScore: score,
    };
  });

  const sorted = scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
  const topJobs = sorted.slice(0, 3);

  res.json({
    recommendations: topJobs,
  });
});

module.exports = router;
