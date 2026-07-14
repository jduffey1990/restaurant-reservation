const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const errorHandler = require("./errors/errorHandler");
const notFound = require("./errors/notFound");
const authenticate = require("./auth/authenticate");
const authRouter = require("./auth/auth.router");
const publicRouter = require("./public/public.router");
const reservationsRouter = require("./reservations/reservations.router");
const tablesRouter = require("./tables/tables.router")
const settingsRouter = require("./settings/settings.router");
const guestsRouter = require("./guests/guests.router");
const notificationsRouter = require("./notifications/notifications.router");
const menuItemsRouter = require("./menu-items/menu-items.router");
const checksRouter = require("./checks/checks.router");
const reportsRouter = require("./reports/reports.router");
const systemRouter = require('./system.router');

const app = express();

const { FRONTEND_URL } = process.env;
app.use(
  cors({
    origin: FRONTEND_URL ? FRONTEND_URL.split(",") : true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/public", publicRouter);
app.use("/reservations", authenticate, reservationsRouter);
app.use("/tables", authenticate, tablesRouter)
app.use("/settings", authenticate, settingsRouter);
app.use("/guests", authenticate, guestsRouter);
app.use("/notifications", authenticate, notificationsRouter);
app.use("/menu-items", authenticate, menuItemsRouter);
app.use("/checks", authenticate, checksRouter);
app.use("/reports", authenticate, reportsRouter);
app.use('/system', systemRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
