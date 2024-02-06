import React, { useEffect, useState } from "react";
import { listReservations, listTables, finishTable, cancelReservation } from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";
import { next, previous, today } from "../utils/date-time";
import Reservation from "../layout/Reservation/Reservation"
import Table from "../layout/Table/Table"

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

  useEffect(loadDashboard, [reservationDate]);



  function loadDashboard() {
    const abortController = new AbortController();
    setReservationsError(null);
    listReservations({ date: reservationDate }, abortController.signal)
      .then(setReservations)
      .catch(setReservationsError);

    listTables().then(setTables);
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
            <div className="table-responsive">
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
            <div className="table-responsive">
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
