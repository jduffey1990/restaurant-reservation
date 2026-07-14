const knex = require("../db/connection");

/** One day's headline numbers for the dashboard summary strip. */
async function daily(restaurant_id, date) {
  const reservations = await knex("reservations")
    .select("people", "status", "source")
    .where({ reservation_date: date });

  const active = reservations.filter(
    (reservation) => reservation.status !== "cancelled"
  );
  const covers = reservations
    .filter((reservation) =>
      ["seated", "finished"].includes(reservation.status)
    )
    .reduce((sum, reservation) => sum + reservation.people, 0);

  const closedChecks = await knex("checks")
    .where({ restaurant_id, status: "closed" })
    .whereRaw("closed_at::date = ?", date);

  return {
    date,
    reservation_count: active.length,
    online_count: active.filter(
      (reservation) => reservation.source === "online"
    ).length,
    covers,
    checks_closed: closedChecks.length,
    sales_total_cents: closedChecks.reduce(
      (sum, check) => sum + check.total_cents,
      0
    ),
  };
}

module.exports = { daily };
