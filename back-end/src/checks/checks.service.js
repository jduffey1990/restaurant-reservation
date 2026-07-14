const knex = require("../db/connection");

// Flat demo tax; a real system would make this a restaurant setting.
const TAX_RATE = 0.08;

function list(restaurant_id, { status } = {}) {
  let query = knex("checks")
    .select("*")
    .where({ restaurant_id })
    .orderBy("opened_at", "desc");
  if (status) query = query.andWhere({ status });
  return query;
}

function read(check_id) {
  return knex("checks").select("*").where({ check_id }).first();
}

function readItems(check_id) {
  return knex("check_items")
    .join("menu_items", "check_items.menu_item_id", "menu_items.menu_item_id")
    .select(
      "check_items.check_item_id",
      "check_items.menu_item_id",
      "check_items.quantity",
      "check_items.price_cents",
      "menu_items.name",
      "menu_items.category"
    )
    .where({ check_id })
    .orderBy("check_items.check_item_id");
}

function readOpenForTable(table_id, db = knex) {
  return db("checks")
    .select("*")
    .where({ table_id, status: "open" })
    .orderBy("opened_at", "desc")
    .first();
}

/** Opens a check when a party is seated; runs inside the seat transaction. */
function openForTable(trx, { restaurant_id, table_id, reservation_id }) {
  return trx("checks")
    .insert({ restaurant_id, table_id, reservation_id })
    .returning("*")
    .then((records) => records[0]);
}

function addItem(check_id, menuItem, quantity) {
  return knex("check_items")
    .insert({
      check_id,
      menu_item_id: menuItem.menu_item_id,
      quantity,
      price_cents: menuItem.price_cents, // snapshot; menu edits don't rewrite history
    })
    .returning("*")
    .then((records) => records[0]);
}

function removeItem(check_item_id) {
  return knex("check_items").where({ check_item_id }).del();
}

/** Totals + closes a check inside an existing transaction. */
async function closeInTransaction(trx, check) {
  const items = await trx("check_items").where({ check_id: check.check_id });
  const subtotal = items.reduce(
    (sum, item) => sum + item.price_cents * item.quantity,
    0
  );
  const tax = Math.round(subtotal * TAX_RATE);

  return trx("checks")
    .where({ check_id: check.check_id })
    .update({
      status: "closed",
      subtotal_cents: subtotal,
      tax_cents: tax,
      total_cents: subtotal + tax,
      closed_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    })
    .returning("*")
    .then((records) => records[0]);
}

/**
 * Closing a check IS the finish flow: totals freeze, the reservation is
 * finished, and the table frees — atomically.
 */
function close(check) {
  return knex.transaction(async (trx) => {
    const closed = await closeInTransaction(trx, check);

    if (check.reservation_id) {
      await trx("reservations")
        .where({ reservation_id: check.reservation_id })
        .update({ status: "finished", updated_at: trx.fn.now() });
      await trx("tables")
        .where({
          table_id: check.table_id,
          reservation_id: check.reservation_id,
        })
        .update({ reservation_id: null, updated_at: trx.fn.now() });
    }

    return closed;
  });
}

module.exports = {
  list,
  read,
  readItems,
  readOpenForTable,
  openForTable,
  addItem,
  removeItem,
  closeInTransaction,
  close,
};
