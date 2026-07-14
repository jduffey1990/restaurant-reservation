
exports.up = function (knex) {
    return knex.schema.createTable("restaurant_settings", (table) => {
        table.increments("setting_id").primary();
        table.integer("restaurant_id").unsigned().notNullable().unique();
        table
            .foreign("restaurant_id")
            .references("restaurant_id")
            .inTable("restaurants")
            .onDelete("cascade");
        table.integer("slot_interval_minutes").notNullable().defaultTo(30);
        table.integer("reservation_duration_minutes").notNullable().defaultTo(90);
        table.integer("max_party_size").notNullable().defaultTo(8);
        table.integer("booking_window_days").notNullable().defaultTo(60);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("restaurant_settings");
};
