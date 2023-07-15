const knex = require("../db/connection")

function list() {
  return knex("reservations").select("*").orderBy("reservation_time", "asc");;
}

function listOnDate(reservation_date) {
  return knex("reservations")
    .select("*")
    .where({ reservation_date })
    .orderBy("reservation_time", "asc");
}

function create(reservation) {
  return knex("reservations")
    .insert(reservation)
    .returning("*")
    .then((createdReservation) => createdReservation[0]);
}

function read(reservation_id) {
  return knex("reservations")
    .select("*")
    .where({ reservation_id: reservation_id })
    .first();
}

function search(mobile_number) {
  return knex("reservations")
    .select("*")
    .whereRaw(
      "translate(mobile_number, '() -', '') like ?",
      `%${mobile_number.replace(/\D/g, "")}%`
    )
    .orderBy("reservation_date");
}

function update(reservation) {
  return knex("reservations")
    .select("*")
    .where({ reservation_id: reservation.reservation_id })
    .update(reservation)
    .then(() => read(reservation.reservation_id));
}

module.exports = {
  list,
  listOnDate,
  create,
  read,
  search,
  update,
}