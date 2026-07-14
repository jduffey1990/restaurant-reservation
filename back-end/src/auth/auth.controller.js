const bcrypt = require("bcryptjs");
const service = require("./auth.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const { sign, COOKIE_OPTIONS } = require("./jwt");

function sanitize(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

function hasBodyData(req, _res, next) {
  if (!req.body.data) return next({ status: 400, message: "data" });
  next();
}

function hasCredentials(req, _res, next) {
  const { email, password } = req.body.data;
  if (!email || !email.length) return next({ status: 400, message: "email" });
  if (!password || !password.length)
    return next({ status: 400, message: "password" });
  next();
}

async function credentialsAreValid(req, res, next) {
  const { email, password } = req.body.data;
  const user = await service.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return next({ status: 401, message: "Invalid email or password" });
  }
  res.locals.user = user;
  next();
}

async function login(_req, res) {
  const user = res.locals.user;
  res.cookie("token", sign(user), COOKIE_OPTIONS);
  res.json({ data: sanitize(user) });
}

async function logout(_req, res) {
  res.clearCookie("token", { ...COOKIE_OPTIONS, maxAge: undefined });
  res.status(200).json({ data: {} });
}

async function me(req, res, next) {
  // Test-env fake user (user_id 0) has no DB row to hydrate.
  if (!req.user.user_id) return res.json({ data: req.user });
  const user = await service.read(req.user.user_id);
  if (!user) return next({ status: 401, message: "Unknown user" });
  res.json({ data: sanitize(user) });
}

function newUserIsValid(req, _res, next) {
  const { email, password, first_name, last_name, role } = req.body.data;
  for (const [field, value] of Object.entries({
    email,
    password,
    first_name,
    last_name,
  })) {
    if (!value || !value.length) return next({ status: 400, message: field });
  }
  if (password.length < 8)
    return next({
      status: 400,
      message: "password must be at least 8 characters",
    });
  if (role && !["owner", "staff"].includes(role))
    return next({ status: 400, message: `role: ${role}` });
  next();
}

async function emailIsAvailable(req, _res, next) {
  const existing = await service.findByEmail(req.body.data.email);
  if (existing)
    return next({ status: 400, message: "email is already in use" });
  next();
}

async function createUser(req, res) {
  const { email, password, first_name, last_name, role } = req.body.data;
  const user = await service.create({
    restaurant_id: req.user.restaurant_id,
    email: email.toLowerCase(),
    password_hash: await bcrypt.hash(password, 10),
    first_name,
    last_name,
    role: role || "staff",
  });
  res.status(201).json({ data: sanitize(user) });
}

module.exports = {
  login: [
    hasBodyData,
    hasCredentials,
    asyncErrorBoundary(credentialsAreValid),
    asyncErrorBoundary(login),
  ],
  logout,
  me: asyncErrorBoundary(me),
  createUser: [
    hasBodyData,
    newUserIsValid,
    asyncErrorBoundary(emailIsAvailable),
    asyncErrorBoundary(createUser),
  ],
};
