
exports.up = async function (knex) {
    await knex.schema.createTable("checks", (table) => {
        table.increments("check_id").primary();
        table.integer("restaurant_id").unsigned().notNullable();
        table
            .foreign("restaurant_id")
            .references("restaurant_id")
            .inTable("restaurants")
            .onDelete("cascade");
        table.integer("table_id").unsigned().notNullable();
        table
            .foreign("table_id")
            .references("table_id")
            .inTable("tables")
            .onDelete("cascade");
        table.integer("reservation_id").unsigned();
        table
            .foreign("reservation_id")
            .references("reservation_id")
            .inTable("reservations")
            .onDelete("set null");
        table.string("status").notNullable().defaultTo("open"); // open|closed
        // totals are computed and frozen when the check closes
        table.integer("subtotal_cents").notNullable().defaultTo(0);
        table.integer("tax_cents").notNullable().defaultTo(0);
        table.integer("total_cents").notNullable().defaultTo(0);
        table.timestamp("opened_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("closed_at");
        table.timestamps(true, true);
    });

    await knex.schema.createTable("check_items", (table) => {
        table.increments("check_item_id").primary();
        table.integer("check_id").unsigned().notNullable();
        table
            .foreign("check_id")
            .references("check_id")
            .inTable("checks")
            .onDelete("cascade");
        table.integer("menu_item_id").unsigned().notNullable();
        table
            .foreign("menu_item_id")
            .references("menu_item_id")
            .inTable("menu_items")
            .onDelete("cascade");
        table.integer("quantity").unsigned().notNullable().defaultTo(1);
        // price snapshot at the moment the item was added
        table.integer("price_cents").unsigned().notNullable();
        table.timestamps(true, true);
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTable("check_items");
    await knex.schema.dropTable("checks");
};
