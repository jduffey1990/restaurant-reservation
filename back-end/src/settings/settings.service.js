const knex = require("../db/connection");

/**
 * Returns the restaurant's scheduling settings plus its weekly hours:
 * { slot_interval_minutes, reservation_duration_minutes, max_party_size,
 *   booking_window_days, hours: [{ weekday, open_time, close_time, is_closed }] }
 */
async function getSettings(restaurant_id) {
  const settings = await knex("restaurant_settings")
    .select("*")
    .where({ restaurant_id })
    .first();

  const hours = await knex("restaurant_hours")
    .select("weekday", "open_time", "close_time", "is_closed")
    .where({ restaurant_id })
    .orderBy("weekday");

  return settings ? { ...settings, hours } : null;
}

function updateSettings(restaurant_id, { hours, ...settings }) {
  return knex.transaction(async (trx) => {
    await trx("restaurant_settings")
      .where({ restaurant_id })
      .update({
        slot_interval_minutes: settings.slot_interval_minutes,
        reservation_duration_minutes: settings.reservation_duration_minutes,
        max_party_size: settings.max_party_size,
        booking_window_days: settings.booking_window_days,
        updated_at: trx.fn.now(),
      });

    for (const day of hours) {
      await trx("restaurant_hours")
        .where({ restaurant_id, weekday: day.weekday })
        .update({
          open_time: day.is_closed ? null : day.open_time,
          close_time: day.is_closed ? null : day.close_time,
          is_closed: day.is_closed,
          updated_at: trx.fn.now(),
        });
    }
  }).then(() => getSettings(restaurant_id));
}

module.exports = {
  getSettings,
  updateSettings,
};
