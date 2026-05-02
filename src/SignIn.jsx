import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import BackButton from "./components/BackButton";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:     "#FFFDF5",
  black:  "#000000",
  red:    "#FF6B6B",
  yellow: "#FFD93D",
  violet: "#C4B5FD",
  white:  "#FFFFFF",
};

const sh = {
  sm:  "4px 4px 0px 0px #000",
  md:  "8px 8px 0px 0px #000",
  lg:  "12px 12px 0px 0px #000",
};

const font = (w = 700, sz = "16px", caps = false, ls = null) => ({
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: w,
  fontSize: sz,
  ...(caps ? { textTransform: "uppercase", letterSpacing: ls ?? "0.1em" } : {}),
  ...(ls && !caps ? { letterSpacing: ls } : {}),
});

const b4 = { border: "4px solid #000" };
const b3 = { border: "3px solid #000" };

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=block');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: ${C.bg}; }

  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .ticker-track { display: flex; animation: ticker 28s linear infinite; width: max-content; gap: 40px; }

  @keyframes float-card {
    0%,100% { transform: rotate(-1deg) translateY(0); }
    50%      { transform: rotate(-1deg) translateY(-8px); }
  }
  .float-card { animation: float-card 3.2s ease-in-out infinite; }

  @keyframes pop {
    from { transform: scale(0.85); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
  .pop-in { animation: pop 0.32s cubic-bezier(0.34,1.56,0.64,1) both; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 3px solid rgba(255,255,255,0.4);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: middle; margin-right: 8px;
  }

  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%,60% { transform: translateX(-6px); }
    40%,80% { transform: translateX(6px); }
  }
  .shake { animation: shake 0.4s ease; }

  .btn {
    cursor: pointer;
    transition: transform 0.1s linear, box-shadow 0.1s linear;
    user-select: none;
  }
  .btn:hover  { transform: translate(-2px,-2px); }
  .btn:active { transform: translate(4px,4px); box-shadow: none !important; }

  .feat-link {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 900; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: #000; text-decoration: none;
    border-bottom: 2px solid transparent;
    transition: border-color 0.1s, background 0.1s; padding-bottom: 1px;
  }
  .feat-link:hover { border-bottom-color: #000; background: ${C.yellow}; }

  .footer-link {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 900; font-size: 13px;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: #000; text-decoration: none;
    border-bottom: 2px solid #000;
    transition: background 0.1s;
  }
  .footer-link:hover { background: ${C.yellow}; }

  .nav-link {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700; font-size: 13px;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: #000; text-decoration: none;
    padding: 7px 12px;
    border: 2px solid transparent;
    transition: border 0.1s, background 0.1s, box-shadow 0.1s;
  }
  .nav-link:hover { border: 2px solid #000; background: ${C.yellow}; box-shadow: 3px 3px 0px #000; }

  .grid-bg {
    background-image:
      linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px);
    background-size: 44px 44px;
  }

  input:focus { outline: none; }

  @media (max-width: 800px) {
    .left-panel { display: none !important; }
    .right-panel { padding: 32px 20px !important; }
  }
`;

// ─── JWT helpers ──────────────────────────────────────────────────────────────
function b64url(obj) {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function makeJWT(email) {
  const header  = b64url({ alg: "HS256", typ: "JWT" });
  const payload = b64url({
    sub: email, iss: "aurasync.io",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    roles: ["user"], plan: "free",
  });
  const sig = btoa(Math.random().toString(36).slice(2, 14)).replace(/=/g, "");
  return `${header}.${payload}.${sig}`;
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
const TICKER_WORDS = [
  "AuraSync","★","Real-time AI coaching","★","Read your stress live","★",
  "Smarter speaking","★","Speak better, live","★","Confidence, on demand","★",
  "AuraSync","★","Your silent AI coach","★","Live tone & stress insights","★",
];

function Ticker() {
  const doubled = [...TICKER_WORDS, ...TICKER_WORDS];
  return (
    <div style={{ background: C.black, overflow: "hidden", borderBottom: "4px solid #000", padding: "12px 0" }}>
      <div className="ticker-track">
        {doubled.map((w, i) => (
          <span key={i} style={{ ...font(900, "11px", true, "0.18em"), color: C.white, whiteSpace: "nowrap" }}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{ background: C.bg, borderBottom: "4px solid #000", padding: "0 28px", position: "sticky", top: 0, zIndex: 200 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BackButton to="/" label="Home" />
          <Link to="/" style={{ textDecoration: "none", display: "inline-flex" }}>
            <div style={{ background: C.yellow, ...b4, boxShadow: sh.sm, padding: "9px 18px" }}>
              <span style={{ ...font(900, "21px"), letterSpacing: "-0.04em", color: C.black }}>AuraSync</span>
            </div>
            <div style={{ background: C.red, ...b4, borderLeft: "none", padding: "9px 12px", display: "flex", alignItems: "center" }}>
              <span style={{ ...font(900, "10px", true, "0.15em"), color: C.white }}>v1.0</span>
            </div>
          </Link>
        </div>
        <span style={{ ...font(700, "13px", true, "0.1em"), color: "rgba(0,0,0,0.4)" }}>
          Secure Authentication
        </span>
      </div>
    </nav>
  );
}

// ─── Google Icon ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div
      className="left-panel"
      style={{
        background: C.black, padding: "64px 52px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        position: "relative", overflow: "hidden", borderRight: "4px solid #000",
      }}
    >
      {/* Halftone overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px)",
        backgroundSize: "22px 22px",
        pointerEvents: "none",
      }} />

      {/* Eyebrow */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: C.yellow, border: "4px solid #fff", boxShadow: sh.sm,
        padding: "7px 14px", marginBottom: 36, width: "fit-content",
        ...font(900, "11px", true, "0.2em"),
        transform: "rotate(-1.5deg)", position: "relative", zIndex: 1,
      }}>
        ★ Secure Auth Portal
      </div>

      {/* Headline */}
      <h1 style={{
        ...font(900, "clamp(40px, 5vw, 72px)"),
        lineHeight: 0.88, letterSpacing: "-0.03em", color: C.white,
        marginBottom: 28, position: "relative", zIndex: 1,
      }}>
        YOUR VOICE
        <span style={{
          display: "inline-block", background: C.yellow,
          border: "4px solid #fff", boxShadow: sh.sm,
          padding: "2px 14px", color: C.black,
          transform: "rotate(1.5deg)", lineHeight: 1.1, margin: "6px 0",
        }}>
          AWAITS
        </span>
        <br />YOU.
      </h1>

      {/* Body */}
      <p style={{
        ...font(700, "15px"), lineHeight: 1.7,
        color: "rgba(255,255,255,0.6)", maxWidth: 360, marginBottom: 36,
        position: "relative", zIndex: 1,
      }}>
        Sign in to unlock your real-time coaching dashboard. Analyze every session, track your growth, and speak like you mean it.
      </p>

      {/* Floating session card */}
      <div className="float-card" style={{
        background: C.white, border: "4px solid #fff",
        boxShadow: "10px 10px 0px 0px rgba(255,255,255,0.25)",
        marginBottom: 32, overflow: "hidden", position: "relative", zIndex: 1,
      }}>
        <div style={{
          background: C.violet, borderBottom: "4px solid #000",
          padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ ...font(900, "11px", true, "0.12em"), color: C.black }}>Live Session · Today</span>
          <div style={{ display: "flex", gap: 5 }}>
            {[C.red, C.yellow, C.violet].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, background: c, border: "2px solid #000", borderRadius: "50%" }} />
            ))}
          </div>
        </div>
        {[
          { dot: "#4ade80", label: "Confidence Score", badge: "92%",  bg: C.yellow },
          { dot: C.red,     label: "Stress Detected",  badge: "LOW",  bg: C.red,    light: true },
          { dot: C.violet,  label: "Filler Words",      badge: "2 Today", bg: C.violet },
        ].map((row, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px",
            borderBottom: i < 2 ? "2px solid #eee" : "none",
            ...font(700, "12px"), color: C.black,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", border: "2px solid #000", background: row.dot, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{row.label}</span>
            <div style={{
              background: row.bg, border: "2px solid #000",
              padding: "2px 7px",
              ...font(900, "9px", true, "0.1em"),
              color: row.light ? C.white : C.black,
            }}>
              {row.badge}
            </div>
          </div>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{
        display: "inline-flex",
        borderTop: "4px solid rgba(255,255,255,0.25)",
        borderLeft: "4px solid rgba(255,255,255,0.25)",
        position: "relative", zIndex: 1,
      }}>
        {[["3K+","Users"],["4.8★","Rating"],["99.9%","Uptime"]].map(([n, l]) => (
          <div key={l} style={{
            padding: "14px 22px",
            borderRight: "4px solid rgba(255,255,255,0.25)",
            borderBottom: "4px solid rgba(255,255,255,0.25)",
            textAlign: "center",
          }}>
            <div style={{ ...font(900, "24px"), color: C.yellow, lineHeight: 1 }}>{n}</div>
            <div style={{ ...font(700, "9px", true, "0.16em"), color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Password Field ───────────────────────────────────────────────────────────
function PasswordField({ id, label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", ...font(900, "10px", true, "0.18em"), marginBottom: 7 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: "100%", ...b4, background: C.bg,
            padding: "13px 44px 13px 16px",
            ...font(700, "15px"), color: C.black,
            transition: "box-shadow 0.1s, background 0.1s",
          }}
          onFocus={e => { e.target.style.background = C.white; e.target.style.boxShadow = sh.sm; }}
          onBlur={e => { e.target.style.background = C.bg; e.target.style.boxShadow = "none"; }}
        />
        <button
          onClick={() => setShow(s => !s)}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            fontSize: 16, opacity: 0.5, padding: 4,
            transition: "opacity 0.1s",
          }}
          onMouseEnter={e => e.target.style.opacity = 1}
          onMouseLeave={e => e.target.style.opacity = 0.5}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

// ─── Strength Bar ─────────────────────────────────────────────────────────────
function StrengthBar({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const colors = ["#FF6B6B", "#FF6B6B", "#FFD93D", "#4ade80"];
  const active = score > 0 ? colors[score - 1] : "#ddd";
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{
          flex: 1, height: 4, border: "1px solid #000",
          background: i <= score ? active : "#ddd",
          transition: "background 0.2s",
        }} />
      ))}
    </div>
  );
}

// ─── Sign In Form ─────────────────────────────────────────────────────────────
function SignInFields({ fields, setFields }) {
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", ...font(900, "10px", true, "0.18em"), marginBottom: 7 }}>
          Email Address
        </label>
        <input
          type="email"
          value={fields.email}
          onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
          placeholder="you@example.com"
          style={{
            width: "100%", ...b4, background: C.bg,
            padding: "13px 16px", ...font(700, "15px"), color: C.black,
            transition: "box-shadow 0.1s, background 0.1s",
          }}
          onFocus={e => { e.target.style.background = C.white; e.target.style.boxShadow = sh.sm; }}
          onBlur={e => { e.target.style.background = C.bg; e.target.style.boxShadow = "none"; }}
        />
      </div>

      <PasswordField
        id="siPass" label="Password"
        value={fields.password}
        onChange={e => setFields(f => ({ ...f, password: e.target.value }))}
        placeholder="Your password"
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          onClick={() => setFields(f => ({ ...f, remember: !f.remember }))}
        >
          <div style={{
            width: 18, height: 18, border: "3px solid #000",
            background: fields.remember ? C.yellow : C.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "background 0.1s",
          }}>
            {fields.remember && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <polyline points="1,5 4.5,8.5 11,1" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ ...font(700, "12px") }}>Remember me</span>
        </div>
        <a href="#" className="feat-link">Forgot password?</a>
      </div>
    </>
  );
}

// ─── Sign Up Form ─────────────────────────────────────────────────────────────
function SignUpFields({ fields, setFields }) {
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", ...font(900, "10px", true, "0.18em"), marginBottom: 7 }}>
          Full Name
        </label>
        <input
          type="text"
          value={fields.name}
          onChange={e => setFields(f => ({ ...f, name: e.target.value }))}
          placeholder="John Doe"
          style={{
            width: "100%", ...b4, background: C.bg,
            padding: "13px 16px", ...font(700, "15px"), color: C.black,
            transition: "box-shadow 0.1s, background 0.1s",
          }}
          onFocus={e => { e.target.style.background = C.white; e.target.style.boxShadow = sh.sm; }}
          onBlur={e => { e.target.style.background = C.bg; e.target.style.boxShadow = "none"; }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", ...font(900, "10px", true, "0.18em"), marginBottom: 7 }}>
          Email Address
        </label>
        <input
          type="email"
          value={fields.email}
          onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
          placeholder="you@example.com"
          style={{
            width: "100%", ...b4, background: C.bg,
            padding: "13px 16px", ...font(700, "15px"), color: C.black,
            transition: "box-shadow 0.1s, background 0.1s",
          }}
          onFocus={e => { e.target.style.background = C.white; e.target.style.boxShadow = sh.sm; }}
          onBlur={e => { e.target.style.background = C.bg; e.target.style.boxShadow = "none"; }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", ...font(900, "10px", true, "0.18em"), marginBottom: 7 }}>
          Password
        </label>
        <div style={{ position: "relative" }}>
          <PasswordField
            id="suPass" label="" value={fields.password}
            onChange={e => setFields(f => ({ ...f, password: e.target.value }))}
            placeholder="Min 8 characters"
          />
        </div>
        <StrengthBar password={fields.password} />
      </div>

      <PasswordField
        id="suPassC" label="Confirm Password"
        value={fields.confirm}
        onChange={e => setFields(f => ({ ...f, confirm: e.target.value }))}
        placeholder="Repeat password"
      />
    </>
  );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────
export default function SignIn() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);

  const [siFields, setSiFields] = useState({ email: "", password: "", remember: false });
  const [suFields, setSuFields] = useState({ name: "", email: "", password: "", confirm: "" });

  // Inject global CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Enter key
  useEffect(() => {
    const handler = e => { if (e.key === "Enter") handleSubmit(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  const triggerError = (msg) => {
    setError(msg);
    setShakeKey(k => k + 1);
  };

  const handleSubmit = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      if (tab === "signin") {
        const { email, password } = siFields;
        if (!email || !password) { setLoading(false); return triggerError("Please fill in all fields."); }
        await login(email, password);
      } else {
        const { name, email, password, confirm } = suFields;
        if (!name || !email || !password || !confirm) { setLoading(false); return triggerError("Please fill in all fields."); }
        if (password.length < 8) { setLoading(false); return triggerError("Password must be at least 8 characters."); }
        if (password !== confirm) { setLoading(false); return triggerError("Passwords do not match."); }
        await signup(email, password, name);
      }
      navigate("/lobby");
    } catch (err) {
      triggerError(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }, [tab, siFields, suFields, login, signup, navigate]);

  const handleGoogle = () => {
    setGoogleLoading(true);
    setTimeout(() => { setGoogleLoading(false); triggerError("Google OAuth not configured yet."); }, 800);
  };

  const switchTab = (t) => {
    setTab(t);
    setError("");
    setToken("");
  };


  // ── Main layout ───────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Ticker />
      <Nav />

      <div className="grid-bg" style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>

        {/* LEFT */}
        <LeftPanel />

        {/* RIGHT */}
        <div
          className="right-panel"
          style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "64px 52px" }}
        >
          {/* Form card */}
          <div key={shakeKey} className={shakeKey > 0 && error ? "shake" : ""}
            style={{ width: "100%", maxWidth: 440, background: C.white, ...b4, boxShadow: sh.lg, overflow: "hidden" }}
          >
            {/* Card header */}
            <div style={{ background: C.yellow, borderBottom: "4px solid #000", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...font(900, "18px"), letterSpacing: "-0.02em" }}>
                {tab === "signin" ? "Welcome Back" : "Join AuraSync"}
              </span>
              <span style={{ background: C.black, ...b4, padding: "5px 11px", ...font(900, "9px", true, "0.18em"), color: C.yellow }}>
                JWT Secured
              </span>
            </div>

            <div style={{ padding: "32px 28px" }}>

              {/* Google button */}
              <button
                className="btn"
                onClick={handleGoogle}
                disabled={googleLoading}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: C.white, ...b4, boxShadow: sh.sm,
                  padding: "14px 20px", marginBottom: 24,
                  ...font(700, "14px", true, "0.08em"), color: C.black,
                  cursor: googleLoading ? "not-allowed" : "pointer",
                  opacity: googleLoading ? 0.7 : 1,
                }}
              >
                {googleLoading ? <><span className="spinner" />Redirecting...</> : <><GoogleIcon /> Continue with Google</>}
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 3, background: "#000" }} />
                <span style={{ ...font(900, "10px", true, "0.22em"), whiteSpace: "nowrap" }}>or use email</span>
                <div style={{ flex: 1, height: 3, background: "#000" }} />
              </div>

              {/* Tabs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", ...b4, marginBottom: 24, overflow: "hidden" }}>
                {["signin","signup"].map((t, i) => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    style={{
                      padding: 11,
                      background: tab === t ? C.black : C.bg,
                      border: "none",
                      borderRight: i === 0 ? "2px solid #000" : "none",
                      ...font(900, "11px", true, "0.15em"),
                      color: tab === t ? C.yellow : C.black,
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => { if (tab !== t) e.target.style.background = C.yellow; }}
                    onMouseLeave={e => { if (tab !== t) e.target.style.background = C.bg; }}
                  >
                    {t === "signin" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: C.red, ...b3, padding: "10px 14px",
                  ...font(700, "12px"), color: C.white, marginBottom: 16,
                }}>
                  {error}
                </div>
              )}

              {/* Fields */}
              {tab === "signin"
                ? <SignInFields fields={siFields} setFields={setSiFields} />
                : <SignUpFields fields={suFields} setFields={setSuFields} />
              }

              {/* Submit */}
              <button
                className="btn"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: "100%", background: C.red, ...b4, boxShadow: sh.md,
                  padding: 16, ...font(700, "14px", true, "0.1em"),
                  color: C.white, cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.75 : 1,
                }}
              >
                {loading
                  ? <><span className="spinner" />{tab === "signin" ? "Authenticating..." : "Creating account..."}</>
                  : tab === "signin" ? "Sign In  →" : "Create Account  →"
                }
              </button>

            </div>

            {/* Card footer */}
            <div style={{
              borderTop: "4px solid #000", padding: "16px 28px",
              background: C.bg, display: "flex", justifyContent: "center", alignItems: "center", gap: 8,
            }}>
              <span style={{ ...font(700, "13px"), color: "rgba(0,0,0,0.5)" }}>
                {tab === "signin" ? "Don't have an account?" : "Already have one?"}
              </span>
              <a href="#" className="footer-link" onClick={e => { e.preventDefault(); switchTab(tab === "signin" ? "signup" : "signin"); }}>
                {tab === "signin" ? "Sign Up Free" : "Sign In"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
