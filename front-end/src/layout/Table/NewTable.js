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
        <main>
            <h1>Create Table</h1>
            <ErrorAlert error={error} />
            <form name="table-form" onSubmit={handleSubmit}>
                <div className="form-group d-md-flex mb-3">
                    <label htmlFor="table-name">Name</label>
                    <input
                        id="table-name"
                        name="table_name"
                        type="text"
                        onChange={handleChange}
                        value={table.table_name}
                        required
                    />
                </div>
                <div className="form-group d-md-flex mb-3">
                    <label htmlFor="table-capacity">Capacity</label>
                    <input
                        id="table-capacity"
                        name="capacity"
                        type="number"
                        onChange={handleChange}
                        value={table.capacity}
                        required
                    />
                </div>
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
            </form>
        </main>
    );
}

export default NewTable