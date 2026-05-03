const express = require("express");
const Job = require("../models/Job");
const CV = require("../models/CV");

const router = express.Router();

/**
 * @swagger
 * /match:
 *   post:
 *     summary: Calculate match score between CV and Job
 *     tags: [Match]
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
 *               jobSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Match result
 */
router.post("/match", (req, res) => {
  const { cvSkills, jobSkills } = req.body;

  if (!cvSkills || !jobSkills) {
    return res.status(400).json({ error: "Missing data" });
  }

  // eşleşen skilller
  const matchingSkills = jobSkills.filter((skill) => cvSkills.includes(skill));

  // eksik skilller
  const missingSkills = jobSkills.filter((skill) => !cvSkills.includes(skill));

  // skor
  const score = Math.round((matchingSkills.length / jobSkills.length) * 100);

  // level
  let level = "Low";
  if (score > 70) level = "High";
  else if (score > 40) level = "Medium";

  // explain
  const explanation = `
Match Score: ${score}%
Matched Skills: ${matchingSkills.join(", ")}
Missing Skills: ${missingSkills.join(", ")}
`;

  res.json({
    matchScore: score,
    level,
    matchingSkills,
    missingSkills,
    explanation,
  });
});

/**
 * @swagger
 * /best-cv/{jobId}:
 *   get:
 *     summary: Get best CV for a job
 *     tags: [Match]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Best CV result
 */
router.get("/best-cv/:jobId", async (req, res) => {
  try {
    if (Job.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const cvs = await CV.find();

    let bestCv = null;
    let bestScore = 0;
    const jobSkills = job.skills || [];

    cvs.forEach((cv) => {
      const match = jobSkills.filter((skill) => cv.skills.includes(skill));

      const score = jobSkills.length
        ? Math.round((match.length / jobSkills.length) * 100)
        : 0;

      if (score > bestScore) {
        bestScore = score;
        bestCv = cv;
      }
    });

    res.json({ bestCv, score: bestScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
