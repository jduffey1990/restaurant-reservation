const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./reports.controller");

router.route("/daily").get(controller.daily).all(methodNotAllowed);

module.exports = router;
