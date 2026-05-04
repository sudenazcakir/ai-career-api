const express = require("express");
const { buildAiCareerMatrix } = require("../services/careerMatrixService");

const router = express.Router();

/**
 * @swagger
 * /career-matrix:
 *   post:
 *     summary: Build AI-assisted career field matrix from Career Passport
 *     tags: [Career Matrix]
 *     responses:
 *       200:
 *         description: Career matrix scores
 */
router.post("/career-matrix", async (req, res) => {
  try {
    const matrix = await buildAiCareerMatrix(req.body?.passport || {});
    res.json({ success: true, data: matrix });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
