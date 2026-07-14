const request = require("supertest");

const app = require("../src/app");
const knex = require("../src/db/connection");

function futureReservation(overrides = {}) {
  return {
    first_name: "Gwen",
    last_name: "Guest",
    mobile_number: "555-867-5309",
    reservation_date: "2031-01-03",
    reservation_time: "18:00",
    people: 2,
    ...overrides,
  };
}

describe("Guests and notifications", () => {
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

  test("creating a reservation upserts a guest and writes a confirmation", async () => {
    const createResponse = await request(app)
      .post("/reservations")
      .set("Accept", "application/json")
      .send({ data: futureReservation() });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.guest_id).toBeDefined();

    const guestsResponse = await request(app)
      .get("/guests?mobile_number=8675309")
      .set("Accept", "application/json");
    expect(guestsResponse.status).toBe(200);
    expect(guestsResponse.body.data).toHaveLength(1);
    expect(guestsResponse.body.data[0].first_name).toBe("Gwen");

    const outbox = await request(app)
      .get("/notifications?event_type=booking_confirmed")
      .set("Accept", "application/json");
    expect(outbox.status).toBe(200);
    const confirmation = outbox.body.data.find(
      (notification) => notification.recipient === "555-867-5309"
    );
    expect(confirmation).toBeDefined();
    expect(confirmation.body).toContain("Gwen");
  });

  test("a second reservation with the same phone reuses the guest", async () => {
    const first = await request(app)
      .post("/reservations")
      .set("Accept", "application/json")
      .send({ data: futureReservation() });
    const second = await request(app)
      .post("/reservations")
      .set("Accept", "application/json")
      .send({
        data: futureReservation({
          reservation_date: "2031-01-04",
          first_name: "Gwendolyn",
        }),
      });

    expect(second.status).toBe(201);
    expect(second.body.data.guest_id).toBe(first.body.data.guest_id);

    const guestsResponse = await request(app)
      .get("/guests?mobile_number=8675309")
      .set("Accept", "application/json");
    expect(guestsResponse.body.data).toHaveLength(1);
    // latest name wins
    expect(guestsResponse.body.data[0].first_name).toBe("Gwendolyn");
  });

  test("guest detail includes visit history", async () => {
    const created = await request(app)
      .post("/reservations")
      .set("Accept", "application/json")
      .send({ data: futureReservation() });

    const detail = await request(app)
      .get(`/guests/${created.body.data.guest_id}`)
      .set("Accept", "application/json");

    expect(detail.status).toBe(200);
    expect(detail.body.data.visits).toHaveLength(1);
    expect(detail.body.data.finished_visits).toBe(0);
  });

  test("updating guest notes persists", async () => {
    const created = await request(app)
      .post("/reservations")
      .set("Accept", "application/json")
      .send({ data: futureReservation() });
    const guest_id = created.body.data.guest_id;

    const updated = await request(app)
      .put(`/guests/${guest_id}`)
      .set("Accept", "application/json")
      .send({ data: { notes: "Prefers window seat" } });

    expect(updated.status).toBe(200);
    expect(updated.body.data.notes).toBe("Prefers window seat");
    expect(updated.body.data.first_name).toBe("Gwen");
  });

  test("cancelling a reservation writes a cancellation notice", async () => {
    const created = await request(app)
      .post("/reservations")
      .set("Accept", "application/json")
      .send({ data: futureReservation() });

    const cancelResponse = await request(app)
      .put(`/reservations/${created.body.data.reservation_id}/status`)
      .set("Accept", "application/json")
      .send({ data: { status: "cancelled" } });
    expect(cancelResponse.status).toBe(200);

    const outbox = await request(app)
      .get("/notifications?event_type=booking_cancelled")
      .set("Accept", "application/json");
    const notice = outbox.body.data.find(
      (notification) =>
        notification.reservation_id === created.body.data.reservation_id
    );
    expect(notice).toBeDefined();
    expect(notice.body).toContain("cancelled");
  });
});
