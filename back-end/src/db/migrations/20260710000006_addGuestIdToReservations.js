
exports.up = function (knex) {
    return knex.schema.alterTable("reservations", (table) => {
        table.integer("guest_id").unsigned();
        table
            .foreign("guest_id")
            .references("guest_id")
            .inTable("guests")
            .onDelete("set null");
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("reservations", (table) => {
        table.dropColumn("guest_id");
    });
};
