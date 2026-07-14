const service = require("./public.service");
const settingsService = require("../settings/settings.service");
const availabilityService = require("../availability/availability.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const {
  hasBodyData,
  nameIsValid,
  mobileNumberIsValid,
  dateIsValid,
  timeIsValid,
  peopleIsValid,
  dateIsInTheFuture,
} = require("../reservations/reservations.validators");

// Single-tenant for now; a /book/:slug route param takes over when
// multi-restaurant support lands.
const DEFAULT_RESTAURANT_ID = 1;

async function loadRestaurant(req, res, next) {
  const restaurant = await service.readRestaurant(DEFAULT_RESTAURANT_ID);
  if (!restaurant)
    return next({ status: 404, message: "Restaurant not found" });
  res.locals.restaurant = restaurant;
  next();
}

async function readRestaurant(_req, res) {
  const { restaurant_id, name, slug, timezone } = res.locals.restaurant;
  const settings = await settingsService.getSettings(restaurant_id);
  res.json({
    data: {
      name,
      slug,
      timezone,
      max_party_size: settings ? settings.max_party_size : null,
      booking_window_days: settings ? settings.booking_window_days : null,
      hours: settings ? settings.hours : [],
    },
  });
}

function availabilityQueryIsValid(req, _res, next) {
  const { date, people } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return next({ status: 400, message: "date" });
  }
  const partySize = Number(people);
  if (!Number.isInteger(partySize) || partySize < 1) {
    return next({ status: 400, message: "people" });
  }
  next();
}

async function listAvailability(req, res) {
  const { restaurant_id, timezone } = res.locals.restaurant;
  const data = await availabilityService.listAvailability({
    restaurant_id,
    date: req.query.date,
    partySize: Number(req.query.people),
    timezone,
  });
  res.json({ data });
}

async function create(req, res) {
  const { restaurant_id, timezone } = res.locals.restaurant;
  const {
    first_name,
    last_name,
    mobile_number,
    email,
    reservation_date,
    reservation_time,
    people,
  } = req.body.data;

  const data = await service.createOnlineReservation(
    {
      first_name,
      last_name,
      mobile_number,
      email: email || null,
      reservation_date,
      reservation_time,
      people,
    },
    { restaurant_id, timezone }
  );
  res.status(201).json({ data });
}

// Cheap "auth" for diners: you must know the phone number on the booking.
async function reservationMatchesPhone(req, res, next) {
  const mobile_number =
    req.query.mobile_number ||
    (req.body.data && req.body.data.mobile_number) ||
    "";
  const reservation = await service.readReservation(
    req.params.reservation_id
  );
  const normalize = (value) => String(value).replace(/\D/g, "");
  if (
    !reservation ||
    !mobile_number ||
    normalize(reservation.mobile_number) !== normalize(mobile_number)
  ) {
    return next({
      status: 404,
      message: `Reservation ${req.params.reservation_id} not found`,
    });
  }
  res.locals.reservation = reservation;
  next();
}

async function readReservation(_req, res) {
  res.json({ data: res.locals.reservation });
}

function isCancellable(_req, res, next) {
  if (res.locals.reservation.status !== "booked") {
    return next({
      status: 400,
      message: `A ${res.locals.reservation.status} reservation cannot be cancelled online`,
    });
  }
  next();
}

async function cancel(_req, res) {
  const data = await service.cancelReservation(
    res.locals.reservation,
    res.locals.restaurant.restaurant_id
  );
  res.json({ data });
}

module.exports = {
  readRestaurant: [
    asyncErrorBoundary(loadRestaurant),
    asyncErrorBoundary(readRestaurant),
  ],
  listAvailability: [
    asyncErrorBoundary(loadRestaurant),
    availabilityQueryIsValid,
    asyncErrorBoundary(listAvailability),
  ],
  create: [
    asyncErrorBoundary(loadRestaurant),
    hasBodyData,
    nameIsValid,
    mobileNumberIsValid,
    dateIsValid,
    timeIsValid,
    peopleIsValid,
    dateIsInTheFuture,
    asyncErrorBoundary(create),
  ],
  readReservation: [
    asyncErrorBoundary(reservationMatchesPhone),
    asyncErrorBoundary(readReservation),
  ],
  cancel: [
    asyncErrorBoundary(loadRestaurant),
    asyncErrorBoundary(reservationMatchesPhone),
    isCancellable,
    asyncErrorBoundary(cancel),
  ],
};
