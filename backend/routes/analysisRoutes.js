const express = require("express");

const router = express.Router();

/**
 * @swagger
 * /analysis:
 *   post:
 *     summary: Analyze missing skills and create roadmap
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               missingSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Skill analysis result
 */
router.post("/analysis", (req, res) => {
  const { missingSkills } = req.body;

  if (!missingSkills) {
    return res.status(400).json({ error: "Missing data" });
  }

  const roadmap = missingSkills.map(
    (skill) => `Learn ${skill} basics -> practice -> build project`
  );

  res.json({
    missingSkills,
    roadmap,
    success: missingSkills.length < 2 ? "High" : "Medium",
  });
});

module.exports = router;
