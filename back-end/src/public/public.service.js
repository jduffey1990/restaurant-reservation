const knex = require("../db/connection");
const guestsService = require("../guests/guests.service");
const notificationsService = require("../notifications/notifications.service");
const availabilityService = require("../availability/availability.service");

function readRestaurant(restaurant_id) {
  return knex("restaurants").select("*").where({ restaurant_id }).first();
}

function readReservation(reservation_id) {
  return knex("reservations").select("*").where({ reservation_id }).first();
}

/**
 * Books an online reservation. The advisory lock serializes bookings per
 * restaurant-day so the availability re-check inside the transaction cannot
 * race a concurrent request into a double-booking; if the requested slot is
 * gone by the time we hold the lock, this throws a 409.
 */
function createOnlineReservation(reservation, { restaurant_id, timezone }) {
  return knex.transaction(async (trx) => {
    await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [
      `booking:${restaurant_id}:${reservation.reservation_date}`,
    ]);

    const slots = await availabilityService.listAvailability(
      {
        restaurant_id,
        date: reservation.reservation_date,
        partySize: reservation.people,
        timezone,
      },
      trx
    );

    const requested = availabilityService.timeToMinutes(
      reservation.reservation_time
    );
    if (!slots.some((slot) => slot.minutes === requested)) {
      throw {
        status: 409,
        message:
          "That time is no longer available — please pick another slot.",
      };
    }

    const guest = await guestsService.upsertByMobile(trx, {
      restaurant_id,
      mobile_number: reservation.mobile_number,
      first_name: reservation.first_name,
      last_name: reservation.last_name,
      email: reservation.email,
    });

    const created = await trx("reservations")
      .insert({
        ...reservation,
        restaurant_id,
        guest_id: guest.guest_id,
        status: "booked",
        source: "online",
      })
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

function cancelReservation(reservation, restaurant_id) {
  return knex.transaction(async (trx) => {
    const cancelled = await trx("reservations")
      .where({ reservation_id: reservation.reservation_id })
      .update({ status: "cancelled", updated_at: trx.fn.now() })
      .returning("*")
      .then((records) => records[0]);

    await notificationsService.enqueue(trx, {
      restaurant_id,
      event_type: "booking_cancelled",
      reservation: cancelled,
    });

    return cancelled;
  });
}

module.exports = {
  readRestaurant,
  readReservation,
  createOnlineReservation,
  cancelReservation,
};
