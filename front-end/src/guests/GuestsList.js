import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";
import { listGuests } from "../utils/api";

/**
 * Guest CRM list: every guest who has ever booked, searchable by phone.
 */
function GuestsList() {
  const [guests, setGuests] = useState([]);
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    listGuests(null, abortController.signal)
      .then(setGuests)
      .catch(setError);
    return () => abortController.abort();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const abortController = new AbortController();
    setError(null);
    listGuests(mobileNumber, abortController.signal)
      .then(setGuests)
      .catch(setError);
  }

  return (
    <main className="container">
      <h1>Guests</h1>
      <ErrorAlert error={error} />
      <form onSubmit={handleSubmit} className="form-inline mb-3">
        <input
          type="text"
          className="form-control mr-2"
          placeholder="Filter by phone number"
          value={mobileNumber}
          onChange={({ target }) => setMobileNumber(target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>
      {guests.length ? (
        <div className="table-responsive table-cards">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone #</th>
                <th>Email</th>
                <th>Notes</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.guest_id}>
                  <td data-label="Name" className="cell-title">
                    {guest.first_name} {guest.last_name}
                  </td>
                  <td data-label="Phone #">{guest.mobile_number}</td>
                  <td data-label="Email">{guest.email}</td>
                  <td data-label="Notes" className="guest-notes cell-block">
                    {guest.notes}
                  </td>
                  <td className="cell-actions">
                    <Link
                      className="btn btn-sm btn-secondary"
                      to={`/guests/${guest.guest_id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No guests found.</p>
      )}
    </main>
  );
}

export default GuestsList;
