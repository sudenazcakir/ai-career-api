const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  skills: { type: [String], default: [] },
  company: { type: String, required: true, trim: true },
  location: { type: String, default: "" },
  salaryMin: { type: Number, default: null },
  salaryMax: { type: Number, default: null },
  category: { type: String, default: "" },
  contractType: { type: String, default: "" },
  contractTime: { type: String, default: "" },
  redirectUrl: { type: String, default: "" },
  remoteType:  { type: String, default: "" },
  seniority:   { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate job postings: one record per (title, company) pair
jobSchema.index({ title: 1, company: 1 }, { unique: true });

module.exports = mongoose.model("Job", jobSchema);
