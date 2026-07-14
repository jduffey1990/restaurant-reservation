import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
} from "../utils/api";

const AuthContext = createContext({ user: null, loading: true });

/**
 * Holds the logged-in staff user. On mount it asks the API who the current
 * session belongs to (the JWT lives in an httpOnly cookie, so the client
 * can't inspect it directly).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    getCurrentUser(abortController.signal)
      .then((currentUser) => setUser(currentUser || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return () => abortController.abort();
  }, []);

  async function login(email, password) {
    const loggedIn = await apiLogin(email, password);
    setUser(loggedIn);
    return loggedIn;
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
