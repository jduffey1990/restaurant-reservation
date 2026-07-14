/**
 * Canonical demo fixtures, shared by the knex seeds (`npx knex seed:run`) and
 * by the runtime top-up in demo.service.js. Keeping them in one place stops the
 * two from drifting apart.
 */

// bcrypt hash of "password" — demo credentials, published on the login page.
const DEMO_PASSWORD_HASH =
  "$2b$10$aGqsjRmHFk/SWI6vVBVH.OQ57zj15TuLHLuO9s2EfHOsmjpDb3nn2";

const RESTAURANT = {
  name: "The Periodic Table",
  slug: "periodic-table",
  timezone: "America/New_York",
};

const USERS = [
  {
    email: "owner@demo.test",
    password_hash: DEMO_PASSWORD_HASH,
    first_name: "Olive",
    last_name: "Owner",
    role: "owner",
  },
  {
    email: "staff@demo.test",
    password_hash: DEMO_PASSWORD_HASH,
    first_name: "Sam",
    last_name: "Staff",
    role: "staff",
  },
];

// booking_window_days is deliberately huge: the original bootcamp tests (us-02)
// book dates years out, and the demo should accept them.
const SETTINGS = {
  slot_interval_minutes: 30,
  reservation_duration_minutes: 90,
  max_party_size: 8,
  booking_window_days: 3650,
};

// Reproduces the original hardcoded rules: closed Tuesdays (weekday 2),
// otherwise open 10:30 with last seating 21:30.
const HOURS = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  open_time: weekday === 2 ? null : "10:30",
  close_time: weekday === 2 ? null : "21:30",
  is_closed: weekday === 2,
}));

const TABLES = [
  { table_name: "Bar #1", capacity: 1 },
  { table_name: "Bar #2", capacity: 1 },
  { table_name: "#1", capacity: 6 },
  { table_name: "#2", capacity: 6 },
];

// Photos live in front-end/public/images/menu/ and are all CC0 / public domain
// (see CREDITS.json alongside them). The paths are relative so they resolve
// against whatever origin serves the front end.
const MENU = [
  { name: "Bruschetta", category: "appetizer", price_cents: 950, description: "Grilled bread, tomato, basil", image_url: "/images/menu/bruschetta.jpg" },
  { name: "Crispy Calamari", category: "appetizer", price_cents: 1250, description: "Lemon aioli", image_url: "/images/menu/crispy-calamari.jpg" },
  { name: "French Onion Soup", category: "appetizer", price_cents: 1050, description: "Gruyère crouton", image_url: "/images/menu/french-onion-soup.jpg" },
  { name: "Roast Chicken", category: "entree", price_cents: 2400, description: "Herb jus, root vegetables", image_url: "/images/menu/roast-chicken.jpg" },
  { name: "Grilled Salmon", category: "entree", price_cents: 2800, description: "Beurre blanc, asparagus", image_url: "/images/menu/grilled-salmon.jpg" },
  { name: "Ribeye 12oz", category: "entree", price_cents: 3900, description: "Peppercorn sauce, frites", image_url: "/images/menu/ribeye.jpg" },
  { name: "Mushroom Risotto", category: "entree", price_cents: 2100, description: "Parmesan, truffle oil", image_url: "/images/menu/mushroom-risotto.jpg" },
  { name: "Crème Brûlée", category: "dessert", price_cents: 900, description: "Vanilla bean custard", image_url: "/images/menu/creme-brulee.jpg" },
  { name: "Chocolate Torte", category: "dessert", price_cents: 1050, description: "Raspberry coulis", image_url: "/images/menu/chocolate-torte.jpg" },
  { name: "House Red", category: "drink", price_cents: 1100, description: "Glass", image_url: "/images/menu/house-red.jpg" },
  { name: "House White", category: "drink", price_cents: 1100, description: "Glass", image_url: "/images/menu/house-white.jpg" },
  { name: "Sparkling Water", category: "drink", price_cents: 450, description: "750ml bottle", image_url: "/images/menu/sparkling-water.jpg" },
];

// Name/phone pool the generated reservations draw from. Fixed list (rather than
// random strings) so the same date always produces the same guests, which keeps
// the top-up idempotent and the guest list stable across visits.
const GUEST_POOL = [
  { first_name: "Ada", last_name: "Lovelace", mobile_number: "808-555-0101" },
  { first_name: "Grace", last_name: "Hopper", mobile_number: "808-555-0102" },
  { first_name: "Alan", last_name: "Turing", mobile_number: "808-555-0103" },
  { first_name: "Katherine", last_name: "Johnson", mobile_number: "808-555-0104" },
  { first_name: "Marie", last_name: "Curie", mobile_number: "808-555-0105" },
  { first_name: "Rosalind", last_name: "Franklin", mobile_number: "808-555-0106" },
  { first_name: "Chien-Shiung", last_name: "Wu", mobile_number: "808-555-0107" },
  { first_name: "Percy", last_name: "Julian", mobile_number: "808-555-0108" },
  { first_name: "Barbara", last_name: "McClintock", mobile_number: "808-555-0109" },
  { first_name: "Linus", last_name: "Pauling", mobile_number: "808-555-0110" },
  { first_name: "Dorothy", last_name: "Hodgkin", mobile_number: "808-555-0111" },
  { first_name: "Jonas", last_name: "Salk", mobile_number: "808-555-0112" },
  { first_name: "Mae", last_name: "Jemison", mobile_number: "808-555-0113" },
  { first_name: "Carl", last_name: "Sagan", mobile_number: "808-555-0114" },
  { first_name: "Lise", last_name: "Meitner", mobile_number: "808-555-0115" },
  { first_name: "Emmy", last_name: "Noether", mobile_number: "808-555-0116" },
];

module.exports = {
  DEMO_PASSWORD_HASH,
  RESTAURANT,
  USERS,
  SETTINGS,
  HOURS,
  TABLES,
  MENU,
  GUEST_POOL,
};
