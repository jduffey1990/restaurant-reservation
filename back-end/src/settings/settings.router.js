const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./settings.controller");
const requireRole = require("../auth/requireRole");

router
  .route("/")
  .get(controller.read)
  .put(requireRole("owner"), controller.update)
  .all(methodNotAllowed);

module.exports = router;
