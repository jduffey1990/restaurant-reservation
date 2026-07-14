/**
 * Field-level reservation validators shared by the staff controller and the
 * public booking controller.
 */

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
    error.message = `first_name`;
    return next(error);
  }
  if (!last_name || !last_name.length) {
    error.message = `last_name`;
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
      message: "mobile_number",
    });
  next();
}

// Validate that reservation date exists and is correctly formatted
function dateIsValid(req, _res, next) {
  const { reservation_date } = req.body.data;
  if (!reservation_date || new Date(reservation_date) == "Invalid Date")
    return next({
      status: 400,
      message: "reservation_date",
    });
  next();
}

// Validate that reservation time exists and is correctly formatted
function timeIsValid(req, res, next) {
  const { reservation_time } = req.body.data;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!reservation_time || !timeRegex.test(reservation_time)) {
    return next({ status: 400, message: "reservation_time" });
  }

  const [hour, mins] = reservation_time.split(":").map(Number);
  res.locals.hour = hour;
  res.locals.mins = mins;
  next();
}

function peopleIsValid(req, _res, next) {
  const { people } = req.body.data;
  if (!people || !Number.isInteger(people) || people <= 0) {
    return next({
      status: 400,
      message: `people`,
    });
  }
  next();
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

module.exports = {
  hasBodyData,
  nameIsValid,
  mobileNumberIsValid,
  dateIsValid,
  timeIsValid,
  peopleIsValid,
  dateIsInTheFuture,
};
