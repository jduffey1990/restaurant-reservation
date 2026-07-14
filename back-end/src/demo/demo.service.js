const knex = require("../db/connection");
const {
  RESTAURANT,
  USERS,
  SETTINGS,
  HOURS,
  TABLES,
  MENU,
  GUEST_POOL,
} = require("./demo.data");

/**
 * Keeps the public demo looking alive.
 *
 * A visitor arriving from GitHub should never land on an empty dashboard, so on
 * each ping we make sure the rolling window around "today" has reservations in
 * it. This is a TOP-UP, not a reseed: it only ever INSERTs what is missing and
 * never deletes, so a visitor poking at the data (cancelling a reservation,
 * seating a table) never has the rug pulled out from under them mid-session.
 * Cancelled reservations are not counted, so the day refills itself over time.
 */

const RESTAURANT_ID = 1;
const PAST_DAYS = 5; // gives the reports/history views something to show
const FUTURE_DAYS = 12; // gives the "upcoming" views something to show
const RESERVATIONS_PER_DAY = 6;
const MAX_SEATED_TODAY = 2;

// Any process running this holds a transaction-scoped Postgres advisory lock, so
// two visitors landing at the same instant cannot both insert the same day.
// It must be the *xact* variant: DATABASE_URL points at Neon's pooled endpoint,
// and session-scoped locks do not survive transaction pooling.
const ADVISORY_LOCK_KEY = 8148150000123;

// Re-checking on literally every ping would mean a query per page load. One
// check per interval per process is plenty for a demo.
const CHECK_INTERVAL_MS = 60_000;
let lastCheckedAt = 0;

/* ---------------------------------------------------------------- date utils */

// "Today" has to be the restaurant's today, not the server's — a Vercel box in
// UTC would otherwise roll the dashboard over to tomorrow at 8pm New York time.
function todayInTimezone(timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // en-CA formats as YYYY-MM-DD
}

function addDays(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function weekdayOf(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = Sunday
}

/* --------------------------------------------------------------------- random */

// Seeded PRNG (mulberry32 over an FNV-1a hash). Deterministic per date, so the
// same day always yields the same guests and times: a top-up run tomorrow will
// not reshuffle the reservations already sitting on the dashboard today.
function makeRandom(seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return function random() {
    hash += 0x6d2b79f5;
    let t = hash;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ bootstrap */

// Brings an empty database (fresh clone, fresh Neon branch) up to a usable demo.
// Every step is existence-checked, so this is a no-op on an already-seeded DB.
async function ensureBaseData(trx) {
  const restaurant = await trx("restaurants")
    .where({ restaurant_id: RESTAURANT_ID })
    .first();
  if (!restaurant) {
    await trx("restaurants").insert([RESTAURANT]);
  }

  const userCount = await trx("users").where({ restaurant_id: RESTAURANT_ID });
  if (!userCount.length) {
    await trx("users").insert(
      USERS.map((user) => ({ ...user, restaurant_id: RESTAURANT_ID }))
    );
  }

  const settings = await trx("restaurant_settings")
    .where({ restaurant_id: RESTAURANT_ID })
    .first();
  if (!settings) {
    await trx("restaurant_settings").insert([
      { ...SETTINGS, restaurant_id: RESTAURANT_ID },
    ]);
  }

  const hours = await trx("restaurant_hours").where({
    restaurant_id: RESTAURANT_ID,
  });
  if (!hours.length) {
    await trx("restaurant_hours").insert(
      HOURS.map((entry) => ({ ...entry, restaurant_id: RESTAURANT_ID }))
    );
  }

  const tables = await trx("tables");
  if (!tables.length) {
    await trx("tables").insert(TABLES);
  }

  const menuItems = await trx("menu_items").where({
    restaurant_id: RESTAURANT_ID,
  });
  if (!menuItems.length) {
    await trx("menu_items").insert(
      MENU.map((item) => ({ ...item, restaurant_id: RESTAURANT_ID }))
    );
    return;
  }

  // A database seeded before image_url existed has the demo items but no photos.
  // Backfill by name, and only where the photo is still missing, so an owner who
  // has set their own image never has it overwritten.
  const needsPhoto = new Set(
    menuItems
      .filter((item) => !item.image_url)
      .map((item) => item.name)
  );
  for (const item of MENU) {
    if (!item.image_url || !needsPhoto.has(item.name)) continue;
    await trx("menu_items")
      .where({ restaurant_id: RESTAURANT_ID, name: item.name })
      .whereNull("image_url")
      .update({ image_url: item.image_url });
  }
}

/* --------------------------------------------------------------------- guests */

// Guests are unique on (restaurant_id, mobile_number). We hold the advisory
// lock, so a plain select-then-insert is safe here without an upsert.
async function ensureGuests(trx, people) {
  // A regular turns up on several days, so `people` repeats phone numbers.
  // Collapse them first: duplicates *within* one INSERT violate the unique
  // constraint just as surely as duplicates against existing rows.
  const wanted = new Map();
  for (const person of people) {
    if (!wanted.has(person.mobile_number)) {
      wanted.set(person.mobile_number, person);
    }
  }

  const existing = await trx("guests")
    .where({ restaurant_id: RESTAURANT_ID })
    .whereIn("mobile_number", [...wanted.keys()]);

  const byNumber = new Map(
    existing.map((guest) => [guest.mobile_number, guest.guest_id])
  );

  const missing = [...wanted.values()].filter(
    (person) => !byNumber.has(person.mobile_number)
  );
  if (missing.length) {
    const inserted = await trx("guests")
      .insert(
        missing.map((person) => ({ ...person, restaurant_id: RESTAURANT_ID }))
      )
      .returning("*");
    for (const guest of inserted) {
      byNumber.set(guest.mobile_number, guest.guest_id);
    }
  }

  return byNumber;
}

/* --------------------------------------------------------------- reservations */

function buildReservationsForDate(date, count, openTime, closeTime, slotMinutes) {
  const random = makeRandom(date);
  const firstSlot = toMinutes(openTime);
  const lastSlot = toMinutes(closeTime);

  // Candidate slots across the service, shuffled deterministically so the day
  // does not fill up strictly front-to-back.
  const slots = [];
  for (let minute = firstSlot; minute <= lastSlot; minute += slotMinutes) {
    slots.push(minute);
  }
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  const guests = [...GUEST_POOL];
  for (let i = guests.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [guests[i], guests[j]] = [guests[j], guests[i]];
  }

  return slots.slice(0, count).map((minute, index) => {
    const guest = guests[index % guests.length];
    return {
      ...guest,
      reservation_date: date,
      reservation_time: toTime(minute),
      people: 2 + Math.floor(random() * 5), // 2–6, within max_party_size
      source: "demo",
    };
  });
}

async function topUpReservations(trx, today) {
  const settings = await trx("restaurant_settings")
    .where({ restaurant_id: RESTAURANT_ID })
    .first();
  const hours = await trx("restaurant_hours").where({
    restaurant_id: RESTAURANT_ID,
  });
  const hoursByWeekday = new Map(hours.map((row) => [row.weekday, row]));

  const start = addDays(today, -PAST_DAYS);
  const end = addDays(today, FUTURE_DAYS);

  // Count per day in SQL and cast the date to text: node-postgres hands back a
  // JS Date for `date` columns, which would drift across timezones if we tried
  // to bucket them in JS. Cancelled rows are excluded so the demo refills after
  // a visitor cancels things.
  const { rows: counts } = await trx.raw(
    `SELECT to_char(reservation_date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
       FROM reservations
      WHERE restaurant_id = ?
        AND status <> 'cancelled'
        AND reservation_date BETWEEN ?::date AND ?::date
      GROUP BY 1`,
    [RESTAURANT_ID, start, end]
  );
  const existingByDate = new Map(counts.map((row) => [row.date, row.count]));

  const pending = [];
  for (let offset = -PAST_DAYS; offset <= FUTURE_DAYS; offset++) {
    const date = addDays(today, offset);
    const dayHours = hoursByWeekday.get(weekdayOf(date));

    // Never book a closed day (Tuesdays, by default) — it would contradict the
    // booking rules the app itself enforces.
    if (!dayHours || dayHours.is_closed) continue;

    const missing = RESERVATIONS_PER_DAY - (existingByDate.get(date) || 0);
    if (missing <= 0) continue;

    pending.push(
      ...buildReservationsForDate(
        date,
        missing,
        dayHours.open_time,
        dayHours.close_time,
        settings.slot_interval_minutes
      ).map((reservation) => ({
        ...reservation,
        status: date < today ? "finished" : "booked",
      }))
    );
  }

  if (!pending.length) return 0;

  const guestIds = await ensureGuests(
    trx,
    pending.map(({ first_name, last_name, mobile_number }) => ({
      first_name,
      last_name,
      mobile_number,
    }))
  );

  await trx("reservations").insert(
    pending.map((reservation) => ({
      ...reservation,
      restaurant_id: RESTAURANT_ID,
      guest_id: guestIds.get(reservation.mobile_number) || null,
    }))
  );

  return pending.length;
}

// A dashboard where every table is empty looks broken. Seat a couple of today's
// bookings at free tables so the seating flow has something to show.
async function seatSomeTables(trx, today) {
  const freeTables = await trx("tables")
    .whereNull("reservation_id")
    .orderBy("capacity", "desc");
  if (!freeTables.length) return 0;

  const occupied = await trx("tables").whereNotNull("reservation_id");
  const alreadySeated = occupied.length;
  if (alreadySeated >= MAX_SEATED_TODAY) return 0;

  const candidates = await trx("reservations")
    .where({ restaurant_id: RESTAURANT_ID, status: "booked" })
    .andWhereRaw("reservation_date = ?::date", [today])
    .orderBy("reservation_time");

  let seated = 0;
  for (const reservation of candidates) {
    if (alreadySeated + seated >= MAX_SEATED_TODAY) break;
    const table = freeTables.find(
      (candidate) => candidate.capacity >= reservation.people
    );
    if (!table) continue;

    await trx("tables")
      .where({ table_id: table.table_id })
      .update({ reservation_id: reservation.reservation_id });
    await trx("reservations")
      .where({ reservation_id: reservation.reservation_id })
      .update({ status: "seated" });

    freeTables.splice(freeTables.indexOf(table), 1);
    seated++;
  }
  return seated;
}

/* -------------------------------------------------------------------- entry pt */

async function ensureDemoData({ force = false } = {}) {
  // The bootcamp test suite seeds its own fixtures and asserts on exact counts;
  // topping up underneath it would break those assertions.
  if (process.env.NODE_ENV === "test") return null;
  if (process.env.DEMO_AUTOSEED === "false") return null;

  const now = Date.now();
  if (!force && now - lastCheckedAt < CHECK_INTERVAL_MS) return null;
  lastCheckedAt = now;

  try {
    return await knex.transaction(async (trx) => {
      const { rows } = await trx.raw("SELECT pg_try_advisory_xact_lock(?) AS locked", [
        ADVISORY_LOCK_KEY,
      ]);
      // Another instance is already topping up. Its work covers this request.
      if (!rows[0].locked) return null;

      await ensureBaseData(trx);

      const restaurant = await trx("restaurants")
        .where({ restaurant_id: RESTAURANT_ID })
        .first();
      const today = todayInTimezone(restaurant.timezone || "America/New_York");

      const created = await topUpReservations(trx, today);
      const seated = await seatSomeTables(trx, today);

      if (created || seated) {
        console.log(
          `[demo] topped up ${created} reservation(s), seated ${seated} table(s) for ${today}`
        );
      }
      return { today, created, seated };
    });
  } catch (error) {
    // The demo top-up must never take the site down. Log and serve the request.
    console.error("[demo] top-up failed:", error.message);
    lastCheckedAt = 0; // allow an immediate retry on the next ping
    return null;
  }
}

module.exports = { ensureDemoData };
