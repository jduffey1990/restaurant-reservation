const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "insecure-development-secret";
const TOKEN_TTL = "12h";

function sign(user) {
  const { user_id, restaurant_id, role } = user;
  return jwt.sign({ user_id, restaurant_id, role }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

function verify(token) {
  return jwt.verify(token, JWT_SECRET);
}

const isProduction = process.env.NODE_ENV === "production";

// Front-end and back-end deploy to different domains, so production cookies
// must be SameSite=None; Secure to survive the cross-site fetch.
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  maxAge: 12 * 60 * 60 * 1000,
};

module.exports = { sign, verify, COOKIE_OPTIONS };
