const service = require("./guests.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

async function list(req, res) {
  const data = await service.search(
    req.user.restaurant_id,
    req.query.mobile_number
  );
  res.json({ data });
}

async function guestExists(req, res, next) {
  const guest = await service.read(req.params.guest_id);
  if (guest && guest.restaurant_id === req.user.restaurant_id) {
    res.locals.guest = guest;
    return next();
  }
  next({ status: 404, message: `Guest ${req.params.guest_id} not found` });
}

async function read(_req, res) {
  const visits = await service.readVisits(res.locals.guest.guest_id);
  const finishedVisits = visits.filter(
    (reservation) => reservation.status === "finished"
  ).length;
  res.json({
    data: { ...res.locals.guest, visits, finished_visits: finishedVisits },
  });
}

function hasBodyData(req, _res, next) {
  if (!req.body.data) return next({ status: 400, message: "data" });
  next();
}

async function update(req, res) {
  const { first_name, last_name, email, notes } = req.body.data;
  const data = await service.update({
    guest_id: res.locals.guest.guest_id,
    first_name:
      first_name !== undefined ? first_name : res.locals.guest.first_name,
    last_name:
      last_name !== undefined ? last_name : res.locals.guest.last_name,
    email: email !== undefined ? email : res.locals.guest.email,
    notes: notes !== undefined ? notes : res.locals.guest.notes,
  });
  res.json({ data });
}

module.exports = {
  list: asyncErrorBoundary(list),
  read: [asyncErrorBoundary(guestExists), asyncErrorBoundary(read)],
  update: [
    hasBodyData,
    asyncErrorBoundary(guestExists),
    asyncErrorBoundary(update),
  ],
};
