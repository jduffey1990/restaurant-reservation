import React, { useState } from "react";
import ErrorAlert from "../layout/ErrorAlert";
import { readPhone } from "../utils/api";
import Reservation from "../layout/Reservation/Reservation";

function Search( onCancel = () => { }) {
    const [reservations, setReservations] = useState([]);
    const [mobileNumber, setMobileNumber] = useState("");
    const [error, setError] = useState(null);

    function handleChange({ target: { value } }) {
        setMobileNumber(value);
    }

    function handleSubmit(event) {
        event.preventDefault();
        loadReservations();
    }

    function loadReservations() {
        readPhone(mobileNumber)
            .then(reservations => {
                setReservations(reservations);
                setError(null); // Clear the error
            })
            .catch(error => setError(error));
    }

    return (
        <main>
            <h3>Search for reservation by phone number</h3>
            <ErrorAlert error={error} />
            <form onSubmit={handleSubmit}>
                <label>
                    <input
                        type="text"
                        id="mobile_number"
                        name="mobile_number"
                        className="form-control"
                        onChange={handleChange}
                        value={mobileNumber}
                        placeholder="mobile number"
                    />
                </label>
                <button type="submit">Find</button>
            </form>
            <div>
                {reservations.length > 0 ?
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
                    </div> :
                    <p> No reservation found </p>}
            </div>
        </main>
    );
}

export default Search;