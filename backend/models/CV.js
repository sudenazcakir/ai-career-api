const mongoose = require("mongoose");

const cvSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  parentCv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CV",
    default: null,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  type: { type: String, default: "General", trim: true },
  version: { type: String, default: "v1", trim: true },
  summary: { type: String, default: "", trim: true },
  skills: {
    type: [String],
    default: [],
    validate: {
      validator: (value) => Array.isArray(value),
      message: "skills must be an array",
    },
  },
  projects: { type: [String], default: [] },
  experience: { type: [String], default: [] },
  education: { type: [String], default: [] },
  certifications: { type: [String], default: [] },
});

cvSchema.index({ owner: 1, title: 1, version: 1 });

module.exports = mongoose.model("CV", cvSchema);
