const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  skills: [String],
  company: String,
  location: String,
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate job postings: one record per (title, company) pair
jobSchema.index({ title: 1, company: 1 }, { unique: true });

module.exports = mongoose.model("Job", jobSchema);
