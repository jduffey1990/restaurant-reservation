import React, { useEffect, useRef, useState } from "react";
import { listReservations, listTables, finishTable, cancelReservation, getPublicRestaurant } from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";
import { next, previous, today } from "../utils/date-time";
import Reservation from "../layout/Reservation/Reservation"
import Table from "../layout/Table/Table"
import DashboardSummary from "./DashboardSummary"

const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

// Parse via Date.UTC rather than `new Date(string)`: the latter reads a bare
// YYYY-MM-DD as UTC midnight and then reports it in local time, which lands on
// the previous day for anyone west of Greenwich.
function weekdayOf(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function isClosedOn(hours, date) {
  const day = hours.find((entry) => entry.weekday === weekdayOf(date));
  return Boolean(day && day.is_closed);
}

function nextOpenDate(hours, date) {
  let candidate = date;
  for (let i = 0; i < 7; i++) {
    candidate = next(candidate);
    if (!isClosedOn(hours, candidate)) return candidate;
  }
  return date; // every day closed; nothing better to offer
}

/**
 * Defines the dashboard page.
 * @param date
 *  the date for which the user wants to view reservations.
 * @returns {JSX.Element}
 */
function Dashboard({ date }) {
  const [reservations, setReservations] = useState([]);
  const [reservationDate, setReservationDate] = useState(date)
  const [reservationsError, setReservationsError] = useState(null);
  const [tables, setTables] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hours, setHours] = useState([]);
  const [skippedDate, setSkippedDate] = useState(null);
  const hasAutoAdvanced = useRef(false);

  useEffect(loadDashboard, [reservationDate]);

  useEffect(() => {
    const abortController = new AbortController();
    // Hours are a nicety — if this fails the dashboard still works, so the error
    // is swallowed rather than surfaced.
    getPublicRestaurant(abortController.signal)
      .then((restaurant) => setHours(restaurant.hours || []))
      .catch(() => {});
    return () => abortController.abort();
  }, []);

  // The restaurant is closed one day a week, and a visitor who happens to arrive
  // on that day would otherwise land on a permanently empty dashboard and assume
  // the app is broken. Skip them forward to the next open day. This runs once,
  // on the initial hours load: navigating to a closed day by hand still works and
  // just shows the banner below.
  useEffect(() => {
    if (!hours.length || hasAutoAdvanced.current) return;
    hasAutoAdvanced.current = true;
    if (!isClosedOn(hours, reservationDate)) return;
    setSkippedDate(reservationDate);
    setReservationDate(nextOpenDate(hours, reservationDate));
  }, [hours, reservationDate]);

  const viewingClosedDay = hours.length && isClosedOn(hours, reservationDate);



  function loadDashboard() {
    const abortController = new AbortController();
    setReservationsError(null);
    listReservations({ date: reservationDate }, abortController.signal)
      .then(setReservations)
      .catch(setReservationsError);

    listTables().then(setTables);
    setRefreshKey((key) => key + 1);
    return () => abortController.abort();
  }

  function onFinish(table_id, reservation_id) {
    finishTable(table_id, reservation_id)
      .then(loadDashboard)
  }

  function onCancel(reservation_id) {
    const abortController = new AbortController();
    cancelReservation(reservation_id, abortController.signal)
      .then(loadDashboard)
    return () => abortController.abort();
  }


  return (
    <main className="container mt-3">
      <h1 className="mb-4 text-center">Dashboard</h1>
      <ErrorAlert error={reservationsError} />

      {skippedDate && skippedDate === date && (
        <div className="alert alert-info">
          The restaurant is closed on {WEEKDAY_NAMES[weekdayOf(skippedDate)]}s,
          so today ({skippedDate}) has no bookings. Showing{" "}
          <strong>{reservationDate}</strong> instead.
        </div>
      )}

      {viewingClosedDay && (
        <div className="alert alert-warning">
          Closed on {WEEKDAY_NAMES[weekdayOf(reservationDate)]}s — no
          reservations can be booked for {reservationDate}.
        </div>
      )}

      <DashboardSummary date={reservationDate} refreshKey={refreshKey} />
      <div className="row mb-3">
          <div className="col">
            <h4>Reservations for {reservationDate}</h4>
            <div className="btn-group" role="group">
              <button type="button" onClick={() => setReservationDate(previous(reservationDate))} className="btn btn-outline-primary">Yesterday</button>
              <button type="button" onClick={() => setReservationDate(today(reservationDate))} className="btn btn-outline-primary mx-2">Today</button>
              <button type="button" onClick={() => setReservationDate(next(reservationDate))} className="btn btn-outline-primary">Tomorrow</button>
            </div>
          </div>
      </div>

      <div className="row">
        <div className="col-lg-12 mb-3">
          <h2>Patrons</h2>
          {reservations.length > 0 ? (
            <div className="table-responsive table-cards">
              <table className="table">
                <thead>
                  <tr>
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
              <p>No reservations for {reservationDate}</p>
            )}
          </div>
        </div>

      <div className="col-lg-12 mb-3">
        <h2>Tables</h2>
        <div>
          {tables.length > 0 ?
            <div className="table-responsive table-cards">
              <table className="table">
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((table) => (
                    <Table onFinish={onFinish} table={table} key={table.table_id} />
                  ))}
                </tbody>
              </table>
            </div> :
            <p> No tables in the restaurant</p>}
        </div>
      </div>
    </main>
  );
}


export default Dashboard;
