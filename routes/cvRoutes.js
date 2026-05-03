const express = require("express");
const CV = require("../models/CV");

const router = express.Router();

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

    const { title, skills = [] } = req.body;
    const cv = await CV.create({ title, skills });

    res.status(201).json({ success: true, data: cv });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /best-cv:
 *   post:
 *     summary: Get best CV for a job
 *     tags: [CV]
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
