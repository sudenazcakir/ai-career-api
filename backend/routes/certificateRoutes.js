const express = require("express");
const multer = require("multer");
const { extractFromPdf, extractFromImage } = require("../services/certificateExtractorService");

const router = express.Router();

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Allowed: PDF, PNG, JPG, WebP.`));
    }
  },
});

/**
 * @swagger
 * /certificates/extract:
 *   post:
 *     summary: Extract certificate data from an uploaded PDF or image file
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Extracted certificate data
 *       400:
 *         description: Bad request (no file, unsupported type, file too large)
 */
router.post("/certificates/extract", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const { buffer, mimetype } = req.file;

  try {
    const result = mimetype === "application/pdf"
      ? await extractFromPdf(buffer)
      : await extractFromImage(buffer, mimetype);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message || "Extraction failed." });
  }
});

/* Multer-specific error handler */
// eslint-disable-next-line no-unused-vars
router.use((error, req, res, next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Maximum size is 5 MB." });
  }
  if (error.message?.startsWith("Unsupported")) {
    return res.status(400).json({ error: error.message });
  }
  res.status(500).json({ error: error.message || "Upload error." });
});

module.exports = router;
