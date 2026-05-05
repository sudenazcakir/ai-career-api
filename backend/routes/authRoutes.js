const express = require("express");
const requireAuth = require("../middleware/authMiddleware");
const User = require("../models/User");
const { hashPassword, signToken, verifyPassword } = require("../services/authService");

const router = express.Router();

function buildAuthResponse(user) {
  return {
    success: true,
    token: signToken({ sub: user._id.toString(), email: user.email }),
    user: user.toPublicJSON(),
  };
}

function normalizePhoneNumber(value = "") {
  return String(value).replace(/\D/g, "");
}

function validatePhoneNumber(value, required = false) {
  const raw = String(value || "");
  const normalized = normalizePhoneNumber(value);

  if (!normalized && !required) {
    return null;
  }

  if (raw && /[^0-9]/.test(raw)) {
    return "Telefon numarasi sadece rakamlardan olusmalidir.";
  }

  if (normalized.startsWith("0")) {
    return "Telefon numarasi basinda 0 olmadan 10 haneli olmalidir.";
  }

  if (normalized.length !== 10) {
    return "Telefon numarasi 10 haneli olmalidir.";
  }

  return null;
}

function validatePassword(password = "") {
  if (password.length < 8) {
    return "Sifre en az 8 karakter olmalidir.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Sifre en az bir buyuk harf icermelidir.";
  }

  if (!/[a-z]/.test(password)) {
    return "Sifre en az bir kucuk harf icermelidir.";
  }

  if (!/[0-9]/.test(password)) {
    return "Sifre en az bir rakam icermelidir.";
  }

  if (!/[.!@#$%^&*\-_]/.test(password)) {
    return "Sifre en az bir ozel karakter icermelidir.";
  }

  return null;
}

function validationFailed(res, errors) {
  return res.status(400).json({
    message: "Validation failed",
    errors,
  });
}

function normalizeProfile(body) {
  const countryCode = body.countryCode || "+90";
  const phoneNumber = normalizePhoneNumber(body.phoneNumber || "");

  return {
    firstName: (body.firstName || "").trim(),
    lastName: (body.lastName || "").trim(),
    email: (body.email || "").trim().toLowerCase(),
    countryCode,
    phoneNumber,
    phone: `${countryCode} ${phoneNumber}`.trim(),
    photo: body.photo || "",
  };
}

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a user and return a JWT
 *     tags: [Auth]
 *     security: []
 */
router.post("/auth/register", async (req, res) => {
  try {
    if (User.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const profile = normalizeProfile(req.body);
    const { password } = req.body;

    if (!profile.firstName || !profile.lastName || !profile.email || !password) {
      return validationFailed(res, {
        form: "firstName, lastName, email and password are required",
      });
    }

    const errors = {};
    const phoneError = validatePhoneNumber(profile.phoneNumber, true);
    if (phoneError) {
      errors.phone = phoneError;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      errors.password = passwordError;
    }

    if (Object.keys(errors).length) {
      return validationFailed(res, errors);
    }

    const existing = await User.findOne({ email: profile.email });
    if (existing) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const user = await User.create({
      ...profile,
      passwordHash: hashPassword(password),
    });

    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email/password and return a JWT
 *     tags: [Auth]
 *     security: []
 */
router.post("/auth/login", async (req, res) => {
  try {
    if (User.db.readyState !== 1) {
      return res.status(503).json({ error: "Database is not connected" });
    }

    const email = (req.body.email || "").trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      const errors = {};
      if (!email) errors.email = "Email zorunludur.";
      if (!password) errors.password = "Sifre zorunludur.";
      return validationFailed(res, errors);
    }

    const user = await User.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Get the authenticated user profile
 *     tags: [Auth]
 */
router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, data: req.user.toPublicJSON() });
});

/**
 * @swagger
 * /me:
 *   put:
 *     summary: Update the authenticated user profile
 *     tags: [Auth]
 */
router.put("/me", requireAuth, async (req, res) => {
  try {
    const updates = normalizeProfile({
      ...req.user.toPublicJSON(),
      ...req.body,
    });

    const phoneError = validatePhoneNumber(updates.phoneNumber, false);
    if (phoneError) {
      return validationFailed(res, { phone: phoneError });
    }

    Object.assign(req.user, updates);
    await req.user.save();

    res.json({ success: true, data: req.user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /me/passport:
 *   put:
 *     summary: Update the authenticated user's Career Passport
 *     tags: [Auth]
 */
router.put("/me/passport", requireAuth, async (req, res) => {
  try {
    req.user.passport = {
      ...req.user.passport.toObject?.(),
      ...req.body.passport,
    };
    req.user.passportCompleted = Boolean(req.body.completed);
    await req.user.save();

    res.json({
      success: true,
      data: req.user.toPublicJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
