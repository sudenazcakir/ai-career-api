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

/**
 * @swagger
 * /success-score:
 *   post:
 *     summary: Predict interview potential for a CV + Job pair
 *     tags: [Match]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cvId:
 *                 type: string
 *               jobId:
 *                 type: string
 */
router.post("/success-score", async (req, res) => {
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

    const match = scoreMatch({ cv, job });

    // CV completeness: key fields filled
    const completenessFields = [
      cv.summary, cv.skills?.length, cv.experience?.length,
      cv.projects?.length, cv.certifications?.length,
    ];
    const filled = completenessFields.filter(Boolean).length;
    const cvCompleteness = Math.round((filled / completenessFields.length) * 100);

    // Adjustments
    const skillGapPenalty  = Math.min(match.missingSkills.length * 4, 20);
    const completenessBonus = Math.round(cvCompleteness * 0.12); // max +12
    const expBonus = Math.min((cv.experience || []).length * 5, 15); // max +15

    const raw = match.matchScore - skillGapPenalty + completenessBonus + expBonus;
    const successScore = Math.max(0, Math.min(100, Math.round(raw)));

    const interviewPotential =
      successScore >= 72 ? "High" :
      successScore >= 48 ? "Medium" : "Low";

    // Actionable suggestions
    const suggestions = [];
    if (!cv.summary) suggestions.push("Add a CV summary to strengthen your profile (+5 pts potential)");
    if (!(cv.experience || []).length) suggestions.push("Add experience entries for better job description alignment (+10 pts potential)");
    if (!(cv.projects || []).length) suggestions.push("List projects to demonstrate practical skills (+5 pts potential)");
    if (match.missingSkills.length > 0) {
      suggestions.push(`Close top skill gaps: ${match.missingSkills.slice(0, 3).join(", ")} (-${Math.min(match.missingSkills.length * 4, 20)} pts penalty removed)`);
    }
    if (cvCompleteness < 80) suggestions.push(`Complete your CV profile — currently ${cvCompleteness}% filled`);

    res.json({
      successScore,
      interviewPotential,
      matchScore:          match.matchScore,
      skillGapCount:       match.missingSkills.length,
      experienceAlignment: match.breakdown.experienceScore,
      cvCompleteness,
      breakdown: {
        base:               match.matchScore,
        skillGapPenalty:    -skillGapPenalty,
        completenessBonus,
        experienceBonus:    expBonus,
      },
      suggestions,
      summary: `${interviewPotential} interview potential — ${match.explanation}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
