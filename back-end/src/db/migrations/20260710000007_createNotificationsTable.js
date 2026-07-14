
exports.up = function (knex) {
    return knex.schema.createTable("notifications", (table) => {
        table.increments("notification_id").primary();
        table.integer("restaurant_id").unsigned().notNullable();
        table
            .foreign("restaurant_id")
            .references("restaurant_id")
            .inTable("restaurants")
            .onDelete("cascade");
        table.integer("reservation_id").unsigned();
        table
            .foreign("reservation_id")
            .references("reservation_id")
            .inTable("reservations")
            .onDelete("set null");
        table.integer("guest_id").unsigned();
        table
            .foreign("guest_id")
            .references("guest_id")
            .inTable("guests")
            .onDelete("set null");
        table.string("channel").notNullable().defaultTo("sms");
        table.string("recipient").notNullable();
        table.string("subject").notNullable();
        table.text("body").notNullable();
        table.string("event_type").notNullable();
        // Simulated outbox: rows are "sent" the moment they are written.
        table.string("status").notNullable().defaultTo("sent");
        table.timestamp("sent_at").notNullable().defaultTo(knex.fn.now());
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("notifications");
};
