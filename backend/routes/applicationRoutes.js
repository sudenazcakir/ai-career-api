const express = require("express");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const CV = require("../models/CV");
const Job = require("../models/Job");
const { findSimilarRoles } = require("../services/similarRoles");

const router = express.Router();
const APPLICATION_STATUSES = new Set(["Saved for Later", "Under Review", "Accepted", "Rejected"]);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * @swagger
 * /applications:
 *   get:
 *     summary: List the authenticated user's applications
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application list
 */
router.get("/applications", async (req, res) => {
  try {
    const applications = await Application.find({ owner: req.user._id })
      .populate("job")
      .populate("cv")
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: Track or save a job application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created application
 */
router.post("/applications", async (req, res) => {
  try {
    const { jobId, cvId, notes = "", status = "Under Review" } = req.body;

    if (!jobId || !cvId) {
      return res.status(400).json({ error: "jobId and cvId are required" });
    }
    if (!isValidObjectId(jobId) || !isValidObjectId(cvId)) {
      return res.status(400).json({ error: "Invalid jobId or cvId" });
    }
    if (!APPLICATION_STATUSES.has(status)) {
      return res.status(400).json({ error: "Invalid application status" });
    }

    const [job, cv] = await Promise.all([
      Job.findById(jobId),
      CV.findOne({ _id: cvId, owner: req.user._id }),
    ]);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (!cv) return res.status(404).json({ error: "CV not found" });

    const existing = await Application.findOne({ owner: req.user._id, job: jobId });
    if (existing) {
      existing.cv = cvId;
      existing.notes = notes;
      existing.status = status;
      await existing.save();
      const populated = await existing.populate(["job", "cv"]);
      return res.status(200).json({ success: true, data: populated, message: "Application updated" });
    }

    const application = await Application.create({
      owner: req.user._id,
      job: jobId,
      cv: cvId,
      notes,
      status,
    });
    const populated = await application.populate(["job", "cv"]);
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /applications/similar-roles:
 *   get:
 *     summary: Get jobs similar to the user's past applications
 *     description: Scores all non-applied jobs by skill overlap with previously applied jobs. Rejected applications are weighted lower (0.4×).
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of up to 6 similar jobs sorted by matchScore descending
 */
router.get("/applications/similar-roles", async (req, res) => {
  try {
    const applications = await Application.find({ owner: req.user._id }).populate("job");

    if (applications.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const appliedJobIds = applications
      .map((a) => a.job?._id?.toString())
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

    const candidates = await Job.find({ _id: { $nin: appliedJobIds } }).limit(60);

    const data = findSimilarRoles(applications, candidates);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /applications/{id}/status:
 *   patch:
 *     summary: Update application status
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated application
 */
router.patch("/applications/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid application id" });
    }
    if (!APPLICATION_STATUSES.has(status)) {
      return res.status(400).json({ error: "Invalid application status" });
    }

    const application = await Application.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      { status },
      { new: true }
    )
      .populate("job")
      .populate("cv");

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/applications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid application id" });
    }
    const application = await Application.findOneAndDelete({ _id: id, owner: req.user._id });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
