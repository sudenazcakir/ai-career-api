const mongoose = require("mongoose");

const cvSchema = new mongoose.Schema({
  title: String,
  skills: [String],
});

module.exports = mongoose.model("CV", cvSchema);
