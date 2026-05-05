const mongoose = require("mongoose");

const cvSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  title: { type: String, required: true, trim: true },
  skills: {
    type: [String],
    default: [],
    validate: {
      validator: (value) => Array.isArray(value),
      message: "skills must be an array",
    },
  },
});

cvSchema.index({ owner: 1, title: 1 });

module.exports = mongoose.model("CV", cvSchema);
