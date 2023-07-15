import React from "react";
import ReservationForm from "./ReservationForm";

/**
 * Defines the edit reservation page for this application.
 *
 * @returns {JSX.Element}
 */

function EditReservation() {
  return (
    <main>
      <h1>Edit Reservation</h1>
      <ReservationForm />
    </main>
  )
}

export default EditReservation;