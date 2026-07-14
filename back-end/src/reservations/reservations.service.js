const knex = require("../db/connection");
const guestsService = require("../guests/guests.service");
const notificationsService = require("../notifications/notifications.service");

const tableName = "reservations";

function list() {
  return knex(tableName).select("*").orderBy("reservation_time", "asc");
}

function listOnDate(reservation_date) {
  return knex(tableName)
    .select("*")
    .where({ reservation_date })
    .whereNotIn("status", ["finished", "cancelled"])
    .orderBy("reservation_time", "asc");
}

function listForNumber(mobile_number) {
  return knex(tableName)
    .whereRaw(
      "translate(mobile_number, '() -', '') like ?",
      `%${mobile_number.replace(/\D/g, "")}%`
    )
    .orderBy("reservation_date");
}

// Creating a reservation also maintains the guest record for the phone
// number and drops a confirmation into the simulated notifications outbox,
// all in one transaction.
function create(reservation, restaurant_id = 1) {
  return knex.transaction(async (trx) => {
    const guest = await guestsService.upsertByMobile(trx, {
      restaurant_id,
      mobile_number: reservation.mobile_number,
      first_name: reservation.first_name,
      last_name: reservation.last_name,
    });

    const created = await trx(tableName)
      .insert({ ...reservation, restaurant_id, guest_id: guest.guest_id })
      .returning("*")
      .then((createdRecords) => createdRecords[0]);

    await notificationsService.enqueue(trx, {
      restaurant_id,
      event_type: "booking_confirmed",
      reservation: created,
      guest,
    });

    return created;
  });
}

function read(reservation_id) {
  return knex(tableName)
    .select("*")
    .where({ reservation_id: reservation_id })
    .first();
}

function update(reservation) {
  return knex(tableName)
    .select("*")
    .where({ reservation_id: reservation.reservation_id })
    .update(reservation)
    .then(() => read(reservation.reservation_id));
}

module.exports = {
  create,
  list,
  listOnDate,
  listForNumber,
  read,
  update,
};