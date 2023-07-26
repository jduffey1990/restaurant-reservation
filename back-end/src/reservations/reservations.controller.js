const service = require("./reservations.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

// checks if body contains data
function hasBodyData(req, _res, next) {
  const { data } = req.body;
  if (!data)
    next({
      status: 400,
    });
  next();
}

// Validate name exists and is not empty
function nameIsValid(req, _res, next) {
  const { first_name, last_name } = req.body.data;
  const error = { status: 400 };
  if (!first_name || !first_name.length) {
    error.message = `First Name Required`;
    return next(error);
  }
  if (!last_name || !last_name.length) {
    error.message = `Last Name Required`;
    return next(error);
  }

  next();
}

// Validate mobile number exists
function mobileNumberIsValid(req, _res, next) {
  const { mobile_number } = req.body.data;
  if (!mobile_number)
    return next({
      status: 400,
      message: "Please enter phone number",
    });
  next();
}

// Validate that reservation date exists and is correctly formatted
function dateIsValid(req, _res, next) {
  const { reservation_date } = req.body.data;
  if (!reservation_date || new Date(reservation_date) == "Invalid Date")
    return next({
      status: 400,
      message: "reservation date",
    });
  next();
}

// Validate that reservation time exists and is correctly formatted
function timeIsValid(req, res, next) {
  let { reservation_time } = req.body.data;

  const error = {
    status: 400,
    message: "check time",
  };
  if (!reservation_time) return next(error);
  if (reservation_time[2] === ":") {
    // remove colon
    reservation_time = reservation_time.replace(":", "");
    // remove only store hours minutes
    reservation_time = reservation_time.substring(0, 4);
  }
  res.locals.hour = reservation_time.substring(0, 2)
  res.locals.mins = reservation_time.substring(2, 4)
  if (Number.isInteger(Number(reservation_time))) {
    next()
  } else {
    next(error);
  }
}

function peopleIsValid(req, _res, next) {
  const { people } = req.body.data;
  if (!people || !Number.isInteger(people) || people <= 0) {
    return next({
      status: 400,
      message: `Party number entry invalid`,
    });
  }
  next();

}

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

function dateIsInTheFuture(req, _res, next) {
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

function dateIsNotTuesday(req, _res, next) {
  const { reservation_date } = req.body.data;
  const day = new Date(reservation_date).getUTCDay();
  if (day === 2)
    return next({
      status: 400,
      message: "Restaurant is closed on Tuesdays",
    });
  next();
}

function isDuringOpenHours(_req, res, next) {
  const { hour, mins } = res.locals;
  if (hour >= 22 || (hour <= 10 && mins <= 30)) {
    return next({
      status: 400,
      message: "We are not open at that time",
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
  const { date } = req.query;
  if (date) {
    return res.json({ data: await service.listOnDate(date) });
  }
  const { mobile_number } = req.query;
  if (mobile_number && !isNaN(mobile_number)) {
    return res.json({ data: await service.listForNumber(mobile_number) });
  }
  // return error message when mobile_number is not a number
  return res.json({ error: "Invalid phone number" });
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
  const data = await service.create(req.body.data);
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
  res.locals.reservation.status = req.body.data.status;
  const data = await service.update(res.locals.reservation);
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
    dateIsNotTuesday,
    isDuringOpenHours,
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
    dateIsNotTuesday,
    isDuringOpenHours,
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

