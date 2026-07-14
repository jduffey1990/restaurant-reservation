const service = require("./settings.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

async function read(req, res, next) {
  const data = await service.getSettings(req.user.restaurant_id);
  if (!data) return next({ status: 404, message: "Settings not found" });
  res.json({ data });
}

function hasBodyData(req, _res, next) {
  if (!req.body.data) return next({ status: 400, message: "data" });
  next();
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

function settingsAreValid(req, _res, next) {
  const {
    slot_interval_minutes,
    reservation_duration_minutes,
    max_party_size,
    booking_window_days,
    hours,
  } = req.body.data;

  for (const [field, value] of Object.entries({
    slot_interval_minutes,
    reservation_duration_minutes,
    max_party_size,
    booking_window_days,
  })) {
    if (!Number.isInteger(value) || value <= 0) {
      return next({ status: 400, message: field });
    }
  }

  if (!Array.isArray(hours) || hours.length !== 7) {
    return next({ status: 400, message: "hours must cover all 7 weekdays" });
  }

  for (const day of hours) {
    if (!Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6) {
      return next({ status: 400, message: `weekday: ${day.weekday}` });
    }
    if (day.is_closed) continue;
    if (!TIME_REGEX.test(day.open_time) || !TIME_REGEX.test(day.close_time)) {
      return next({
        status: 400,
        message: `open_time/close_time required for weekday ${day.weekday}`,
      });
    }
    if (day.close_time < day.open_time) {
      return next({
        status: 400,
        message: `close_time is before open_time on weekday ${day.weekday}`,
      });
    }
  }

  next();
}

async function update(req, res) {
  const data = await service.updateSettings(
    req.user.restaurant_id,
    req.body.data
  );
  res.json({ data });
}

module.exports = {
  read: asyncErrorBoundary(read),
  update: [hasBodyData, settingsAreValid, asyncErrorBoundary(update)],
};
