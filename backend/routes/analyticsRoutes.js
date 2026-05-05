const express = require("express");
const CV = require("../models/CV");
const Job = require("../models/Job");
const fetchAdzunaJobs = require("../services/adzunaService");

const router = express.Router();

function ensureDbConnected(res) {
  if (CV.db.readyState !== 1) {
    res.status(503).json({ error: "Database is not connected" });
    return false;
  }

  return true;
}

function calculateMissingSkills(jobSkills = [], cvSkills = []) {
  const normalizedCvSkills = cvSkills.map((skill) => String(skill).toLowerCase());
  return jobSkills.filter(
    (skill) => !normalizedCvSkills.includes(String(skill).toLowerCase())
  );
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function toDistribution(counts) {
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * @swagger
 * /analytics/skills:
 *   get:
 *     summary: Get missing skill analytics from stored CV and Job data
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Missing skill analytics
 */
router.get("/analytics/skills", async (req, res) => {
  if (!ensureDbConnected(res)) return;

  const [cvs, jobs] = await Promise.all([
    CV.find({ owner: req.user._id }),
    Job.find(),
  ]);
  const counts = {};
  let comparisons = 0;

  cvs.forEach((cv) => {
    jobs.forEach((job) => {
      comparisons += 1;
      calculateMissingSkills(job.skills || [], cv.skills || []).forEach((skill) => {
        counts[skill] = (counts[skill] || 0) + 1;
      });
    });
  });

  const data = Object.entries(counts)
    .map(([skill, missingCount]) => ({
      skill,
      missingCount,
      share:
        comparisons > 0 ? Number(((missingCount / comparisons) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.missingCount - a.missingCount)
    .slice(0, 12);

  res.json({
    success: true,
    data,
    meta: {
      source: "mongodb",
      cvCount: cvs.length,
      jobCount: jobs.length,
      comparisons,
    },
  });
});

/**
 * @swagger
 * /analytics/trends:
 *   get:
 *     summary: Get market trend analytics
 *     description: Uses Adzuna search data when credentials are available, otherwise summarizes stored jobs.
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Trend analytics response
 */
router.get("/analytics/trends", async (req, res) => {
  if (!ensureDbConnected(res)) return;

  const {
    keyword = "developer",
    country = "gb",
    location = "",
    source = "adzuna",
  } = req.query;

  if (source === "adzuna") {
    try {
      const data = await fetchAdzunaJobs.fetchSearch({
        keyword,
        country,
        location,
      });
      const results = data.results || [];

      return res.json({
        success: true,
        data: {
          source: "adzuna",
          keyword,
          country,
          location,
          totalCount: data.count || results.length,
          sampleSize: results.length,
          averageSalaryMin: average(results.map((job) => Number(job.salary_min))),
          averageSalaryMax: average(results.map((job) => Number(job.salary_max))),
          categories: toDistribution(
            countBy(results, (job) => job.category?.label || job.category?.tag)
          ),
          contractTypes: toDistribution(countBy(results, (job) => job.contract_type)),
          locations: toDistribution(
            countBy(results, (job) => job.location?.display_name)
          ).slice(0, 8),
        },
      });
    } catch (error) {
      console.warn("Adzuna analytics fallback:", error.message);
    }
  }

  const jobs = await Job.find();
  res.json({
    success: true,
    data: {
      source: "mongodb",
      totalCount: jobs.length,
      sampleSize: jobs.length,
      averageSalaryMin: average(jobs.map((job) => job.salaryMin)),
      averageSalaryMax: average(jobs.map((job) => job.salaryMax)),
      categories: toDistribution(countBy(jobs, (job) => job.category)),
      contractTypes: toDistribution(countBy(jobs, (job) => job.contractType)),
      locations: toDistribution(countBy(jobs, (job) => job.location)).slice(0, 8),
    },
    meta: {
      message: "Using stored jobs because Adzuna data was unavailable.",
    },
  });
});

module.exports = router;
