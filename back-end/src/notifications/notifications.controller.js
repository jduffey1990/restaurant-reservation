const service = require("./notifications.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

async function list(req, res) {
  const data = await service.list(
    req.user.restaurant_id,
    req.query.event_type
  );
  res.json({ data });
}

module.exports = {
  list: asyncErrorBoundary(list),
};
