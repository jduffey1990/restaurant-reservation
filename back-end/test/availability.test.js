/**
 * Pure unit tests for the availability engine — no database required.
 */
const {
  computeAvailableSlots,
} = require("../src/availability/availability.service");

const BASE_SETTINGS = {
  slot_interval_minutes: 30,
  reservation_duration_minutes: 90,
  max_party_size: 8,
  booking_window_days: 60,
  hours: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    open_time: weekday === 2 ? null : "17:00",
    close_time: weekday === 2 ? null : "21:00",
    is_closed: weekday === 2,
  })),
};

// 2031-01-03 is a Friday; 2031-01-07 is a Tuesday
const FRIDAY = "2031-01-03";
const TUESDAY = "2031-01-07";

function compute(overrides = {}) {
  return computeAvailableSlots({
    date: FRIDAY,
    partySize: 2,
    settings: BASE_SETTINGS,
    tables: [
      { table_id: 1, capacity: 2 },
      { table_id: 2, capacity: 4 },
    ],
    reservations: [],
    now: { date: "2031-01-01", minutes: 12 * 60 },
    ...overrides,
  });
}

describe("computeAvailableSlots", () => {
  test("generates slots from open through last seating on the interval", () => {
    const slots = compute();
    expect(slots.map((slot) => slot.time)).toEqual([
      "17:00",
      "17:30",
      "18:00",
      "18:30",
      "19:00",
      "19:30",
      "20:00",
      "20:30",
      "21:00",
    ]);
  });

  test("returns nothing on a closed day", () => {
    expect(compute({ date: TUESDAY })).toEqual([]);
  });

  test("returns nothing when the party exceeds max_party_size", () => {
    expect(compute({ partySize: 9 })).toEqual([]);
  });

  test("returns nothing outside the booking window", () => {
    expect(
      compute({
        settings: { ...BASE_SETTINGS, booking_window_days: 1 },
      })
    ).toEqual([]);
    expect(compute({ now: { date: "2031-01-05", minutes: 0 } })).toEqual([]); // past date
  });

  test("drops same-day slots that are too soon", () => {
    const slots = compute({
      now: { date: FRIDAY, minutes: 18 * 60 }, // 18:00 on the day
    });
    // 30-minute lead: first bookable slot is 18:30
    expect(slots[0].time).toBe("18:30");
  });

  test("a reservation blocks overlapping slots for its duration", () => {
    // Party of 2 at 18:00 for 90 min occupies the only 2-top until 19:30
    const slots = compute({
      tables: [{ table_id: 1, capacity: 2 }],
      reservations: [
        {
          reservation_time: "18:00",
          duration_minutes: null,
          people: 2,
          status: "booked",
        },
      ],
    });
    const times = slots.map((slot) => slot.time);
    expect(times).not.toContain("17:00"); // 17:00+90 overlaps 18:00
    expect(times).not.toContain("18:00");
    expect(times).not.toContain("18:30");
    expect(times).not.toContain("19:00");
    expect(times).toContain("19:30"); // previous party's 90 min are up
  });

  test("finished and cancelled reservations do not block", () => {
    const slots = compute({
      tables: [{ table_id: 1, capacity: 2 }],
      reservations: [
        {
          reservation_time: "18:00",
          duration_minutes: null,
          people: 2,
          status: "cancelled",
        },
        {
          reservation_time: "18:00",
          duration_minutes: null,
          people: 2,
          status: "finished",
        },
      ],
    });
    expect(slots.map((slot) => slot.time)).toContain("18:00");
  });

  test("a big party consuming the last big table blocks another big party", () => {
    const slots = compute({
      partySize: 4,
      tables: [
        { table_id: 1, capacity: 2 },
        { table_id: 2, capacity: 4 },
      ],
      reservations: [
        {
          reservation_time: "18:00",
          duration_minutes: null,
          people: 4,
          status: "booked",
        },
      ],
    });
    // the 4-top is taken 18:00-19:30; a second party of 4 can't fit then
    const times = slots.map((slot) => slot.time);
    expect(times).not.toContain("18:00");
    expect(times).toContain("19:30");
  });

  test("small party can still book around a big party on remaining tables", () => {
    const slots = compute({
      partySize: 2,
      reservations: [
        {
          reservation_time: "18:00",
          duration_minutes: null,
          people: 4,
          status: "booked",
        },
      ],
    });
    const at18 = slots.find((slot) => slot.time === "18:00");
    expect(at18).toBeDefined();
    expect(at18.available_table_count).toBe(1); // only the 2-top remains
  });

  test("respects explicit per-reservation durations", () => {
    const slots = compute({
      tables: [{ table_id: 1, capacity: 2 }],
      reservations: [
        {
          reservation_time: "17:00",
          duration_minutes: 240, // long banquet
          people: 2,
          status: "seated",
        },
      ],
    });
    expect(slots.map((slot) => slot.time)).toEqual(["21:00"]);
  });

  test("capacity check: no table fits the party at all", () => {
    expect(
      compute({
        partySize: 6,
        settings: { ...BASE_SETTINGS, max_party_size: 8 },
      })
    ).toEqual([]); // biggest table is a 4-top
  });
});
