const service = require("./reservations.service");
const settingsService = require("../settings/settings.service");
const notificationsService = require("../notifications/notifications.service");
const knex = require("../db/connection");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const {
  hasBodyData,
  nameIsValid,
  mobileNumberIsValid,
  dateIsValid,
  timeIsValid,
  peopleIsValid,
  dateIsInTheFuture,
} = require("./reservations.validators");

async function reservationExists(req, res, next) {
  const reservation = await service.read(req.params.reservation_id);
  if (reservation) {
    res.locals.reservation = reservation;
    return next();
  }
  next({
    status: 404,
    message: `${req.params.reservation_id}`,
  });
}

// "10:30:00" or "10:30" -> minutes since midnight
function timeToMinutes(time) {
  const [hour, mins] = time.split(":").map(Number);
  return hour * 60 + mins;
}

// Replaces the old hardcoded closed-Tuesday / 10:30-21:30 rules with the
// restaurant's own configured hours, party-size cap, and booking window.
async function validateAgainstSettings(req, res, next) {
  const { reservation_date, people } = req.body.data;
  const restaurant_id = (req.user && req.user.restaurant_id) || 1;
  const settings = await settingsService.getSettings(restaurant_id);
  if (!settings) return next();
  res.locals.settings = settings;

  const weekday = new Date(reservation_date).getUTCDay();
  const day = settings.hours.find((hour) => hour.weekday === weekday);
  if (!day || day.is_closed) {
    return next({
      status: 400,
      message: "Restaurant is closed on that day",
    });
  }

  const timeAsMinutes = res.locals.hour * 60 + res.locals.mins;
  if (
    timeAsMinutes < timeToMinutes(day.open_time) ||
    timeAsMinutes > timeToMinutes(day.close_time)
  ) {
    return next({ status: 400, message: "We are not open at that time" });
  }

  if (people > settings.max_party_size) {
    return next({
      status: 400,
      message: `people exceeds the maximum party size of ${settings.max_party_size}`,
    });
  }

  const lastBookableDay = new Date();
  lastBookableDay.setDate(
    lastBookableDay.getDate() + settings.booking_window_days
  );
  if (new Date(`${reservation_date}T23:59:59`) > lastBookableDay) {
    return next({
      status: 400,
      message: `Reservations can only be made up to ${settings.booking_window_days} days in advance`,
    });
  }

  next();
}

function newStatusIsValid(req, res, next) {
  const { status } = req.body.data;
  if (
    (status && status === "booked") ||
    status === "seated" ||
    status === "finished" ||
    status === "cancelled"
  )
    return next();
  next({
    status: 400,
    message: status,
  });
}

function isNotFinished(_req, res, next) {
  if (res.locals.reservation.status === "finished")
    return next({
      status: 400,
      message: "finished",
    });
  next();
}



// list reservations
async function list(req, res, _next) {
  const { date, mobile_number } = req.query;
  let data;
  if (date) {
    data = await service.listOnDate(date);
  } else if (mobile_number) {
    data = await service.listForNumber(mobile_number);
  } else {
    data = await service.list();
  }
  res.status(200).json({ data });
}

async function create(req, res, next) {
  const reservation = req.body.data;
  const { status } = reservation;

  if (status && (status === "seated" || status === "finished")) {
    return next({
      status: 400,
      message: status,
    });
  }
  reservation.status = "booked";
  const restaurant_id = (req.user && req.user.restaurant_id) || 1;
  const data = await service.create(req.body.data, restaurant_id);
  if (data) return res.status(201).json({ data });
  next({
    status: 500,
    message: "Failed to create reservation",
  });
}

async function read(_req, res, _next) {
  res.json({ data: res.locals.reservation });
}

async function update(req, res, _next) {
  const updatedReservation = req.body.data;

  const data = await service.update(updatedReservation);
  res.json({ data });
}

async function status(req, res, _next) {
  const newStatus = req.body.data.status;
  res.locals.reservation.status = newStatus;
  const restaurant_id = (req.user && req.user.restaurant_id) || 1;
  const data = await service.update(res.locals.reservation);
  if (newStatus === "cancelled") {
    await notificationsService.enqueue(knex, {
      restaurant_id,
      event_type: "booking_cancelled",
      reservation: data,
    });
  }
  res.json({ data });
}

module.exports = {
  create: [
    hasBodyData,
    nameIsValid,
    mobileNumberIsValid,
    dateIsValid,
    timeIsValid,
    peopleIsValid,
    dateIsInTheFuture,
    asyncErrorBoundary(validateAgainstSettings),
    asyncErrorBoundary(create),
  ],
  list: asyncErrorBoundary(list),
  read: [asyncErrorBoundary(reservationExists), read],
  update: [
    hasBodyData,
    nameIsValid,
    mobileNumberIsValid,
    dateIsValid,
    timeIsValid,
    peopleIsValid,
    dateIsInTheFuture,
    asyncErrorBoundary(validateAgainstSettings),
    asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(update),
  ],
  status: [
    hasBodyData,
    asyncErrorBoundary(reservationExists),
    isNotFinished,
    newStatusIsValid,
    asyncErrorBoundary(status),
  ],
};

