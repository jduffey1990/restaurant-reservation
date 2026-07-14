import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";
import {
  addCheckItem,
  closeCheck,
  listMenuItems,
  readCheck,
  removeCheckItem,
} from "../utils/api";

const TAX_RATE = 0.08;

function dollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * A table's open check: line items, add-item picker, running totals,
 * and the Close action that settles the check and frees the table.
 */
function CheckPage() {
  const { check_id } = useParams();
  const history = useHistory();
  const [check, setCheck] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [selection, setSelection] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    readCheck(check_id, abortController.signal)
      .then(setCheck)
      .catch(setError);
    listMenuItems(false, abortController.signal)
      .then(setMenuItems)
      .catch(setError);
    return () => abortController.abort();
  }, [check_id]);

  const isOpen = check && check.status === "open";
  const subtotal = check
    ? check.items.reduce(
        (sum, item) => sum + item.price_cents * item.quantity,
        0
      )
    : 0;

  async function handleAdd(event) {
    event.preventDefault();
    if (!selection) return;
    setError(null);
    try {
      const updated = await addCheckItem(
        check_id,
        Number(selection),
        Number(quantity)
      );
      setCheck({ ...check, items: updated.items });
      setSelection("");
      setQuantity(1);
    } catch (addError) {
      setError(addError);
    }
  }

  async function handleRemove(check_item_id) {
    setError(null);
    try {
      const updated = await removeCheckItem(check_id, check_item_id);
      setCheck({ ...check, items: updated.items });
    } catch (removeError) {
      setError(removeError);
    }
  }

  async function handleClose() {
    if (
      !window.confirm(
        "Close this check? The table will be freed and totals locked in."
      )
    )
      return;
    setClosing(true);
    setError(null);
    try {
      await closeCheck(check_id);
      history.push("/dashboard");
    } catch (closeError) {
      setError(closeError);
      setClosing(false);
    }
  }

  if (!check) {
    return (
      <main className="container">
        <ErrorAlert error={error} />
        {!error && <div className="spinner-border m-4" role="status" />}
      </main>
    );
  }

  return (
    <main className="container">
      <h1>
        Check #{check.check_id}{" "}
        <span
          className={`badge ${
            isOpen ? "badge-success" : "badge-secondary"
          } align-middle`}
        >
          {check.status}
        </span>
      </h1>
      <ErrorAlert error={error} />

      {isOpen && (
        <form onSubmit={handleAdd} className="form-row align-items-end mb-3">
          <div className="form-group col-md-6">
            <label htmlFor="menu_item">Add item</label>
            <select
              id="menu_item"
              className="form-control"
              value={selection}
              onChange={({ target }) => setSelection(target.value)}
            >
              <option value="">Choose from the menu…</option>
              {["appetizer", "entree", "dessert", "drink"].map((category) => (
                <optgroup key={category} label={category}>
                  {menuItems
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <option key={item.menu_item_id} value={item.menu_item_id}>
                        {item.name} — {dollars(item.price_cents)}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="form-group col-md-2">
            <label htmlFor="quantity">Qty</label>
            <input
              id="quantity"
              type="number"
              min="1"
              className="form-control"
              value={quantity}
              onChange={({ target }) => setQuantity(target.value)}
            />
          </div>
          <div className="form-group col-md-2">
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={!selection}
            >
              Add
            </button>
          </div>
        </form>
      )}

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Line total</th>
              {isOpen && <th></th>}
            </tr>
          </thead>
          <tbody>
            {check.items.length ? (
              check.items.map((item) => (
                <tr key={item.check_item_id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{dollars(item.price_cents)}</td>
                  <td>{dollars(item.price_cents * item.quantity)}</td>
                  {isOpen && (
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemove(item.check_item_id)}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isOpen ? 5 : 4}>Nothing ordered yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-right col-lg-4 ml-auto pr-0">
        {isOpen ? (
          <>
            <p className="mb-1">Subtotal: {dollars(subtotal)}</p>
            <p className="mb-1">
              Tax ({(TAX_RATE * 100).toFixed(0)}%):{" "}
              {dollars(Math.round(subtotal * TAX_RATE))}
            </p>
            <p className="h5">
              Total: {dollars(subtotal + Math.round(subtotal * TAX_RATE))}
            </p>
            <button
              type="button"
              className="btn btn-success"
              onClick={handleClose}
              disabled={closing}
            >
              {closing ? "Closing…" : "Close check & free table"}
            </button>
          </>
        ) : (
          <>
            <p className="mb-1">Subtotal: {dollars(check.subtotal_cents)}</p>
            <p className="mb-1">Tax: {dollars(check.tax_cents)}</p>
            <p className="h5">Total: {dollars(check.total_cents)}</p>
          </>
        )}
      </div>
    </main>
  );
}

export default CheckPage;
