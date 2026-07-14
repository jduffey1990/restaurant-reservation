const knex = require("../db/connection");
const settingsService = require("../settings/settings.service");

// Diners shouldn't be able to book a slot starting in the next few minutes.
const ONLINE_LEAD_MINUTES = 30;

// "18:30" or "18:30:00" -> minutes since midnight
function timeToMinutes(time) {
  const [hour, mins] = String(time).split(":").map(Number);
  return hour * 60 + mins;
}

function minutesToTime(minutes) {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hour}:${mins}`;
}

function toDateString(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function daysBetween(fromDate, toDate) {
  return Math.round(
    (new Date(`${toDate}T00:00:00Z`) - new Date(`${fromDate}T00:00:00Z`)) /
      86400000
  );
}

/**
 * Seats parties at tables greedily: largest party first, each taking the
 * smallest free table that fits. Returns the remaining table pool, or null
 * if some party cannot be seated. Greedy best-fit is not provably optimal
 * matching, so it may occasionally under-offer a slot — but it never
 * over-offers, which is the safe direction for double-booking.
 */
function seatParties(partySizes, tablePool) {
  const pool = [...tablePool].sort((a, b) => a.capacity - b.capacity);
  const parties = [...partySizes].sort((a, b) => b - a);
  for (const party of parties) {
    const index = pool.findIndex((table) => table.capacity >= party);
    if (index === -1) return null;
    pool.splice(index, 1);
  }
  return pool;
}

/**
 * Pure availability engine — no I/O, fully unit-testable.
 *
 * @param date        "YYYY-MM-DD" being requested
 * @param partySize   number of diners
 * @param settings    output of settingsService.getSettings (includes hours)
 * @param tables      [{ table_id, capacity }]
 * @param reservations existing reservations on `date` (any status; filtered here)
 * @param now         { date: "YYYY-MM-DD", minutes } current time, or null to
 *                    skip lead-time trimming (staff/testing use)
 * @returns [{ time: "17:30", minutes, available_table_count }]
 */
function computeAvailableSlots({
  date,
  partySize,
  settings,
  tables,
  reservations,
  now,
}) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const day = settings.hours.find((hour) => hour.weekday === weekday);
  if (!day || day.is_closed) return [];
  if (partySize > settings.max_party_size || partySize < 1) return [];

  if (now) {
    const daysAhead = daysBetween(now.date, date);
    if (daysAhead < 0 || daysAhead > settings.booking_window_days) return [];
  }

  const open = timeToMinutes(day.open_time);
  const close = timeToMinutes(day.close_time); // last seating
  const duration = settings.reservation_duration_minutes;

  const occupied = reservations
    .filter((reservation) =>
      ["booked", "seated"].includes(reservation.status)
    )
    .map((reservation) => {
      const start = timeToMinutes(reservation.reservation_time);
      return {
        start,
        end: start + (reservation.duration_minutes || duration),
        people: reservation.people,
      };
    });

  const slots = [];
  for (let slot = open; slot <= close; slot += settings.slot_interval_minutes) {
    if (now && date === now.date && slot < now.minutes + ONLINE_LEAD_MINUTES) {
      continue;
    }

    const slotEnd = slot + duration;
    const overlapping = occupied.filter(
      (busy) => busy.start < slotEnd && busy.end > slot
    );

    const remaining = seatParties(
      overlapping.map((busy) => busy.people),
      tables
    );
    if (!remaining) continue; // existing parties already exhaust the room

    const fitting = remaining.filter((table) => table.capacity >= partySize);
    if (fitting.length === 0) continue;

    slots.push({
      time: minutesToTime(slot),
      minutes: slot,
      available_table_count: fitting.length,
    });
  }

  return slots;
}

/** Current wall-clock date/minutes in the restaurant's timezone. */
function nowInTimeZone(timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

/**
 * Loads everything the engine needs and runs it. `db` may be the shared knex
 * instance or an open transaction (the booking path re-checks inside one).
 */
async function listAvailability(
  { restaurant_id, date, partySize, timezone },
  db = knex
) {
  const settings = await settingsService.getSettings(restaurant_id);
  if (!settings) return [];
  const tables = await db("tables").select("table_id", "capacity");
  const reservations = await db("reservations")
    .select("reservation_time", "duration_minutes", "people", "status")
    .where({ reservation_date: date });

  return computeAvailableSlots({
    date,
    partySize,
    settings,
    tables,
    reservations,
    now: nowInTimeZone(timezone),
  });
}

module.exports = {
  computeAvailableSlots,
  listAvailability,
  nowInTimeZone,
  timeToMinutes,
  minutesToTime,
  toDateString,
};
