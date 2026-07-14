const { RESTAURANT, USERS, SETTINGS, HOURS } = require("../../demo/demo.data");

exports.seed = async function (knex) {
  await knex.raw("TRUNCATE TABLE restaurants RESTART IDENTITY CASCADE");

  await knex("restaurants").insert([RESTAURANT]);

  await knex("users").insert(
    USERS.map((user) => ({ ...user, restaurant_id: 1 }))
  );

  await knex("restaurant_settings").insert([
    { ...SETTINGS, restaurant_id: 1 },
  ]);

  await knex("restaurant_hours").insert(
    HOURS.map((hours) => ({ ...hours, restaurant_id: 1 }))
  );
};
