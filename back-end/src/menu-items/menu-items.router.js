const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./menu-items.controller");
const requireRole = require("../auth/requireRole");

router
  .route("/:menu_item_id")
  .put(requireRole("owner"), controller.update)
  .all(methodNotAllowed);

router
  .route("/")
  .get(controller.list)
  .post(requireRole("owner"), controller.create)
  .all(methodNotAllowed);

module.exports = router;
