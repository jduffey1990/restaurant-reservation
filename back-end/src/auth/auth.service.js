const knex = require("../db/connection");

const tableName = "users";

function findByEmail(email) {
  return knex(tableName)
    .select("*")
    .whereRaw("lower(email) = ?", email.toLowerCase())
    .first();
}

function read(user_id) {
  return knex(tableName).select("*").where({ user_id }).first();
}

function create(user) {
  return knex(tableName)
    .insert(user)
    .returning("*")
    .then((createdRecords) => createdRecords[0]);
}

module.exports = {
  findByEmail,
  read,
  create,
};
