
exports.up = function (knex) {
    return knex.schema.createTable("users", (table) => {
        table.increments("user_id").primary();
        table.integer("restaurant_id").unsigned().notNullable();
        table
            .foreign("restaurant_id")
            .references("restaurant_id")
            .inTable("restaurants")
            .onDelete("cascade");
        table.string("email").notNullable().unique();
        table.string("password_hash").notNullable();
        table.string("first_name").notNullable();
        table.string("last_name").notNullable();
        table.string("role").notNullable().defaultTo("staff");
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("users");
};
