import React from "react";

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
      <td>{table.table_id}</td>
      <td>{table.table_name}</td>
      <td>{table.capacity}</td>
      <td className={`col-sm-1 ${table.reservation_id ? 'text-danger' : 'text-success'}`}
          data-table-id-status={table.table_id}
      >
        {table.reservation_id ? "Occupied" : "Free"}
      </td>
      <td>
        {table.reservation_id ?
          <button type="button" className="btn btn-success" data-table-id-finish={table.table_id} data-reservation-id-finish={table.reservation_id}
            onClick={handleFinish}>
             Finish
          </button> : ("")
        }
      </td>
    </tr>
  );
}

export default Table;