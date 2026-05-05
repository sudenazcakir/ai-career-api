const mongoose = require("mongoose");

const passportSchema = new mongoose.Schema(
  {
    targetTitle: { type: String, default: "" },
    school: { type: String, default: "" },
    department: { type: String, default: "" },
    graduationYear: { type: String, default: "" },
    gpa: { type: String, default: "" },
    location: { type: String, default: "" },
    interests: { type: String, default: "" },
    skills: { type: String, default: "" },
    languages: { type: String, default: "" },
    tools: { type: String, default: "" },
    experience: { type: String, default: "" },
    projects: { type: String, default: "" },
    certificates: { type: String, default: "" },
    achievements: { type: String, default: "" },
    summary: { type: String, default: "" },
    workStyle: { type: String, default: "" },
    salaryExpectation: { type: String, default: "" },
    availability: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: { type: String, required: true },
    countryCode: { type: String, default: "+90" },
    phoneNumber: { type: String, default: "" },
    phone: { type: String, default: "" },
    photo: { type: String, default: "" },
    passport: { type: passportSchema, default: () => ({}) },
    passportCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    _id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    countryCode: this.countryCode,
    phoneNumber: this.phoneNumber,
    phone: this.phone,
    photo: this.photo,
    passport: this.passport,
    passportCompleted: this.passportCompleted,
  };
};

module.exports = mongoose.model("User", userSchema);
