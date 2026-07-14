
exports.up = function (knex) {
    return knex.schema.alterTable("menu_items", (table) => {
        // Either an absolute http(s) URL or a path served by the front end,
        // e.g. "/images/menu/bruschetta.jpg". Null means "no photo".
        table.string("image_url", 500);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("menu_items", (table) => {
        table.dropColumn("image_url");
    });
};
