const request = require("supertest");

const app = require("../src/app");
const knex = require("../src/db/connection");

describe("Auth", () => {
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

  describe("POST /auth/login", () => {
    test("returns 200 and the user for valid credentials", async () => {
      const response = await request(app)
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({ data: { email: "owner@demo.test", password: "password" } });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.objectContaining({ email: "owner@demo.test", role: "owner" })
      );
      expect(response.body.data.password_hash).toBeUndefined();
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    test("returns 401 for a wrong password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({ data: { email: "owner@demo.test", password: "nope" } });

      expect(response.status).toBe(401);
    });

    test("returns 401 for an unknown email", async () => {
      const response = await request(app)
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({ data: { email: "ghost@demo.test", password: "password" } });

      expect(response.status).toBe(401);
    });

    test("returns 400 when email or password is missing", async () => {
      const response = await request(app)
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({ data: { email: "owner@demo.test" } });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("password");
    });
  });

  describe("POST /auth/users", () => {
    // NODE_ENV=test injects a fake owner, so these exercise validation only.
    test("creates a staff user with valid data", async () => {
      const response = await request(app)
        .post("/auth/users")
        .set("Accept", "application/json")
        .send({
          data: {
            email: "second@demo.test",
            password: "longenough",
            first_name: "Second",
            last_name: "Staff",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.role).toBe("staff");
      expect(response.body.data.password_hash).toBeUndefined();
    });

    test("rejects a duplicate email", async () => {
      const response = await request(app)
        .post("/auth/users")
        .set("Accept", "application/json")
        .send({
          data: {
            email: "owner@demo.test",
            password: "longenough",
            first_name: "Dup",
            last_name: "User",
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("email");
    });

    test("rejects a short password", async () => {
      const response = await request(app)
        .post("/auth/users")
        .set("Accept", "application/json")
        .send({
          data: {
            email: "short@demo.test",
            password: "short",
            first_name: "Shorty",
            last_name: "Pass",
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("password");
    });
  });
});
