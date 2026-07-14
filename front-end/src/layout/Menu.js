import React from "react";

import { Link, NavLink, useHistory } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const LINKS = [
  { to: "/dashboard", icon: "oi-dashboard", label: "Dashboard" },
  { to: "/search", icon: "oi-magnifying-glass", label: "Search" },
  { to: "/reservations/new", icon: "oi-plus", label: "New Reservation" },
  { to: "/tables/new", icon: "oi-layers", label: "New Table" },
  { to: "/guests", icon: "oi-people", label: "Guests" },
  { to: "/notifications", icon: "oi-envelope-closed", label: "Notifications" },
  { to: "/menu", icon: "oi-list", label: "Menu" },
];

/**
 * Defines the menu for this application.
 *
 * @param onNavigate
 *  called after a nav link is followed, so the mobile drawer can close itself.
 * @returns {JSX.Element}
 */
function Menu({ onNavigate = () => {} }) {
  const { user, logout } = useAuth();
  const history = useHistory();

  async function handleLogout() {
    onNavigate();
    await logout();
    history.push("/login");
  }

  const links = [...LINKS];
  if (user && user.role === "owner") {
    links.push({ to: "/settings", icon: "oi-cog", label: "Settings" });
  }

  return (
    <nav className="sidebar-nav" aria-label="Main">
      <div className="sidebar-head">
        <Link className="sidebar-brand" to="/" onClick={onNavigate}>
          Periodic Tables
        </Link>
        <button
          className="menu-close"
          type="button"
          aria-label="Close navigation menu"
          onClick={onNavigate}
        >
          <span className="oi oi-x" />
        </button>
      </div>

      <ul className="sidebar-links">
        {links.map(({ to, icon, label }) => (
          <li key={to}>
            <NavLink
              className="nav-link"
              activeClassName="nav-link-active"
              to={to}
              onClick={onNavigate}
            >
              <span className={`oi ${icon}`} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {user && (
        <div className="sidebar-foot">
          <div className="sidebar-user">
            Signed in as {user.first_name || user.email}
            {user.role === "owner" && " (owner)"}
          </div>
          <button
            className="btn btn-sm btn-outline-light"
            type="button"
            onClick={handleLogout}
          >
            <span className="oi oi-account-logout" aria-hidden="true" />
            &nbsp;Log out
          </button>
        </div>
      )}
    </nav>
  );
}

export default Menu;
