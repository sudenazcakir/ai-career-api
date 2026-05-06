const express = require("express");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const CV = require("../models/CV");
const Job = require("../models/Job");

const router = express.Router();
const APPLICATION_STATUSES = ["Saved for Later", "Under Review", "Accepted", "Rejected"];

function ensureDbConnected(res) {
  if (Application.db.readyState !== 1) {
    res.status(503).json({ error: "Database is not connected" });
    return false;
  }
  return true;
}

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
    if (!ensureDbConnected(res)) return;

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
    if (!ensureDbConnected(res)) return;

    const { jobId, cvId, notes = "", status = "Under Review" } = req.body;

    if (!jobId || !cvId) {
      return res.status(400).json({ error: "jobId and cvId are required" });
    }
    if (!isValidObjectId(jobId) || !isValidObjectId(cvId)) {
      return res.status(400).json({ error: "Invalid jobId or cvId" });
    }
    if (!APPLICATION_STATUSES.includes(status)) {
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
/**
 * GET /applications/similar-roles
 * Returns jobs similar to what the user has previously applied to,
 * excluding jobs already in their application list.
 */
router.get("/applications/similar-roles", async (req, res) => {
  try {
    if (!ensureDbConnected(res)) return;

    const applications = await Application.find({ owner: req.user._id }).populate("job");

    if (applications.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Build applied job IDs set for exclusion
    const appliedJobIds = applications
      .map((a) => a.job?._id?.toString())
      .filter(Boolean);

    // Extract skills from applied jobs; weight non-rejected apps higher
    const skillFreq = {};
    for (const app of applications) {
      const weight = app.status === "Rejected" ? 0.4 : 1;
      for (const skill of app.job?.skills || []) {
        const key = skill.toLowerCase();
        skillFreq[key] = (skillFreq[key] || 0) + weight;
      }
    }

    // Top 6 skills by frequency
    const topSkills = Object.entries(skillFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([skill]) => skill);

    if (topSkills.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Fetch candidate jobs not already applied to (limit scan to 60)
    const validExclusions = appliedJobIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const candidates = await Job.find({
      _id: { $nin: validExclusions },
    }).limit(60);

    // Score by skill overlap with top skills
    const scored = candidates
      .map((job) => {
        const jobSkillsLower = (job.skills || []).map((s) => s.toLowerCase());
        const overlap = topSkills.filter((s) => jobSkillsLower.includes(s)).length;
        return {
          ...job.toObject(),
          matchScore: Math.round((overlap / topSkills.length) * 100),
        };
      })
      .filter((job) => job.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    res.json({ success: true, data: scored });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/applications/:id/status", async (req, res) => {
  try {
    if (!ensureDbConnected(res)) return;

    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid application id" });
    }
    if (!APPLICATION_STATUSES.includes(status)) {
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

module.exports = router;
