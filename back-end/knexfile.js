require('dotenv').config();
const path = require("path");

const { DATABASE_URL, DEBUG } = process.env;

const config = {
  client: "pg",
  connection: {
    connectionString: DATABASE_URL,
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

module.exports = {
  development: config,
  production: config,
};