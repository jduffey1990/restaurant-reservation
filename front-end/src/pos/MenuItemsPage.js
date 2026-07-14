import React, { useEffect, useState } from "react";
import ErrorAlert from "../layout/ErrorAlert";
import { useAuth } from "../auth/AuthContext";
import {
  createMenuItem,
  listMenuItems,
  updateMenuItem,
} from "../utils/api";

const CATEGORIES = ["appetizer", "entree", "dessert", "drink"];

function dollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "entree",
  price: "",
  image_url: "",
};

const THUMBNAIL_SIZE = 56;

/**
 * Thumbnail that degrades to a neutral placeholder — an item may have no photo,
 * and an owner can paste a URL that later rots. Neither should render a broken
 * image icon in the middle of the menu.
 */
function Thumbnail({ item }) {
  const [failed, setFailed] = useState(false);
  const style = {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    objectFit: "cover",
  };

  if (!item.image_url || failed) {
    return (
      <div
        className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
        style={style}
        aria-hidden="true"
      >
        <small>—</small>
      </div>
    );
  }

  return (
    <img
      src={item.image_url}
      alt=""
      className="rounded border"
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Menu management for the fake POS. Owners can add/edit/deactivate items;
 * staff get a read-only view.
 */
function MenuItemsPage() {
  const { user } = useAuth();
  const isOwner = user && user.role === "owner";
  const [menuItems, setMenuItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    listMenuItems(true, abortController.signal)
      .then(setMenuItems)
      .catch(setError);
    return () => abortController.abort();
  }, []);

  function setField({ target }) {
    setForm({ ...form, [target.name]: target.value });
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError(null);
    try {
      const created = await createMenuItem({
        name: form.name,
        description: form.description,
        category: form.category,
        price_cents: Math.round(Number(form.price) * 100),
        image_url: form.image_url.trim() || null,
      });
      setMenuItems([...menuItems, created]);
      setForm(EMPTY_FORM);
    } catch (createError) {
      setError(createError);
    }
  }

  async function toggleActive(menuItem) {
    setError(null);
    try {
      const updated = await updateMenuItem({
        ...menuItem,
        is_active: !menuItem.is_active,
      });
      setMenuItems(
        menuItems.map((item) =>
          item.menu_item_id === updated.menu_item_id ? updated : item
        )
      );
    } catch (updateError) {
      setError(updateError);
    }
  }

  return (
    <main className="container">
      <h1>Menu</h1>
      <ErrorAlert error={error} />

      {isOwner && (
        <form onSubmit={handleCreate} className="mb-4">
          <div className="form-row align-items-end">
            <div className="form-group col-md-4">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                className="form-control"
                required
                value={form.name}
                onChange={setField}
              />
            </div>
            <div className="form-group col-md-5">
              <label htmlFor="description">Description</label>
              <input
                id="description"
                name="description"
                className="form-control"
                value={form.description}
                onChange={setField}
              />
            </div>
            <div className="form-group col-md-3">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                className="form-control"
                value={form.category}
                onChange={setField}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row align-items-end">
            <div className="form-group col-md-3">
              <label htmlFor="price">Price ($)</label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                required
                value={form.price}
                onChange={setField}
              />
            </div>
            <div className="form-group col-md-6">
              <label htmlFor="image_url">
                Image URL <span className="text-muted">(optional)</span>
              </label>
              <input
                id="image_url"
                name="image_url"
                className="form-control"
                placeholder="https://… or /images/menu/your-dish.jpg"
                value={form.image_url}
                onChange={setField}
              />
            </div>
            <div className="form-group col-md-3">
              <button type="submit" className="btn btn-primary btn-block">
                Add item
              </button>
            </div>
          </div>
        </form>
      )}

      {CATEGORIES.map((category) => {
        const items = menuItems.filter(
          (item) => item.category === category
        );
        if (!items.length) return null;
        return (
          <section key={category} className="mb-4">
            <h2 className="h4 text-capitalize">{category}s</h2>
            <div className="table-responsive table-cards">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th style={{ width: THUMBNAIL_SIZE + 16 }}>
                      <span className="sr-only">Photo</span>
                    </th>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Status</th>
                    {isOwner && (
                      <th>
                        <span className="sr-only">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.menu_item_id}
                      className={item.is_active ? "" : "text-muted"}
                    >
                      <td className="cell-media">
                        <Thumbnail item={item} />
                      </td>
                      <td data-label="Item" className="cell-title">
                        {item.name}
                      </td>
                      <td data-label="Description" className="cell-block">
                        {item.description}
                      </td>
                      <td data-label="Price">{dollars(item.price_cents)}</td>
                      <td data-label="Status">
                        {item.is_active ? "Active" : "Inactive"}
                      </td>
                      {isOwner && (
                        <td className="cell-actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => toggleActive(item)}
                          >
                            {item.is_active ? "Deactivate" : "Reactivate"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </main>
  );
}

export default MenuItemsPage;
