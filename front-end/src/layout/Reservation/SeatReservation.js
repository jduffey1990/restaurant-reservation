import React, { useState, useEffect } from "react";
import ErrorAlert from "../ErrorAlert";
import { useHistory, useParams } from "react-router-dom";
import { listTables, seatReservation, readReservation } from "../../utils/api";

function SeatReservation(onSubmit) {
  const history = useHistory();
  const { reservation_id } = useParams();
  const [reservation, setReservation] = useState({});
  const [tables, setTables] = useState([]);
  const [tableId, setTableId] = useState("");
  const [tableErrors, setTableErrors] = useState(null);

  useEffect(() => {
    readReservation(reservation_id).then(setReservation);
  }, [reservation_id]);

  useEffect(() => {
    loadTables();
  }, []);

  function loadTables() {
    const abortController = new AbortController();
    setTableErrors(null);
    listTables(abortController.signal).then(setTables).catch(setTableErrors);
    return () => abortController.abort();
  }

  function changeHandler({ target: { value } }) {
    setTableErrors(null);
    setTableId(value);
  }

  function submitHandler(event) {
    event.preventDefault();
    const abortController = new AbortController();

    seatReservation(reservation_id, tableId, abortController.signal)
      .then(() => {
        history.push("/dashboard")
      })
      .catch(setTableErrors);

    return () => abortController.abort();
  }

  return (
    <>
      <form onSubmit={submitHandler}>
        <select
          className="m-2"
          id="table_id"
          name="table_id"
          value={tableId}
          required={true}
          onChange={changeHandler}
        >
          <option value="">Table</option>
          {tables.map((table) => (
            <option key={table.table_id} value={table.table_id}>
              {table.table_name} - {table.capacity}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn btn-primary m-2"
        >
          Submit
        </button>
      </form>
      <button
        type="button"
        className="btn btn-secondary m-2"
        onClick={() => history.goBack()}
      >
        Cancel
      </button>
      <ErrorAlert error={tableErrors} />
    </>
  );
}

export default SeatReservation;