const knex = require("../db/connection");

const tableName = "menu_items";

function list(restaurant_id, includeInactive = false) {
  let query = knex(tableName)
    .select("*")
    .where({ restaurant_id })
    .orderBy(["category", "name"]);
  if (!includeInactive) query = query.andWhere({ is_active: true });
  return query;
}

function read(menu_item_id) {
  return knex(tableName).select("*").where({ menu_item_id }).first();
}

function create(menuItem) {
  return knex(tableName)
    .insert(menuItem)
    .returning("*")
    .then((createdRecords) => createdRecords[0]);
}

function update(menu_item_id, changes) {
  return knex(tableName)
    .where({ menu_item_id })
    .update({ ...changes, updated_at: knex.fn.now() })
    .returning("*")
    .then((records) => records[0]);
}

module.exports = {
  list,
  read,
  create,
  update,
};
