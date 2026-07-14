import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";
import { readGuest, updateGuest } from "../utils/api";

/**
 * Guest profile: contact info, private staff notes, and visit history.
 */
function GuestDetail() {
  const { guest_id } = useParams();
  const history = useHistory();
  const [guest, setGuest] = useState(null);
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    readGuest(guest_id, abortController.signal)
      .then((data) => {
        setGuest(data);
        setNotes(data.notes || "");
        setEmail(data.email || "");
      })
      .catch(setError);
    return () => abortController.abort();
  }, [guest_id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const updated = await updateGuest({ guest_id, notes, email });
      setGuest({ ...guest, ...updated });
      setSaved(true);
    } catch (saveError) {
      setError(saveError);
    }
  }

  if (!guest) {
    return (
      <main className="container">
        <ErrorAlert error={error} />
        {!error && <div className="spinner-border m-4" role="status" />}
      </main>
    );
  }

  return (
    <main className="container">
      <button
        type="button"
        className="btn btn-link pl-0"
        onClick={() => history.goBack()}
      >
        &larr; Back
      </button>
      <h1>
        {guest.first_name} {guest.last_name}
      </h1>
      <p className="text-muted">
        {guest.mobile_number}
        {guest.finished_visits > 0 &&
          ` · ${guest.finished_visits} completed visit${
            guest.finished_visits === 1 ? "" : "s"
          }`}
      </p>
      <ErrorAlert error={error} />
      {saved && <div className="alert alert-success m-2">Guest saved.</div>}

      <form onSubmit={handleSubmit} className="col-lg-6 pl-0 mb-4">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={email}
            onChange={({ target }) => setEmail(target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="notes">Staff notes</label>
          <textarea
            id="notes"
            className="form-control"
            rows="3"
            placeholder="Allergies, seating preferences, VIP…"
            value={notes}
            onChange={({ target }) => setNotes(target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Save guest
        </button>
      </form>

      <h2 className="h4">Visit history</h2>
      {guest.visits && guest.visits.length ? (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Party</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {guest.visits.map((visit) => (
                <tr key={visit.reservation_id}>
                  <td>{String(visit.reservation_date).slice(0, 10)}</td>
                  <td>{String(visit.reservation_time).slice(0, 5)}</td>
                  <td>{visit.people}</td>
                  <td>{visit.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No reservations yet.</p>
      )}
    </main>
  );
}

export default GuestDetail;
