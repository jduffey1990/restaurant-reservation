import React, { useState } from "react";
import ErrorAlert from "../layout/ErrorAlert";
import { listReservations } from "../utils/api";
import Reservation from "../layout/Reservation/Reservation";

function Search(onCancel = () => { }) {
    const [reservations, setReservations] = useState([]);
    const [mobile_number, setMobileNumber] = useState("");
    const [error, setError] = useState(null);

    function handleChange({ target: { value } }) {
        setMobileNumber(value);
    }

    function handleSubmit(event) {
        event.preventDefault();
        if (mobile_number === "") {
            setError(new Error("Please enter a mobile number before searching."));
            return;
        }
        const abortController = new AbortController();

        listReservations({ mobile_number }, abortController.signal)
            .then(reservations => {
                if (reservations.length === 0) {
                    setError(new Error("There is no record of that phone number."));
                } else {
                    setReservations(reservations);
                    setError(null); // Clear the error
                }
            })
            .catch(error => setError(new Error(error.message)));
    }

    return (
        <main className="container">
        <h3>Search for Reservation by Phone Number</h3>
        <ErrorAlert error={error} />
        <form onSubmit={handleSubmit} className="col-lg-6 mb-3">
          <div className="form-group">
            <input
              type="text"
              id="mobile_number"
              name="mobile_number"
              className="form-control"
              onChange={handleChange}
              value={mobile_number}
              placeholder="Mobile number"
            />
          </div>
          <button type="submit" className="btn btn-primary">Find</button>
        </form>
        <div>
          {reservations.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patron</th>
                    <th>Phone #</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <Reservation onCancel={onCancel} reservation={reservation} key={reservation.reservation_id} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No reservation found</p>
          )}
        </div>
      </main>
    );
}

export default Search;