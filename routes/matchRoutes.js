const express = require("express");
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

  const matching = jobSkills.filter((skill) => cvSkills.includes(skill));

  const score = Math.round((matching.length / jobSkills.length) * 100);

  const missing = jobSkills.filter((skill) => !cvSkills.includes(skill));

  res.json({
    matchScore: score,
    matchingSkills: matching,
    missingSkills: missing,
  });
});

module.exports = router;
