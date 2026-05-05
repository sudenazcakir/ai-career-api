const mongoose = require("mongoose");

const cvSchema = new mongoose.Schema({
  title: String,
  type: String,
  summary: String,
  skills: [String],
  projects: [String],
  experience: [String],
  education: [String],
  certifications: [String],
  source: {
    type: String,
    enum: ["manual", "ai-generated", "rule-generated"],
    default: "manual",
  },
  targetJobTitle: String,
  targetCompany: String,
});

module.exports = mongoose.model("CV", cvSchema);
