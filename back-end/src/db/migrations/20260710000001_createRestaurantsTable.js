
exports.up = function (knex) {
    return knex.schema.createTable("restaurants", (table) => {
        table.increments("restaurant_id").primary();
        table.string("name").notNullable();
        table.string("slug").notNullable().unique();
        table.string("timezone").notNullable().defaultTo("America/New_York");
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("restaurants");
};
