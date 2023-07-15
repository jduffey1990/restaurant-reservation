import React from "react";
import ReservationForm from "./ReservationForm";

/**
 * Defines the new reservation component.
 *
 * @returns {JSX.Element}
 */

function NewReservation() {
  return (
    <main>
      <h1>Create Reservation</h1>
      <ReservationForm />
    </main>
  )
}
  

export default NewReservation;