import React, { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";
import { useAuth } from "./AuthContext";

/**
 * Standalone staff login page (rendered outside the sidebar Layout).
 */
const DEMO_PASSWORD = "password";

// This is a public portfolio demo: anyone arriving from GitHub needs to be able
// to get in, and to understand what the two roles actually differ on.
const DEMO_ACCOUNTS = [
  {
    role: "Owner",
    email: "owner@demo.test",
    summary: "Full access — everything staff can do, plus the owner-only bits.",
    extras: ["Add and edit menu items", "Change restaurant settings & hours", "Create staff accounts"],
  },
  {
    role: "Staff",
    email: "staff@demo.test",
    summary: "Day-to-day floor operations. Owner-only controls are hidden.",
    extras: ["Book, seat, and finish reservations", "Run checks in the POS", "Read-only menu & settings"],
  },
];

function Login() {
  const { user, login } = useAuth();
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Redirect to="/dashboard" />;

  async function signIn(emailToUse, passwordToUse) {
    setError(null);
    setSubmitting(true);
    try {
      await login(emailToUse, passwordToUse);
      history.push("/dashboard");
    } catch (loginError) {
      setError(loginError);
      setSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await signIn(email, password);
  }

  // Fills the form as well as submitting, so it is obvious what credentials were
  // used and the visitor can retype them by hand if they want to.
  async function handleDemoSignIn(account) {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    await signIn(account.email, DEMO_PASSWORD);
  }

  return (
    <div className="d-flex justify-content-center align-items-start min-vh-100 py-5">
      <div style={{ width: "24rem" }}>
      <div className="card shadow">
        <div className="card-body">
          <h1 className="h3 text-center mb-1">Periodic Tables</h1>
          <p className="text-center text-muted mb-4">Staff sign in</p>
          <ErrorAlert error={error} />
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                autoComplete="username"
                required
                value={email}
                onChange={({ target }) => setEmail(target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                autoComplete="current-password"
                required
                value={password}
                onChange={({ target }) => setPassword(target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>

      <div className="card shadow mt-3">
        <div className="card-body">
          <h2 className="h6 mb-1">Just looking around?</h2>
          <p className="small text-muted mb-3">
            This is a public demo. Pick an account to sign in instantly.
          </p>

          {DEMO_ACCOUNTS.map((account) => (
            <div key={account.email} className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{account.role}</strong>
                  <div className="small text-muted">{account.email}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  disabled={submitting}
                  onClick={() => handleDemoSignIn(account)}
                >
                  Sign in
                </button>
              </div>
              <p className="small mt-2 mb-1">{account.summary}</p>
              <ul className="small text-muted pl-3 mb-0">
                {account.extras.map((extra) => (
                  <li key={extra}>{extra}</li>
                ))}
              </ul>
            </div>
          ))}

          <p className="small text-muted mb-0">
            Demo data refreshes on its own, so feel free to book, seat, and
            cancel things — you can&apos;t break it.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Login;
