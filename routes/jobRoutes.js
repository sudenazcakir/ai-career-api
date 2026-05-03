const express = require("express");
const axios = require("axios");
const Job = require("../models/Job");
const CV = require("../models/CV");
const fetchAdzunaJobs = require("../services/adzunaService");
const extractSkills = require("../services/skillExtractor");

const router = express.Router();
const jobs = [];

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
router.get("/jobs", (req, res) => {
  res.json({ success: true, data: jobs });
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
    const { keyword, skill, minMatch, sort, cvId } = req.query;

    if (Job.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    let jobs = await Job.find();

    // keyword
    if (keyword) {
      jobs = jobs.filter((j) =>
        j.title.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // skill
    if (skill) {
      jobs = jobs.filter((j) => j.skills.includes(skill));
    }

    // CV çek
    let userSkills = [];
    if (cvId) {
      const cv = await CV.findById(cvId);
      if (cv) userSkills = cv.skills;
    }

    // match + minMatch
    if (minMatch && userSkills.length) {
      jobs = jobs
        .map((j) => {
          const match = j.skills.filter((s) => userSkills.includes(s));
          const score = Math.round((match.length / j.skills.length) * 100);
          return { ...j.toObject(), matchScore: score };
        })
        .filter((j) => j.matchScore >= Number(minMatch));
    }

    // sort
    if (sort === "score") {
      jobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (sort === "newest") {
      jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ jobs });
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
router.post("/jobs", (req, res) => {
  const { title, company, skills = [] } = req.body;

  const job = {
    id: jobs.length + 1,
    title,
    company,
    skills,
  };

  jobs.push(job);

  res.status(201).json({ success: true, data: job });
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
      return res.status(503).json({
        success: false,
        error: "Database is not connected",
      });
    }

    const adzunaJobs = await fetchAdzunaJobs(req.body);

    const jobsToSave = adzunaJobs.map((job) => {
      const description = job.description || "";
      const title = job.title || "";

      return {
        title,
        description,
        skills: extractSkills(`${title} ${description}`),
        company: job.company?.display_name || "",
        location: job.location?.display_name || "",
        createdAt: job.created ? new Date(job.created) : new Date(),
      };
    });

    const savedJobs = await Job.insertMany(jobsToSave);

    res.status(201).json({
      success: true,
      imported: savedJobs.length,
      jobs: savedJobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
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

    const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_APP_KEY}&what=developer`;

    const response = await axios.get(url);

    const jobs = response.data.results;

    for (const j of jobs) {
      const skills = extractSkills(j.description);

      // duplicate basit kontrol (title + company)
      const exists = await Job.findOne({
        title: j.title,
        company: j.company?.display_name,
      });

      if (!exists) {
        await Job.create({
          title: j.title,
          description: j.description,
          skills,
          company: j.company?.display_name,
          location: j.location?.display_name,
        });
      }
    }

    res.json({ message: "Jobs fetched & saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
