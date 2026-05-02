import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/BackButton";

const C = { bg: "#FFFDF5", black: "#000", red: "#FF6B6B", yellow: "#FFD93D", violet: "#C4B5FD" };
const sh = { sm: "4px 4px 0px 0px #000", md: "8px 8px 0px 0px #000" };
const font = (w = 700, sz = "16px", caps = false) => ({
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: w,
  fontSize: sz,
  ...(caps ? { textTransform: "uppercase", letterSpacing: "0.1em" } : {}),
});
const b4 = { border: "4px solid #000" };

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=block');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; }
  @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .ticker-track { display: flex; animation: ticker 28s linear infinite; width: max-content; gap: 40px; }
  .btn { cursor: pointer; transition: transform 0.1s linear, box-shadow 0.1s linear; user-select: none; }
  .btn:hover { transform: translate(-2px,-2px); }
  .btn:active { transform: translate(4px,4px); box-shadow: none !important; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }
  @keyframes shake { 0%,100%{transform:translateX(0);} 20%,60%{transform:translateX(-6px);} 40%,80%{transform:translateX(6px);} }
  .shake { animation: shake 0.4s ease; }
`;

const TICKER_ITEMS = ["JOIN AURASYNC", "MASTER YOUR INTERVIEW", "BIOMETRIC AI COACHING", "EARN AI BADGES", "BEAT THE STRESS"];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ ...b4, background: C.yellow, overflow: "hidden", padding: "10px 0", borderBottom: "4px solid #000" }}>
      <div className="ticker-track">
        {items.map((t, i) => (
          <span key={i} style={{ ...font(700, "13px", true), whiteSpace: "nowrap" }}>
            {t} <span style={{ color: C.red, margin: "0 4px" }}>★</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const s = document.createElement("style");
    s.innerHTML = GLOBAL_CSS;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.displayName || !form.email || !form.password) {
      setError("All fields required.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signup(form.email, form.password, form.displayName);
      navigate("/lobby");
    } catch (err) {
      setError(err.message ?? "Signup failed");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }, [form, signup, navigate]);

  const inp = {
    width: "100%",
    padding: "14px 16px",
    ...b4,
    boxShadow: sh.sm,
    background: "#fff",
    ...font(500, "16px"),
    outline: "none",
    marginBottom: "16px",
    display: "block",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <Ticker />

      {/* Nav */}
      <nav style={{ ...b4, borderTop: "none", borderLeft: "none", borderRight: "none", padding: "0 32px", display: "flex", alignItems: "center", gap: "16px", height: "60px", background: C.bg }}>
        <BackButton to="/" label="Home" />
        <Link to="/" style={{ ...font(900, "20px"), textDecoration: "none", color: C.black }}>
          AURA<span style={{ color: C.red }}>SYNC</span>
        </Link>
        <div style={{ flex: 1 }} />
        <Link to="/signin" style={{ ...font(700, "13px", true), textDecoration: "none", color: C.black }}>Sign In</Link>
      </nav>

      {/* Form */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 100px)", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <div className={shake ? "shake" : ""} style={{ ...b4, background: C.white, padding: "40px 36px", boxShadow: sh.md }}>
            <h1 style={{ ...font(900, "28px"), marginBottom: "8px" }}>Create Account</h1>
            <p style={{ ...font(400, "14px"), color: "#555", marginBottom: "32px" }}>
              Start your journey to interview mastery.
            </p>

            {error && (
              <div style={{ ...b4, background: C.red, padding: "12px 16px", marginBottom: "20px", ...font(700, "14px") }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label style={{ ...font(700, "12px", true), display: "block", marginBottom: "6px" }}>Display Name</label>
              <input
                style={inp}
                placeholder="Alex Chen"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />

              <label style={{ ...font(700, "12px", true), display: "block", marginBottom: "6px" }}>Email</label>
              <input
                style={inp}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />

              <label style={{ ...font(700, "12px", true), display: "block", marginBottom: "6px" }}>Password</label>
              <input
                style={{ ...inp, marginBottom: "28px" }}
                type="password"
                placeholder="8+ characters"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />

              <button
                className="btn"
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px",
                  ...b4,
                  background: C.yellow,
                  boxShadow: sh.md,
                  ...font(700, "14px", true),
                  marginBottom: "16px",
                }}
              >
                {loading ? "Creating Account..." : "Create Account →"}
              </button>
            </form>

            <p style={{ ...font(400, "14px"), textAlign: "center", color: "#555" }}>
              Already have an account?{" "}
              <Link to="/signin" style={{ ...font(700, "14px"), color: C.black }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
