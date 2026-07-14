const request = require("supertest");

const app = require("../src/app");
const knex = require("../src/db/connection");

describe("Fake POS checks", () => {
  beforeAll(() => {
    return knex.migrate
      .forceFreeMigrationsLock()
      .then(() => knex.migrate.rollback(null, true))
      .then(() => knex.migrate.latest());
  });

  beforeEach(() => {
    return knex.seed.run();
  });

  afterAll(async () => {
    return await knex.migrate.rollback(null, true).then(() => knex.destroy());
  });

  async function seatFirstBooked() {
    const reservation = await knex("reservations")
      .where({ status: "booked" })
      .orderBy(["reservation_date", "reservation_time"])
      .first();
    const table = await knex("tables")
      .whereNull("reservation_id")
      .where("capacity", ">=", reservation.people)
      .first();

    const response = await request(app)
      .put(`/tables/${table.table_id}/seat`)
      .set("Accept", "application/json")
      .send({ data: { reservation_id: reservation.reservation_id } });
    expect(response.status).toBe(200);
    return { reservation, table };
  }

  test("seating a reservation opens a check for the table", async () => {
    const { reservation, table } = await seatFirstBooked();

    const check = await knex("checks")
      .where({ table_id: table.table_id, status: "open" })
      .first();
    expect(check).toBeDefined();
    expect(check.reservation_id).toBe(reservation.reservation_id);
  });

  test("items can be added with price snapshots and totals computed on close", async () => {
    const { reservation, table } = await seatFirstBooked();
    const check = await knex("checks")
      .where({ table_id: table.table_id, status: "open" })
      .first();
    const menuItem = await knex("menu_items").where({ name: "Roast Chicken" }).first();

    const addResponse = await request(app)
      .post(`/checks/${check.check_id}/items`)
      .set("Accept", "application/json")
      .send({ data: { menu_item_id: menuItem.menu_item_id, quantity: 2 } });
    expect(addResponse.status).toBe(201);
    expect(addResponse.body.data.items).toHaveLength(1);
    expect(addResponse.body.data.items[0].price_cents).toBe(2400);

    const closeResponse = await request(app)
      .put(`/checks/${check.check_id}/close`)
      .set("Accept", "application/json");
    expect(closeResponse.status).toBe(200);
    expect(closeResponse.body.data.subtotal_cents).toBe(4800);
    expect(closeResponse.body.data.tax_cents).toBe(Math.round(4800 * 0.08));
    expect(closeResponse.body.data.total_cents).toBe(
      4800 + Math.round(4800 * 0.08)
    );

    // closing the check finished the reservation and freed the table
    const finishedReservation = await knex("reservations")
      .where({ reservation_id: reservation.reservation_id })
      .first();
    expect(finishedReservation.status).toBe("finished");
    const freedTable = await knex("tables")
      .where({ table_id: table.table_id })
      .first();
    expect(freedTable.reservation_id).toBeNull();
  });

  test("cannot add items to a closed check", async () => {
    const { table } = await seatFirstBooked();
    const check = await knex("checks")
      .where({ table_id: table.table_id, status: "open" })
      .first();
    await request(app).put(`/checks/${check.check_id}/close`).expect(200);

    const menuItem = await knex("menu_items").first();
    const response = await request(app)
      .post(`/checks/${check.check_id}/items`)
      .set("Accept", "application/json")
      .send({ data: { menu_item_id: menuItem.menu_item_id } });
    expect(response.status).toBe(400);
    expect(response.body.error).toContain("closed");
  });

  test("the legacy finish flow (DELETE /tables/:id/seat) closes the open check", async () => {
    const { table } = await seatFirstBooked();

    const response = await request(app)
      .delete(`/tables/${table.table_id}/seat`)
      .set("Accept", "application/json");
    expect(response.status).toBe(200);

    const check = await knex("checks")
      .where({ table_id: table.table_id })
      .orderBy("check_id", "desc")
      .first();
    expect(check.status).toBe("closed");
  });

  test("daily report aggregates covers and sales", async () => {
    const { reservation, table } = await seatFirstBooked();
    const check = await knex("checks")
      .where({ table_id: table.table_id, status: "open" })
      .first();
    const menuItem = await knex("menu_items").where({ name: "House Red" }).first();
    await request(app)
      .post(`/checks/${check.check_id}/items`)
      .send({ data: { menu_item_id: menuItem.menu_item_id, quantity: 4 } })
      .expect(201);
    await request(app).put(`/checks/${check.check_id}/close`).expect(200);

    const date = new Date(reservation.reservation_date)
      .toISOString()
      .slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const report = await request(app)
      .get(`/reports/daily?date=${date}`)
      .set("Accept", "application/json");
    expect(report.status).toBe(200);
    expect(report.body.data.covers).toBeGreaterThanOrEqual(
      reservation.people
    );

    // sales land on the close date (today), not the reservation date
    const todayReport = await request(app)
      .get(`/reports/daily?date=${today}`)
      .set("Accept", "application/json");
    const subtotal = 1100 * 4;
    expect(todayReport.body.data.sales_total_cents).toBe(
      subtotal + Math.round(subtotal * 0.08)
    );
    expect(todayReport.body.data.checks_closed).toBe(1);
  });

  test("menu items CRUD works and soft-deletes via is_active", async () => {
    const created = await request(app)
      .post("/menu-items")
      .set("Accept", "application/json")
      .send({
        data: { name: "Special", category: "entree", price_cents: 1500 },
      });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/menu-items/${created.body.data.menu_item_id}`)
      .set("Accept", "application/json")
      .send({
        data: {
          name: "Special",
          category: "entree",
          price_cents: 1500,
          is_active: false,
        },
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.is_active).toBe(false);

    const active = await request(app).get("/menu-items");
    expect(
      active.body.data.find((item) => item.name === "Special")
    ).toBeUndefined();
  });
});
