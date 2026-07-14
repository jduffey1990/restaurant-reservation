import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";
import useQuery from "../utils/useQuery";
import {
  cancelPublicReservation,
  readPublicReservation,
} from "../utils/api";
import "../layout/Layout.css";
import "./Booking.css";

function BookingConfirmation() {
  const { reservation_id } = useParams();
  const query = useQuery();
  const mobileNumber = query.get("mobile_number") || "";
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    readPublicReservation(reservation_id, mobileNumber, abortController.signal)
      .then(setReservation)
      .catch(setError);
    return () => abortController.abort();
  }, [reservation_id, mobileNumber]);

  async function handleCancel() {
    if (!window.confirm("Cancel this reservation?")) return;
    setCancelling(true);
    setError(null);
    try {
      const cancelled = await cancelPublicReservation(
        reservation_id,
        mobileNumber
      );
      setReservation(cancelled);
    } catch (cancelError) {
      setError(cancelError);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="booking-page">
      <header className="booking-header">
        <h1>Reservation</h1>
        <p>Confirmation #{reservation_id}</p>
      </header>
      <div className="booking-card text-center">
        <ErrorAlert error={error} />
        {reservation ? (
          <>
            {reservation.status === "booked" ? (
              <div className="alert alert-success">
                You're booked! A confirmation text has been sent to{" "}
                {reservation.mobile_number}.
              </div>
            ) : (
              <div className="alert alert-secondary">
                This reservation is {reservation.status}.
              </div>
            )}
            <p className="h5 mb-1">
              {reservation.first_name} {reservation.last_name}
            </p>
            <p className="mb-1">
              Party of {reservation.people} ·{" "}
              {String(reservation.reservation_date).slice(0, 10)} at{" "}
              {String(reservation.reservation_time).slice(0, 5)}
            </p>
            <p className="text-muted">{reservation.mobile_number}</p>
            {reservation.status === "booked" && (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling…" : "Cancel reservation"}
              </button>
            )}
          </>
        ) : (
          !error && <div className="spinner-border" role="status" />
        )}
        <p className="mt-4 mb-0">
          <Link to="/book">Make another reservation</Link>
        </p>
      </div>
    </div>
  );
}

export default BookingConfirmation;
