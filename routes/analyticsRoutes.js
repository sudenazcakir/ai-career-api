const express = require("express");
const CV = require("../models/CV");

const router = express.Router();

function ensureDbConnected(res) {
  if (CV.db.readyState !== 1) {
    res.status(503).json({ error: "Database is not connected" });
    return false;
  }

  return true;
}

/**
 * @swagger
 * /analytics/skills:
 *   get:
 *     summary: Analytics placeholder for skill insights
 *     description: Future analytics surface. Returns placeholder data in this phase.
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Analytics placeholder response
 */
router.get("/analytics/skills", async (req, res) => {
  if (!ensureDbConnected(res)) return;

  res.json({
    success: true,
    data: [],
    message: "Analytics placeholder",
  });
});

/**
 * @swagger
 * /analytics/trends:
 *   get:
 *     summary: Analytics placeholder for trend insights
 *     description: Future analytics surface. Returns placeholder data in this phase.
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Analytics placeholder response
 */
router.get("/analytics/trends", async (req, res) => {
  if (!ensureDbConnected(res)) return;

  res.json({
    success: true,
    data: [],
    message: "Analytics placeholder",
  });
});

module.exports = router;
