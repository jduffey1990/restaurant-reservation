const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./checks.controller");

router
  .route("/:check_id/items/:check_item_id")
  .delete(controller.removeItem)
  .all(methodNotAllowed);

router
  .route("/:check_id/items")
  .post(controller.addItem)
  .all(methodNotAllowed);

router
  .route("/:check_id/close")
  .put(controller.close)
  .all(methodNotAllowed);

router.route("/:check_id").get(controller.read).all(methodNotAllowed);

router.route("/").get(controller.list).all(methodNotAllowed);

module.exports = router;
