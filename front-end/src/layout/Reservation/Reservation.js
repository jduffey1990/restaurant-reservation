import React from "react";
import { Link } from "react-router-dom";


function Reservation({ onCancel = () => { }, reservation }) {

    function cancelHandler() {
        if (window.confirm("Do you want to cancel this reservation? This cannot be undone.")) {
            onCancel(reservation.reservation_id);
        }
    }

    return (
        <tr>
            <td data-label="Patron" className="cell-title">
                {reservation.last_name}, {reservation.first_name}
                {reservation.source === "online" && (
                    <span className="badge badge-info ml-2">online</span>
                )}
            </td>
            <td data-label="Phone #">{reservation.mobile_number}</td>
            <td data-label="Date">{reservation.reservation_date}</td>
            <td data-label="Time">{reservation.reservation_time}</td>
            <td data-label="Size">{reservation.people}</td>
            <td data-label="Status" className={
                `col-sm-1 ${reservation.status === 'booked' ? 'text-success' :
                    reservation.status === 'seated' ? 'text-warning' :
                        reservation.status === 'finished' ? 'text-primary' : ''
                }`
            }
                data-reservation-id-status={reservation.reservation_id}
            >
                {reservation.status}
            </td>
            <td className="cell-actions">
                {reservation.status === "booked" ? (
                    <div className="btn-group" role="group" aria-label="Reservation Actions">
                        <Link
                            className="btn btn-primary"
                            to={`/reservations/${reservation.reservation_id}/seat`}
                        >
                            seat
                        </Link>
                        <Link
                            className="btn btn-warning"
                            to={`/reservations/${reservation.reservation_id}/edit`}
                        >
                            edit
                        </Link>
                        <button
                            type="button"
                            className="btn btn-danger"
                            data-reservation-id-cancel={reservation.reservation_id}
                            onClick={cancelHandler}
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    ""
                )}
            </td>
        </tr>
    )
}

export default Reservation;
