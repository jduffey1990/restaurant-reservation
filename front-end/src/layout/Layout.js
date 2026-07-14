import React, { useState } from "react";
import Menu from "./Menu";
import Routes from "./Routes";

import "./Layout.css";

/**
 * Defines the main layout of the application.
 *
 * @returns {JSX.Element}
 */
function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button
          className="menu-toggle"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span className="oi oi-menu" />
        </button>
        <span className="app-topbar-brand">Periodic Tables</span>
      </header>

      {menuOpen && (
        <div
          className="menu-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`side-bar${menuOpen ? " side-bar-open" : ""}`}>
        <Menu onNavigate={() => setMenuOpen(false)} />
      </div>

      <div className="app-content">
        <Routes />
      </div>
    </div>
  );
}

export default Layout;
