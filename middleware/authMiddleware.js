const User = require("../models/User");
const { verifyToken } = require("../services/authService");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

module.exports = requireAuth;
