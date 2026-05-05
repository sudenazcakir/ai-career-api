const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const CV = require("../models/CV");
const { scoreMatch } = require("../services/matchService");

const router = express.Router();

/**
 * @swagger
 * /recommendations:
 *   get:
 *     summary: Rank all jobs for a CV using weighted match score (60% skill + 25% experience + 15% role)
 *     tags: [Recommendation]
 *     parameters:
 *       - in: query
 *         name: cvId
 *         required: true
 *         schema:
 *           type: string
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

    const scored = jobs.map((job) => {
      const result = scoreMatch({ cv, job });
      return {
        ...job.toObject(),
        matchScore:    result.matchScore,
        level:         result.level,
        explanation:   result.explanation,
        matchedSkills: result.matchedSkills,
        missingSkills: result.missingSkills,
        breakdown:     result.breakdown,
      };
    });

    const sorted = scored.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ recommendations: sorted.slice(0, 10) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
