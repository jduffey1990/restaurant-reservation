import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";
import {
  createPublicReservation,
  getPublicRestaurant,
  listAvailability,
} from "../utils/api";
import { today } from "../utils/date-time";
import "../layout/Layout.css";
import "./Booking.css";

/**
 * Diner-facing booking flow (no login):
 * 1. pick a date + party size, 2. pick an available time, 3. contact details.
 */
function BookingPage() {
  const history = useHistory();
  const [restaurant, setRestaurant] = useState(null);
  const [date, setDate] = useState(today());
  const [people, setPeople] = useState(2);
  const [slots, setSlots] = useState(null); // null = not searched yet
  const [selectedTime, setSelectedTime] = useState(null);
  const [contact, setContact] = useState({
    first_name: "",
    last_name: "",
    mobile_number: "",
    email: "",
  });
  const [error, setError] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    getPublicRestaurant(abortController.signal)
      .then(setRestaurant)
      .catch(setError);
    return () => abortController.abort();
  }, []);

  async function findSlots(event) {
    event.preventDefault();
    setError(null);
    setSelectedTime(null);
    setLoadingSlots(true);
    try {
      setSlots(await listAvailability(date, people));
    } catch (searchError) {
      setError(searchError);
      setSlots(null);
    } finally {
      setLoadingSlots(false);
    }
  }

  function setContactField({ target }) {
    setContact({ ...contact, [target.name]: target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await createPublicReservation({
        ...contact,
        reservation_date: date,
        reservation_time: selectedTime,
        people: Number(people),
      });
      history.push(
        `/book/confirmation/${created.reservation_id}?mobile_number=${encodeURIComponent(
          contact.mobile_number
        )}`
      );
    } catch (bookingError) {
      setError(bookingError);
      setSubmitting(false);
      // the slot may have just been taken — refresh the grid
      try {
        setSlots(await listAvailability(date, people));
        setSelectedTime(null);
      } catch (refreshError) {
        /* keep original error visible */
      }
    }
  }

  const maxParty = (restaurant && restaurant.max_party_size) || 8;

  return (
    <div className="booking-page">
      <header className="booking-header">
        <h1>{restaurant ? restaurant.name : "…"}</h1>
        <p>Reserve a table</p>
      </header>

      <div className="booking-card">
        <ErrorAlert error={error} />

        <p className="booking-step-label">1 · When are you coming?</p>
        <form onSubmit={findSlots} className="mb-4">
          <div className="form-row">
            <div className="form-group col-6">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                className="form-control"
                required
                min={today()}
                value={date}
                onChange={({ target }) => setDate(target.value)}
              />
            </div>
            <div className="form-group col-6">
              <label htmlFor="people">Party size</label>
              <select
                id="people"
                className="form-control"
                value={people}
                onChange={({ target }) => setPeople(Number(target.value))}
              >
                {Array.from({ length: maxParty }, (_, i) => i + 1).map(
                  (size) => (
                    <option key={size} value={size}>
                      {size} {size === 1 ? "guest" : "guests"}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="booking-submit"
            disabled={loadingSlots}
          >
            {loadingSlots ? "Checking…" : "Find a table"}
          </button>
        </form>

        {slots && (
          <>
            <p className="booking-step-label">2 · Pick a time</p>
            {slots.length ? (
              <div className="slot-grid mb-4">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    className={`slot-button${
                      selectedTime === slot.time ? " selected" : ""
                    }`}
                    onClick={() => setSelectedTime(slot.time)}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mb-4">
                No tables available that day — please try another date.
              </p>
            )}
          </>
        )}

        {selectedTime && (
          <>
            <p className="booking-step-label">3 · Your details</p>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group col-6">
                  <label htmlFor="first_name">First name</label>
                  <input
                    id="first_name"
                    name="first_name"
                    className="form-control"
                    required
                    value={contact.first_name}
                    onChange={setContactField}
                  />
                </div>
                <div className="form-group col-6">
                  <label htmlFor="last_name">Last name</label>
                  <input
                    id="last_name"
                    name="last_name"
                    className="form-control"
                    required
                    value={contact.last_name}
                    onChange={setContactField}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="mobile_number">Mobile number</label>
                <input
                  id="mobile_number"
                  name="mobile_number"
                  type="tel"
                  className="form-control"
                  required
                  value={contact.mobile_number}
                  onChange={setContactField}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email (optional)</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  value={contact.email}
                  onChange={setContactField}
                />
              </div>
              <button
                type="submit"
                className="booking-submit"
                disabled={submitting}
              >
                {submitting
                  ? "Booking…"
                  : `Book ${selectedTime} for ${people}`}
              </button>
            </form>
          </>
        )}
      </div>

      <footer className="booking-footer">
        Powered by Periodic Tables · Staff?{" "}
        <a href="/login">Sign in</a>
      </footer>
    </div>
  );
}

export default BookingPage;
