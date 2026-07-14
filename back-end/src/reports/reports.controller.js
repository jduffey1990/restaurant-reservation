const service = require("./reports.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

async function daily(req, res, next) {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return next({ status: 400, message: "date" });
  }
  const data = await service.daily(req.user.restaurant_id, date);
  res.json({ data });
}

module.exports = {
  daily: asyncErrorBoundary(daily),
};
