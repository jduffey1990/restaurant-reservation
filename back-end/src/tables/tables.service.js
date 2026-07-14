const knex = require("../db/connection");
const checksService = require("../checks/checks.service");


function list() {
  // open_check_id lets the dashboard link an occupied table to its check
  return knex("tables")
    .select("tables.*", "checks.check_id as open_check_id")
    .leftJoin("checks", function () {
      this.on("checks.table_id", "tables.table_id").andOnVal(
        "checks.status",
        "open"
      );
    })
    .orderBy("table_name");
}

function create(table) {
  return knex("tables")
    .insert(table, "*")
    .then((createdRecords) => createdRecords[0]);
}

function read(table_id) {
  return knex("tables").where({ table_id: table_id }).first();
}

function seat(table_id, reservation_id) {
  return knex.transaction(async (transaction) => {
    const reservation = await knex("reservations")
      .where({ reservation_id })
      .update({ status: "seated" }, "*")
      .transacting(transaction)
      .then((records) => records[0]);

    // seating a party opens their (fake POS) check
    await checksService.openForTable(transaction, {
      restaurant_id: (reservation && reservation.restaurant_id) || 1,
      table_id,
      reservation_id,
    });

    return knex("tables")
      .where({ table_id })
      .update({ reservation_id }, "*")
      .transacting(transaction)
      .then((records) => records[0]);
  })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

function finish(table) {
  return knex.transaction(async (transaction) => {
    await knex("reservations")
      .where({ reservation_id: table.reservation_id })
      .update({ status: "finished" })
      .transacting(transaction);

    // the legacy Finish button also settles any open check (possibly empty)
    const openCheck = await checksService.readOpenForTable(
      table.table_id,
      transaction
    );
    if (openCheck) {
      await checksService.closeInTransaction(transaction, openCheck);
    }

    return knex("tables")
      .where({ table_id: table.table_id })
      .update({ reservation_id: null }, "*")
      .transacting(transaction)
      .then((records) => records[0]);
  });
}


module.exports = {
  list,
  create,
  read,
  seat,
  finish
};