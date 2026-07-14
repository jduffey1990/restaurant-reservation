const request = require("supertest");

const app = require("../src/app");
const knex = require("../src/db/connection");

function defaultHours(overrides = {}) {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    open_time: weekday === 2 ? null : "10:30",
    close_time: weekday === 2 ? null : "21:30",
    is_closed: weekday === 2,
    ...(overrides[weekday] || {}),
  }));
}

describe("Restaurant settings", () => {
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

  describe("GET /settings", () => {
    test("returns the seeded settings with 7 hour rows", async () => {
      const response = await request(app)
        .get("/settings")
        .set("Accept", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          slot_interval_minutes: 30,
          reservation_duration_minutes: 90,
          max_party_size: 8,
        })
      );
      expect(response.body.data.hours).toHaveLength(7);
      expect(response.body.data.hours[2].is_closed).toBe(true);
    });
  });

  describe("PUT /settings", () => {
    test("updates numeric settings and hours", async () => {
      const response = await request(app)
        .put("/settings")
        .set("Accept", "application/json")
        .send({
          data: {
            slot_interval_minutes: 15,
            reservation_duration_minutes: 60,
            max_party_size: 10,
            booking_window_days: 30,
            hours: defaultHours({
              1: { open_time: null, close_time: null, is_closed: true },
            }),
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.slot_interval_minutes).toBe(15);
      expect(response.body.data.hours[1].is_closed).toBe(true);
    });

    test("rejects invalid numeric settings", async () => {
      const response = await request(app)
        .put("/settings")
        .set("Accept", "application/json")
        .send({
          data: {
            slot_interval_minutes: 0,
            reservation_duration_minutes: 60,
            max_party_size: 10,
            booking_window_days: 30,
            hours: defaultHours(),
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("slot_interval_minutes");
    });

    test("rejects incomplete hours", async () => {
      const response = await request(app)
        .put("/settings")
        .set("Accept", "application/json")
        .send({
          data: {
            slot_interval_minutes: 30,
            reservation_duration_minutes: 90,
            max_party_size: 8,
            booking_window_days: 60,
            hours: defaultHours().slice(0, 5),
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe("reservation validation reads settings", () => {
    test("rejects a reservation on a newly closed weekday", async () => {
      // 2031-01-06 is a Monday
      await request(app)
        .put("/settings")
        .set("Accept", "application/json")
        .send({
          data: {
            slot_interval_minutes: 30,
            reservation_duration_minutes: 90,
            max_party_size: 8,
            booking_window_days: 3650,
            hours: defaultHours({
              1: { open_time: null, close_time: null, is_closed: true },
            }),
          },
        });

      const response = await request(app)
        .post("/reservations")
        .set("Accept", "application/json")
        .send({
          data: {
            first_name: "Closed",
            last_name: "Monday",
            mobile_number: "555-1212",
            reservation_date: "2031-01-06",
            reservation_time: "17:30",
            people: 2,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("closed");
    });

    test("rejects a party larger than max_party_size", async () => {
      const response = await request(app)
        .post("/reservations")
        .set("Accept", "application/json")
        .send({
          data: {
            first_name: "Big",
            last_name: "Party",
            mobile_number: "555-1212",
            reservation_date: "2031-01-03",
            reservation_time: "17:30",
            people: 9,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("people");
    });

    test("rejects a date beyond the booking window", async () => {
      await request(app)
        .put("/settings")
        .set("Accept", "application/json")
        .send({
          data: {
            slot_interval_minutes: 30,
            reservation_duration_minutes: 90,
            max_party_size: 8,
            booking_window_days: 7,
            hours: defaultHours(),
          },
        });

      const response = await request(app)
        .post("/reservations")
        .set("Accept", "application/json")
        .send({
          data: {
            first_name: "Too",
            last_name: "Far",
            mobile_number: "555-1212",
            reservation_date: "2031-01-03",
            reservation_time: "17:30",
            people: 2,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("days in advance");
    });
  });
});
