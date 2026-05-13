const express = require("express");
const mongoose = require("mongoose");
const CV = require("../models/CV");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { parseCvText } = require("../services/cvParser");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ["application/pdf", "text/plain"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and TXT files are accepted"));
    }
  },
});

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

/**
 * @swagger
 * /cvs/{id}/version:
 *   post:
 *     summary: Create a versioned copy of a CV
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Source CV ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               version:
 *                 type: string
 *                 description: Optional version label (auto-incremented if omitted)
 *     responses:
 *       201:
 *         description: New versioned CV created
 *       404:
 *         description: Source CV not found
 */
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

/**
 * @swagger
 * /cvs/compare:
 *   post:
 *     summary: Compare two CVs side-by-side
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leftCvId, rightCvId]
 *             properties:
 *               leftCvId:
 *                 type: string
 *               rightCvId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comparison result with shared skills, unique skills per CV, and similarity score
 *       404:
 *         description: One or both CVs not found
 */
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



/**
 * @swagger
 * /cvs/generate:
 *   post:
 *     summary: Generate a CV draft from Career Passport data
 *     description: Uses OpenAI (if configured) to draft a CV from the user's passport profile. Falls back to a rule-based template when no API key is set.
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passport]
 *             properties:
 *               passport:
 *                 type: object
 *                 description: Career Passport fields (targetTitle, skills, experience, etc.)
 *               targetField:
 *                 type: string
 *                 description: Target job field hint (e.g. "Backend", "Frontend")
 *               jobId:
 *                 type: string
 *                 description: Optional job ID to tailor the draft toward
 *     responses:
 *       200:
 *         description: Generated CV draft with title, skills, summary and sections
 */
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

/**
 * @swagger
 * /cvs/rank-for-job:
 *   post:
 *     summary: Rank all user CVs for a specific job using weighted match score
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobId]
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: The job to rank CVs against
 *     responses:
 *       200:
 *         description: Array of CVs sorted by match score descending, each with matchScore, matchedSkills, missingSkills
 */
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

/**
 * @swagger
 * /cvs/upload:
 *   post:
 *     summary: Parse a CV file and return extracted fields for review
 *     description: Accepts a PDF or TXT file (max 5 MB). Extracts title, summary, skills, experience, projects, education, and certifications using rule-based parsing. Does NOT save — the client reviews extracted fields and saves separately. Rate limited to 10 uploads per user per hour.
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF or TXT file, max 5 MB
 *     responses:
 *       200:
 *         description: Extracted CV fields
 *       400:
 *         description: No file uploaded or unsupported file type
 *       413:
 *         description: File exceeds 5 MB limit
 *       429:
 *         description: Rate limit exceeded (10 uploads per hour)
 */
router.post(
  "/upload",
  (req, res, next) => {
    if (!router._uploadCounts) router._uploadCounts = {};
    const key = `${req.user._id}_${Math.floor(Date.now() / 3_600_000)}`;
    router._uploadCounts[key] = (router._uploadCounts[key] || 0) + 1;
    if (router._uploadCounts[key] > 10) {
      return res.status(429).json({ error: "Upload limit reached (10 per hour)" });
    }
    next();
  },
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let rawText = "";

      if (req.file.mimetype === "application/pdf") {
        const parsed = await pdfParse(req.file.buffer);
        rawText = parsed.text || "";
      } else {
        rawText = req.file.buffer.toString("utf-8");
      }

      rawText = rawText.replace(/<[^>]*>/g, " ").replace(/\s{3,}/g, "\n\n");

      const cvFields = parseCvText(rawText);

      res.json({ success: true, data: cvFields });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /cvs/{id}/ai-version:
 *   post:
 *     summary: Generate an AI-optimised CV version for review (does not save)
 *     description: |
 *       Applies one of four optimisation modes to the source CV and returns a proposed version with
 *       a list of changes and warnings. The result is NOT saved — the client shows the diff and the
 *       user chooses to save via POST /cvs/:id/version. Falls back to rule-based output when
 *       OPENAI_API_KEY is not configured.
 *
 *       **Modes:**
 *       - `ats_optimize` — move job-matching skills to front, add target role keyword to summary
 *       - `role_tailor` — prioritise experience/projects by relevance to target job
 *       - `concise` — cap bullets at 4 items, shorten entries to 100 chars
 *       - `seniority_boost` — prepend strong action verbs to experience and project bullets
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Source CV ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mode]
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [ats_optimize, role_tailor, concise, seniority_boost]
 *               targetJobId:
 *                 type: string
 *                 description: Optional job ID to tailor the version toward
 *               instructions:
 *                 type: string
 *                 description: Optional free-text instructions for the AI (max 500 chars)
 *     responses:
 *       200:
 *         description: Proposed CV with changes and warnings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     proposedCv:
 *                       type: object
 *                     changes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           message:
 *                             type: string
 *                     modelInfo:
 *                       type: object
 *       400:
 *         description: Invalid CV id or missing/invalid mode
 *       404:
 *         description: CV not found or not owned by user
 */
router.post("/:id/ai-version", async (req, res) => {
  try {
    if (CV.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid CV id" });
    }

    const { MODES, generateAiVersion, getJob } = require("../services/cvAiVersioningService");
    const { mode, targetJobId, instructions } = req.body;

    if (!mode || !MODES.includes(mode)) {
      return res.status(400).json({ error: `mode must be one of: ${MODES.join(", ")}` });
    }

    const source = await CV.findOne({ _id: id, owner: req.user._id });
    if (!source) {
      return res.status(404).json({ error: "CV not found" });
    }

    const job = await getJob(targetJobId || null);
    const proposedCv = await generateAiVersion({
      cv: source.toObject(),
      job,
      mode,
      instructions: typeof instructions === "string" ? instructions.slice(0, 500) : undefined,
    });

    res.json({
      success: true,
      data: {
        proposedCv,
        changes: proposedCv.changes,
        warnings: proposedCv.warnings,
        modelInfo: proposedCv.modelInfo,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File is too large (max 5 MB)" });
  }
  if (err.message === "Only PDF and TXT files are accepted") {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
