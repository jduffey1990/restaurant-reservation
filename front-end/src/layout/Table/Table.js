import React from "react";
import { Link } from "react-router-dom";

function Table({ onFinish, table }) {

  function handleFinish({
    target: { dataset: { tableIdFinish, reservationIdFinish } } = {},
  }) {
    if (
      tableIdFinish && reservationIdFinish &&
      window.confirm(
        "Is this table ready to seat new guests? This cannot be undone."
      )
    ) {
      onFinish(tableIdFinish, reservationIdFinish);
    }
  }

  return (
    <tr>
      <td data-label="Table" className="cell-title">{table.table_name}</td>
      <td data-label="Capacity">{table.capacity}</td>
      <td data-label="Status" className={`col-sm-1 ${table.reservation_id ? 'text-danger' : 'text-success'}`}
          data-table-id-status={table.table_id}
      >
        {table.reservation_id ? "Occupied" : "Free"}
      </td>
      <td className="cell-actions">
        {table.reservation_id ?
          <div className="btn-group" role="group" aria-label="Table Actions">
            {table.open_check_id && (
              <Link
                className="btn btn-outline-primary"
                to={`/checks/${table.open_check_id}`}
              >
                View check
              </Link>
            )}
            <button type="button" className="btn btn-success" data-table-id-finish={table.table_id} data-reservation-id-finish={table.reservation_id}
              onClick={handleFinish}>
              Finish
            </button>
          </div> : ("")
        }
      </td>
    </tr>
  );
}

export default Table;