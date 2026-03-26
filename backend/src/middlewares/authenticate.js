const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Missing or invalid Authorization header",
      errors: [],
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      errors: [],
    });
  }
}

module.exports = { authenticate };
