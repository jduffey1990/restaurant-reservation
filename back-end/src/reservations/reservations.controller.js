const service = require("./reservations.service")
const asyncErrorBoundary = require("../errors/asyncErrorBoundary")
/**
 * List handler for reservation resources
 */

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

function read(_req, res, _next) {
  res.json({ data: res.locals.reservation });
}


function dateIsInTheFuture(req, res, next) {
  const { reservation_date, reservation_time } = req.body.data;
  const dateTime = new Date(`${reservation_date}T${reservation_time}`);
  if (dateTime < new Date()) {
    return next({
      status: 400,
      message: "Reservation must be in the future",
    });
  }
  next();
}

function dateIsNotTuesday(req, res, next) {
  const { reservation_date } = req.body.data;
  const day = new Date(reservation_date).getUTCDay();
  if (day === 2)
    return next({
      status: 400,
      message: "We are closed on tuesdays",
    });
  next();
}

function isDuringOpenHours(req, res, next) {
  const { hour, mins } = res.locals;
  if ((hour >= 21 && mins >= 30) || (hour <= 10 && mins <= 30)) {
    return next({
      status: 400,
      message: "Reservation is not during operating hours",
    });
  }
  next();
}

async function create(req, res, _next) {
  res.status(201).json({ data: await service.create(req.body.data) });
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

function validatePhoneNumber(req, res, next) {
  const { mobile_number } = req.query;
  // Make sure mobile_number exists and fits properly
  if (!mobile_number) {
    return next({ status: 400, message: 'Phone number is required' });
  }
  const cleanNumber = mobile_number.replace(/\D/g, '');
  if (!/^\d+$/.test(cleanNumber) || ![7, 10].includes(cleanNumber.length)) {
    console.log("Invalid phone number entered");
    return next({ status: 400, message: 'Invalid phone number. Phone number must contain exactly 7 or 10 digits' });
  }
  res.locals.mobile_number = cleanNumber; // Modified this line
  next();
}

async function list(req, res) {
  // list reservations only on the date passed in the query
  const { date } = req.query;
  if (date) {
    return res.json({ data: await service.listOnDate(date) });
  }
  // list all reservations (no date given)
  data = await service.list();
  return res.json({ data });
}

async function status(req, res) {
  res.locals.reservation.status = req.body.data.status;
  const data = await service.update(res.locals.reservation);
  res.json({ data });
}

async function search(req, res, next) {
  const mobile_number = res.locals.mobile_number; // Modified this line
  const data = await service.search(mobile_number);
  res.json({ data });
}

async function update(req, res, _next) {
  const updatedReservation = req.body.data;

  const data = await service.update(updatedReservation);
  res.json({ data });
}

module.exports = {
  create: [
    dateIsInTheFuture,
    dateIsNotTuesday,
    isDuringOpenHours,
    create
  ],
  list: asyncErrorBoundary(list),
  read: [
    asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(read)
  ],
  status: [
    asyncErrorBoundary(reservationExists),
    isNotFinished,
    newStatusIsValid,
    asyncErrorBoundary(status),
  ],
  search: [
    asyncErrorBoundary(validatePhoneNumber),
    asyncErrorBoundary(search)
  ],
  update: [
    dateIsInTheFuture,
    dateIsNotTuesday,
    isDuringOpenHours,
    asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(update),
  ],
};

