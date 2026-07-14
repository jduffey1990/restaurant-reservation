require('dotenv').config();
const path = require("path");

const { DATABASE_URL, DATABASE_URL_TEST, DEBUG } = process.env;

function makeConfig(connectionString) {
  return {
    client: "pg",
    connection: {
      connectionString,
      ssl: { require: true, rejectUnauthorized: false },
    },
    pool: { min: 1, max: 5 },
    migrations: {
      directory: path.join(__dirname, "src", "db", "migrations"),
    },
    seeds: {
      directory: path.join(__dirname, "src", "db", "seeds"),
    },
    debug: !!DEBUG,
  };
}

module.exports = {
  development: makeConfig(DATABASE_URL),
  test: makeConfig(DATABASE_URL_TEST || DATABASE_URL),
  production: makeConfig(DATABASE_URL),
};