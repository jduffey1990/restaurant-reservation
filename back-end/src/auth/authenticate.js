const { verify } = require("./jwt");

/**
 * Populates req.user from the session cookie, or 401s.
 *
 * Under NODE_ENV=test a fake owner is injected so the original bootcamp
 * test suites (us-01..us-08) can call staff endpoints without a login step.
 */
function authenticate(req, _res, next) {
  if (process.env.NODE_ENV === "test") {
    req.user = { user_id: 0, restaurant_id: 1, role: "owner" };
    return next();
  }

  const token = req.cookies && req.cookies.token;
  if (!token) {
    return next({ status: 401, message: "Authentication required" });
  }

  try {
    req.user = verify(token);
    return next();
  } catch (error) {
    return next({ status: 401, message: "Invalid or expired session" });
  }
}

module.exports = authenticate;
