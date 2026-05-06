const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const CV = require("../models/CV");
const fetchAdzunaJobs = require("../services/adzunaService");
const extractSkills = require("../services/skillExtractor");
const { scoreMatch } = require("../services/matchService");

const router = express.Router();

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSkills(skills = []) {
  return [...new Set(skills.map((skill) => String(skill).trim()).filter(Boolean))];
}


function inferRemoteType(job) {
  const text = [
    job.location?.display_name || "",
    job.description || "",
    job.contract_time || "",
    job.contract_type || "",
  ].join(" ").toLowerCase();
  if (/\bhybrid\b/.test(text)) return "Hybrid";
  if (/\bremote\b|\bwork from home\b|\bwfh\b/.test(text)) return "Remote";
  return "On-site";
}

function inferSeniority(title = "") {
  const lower = title.toLowerCase();
  if (/\bintern\b|\btrainee\b|\bapprentice\b|\bgraduate\b/.test(lower)) return "Intern";
  if (/\bjunior\b|\bjr\.?\b|\bentry.?level\b/.test(lower)) return "Junior";
  if (/\bsenior\b|\bsr\.?\b|\blead\b|\bprincipal\b|\bstaff\b/.test(lower)) return "Senior";
  if (/\bmid\b|\bmiddle\b/.test(lower)) return "Mid";
  return "Mid";
}

function buildJobDocument(job) {
  const description = job.description || "";
  const title = job.title || "";

  return {
    title,
    description,
    skills: normalizeSkills(extractSkills(`${title} ${description}`)),
    company: job.company?.display_name || "",
    location: job.location?.display_name || "",
    salaryMin: job.salary_min || null,
    salaryMax: job.salary_max || null,
    category: job.category?.label || job.category?.tag || "",
    contractType: job.contract_type || "",
    contractTime: job.contract_time || "",
    redirectUrl: job.redirect_url || "",
    createdAt: job.created ? new Date(job.created) : new Date(),
    remoteType: inferRemoteType(job),
    seniority: inferSeniority(title),
  };
}

async function saveAdzunaJobs(adzunaJobs) {
  if (!adzunaJobs.length) return { imported: 0, updated: 0 };

  const ops = adzunaJobs.map((job) => {
    const doc = buildJobDocument(job);
    return {
      updateOne: {
        filter: { title: doc.title, company: doc.company },
        update: { $set: doc },
        upsert: true,
      },
    };
  });

  try {
    const result = await Job.bulkWrite(ops, { ordered: false });
    return {
      imported: result.upsertedCount || 0,
      updated: result.modifiedCount || 0,
    };
  } catch (err) {
    // ordered: false allows partial success; extract counts from the error result
    if (err.result) {
      const skipped = err.writeErrors?.length || 0;
      if (skipped > 0) {
        console.warn(`saveAdzunaJobs: ${skipped} operation(s) skipped due to write errors`);
      }
      return {
        imported: err.result.upsertedCount || 0,
        updated: err.result.modifiedCount || 0,
      };
    }
    throw err;
  }
}

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Job list
 */
router.get("/jobs", async (req, res) => {
  try {
    if (Job.db.readyState === 1) {
      const all = await Job.find().sort({ createdAt: -1 });
      return res.json({ success: true, data: all });
    }

    return res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /jobs/filter:
 *   get:
 *     summary: Filter jobs from DB with real CV
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: cvId
 *         schema:
 *           type: string
 *         description: CV ID for match score calculation
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search by job title
 *       - in: query
 *         name: skill
 *         schema:
 *           type: string
 *         description: Filter by skill
 *       - in: query
 *         name: minMatch
 *         schema:
 *           type: number
 *         description: Minimum match score
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [score, newest]
 *         description: Sort results
 *     responses:
 *       200:
 *         description: Filtered jobs
 */
router.get("/jobs/filter", async (req, res) => {
  try {
    const {
      keyword, skill, minMatch, sort, cvId,
      company, location, remoteType, seniority,
      salaryMin, maxSkillGap, level,
    } = req.query;

    if (Job.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const needsCvContext = Boolean(
      (minMatch !== undefined && minMatch !== "") ||
      (maxSkillGap !== undefined && maxSkillGap !== "") ||
      level ||
      sort === "score" ||
      sort === "gaps" ||
      sort === "potential"
    );

    if (needsCvContext && !cvId) {
      return res.status(400).json({
        error: "cvId is required when using minMatch, maxSkillGap, level, or score-based sorting",
      });
    }

    let minMatchValue;
    if (minMatch !== undefined && minMatch !== "") {
      minMatchValue = Number(minMatch);
      if (Number.isNaN(minMatchValue)) {
        return res.status(400).json({ error: "minMatch must be a number" });
      }
    }

    let maxSkillGapValue;
    if (maxSkillGap !== undefined && maxSkillGap !== "") {
      maxSkillGapValue = Number(maxSkillGap);
      if (Number.isNaN(maxSkillGapValue)) {
        return res.status(400).json({ error: "maxSkillGap must be a number" });
      }
    }

    let salaryMinValue;
    if (salaryMin !== undefined && salaryMin !== "") {
      salaryMinValue = Number(salaryMin);
      if (Number.isNaN(salaryMinValue)) {
        return res.status(400).json({ error: "salaryMin must be a number" });
      }
    }

    // Build MongoDB query (DB-level filters)
    const query = {};

    if (keyword) {
      query.$or = [
        { title: { $regex: escapeRegex(keyword), $options: "i" } },
        { company: { $regex: escapeRegex(keyword), $options: "i" } },
        { description: { $regex: escapeRegex(keyword), $options: "i" } },
      ];
    }

    if (company) {
      query.company = { $regex: escapeRegex(company), $options: "i" };
    }

    if (location) {
      query.location = { $regex: escapeRegex(location), $options: "i" };
    }

    if (remoteType) {
      query.remoteType = { $regex: escapeRegex(remoteType), $options: "i" };
    }

    if (seniority) {
      query.seniority = { $regex: escapeRegex(seniority), $options: "i" };
    }

    let jobs = await Job.find(query).sort({ createdAt: -1 });

    // Skill filter (in-memory, deterministic)
    if (skill) {
      const normalizedSkill = String(skill).trim().toLowerCase();
      jobs = jobs.filter((job) =>
        (job.skills || []).some((jobSkill) =>
          String(jobSkill).toLowerCase().includes(normalizedSkill)
        )
      );
    }

    // Salary filter (in-memory — exclude jobs with no salary data if filter is active)
    if (salaryMinValue !== undefined) {
      jobs = jobs.filter((job) => {
        if (job.salaryMax == null && job.salaryMin == null) return false;
        return Math.max(job.salaryMax ?? 0, job.salaryMin ?? 0) >= salaryMinValue;
      });
    }

    // CV-based scoring (uses full weighted scoreMatch for consistency with /recommendations)
    if (cvId) {
      if (!mongoose.Types.ObjectId.isValid(cvId)) {
        return res.status(400).json({ error: "Invalid cvId" });
      }

      const cv = await CV.findOne({ _id: cvId, owner: req.user._id });
      if (!cv) {
        return res.status(404).json({ error: "CV not found" });
      }

      jobs = jobs.map((job) => {
        const result = scoreMatch({ cv, job });
        return {
          ...job.toObject(),
          matchScore:    result.matchScore,
          level:         result.level,
          explanation:   result.explanation,
          matchedSkills: result.matchedSkills,
          partialSkills: result.partialSkills,
          missingSkills: result.missingSkills,
          breakdown:     result.breakdown,
        };
      });
    }

    // Post-scoring filters
    if (minMatchValue !== undefined) {
      jobs = jobs.filter((job) => (job.matchScore ?? 0) >= minMatchValue);
    }

    if (maxSkillGapValue !== undefined) {
      jobs = jobs.filter((job) => (job.missingSkills?.length ?? 0) <= maxSkillGapValue);
    }

    if (level) {
      jobs = jobs.filter((job) => job.level === level);
    }

    // Sort
    if (sort === "score") {
      jobs.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    } else if (sort === "gaps" && cvId) {
      jobs.sort((a, b) => (a.missingSkills?.length ?? 0) - (b.missingSkills?.length ?? 0));
    } else if (sort === "potential" && cvId) {
      jobs.sort((a, b) => {
        const aScore = (a.breakdown?.experienceScore ?? 0) + (a.breakdown?.roleScore ?? 0);
        const bScore = (b.breakdown?.experienceScore ?? 0) + (b.breakdown?.roleScore ?? 0);
        return bScore - aScore;
      });
    } else {
      jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a job
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               company:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created job
 */
router.post("/jobs", async (req, res) => {
  try {
    const { title, company, skills = [] } = req.body;

    if (Job.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    if (!title || !company) {
      return res.status(400).json({ error: "title and company are required" });
    }

    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: "skills must be an array" });
    }

    const existing = await Job.findOne({ title, company });
    if (existing) {
      return res.status(200).json({
        success: true,
        data: existing,
        message: "Job already exists",
      });
    }

    const created = await Job.create({
      title: title.trim(),
      company: company.trim(),
      skills: normalizeSkills(skills),
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /jobs/import-adzuna:
 *   post:
 *     summary: Import jobs from Adzuna and save to database
 *     tags: [Jobs]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keyword:
 *                 type: string
 *               location:
 *                 type: string
 *               country:
 *                 type: string
 *               page:
 *                 type: number
 *     responses:
 *       201:
 *         description: Imported jobs
 */
router.post("/jobs/import-adzuna", async (req, res) => {
  try {
    if (Job.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const adzunaJobs = await fetchAdzunaJobs(req.body);
    const { imported, updated } = await saveAdzunaJobs(adzunaJobs);

    res.status(201).json({ success: true, imported, updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /jobs/fetch:
 *   get:
 *     summary: Fetch jobs from Adzuna and save to DB
 *     tags: [Jobs]
 */
router.get("/jobs/fetch", async (req, res) => {
  try {
    if (Job.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const adzunaJobs = await fetchAdzunaJobs();
    const { imported, updated } = await saveAdzunaJobs(adzunaJobs);

    res.json({
      success: true,
      imported,
      updated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
