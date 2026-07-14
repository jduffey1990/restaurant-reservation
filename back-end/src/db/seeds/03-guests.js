const reservations = require("./01-reservations.json");

// Derives guest records from the seeded reservations (one per phone number)
// and back-links reservations.guest_id so visit history has demo data.
exports.seed = async function (knex) {
  await knex("notifications").del();
  await knex("reservations").update({ guest_id: null });
  await knex("guests").del();

  const byMobile = new Map();
  for (const reservation of reservations) {
    if (!byMobile.has(reservation.mobile_number)) {
      byMobile.set(reservation.mobile_number, {
        restaurant_id: 1,
        mobile_number: reservation.mobile_number,
        first_name: reservation.first_name,
        last_name: reservation.last_name,
      });
    }
  }

  const guests = await knex("guests")
    .insert([...byMobile.values()])
    .returning("*");

  for (const guest of guests) {
    await knex("reservations")
      .where({ mobile_number: guest.mobile_number })
      .update({ guest_id: guest.guest_id });
  }
};
