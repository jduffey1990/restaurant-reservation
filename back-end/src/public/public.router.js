const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./public.controller");

router
  .route("/restaurant")
  .get(controller.readRestaurant)
  .all(methodNotAllowed);

router
  .route("/availability")
  .get(controller.listAvailability)
  .all(methodNotAllowed);

router
  .route("/reservations/:reservation_id/cancel")
  .put(controller.cancel)
  .all(methodNotAllowed);

router
  .route("/reservations/:reservation_id")
  .get(controller.readReservation)
  .all(methodNotAllowed);

router
  .route("/reservations")
  .post(controller.create)
  .all(methodNotAllowed);

module.exports = router;
