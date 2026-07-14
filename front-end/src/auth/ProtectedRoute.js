import React from "react";
import { Redirect } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Renders children only for a logged-in user; otherwise sends to /login.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  return children;
}

export default ProtectedRoute;
