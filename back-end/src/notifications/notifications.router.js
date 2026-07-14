const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./notifications.controller");

router.route("/").get(controller.list).all(methodNotAllowed);

module.exports = router;
