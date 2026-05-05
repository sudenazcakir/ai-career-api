const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    cv: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CV",
      required: true,
    },
    status: {
      type: String,
      enum: ["Saved for Later", "Under Review", "Accepted", "Rejected"],
      default: "Under Review",
    },
    notes: {
      type: String,
      default: "",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ owner: 1, job: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
