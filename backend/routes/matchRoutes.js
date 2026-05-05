const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const CV = require("../models/CV");
const { scoreMatch, scoreSkillsOnly } = require("../services/matchService");

const router = express.Router();

/**
 * @swagger
 * /match:
 *   post:
 *     summary: Calculate skill-based match score between two skill arrays
 *     tags: [Match]
 */
router.post("/match", (req, res) => {
  const { cvSkills, jobSkills } = req.body;

  if (!Array.isArray(cvSkills) || !Array.isArray(jobSkills)) {
    return res.status(400).json({ error: "cvSkills and jobSkills must be arrays" });
  }

  const result = scoreSkillsOnly({ cvSkills, jobSkills });
  res.json(result);
});

/**
 * @swagger
 * /match/full:
 *   post:
 *     summary: Full weighted match between a saved CV and a saved Job (60% skill + 25% experience + 15% role)
 *     tags: [Match]
 */
router.post("/match/full", async (req, res) => {
  try {
    const { cvId, jobId } = req.body;

    if (!cvId || !jobId) {
      return res.status(400).json({ error: "cvId and jobId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(cvId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: "Invalid cvId or jobId" });
    }

    const [cv, job] = await Promise.all([
      CV.findOne({ _id: cvId, owner: req.user._id }),
      Job.findById(jobId),
    ]);

    if (!cv)  return res.status(404).json({ error: "CV not found" });
    if (!job) return res.status(404).json({ error: "Job not found" });

    res.json(scoreMatch({ cv, job }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /best-cv/{jobId}:
 *   get:
 *     summary: Get the best-matching CV for a job using weighted score
 *     tags: [Match]
 */
router.get("/best-cv/:jobId", async (req, res) => {
  try {
    if (Job.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const cvs = await CV.find({ owner: req.user._id });
    if (!cvs.length) return res.json({ cv: null, matchScore: 0, reason: "No CVs found" });

    let best = null;
    let bestResult = null;

    for (const cv of cvs) {
      const result = scoreMatch({ cv, job });
      if (!best || result.matchScore > bestResult.matchScore) {
        best = cv;
        bestResult = result;
      }
    }

    res.json({
      cv:        best,
      matchScore: bestResult.matchScore,
      reason:    bestResult.explanation,
      breakdown: bestResult.breakdown,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
