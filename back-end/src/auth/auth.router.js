const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./auth.controller");
const authenticate = require("./authenticate");
const requireRole = require("./requireRole");

router.route("/login").post(controller.login).all(methodNotAllowed);

router.route("/logout").post(controller.logout).all(methodNotAllowed);

router.route("/me").get(authenticate, controller.me).all(methodNotAllowed);

router
  .route("/users")
  .post(authenticate, requireRole("owner"), controller.createUser)
  .all(methodNotAllowed);

module.exports = router;
