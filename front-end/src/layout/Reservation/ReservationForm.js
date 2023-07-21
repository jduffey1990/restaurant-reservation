import React, { useState, useEffect } from "react";
import ErrorAlert from "../ErrorAlert";
import { useHistory, useParams } from "react-router-dom";
import {
  createReservation,
  readReservation,
  updateReservation
} from "../../utils/api";



function ReservationForm() {
  const history = useHistory();
  const { reservation_id } = useParams();


  const initalFormState = {
    first_name: "",
    last_name: "",
    mobile_number: "",
    reservation_date: "",
    reservation_time: "",
    people: 1,
  };

  const [reservation, setReservation] = useState({
    ...initalFormState,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (reservation_id) {
      setError(null);
      readReservation(reservation_id)
        .then(setReservation)
        .catch(setError);
    }
  }, [reservation_id]);

  const handleChange = ({ target }) => {
    let { value, name } = target;
    if (name === "people") {
      setReservation({
        ...reservation,
        [name]: Number(value),
      });

    }
    setReservation({
      ...reservation,
      [name]: value,
    });
    return
  };


  function handleSubmit(event) {
    event.preventDefault();

    const abortController = new AbortController();

    if (reservation_id) {
      // update reservation
      updateReservation(reservation)
        .then(() => history.push(`/dashboard/?date=${reservation.reservation_date}`))
        .catch((error) => {
          setError(error);
        });
    } else {
      createReservation(reservation)
        .then(() => history.push(`/dashboard/?date=${reservation.reservation_date}`))
        .catch((error) => {
          setError(error);
        });
      return () => abortController.abort();
    }
  }


  return (
    <main>
      <ErrorAlert error={error} />
      <form name="reservation-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="first-name">First Name</label>
          <input
            id="first-name"
            name="first_name"
            type="text"
            onChange={handleChange}
            value={reservation.first_name}
            required
          />
        </div>
        <div>
          <label htmlFor="last-name">Last Name</label>
          <input
            id="last-name"
            name="last_name"
            type="text"
            onChange={handleChange}
            value={reservation.last_name}
            required
          />
        </div>
        <div>
          <label htmlFor="mobile-number">Mobile Number</label>
          <input
            id="mobile-number"
            name="mobile_number"
            type="text"
            pattern="^(\d{7}|\d{10})$"
            onChange={handleChange}
            value={reservation.mobile_number}
            required
          />
        </div>
        <div>
          <label htmlFor="reservation-date">Date</label>
          <input
            id="reservation-date"
            name="reservation_date"
            type="date"
            onChange={handleChange}
            value={reservation.reservation_date}
            required
          />
        </div>
        <div >
          <label htmlFor="reservation-time">Time</label>
          <input
            id="reservation-time"
            name="reservation_time"
            type="time"
            onChange={handleChange}
            value={reservation.reservation_time}
            required
          />
        </div>
        <div >
          <label htmlFor="people">People</label>
          <select id="people" name="people" onChange={handleChange} value={reservation.people} required>
            <option> 1 </option>
            <option> 2 </option>
            <option> 3 </option>
            <option> 4 </option>
            <option> 5 </option>
            <option> 6 </option>
            <option> 7 </option>
            <option> 8 </option>
            <option> 9 </option>
            <option> 10 </option>
          </select>

        </div>
        <button
          type="button"
          className="btn btn-secondary mr-2"
          onClick={() => history.goBack()}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>
    </main>
  );
}

export default ReservationForm;