const knex = require("../db/connection");

const tableName = "guests";

function search(restaurant_id, mobile_number) {
  let query = knex(tableName)
    .select("*")
    .where({ restaurant_id })
    .orderBy(["last_name", "first_name"]);
  if (mobile_number) {
    query = query.whereRaw(
      "translate(mobile_number, '() -', '') like ?",
      `%${mobile_number.replace(/\D/g, "")}%`
    );
  }
  return query;
}

function read(guest_id) {
  return knex(tableName).select("*").where({ guest_id }).first();
}

function readVisits(guest_id) {
  return knex("reservations")
    .select("*")
    .where({ guest_id })
    .orderBy([
      { column: "reservation_date", order: "desc" },
      { column: "reservation_time", order: "desc" },
    ]);
}

function update(guest) {
  return knex(tableName)
    .where({ guest_id: guest.guest_id })
    .update({
      first_name: guest.first_name,
      last_name: guest.last_name,
      email: guest.email,
      notes: guest.notes,
      updated_at: knex.fn.now(),
    })
    .then(() => read(guest.guest_id));
}

/**
 * Finds-or-creates the guest for a phone number, refreshing name/email with
 * whatever the latest reservation supplied. Runs inside the caller's
 * transaction so a failed reservation insert doesn't strand a guest row.
 */
async function upsertByMobile(trx, { restaurant_id, mobile_number, first_name, last_name, email }) {
  const merge = { first_name, last_name, updated_at: trx.fn.now() };
  if (email) merge.email = email; // never blank out a known email
  const rows = await trx(tableName)
    .insert({ restaurant_id, mobile_number, first_name, last_name, email })
    .onConflict(["restaurant_id", "mobile_number"])
    .merge(merge)
    .returning("*");
  return rows[0];
}

module.exports = {
  search,
  read,
  readVisits,
  update,
  upsertByMobile,
};
