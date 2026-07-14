const { MENU } = require("../../demo/demo.data");

exports.seed = async function (knex) {
  await knex("check_items").del();
  await knex("checks").del();
  await knex("menu_items").del();
  await knex("menu_items").insert(
    MENU.map((item) => ({ ...item, restaurant_id: 1 }))
  );
};
