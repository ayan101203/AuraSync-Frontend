import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() =>
    localStorage.getItem("aurasync_token"),
  );
  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((tok, userData) => {
    localStorage.setItem("aurasync_token", tok);
    setToken(tok);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("aurasync_token");
    setToken(null);
    setUser(null);
  }, []);

  // Rehydrate from stored token — only logout on explicit 401, not network errors
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          logout();
          return null;
        }
        return r.ok ? r.json() : null; // server errors → keep token, try again later
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {
        /*  error — keep token, user stays logged in */
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  async function signup(email, password, displayName) {
    const res = await fetch(`${API}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Signup failed");
    saveAuth(data.token, data.user);
    return data.user;
  }

  async function login(email, password) {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Login failed");
    saveAuth(data.token, data.user);
    return data.user;
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
