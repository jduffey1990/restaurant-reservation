import React, { useEffect, useState } from "react";
import ErrorAlert from "../layout/ErrorAlert";
import { getSettings, updateSettings } from "../utils/api";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// pg returns "10:30:00"; time inputs want "10:30"
function toInputTime(time) {
  return time ? time.slice(0, 5) : "";
}

/**
 * Owner-only page for the restaurant's booking rules: weekly hours,
 * slot interval, reservation duration, party-size cap, booking window.
 */
function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    getSettings(abortController.signal)
      .then((data) =>
        setSettings({
          ...data,
          hours: data.hours.map((day) => ({
            ...day,
            open_time: toInputTime(day.open_time),
            close_time: toInputTime(day.close_time),
          })),
        })
      )
      .catch(setError);
    return () => abortController.abort();
  }, []);

  if (!settings && !error) {
    return <div className="spinner-border m-4" role="status" />;
  }

  function setNumber({ target }) {
    setSaved(false);
    setSettings({ ...settings, [target.name]: Number(target.value) });
  }

  function setDay(weekday, changes) {
    setSaved(false);
    setSettings({
      ...settings,
      hours: settings.hours.map((day) =>
        day.weekday === weekday ? { ...day, ...changes } : day
      ),
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateSettings({
        slot_interval_minutes: settings.slot_interval_minutes,
        reservation_duration_minutes: settings.reservation_duration_minutes,
        max_party_size: settings.max_party_size,
        booking_window_days: settings.booking_window_days,
        hours: settings.hours,
      });
      setSaved(true);
    } catch (saveError) {
      setError(saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <h1>Restaurant Settings</h1>
      <ErrorAlert error={error} />
      {saved && <div className="alert alert-success m-2">Settings saved.</div>}
      {settings && (
        <form onSubmit={handleSubmit}>
          <h2 className="h4 mt-4">Booking rules</h2>
          <div className="form-row">
            <div className="form-group col-md-3">
              <label htmlFor="slot_interval_minutes">
                Slot interval (min)
              </label>
              <input
                id="slot_interval_minutes"
                name="slot_interval_minutes"
                type="number"
                min="5"
                step="5"
                className="form-control"
                required
                value={settings.slot_interval_minutes}
                onChange={setNumber}
              />
            </div>
            <div className="form-group col-md-3">
              <label htmlFor="reservation_duration_minutes">
                Reservation duration (min)
              </label>
              <input
                id="reservation_duration_minutes"
                name="reservation_duration_minutes"
                type="number"
                min="15"
                step="15"
                className="form-control"
                required
                value={settings.reservation_duration_minutes}
                onChange={setNumber}
              />
            </div>
            <div className="form-group col-md-3">
              <label htmlFor="max_party_size">Max party size</label>
              <input
                id="max_party_size"
                name="max_party_size"
                type="number"
                min="1"
                className="form-control"
                required
                value={settings.max_party_size}
                onChange={setNumber}
              />
            </div>
            <div className="form-group col-md-3">
              <label htmlFor="booking_window_days">
                Booking window (days)
              </label>
              <input
                id="booking_window_days"
                name="booking_window_days"
                type="number"
                min="1"
                className="form-control"
                required
                value={settings.booking_window_days}
                onChange={setNumber}
              />
            </div>
          </div>

          <h2 className="h4 mt-4">Weekly hours</h2>
          <p className="text-muted">
            Close time is the last seating, not when doors close.
          </p>
          <div className="table-responsive table-cards">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Closed</th>
                  <th>Open</th>
                  <th>Last seating</th>
                </tr>
              </thead>
              <tbody>
                {settings.hours.map((day) => (
                  <tr key={day.weekday}>
                    <td data-label="Day" className="cell-title">
                      {WEEKDAY_NAMES[day.weekday]}
                    </td>
                    <td data-label="Closed">
                      <input
                        type="checkbox"
                        aria-label={`${WEEKDAY_NAMES[day.weekday]} closed`}
                        checked={day.is_closed}
                        onChange={({ target }) =>
                          setDay(day.weekday, { is_closed: target.checked })
                        }
                      />
                    </td>
                    <td data-label="Open">
                      <input
                        type="time"
                        className="form-control"
                        aria-label={`${WEEKDAY_NAMES[day.weekday]} open time`}
                        disabled={day.is_closed}
                        required={!day.is_closed}
                        value={day.open_time || ""}
                        onChange={({ target }) =>
                          setDay(day.weekday, { open_time: target.value })
                        }
                      />
                    </td>
                    <td data-label="Last seating">
                      <input
                        type="time"
                        className="form-control"
                        aria-label={`${WEEKDAY_NAMES[day.weekday]} close time`}
                        disabled={day.is_closed}
                        required={!day.is_closed}
                        value={day.close_time || ""}
                        onChange={({ target }) =>
                          setDay(day.weekday, { close_time: target.value })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </form>
      )}
    </main>
  );
}

export default SettingsPage;
