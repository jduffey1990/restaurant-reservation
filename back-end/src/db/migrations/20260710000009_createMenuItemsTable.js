
exports.up = function (knex) {
    return knex.schema.createTable("menu_items", (table) => {
        table.increments("menu_item_id").primary();
        table.integer("restaurant_id").unsigned().notNullable();
        table
            .foreign("restaurant_id")
            .references("restaurant_id")
            .inTable("restaurants")
            .onDelete("cascade");
        table.string("name").notNullable();
        table.text("description");
        table.string("category").notNullable(); // appetizer|entree|dessert|drink
        table.integer("price_cents").unsigned().notNullable();
        table.boolean("is_active").notNullable().defaultTo(true);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("menu_items");
};
