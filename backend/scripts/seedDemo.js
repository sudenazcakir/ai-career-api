const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const CV = require("../models/CV");

async function main() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-career-api";
  await mongoose.connect(mongoUri);

  const demoCV = {
    title: "Demo Candidate",
    skills: ["JavaScript", "React", "Node.js", "Express", "MongoDB"],
  };

  const result = await CV.findOneAndUpdate(
    { title: demoCV.title },
    demoCV,
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  console.log(`Demo CV ready: ${result.title}`);
  console.log(`Skills: ${result.skills.join(", ")}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
