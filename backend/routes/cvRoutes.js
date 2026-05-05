const express = require("express");
const mongoose = require("mongoose");
const CV = require("../models/CV");

const router = express.Router();

function normalizeSkills(skills = []) {
  return [...new Set(skills.map((skill) => String(skill).trim()).filter(Boolean))];
}

function normalizeList(items = []) {
  return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
}

function validateCvPayload(payload, partial = false) {
  const { title, skills } = payload;
  if (!partial && !title) {
    return "title is required";
  }

  if (title !== undefined && !String(title).trim()) {
    return "title cannot be empty";
  }

  if (skills !== undefined && !Array.isArray(skills)) {
    return "skills must be an array";
  }

  const listFields = ["projects", "experience", "education", "certifications"];
  const invalidField = listFields.find(
    (field) => payload[field] !== undefined && !Array.isArray(payload[field])
  );
  if (invalidField) {
    return `${invalidField} must be an array`;
  }

  return null;
}

function buildCvFields(payload) {
  const fields = {};
  const stringFields = ["title", "type", "version", "summary"];
  const listFields = ["projects", "experience", "education", "certifications"];

  stringFields.forEach((field) => {
    if (payload[field] !== undefined) fields[field] = String(payload[field]).trim();
  });

  if (payload.skills !== undefined) fields.skills = normalizeSkills(payload.skills);
  listFields.forEach((field) => {
    if (payload[field] !== undefined) fields[field] = normalizeList(payload[field]);
  });

  return fields;
}

function asSet(items = []) {
  return new Set(items.map((item) => String(item).trim().toLowerCase()).filter(Boolean));
}

function compareLists(left = [], right = []) {
  const leftSet = asSet(left);
  const rightSet = asSet(right);

  return {
    shared: left.filter((item) => rightSet.has(String(item).toLowerCase())),
    onlyLeft: left.filter((item) => !rightSet.has(String(item).toLowerCase())),
    onlyRight: right.filter((item) => !leftSet.has(String(item).toLowerCase())),
  };
}

function nextVersionLabel(version = "v1") {
  const match = String(version || "").match(/v?(\d+)$/i);
  const next = match ? Number(match[1]) + 1 : 2;
  return `v${next}`;
}

function buildCvComparison(left, right) {
  const skillComparison = compareLists(left.skills || [], right.skills || []);
  const fieldNames = ["projects", "experience", "education", "certifications"];
  const fieldComparison = fieldNames.map((field) => ({
    field,
    leftCount: left[field]?.length || 0,
    rightCount: right[field]?.length || 0,
    ...compareLists(left[field] || [], right[field] || []),
  }));

  const totalUniqueSkills = new Set([
    ...(left.skills || []).map((skill) => String(skill).toLowerCase()),
    ...(right.skills || []).map((skill) => String(skill).toLowerCase()),
  ]).size;

  return {
    left,
    right,
    skills: skillComparison,
    fields: fieldComparison,
    similarityScore: totalUniqueSkills
      ? Math.round((skillComparison.shared.length / totalUniqueSkills) * 100)
      : 0,
  };
}

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

    const cvs = await CV.find({ owner: req.user._id }).sort({ _id: -1 });

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

    const validationError = validateCvPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const cv = await CV.create({
      owner: req.user._id,
      type: "General",
      version: "v1",
      ...buildCvFields({
        skills: [],
        projects: [],
        experience: [],
        education: [],
        certifications: [],
        ...req.body,
      }),
    });

    res.status(201).json({ success: true, data: cv });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /cvs/{id}:
 *   put:
 *     summary: Update a CV
 *     tags: [CVs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CV ID
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
 *       200:
 *         description: Updated CV
 */
router.put("/:id", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid CV id" });
    }

    const validationError = validateCvPayload(req.body, true);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updates = buildCvFields(req.body);

    const cv = await CV.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      updates,
      { new: true }
    );
    if (!cv) {
      return res.status(404).json({ error: "CV not found" });
    }

    res.json({ success: true, data: cv });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /cvs/{id}:
 *   delete:
 *     summary: Delete a CV
 *     tags: [CVs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CV ID
 *     responses:
 *       200:
 *         description: Deleted CV
 */
router.delete("/:id", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid CV id" });
    }

    const deleted = await CV.findOneAndDelete({ _id: id, owner: req.user._id });
    if (!deleted) {
      return res.status(404).json({ error: "CV not found" });
    }

    res.json({
      success: true,
      message: "CV deleted",
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/version", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid CV id" });
    }

    const source = await CV.findOne({ _id: id, owner: req.user._id });
    if (!source) {
      return res.status(404).json({ error: "CV not found" });
    }

    const validationError = validateCvPayload(req.body || {}, true);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const overrides = buildCvFields(req.body || {});
    const version = overrides.version || nextVersionLabel(source.version);
    const sourceObject = source.toObject();
    delete sourceObject._id;
    delete sourceObject.__v;
    delete sourceObject.createdAt;
    delete sourceObject.updatedAt;

    const cv = await CV.create({
      ...sourceObject,
      ...overrides,
      owner: req.user._id,
      parentCv: source.parentCv || source._id,
      title: overrides.title || source.title,
      version,
    });

    res.status(201).json({ success: true, data: cv });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/compare", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const { leftCvId, rightCvId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(leftCvId) || !mongoose.Types.ObjectId.isValid(rightCvId)) {
      return res.status(400).json({ error: "Valid leftCvId and rightCvId are required" });
    }

    const [left, right] = await Promise.all([
      CV.findOne({ _id: leftCvId, owner: req.user._id }),
      CV.findOne({ _id: rightCvId, owner: req.user._id }),
    ]);
    if (!left || !right) {
      return res.status(404).json({ error: "CV not found" });
    }

    res.json({ success: true, data: buildCvComparison(left, right) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /cvs/best-cv:
 *   post:
 *     summary: Legacy manual best-CV flow
 *     description: Manual non-DB helper kept for compatibility. Current app flow uses GET /api/best-cv/{jobId}.
 *     tags: [CVs]
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



router.post("/generate", async (req, res) => {
  try {
    const { generateCvDraft } = require("../services/cvGeneratorService");
    const draft = await generateCvDraft({
      passport: req.body.passport || {},
      targetField: req.body.targetField || "Backend",
      jobId: req.body.jobId,
    });
    res.json({ success: true, data: draft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/rank-for-job", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }
    const { jobId } = req.body;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: "Valid jobId is required" });
    }
    const { rankCvsForJob } = require("../services/cvRankingService");
    const result = await rankCvsForJob({ jobId });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

module.exports = router;
