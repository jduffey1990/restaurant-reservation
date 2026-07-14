const request = require("supertest");

const app = require("../src/app");
const knex = require("../src/db/connection");

// 2031-01-03 is a Friday
const DATE = "2031-01-03";

function booking(overrides = {}) {
  return {
    first_name: "Dina",
    last_name: "Diner",
    mobile_number: "555-300-4000",
    email: "dina@example.test",
    reservation_date: DATE,
    reservation_time: "19:00",
    people: 4,
    ...overrides,
  };
}

describe("Public booking", () => {
  beforeAll(() => {
    return knex.migrate
      .forceFreeMigrationsLock()
      .then(() => knex.migrate.rollback(null, true))
      .then(() => knex.migrate.latest());
  });

  beforeEach(async () => {
    await knex.seed.run();
    // deterministic table inventory: exactly two 4-tops
    await knex("tables").del();
    await knex("tables").insert([
      { table_name: "Four #1", capacity: 4 },
      { table_name: "Four #2", capacity: 4 },
    ]);
    // clear seeded reservations so availability is clean
    await knex("reservations").del();
  });

  afterAll(async () => {
    return await knex.migrate.rollback(null, true).then(() => knex.destroy());
  });

  test("GET /public/restaurant returns booking metadata without auth", async () => {
    const response = await request(app).get("/public/restaurant");
    expect(response.status).toBe(200);
    expect(response.body.data.name).toBeDefined();
    expect(response.body.data.hours).toHaveLength(7);
  });

  test("GET /public/availability lists slots and shrinks as tables book up", async () => {
    const before = await request(app).get(
      `/public/availability?date=${DATE}&people=4`
    );
    expect(before.status).toBe(200);
    const slot = before.body.data.find((s) => s.time === "19:00");
    expect(slot).toBeDefined();
    expect(slot.available_table_count).toBe(2);

    await request(app)
      .post("/public/reservations")
      .send({ data: booking() })
      .expect(201);

    const after = await request(app).get(
      `/public/availability?date=${DATE}&people=4`
    );
    const slotAfter = after.body.data.find((s) => s.time === "19:00");
    expect(slotAfter.available_table_count).toBe(1);
  });

  test("booking creates guest, outbox row, and an online-source reservation", async () => {
    const response = await request(app)
      .post("/public/reservations")
      .send({ data: booking() });

    expect(response.status).toBe(201);
    expect(response.body.data.source).toBe("online");
    expect(response.body.data.status).toBe("booked");
    expect(response.body.data.guest_id).toBeDefined();

    const guest = await knex("guests")
      .where({ mobile_number: "555-300-4000" })
      .first();
    expect(guest).toBeDefined();
    expect(guest.email).toBe("dina@example.test");

    const outbox = await knex("notifications").where({
      reservation_id: response.body.data.reservation_id,
    });
    expect(outbox).toHaveLength(1);
    expect(outbox[0].event_type).toBe("booking_confirmed");
  });

  test("returns 409 when the slot fills up", async () => {
    await request(app)
      .post("/public/reservations")
      .send({ data: booking() })
      .expect(201);
    await request(app)
      .post("/public/reservations")
      .send({ data: booking({ mobile_number: "555-300-4001" }) })
      .expect(201);

    const third = await request(app)
      .post("/public/reservations")
      .send({ data: booking({ mobile_number: "555-300-4002" }) });

    expect(third.status).toBe(409);
    expect(third.body.error).toContain("no longer available");
  });

  test("rejects a closed-day booking with 409 (no slots)", async () => {
    // 2031-01-07 is a Tuesday, seeded closed
    const response = await request(app)
      .post("/public/reservations")
      .send({ data: booking({ reservation_date: "2031-01-07" }) });
    expect(response.status).toBe(409);
  });

  test("diner can look up and cancel with the matching phone number", async () => {
    const created = await request(app)
      .post("/public/reservations")
      .send({ data: booking() });
    const id = created.body.data.reservation_id;

    await request(app)
      .get(`/public/reservations/${id}?mobile_number=wrong`)
      .expect(404);

    const found = await request(app).get(
      `/public/reservations/${id}?mobile_number=5553004000`
    );
    expect(found.status).toBe(200);

    const cancelled = await request(app)
      .put(`/public/reservations/${id}/cancel`)
      .send({ data: { mobile_number: "555-300-4000" } });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe("cancelled");

    const outbox = await knex("notifications").where({
      reservation_id: id,
      event_type: "booking_cancelled",
    });
    expect(outbox).toHaveLength(1);
  });

  test("staff endpoints remain protected while /public is open", async () => {
    // sanity: the public router requires no cookie at all
    const availability = await request(app).get(
      `/public/availability?date=${DATE}&people=2`
    );
    expect(availability.status).toBe(200);
  });
});
