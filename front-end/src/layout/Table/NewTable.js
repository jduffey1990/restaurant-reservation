import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { createTable } from "../../utils/api";
import ErrorAlert from "../ErrorAlert";

function NewTable() {
    const history = useHistory()
    const initialState = {
        table_name: "",
        capacity: 0
    };


    const [table, setTable] = useState({ ...initialState })
    const [error, setError] = useState(null)

    const handleChange = ({ target: { name, value } }) => {
        if (name === 'capacity') {
            setTable({
                ...table,
                [name]: Number(value),
            });
        } else {
            setTable({
                ...table,
                [name]: value,
            })
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        const abortController = new AbortController();

        setError(null);
        createTable(table, abortController.signal)
            .then(() => history.push("/dashboard"))
            .catch((error) => {
                setError(error);
            });
        return () => abortController.abort();
    }

    return (
        <main className="container">
        <h1>Create Table</h1>
        <ErrorAlert error={error} />
        <form name="table-form" className="col-lg-6 mb-3" onSubmit={handleSubmit}>
          <div className="form-group row">
            <label htmlFor="table-name" className="col-sm-2 col-form-label">Name</label>
            <div className="col-sm-10">
              <input
                id="table-name"
                name="table_name"
                type="text"
                className="form-control"
                onChange={handleChange}
                value={table.table_name}
                required
              />
            </div>
          </div>
          <div className="form-group row">
            <label htmlFor="table-capacity" className="col-sm-2 col-form-label">Capacity</label>
            <div className="col-sm-10">
              <input
                id="table-capacity"
                name="capacity"
                type="number"
                className="form-control"
                onChange={handleChange}
                value={table.capacity}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <button
              type="button"
              className="btn btn-secondary mr-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </div>
        </form>
      </main>
    );
}

export default NewTable