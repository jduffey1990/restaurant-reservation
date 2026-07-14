
exports.up = function (knex) {
    return knex.schema.alterTable("reservations", (table) => {
        // default 1 keeps pre-existing rows and legacy inserts valid
        table
            .integer("restaurant_id")
            .unsigned()
            .notNullable()
            .defaultTo(1);
        table
            .foreign("restaurant_id")
            .references("restaurant_id")
            .inTable("restaurants")
            .onDelete("cascade");
        // null means "use the restaurant's default duration"
        table.integer("duration_minutes");
        table.string("source").notNullable().defaultTo("staff");
        table.string("email");
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("reservations", (table) => {
        table.dropColumn("restaurant_id");
        table.dropColumn("duration_minutes");
        table.dropColumn("source");
        table.dropColumn("email");
    });
};
