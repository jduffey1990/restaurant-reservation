
exports.up = function (knex) {
    return knex.schema.createTable("restaurant_hours", (table) => {
        table.increments("hour_id").primary();
        table.integer("restaurant_id").unsigned().notNullable();
        table
            .foreign("restaurant_id")
            .references("restaurant_id")
            .inTable("restaurants")
            .onDelete("cascade");
        table.integer("weekday").notNullable(); // 0 = Sunday .. 6 = Saturday
        table.time("open_time");
        table.time("close_time"); // last seating time, not door-close
        table.boolean("is_closed").notNullable().defaultTo(false);
        table.unique(["restaurant_id", "weekday"]);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("restaurant_hours");
};
