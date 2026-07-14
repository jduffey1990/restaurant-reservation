
exports.up = function (knex) {
    return knex.schema.createTable("guests", (table) => {
        table.increments("guest_id").primary();
        table.integer("restaurant_id").unsigned().notNullable();
        table
            .foreign("restaurant_id")
            .references("restaurant_id")
            .inTable("restaurants")
            .onDelete("cascade");
        table.string("mobile_number").notNullable();
        table.string("first_name");
        table.string("last_name");
        table.string("email");
        table.text("notes");
        table.unique(["restaurant_id", "mobile_number"]);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("guests");
};
