const knex = require("../db/connection");

const tableName = "notifications";

function list(restaurant_id, event_type) {
  let query = knex(tableName)
    .select("*")
    .where({ restaurant_id })
    .orderBy("sent_at", "desc")
    .limit(100);
  if (event_type) query = query.andWhere({ event_type });
  return query;
}

function formatDate(reservation_date) {
  // dates arrive as Date objects from pg or "YYYY-MM-DD" strings from input
  if (reservation_date instanceof Date) {
    return reservation_date.toISOString().slice(0, 10);
  }
  return String(reservation_date).slice(0, 10);
}

function formatTime(reservation_time) {
  return String(reservation_time).slice(0, 5);
}

const TEMPLATES = {
  booking_confirmed: (reservation) => ({
    subject: "Your reservation is confirmed",
    body: `Hi ${reservation.first_name}, your table for ${
      reservation.people
    } on ${formatDate(reservation.reservation_date)} at ${formatTime(
      reservation.reservation_time
    )} is confirmed. See you soon!`,
  }),
  booking_cancelled: (reservation) => ({
    subject: "Your reservation has been cancelled",
    body: `Hi ${reservation.first_name}, your reservation for ${
      reservation.people
    } on ${formatDate(reservation.reservation_date)} at ${formatTime(
      reservation.reservation_time
    )} has been cancelled. We hope to see you another time.`,
  }),
};

/**
 * Writes a simulated SMS to the outbox. `db` may be the shared knex instance
 * or an in-flight transaction.
 */
function enqueue(db, { restaurant_id, event_type, reservation, guest }) {
  const template = TEMPLATES[event_type];
  if (!template) throw new Error(`Unknown notification event: ${event_type}`);
  const { subject, body } = template(reservation);
  return db(tableName).insert({
    restaurant_id,
    reservation_id: reservation.reservation_id || null,
    guest_id: (guest && guest.guest_id) || reservation.guest_id || null,
    channel: "sms",
    recipient: reservation.mobile_number,
    subject,
    body,
    event_type,
  });
}

module.exports = {
  list,
  enqueue,
};
