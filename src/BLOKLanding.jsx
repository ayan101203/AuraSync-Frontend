import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

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
  xl:  "16px 16px 0px 0px #000",
  wht: "8px 8px 0px 0px #fff",
};

const font = (w = 700, sz = "16px", caps = false, ls = null) => ({
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: w,
  fontSize: sz,
  ...(caps ? { textTransform: "uppercase", letterSpacing: ls ?? "0.1em" } : {}),
  ...(ls && !caps ? { letterSpacing: ls } : {}),
});

const b4 = { border: "4px solid #000" };
const b2 = { border: "2px solid #000" };

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=block');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; }

  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .ticker-track {
    display: flex;
    animation: ticker 28s linear infinite;
    width: max-content;
    gap: 40px;
  }

  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .spin { animation: spin-slow 14s linear infinite; }

  @keyframes float {
    0%, 100% { transform: rotate(-8deg) translateY(0px);   }
    50%       { transform: rotate(-8deg) translateY(-12px); }
  }
  .float-badge { animation: float 3.2s ease-in-out infinite; }

  @keyframes float2 {
    0%, 100% { transform: rotate(2deg) translateY(0px);  }
    50%       { transform: rotate(2deg) translateY(-8px); }
  }
  .float2 { animation: float2 2.8s ease-in-out infinite; }

  .btn {
    cursor: pointer;
    transition: transform 0.1s linear, box-shadow 0.1s linear;
    user-select: none;
  }
  .btn:hover  { transform: translate(-2px,-2px); }
  .btn:active { transform: translate(4px,4px); box-shadow: none !important; }

  .card-lift {
    transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
    cursor: default;
  }
  .card-lift:hover {
    transform: translateY(-8px);
    box-shadow: 14px 14px 0px 0px #000 !important;
  }

  .nav-link {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #000;
    text-decoration: none;
    padding: 7px 12px;
    border: 2px solid transparent;
    transition: border 0.1s, background 0.1s, box-shadow 0.1s;
  }
  .nav-link:hover {
    border: 2px solid #000;
    background: ${C.yellow};
    box-shadow: 3px 3px 0px #000;
  }

  .feat-link {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #000;
    text-decoration: none;
    border-bottom: 2px solid #000;
    padding-bottom: 1px;
    transition: background 0.1s;
  }
  .feat-link:hover { background: ${C.yellow}; }

  .footer-link {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: rgba(255,255,255,0.65);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: color 0.1s, border-color 0.1s;
  }
  .footer-link:hover { color: #fff; border-bottom-color: #fff; }

  .halftone {
    background-image: radial-gradient(#000 1.5px, transparent 1.5px);
    background-size: 22px 22px;
  }
  .grid-bg {
    background-image:
      linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px);
    background-size: 44px 44px;
  }

  @media (prefers-reduced-motion: reduce) {
    .ticker-track, .spin, .float-badge, .float2 { animation: none; }
  }

  @media (max-width: 900px) {
    .hero-grid   { grid-template-columns: 1fr !important; }
    .feats-grid  { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
    .desktop-nav { display: none !important; }
    .hero-visual { display: none !important; }
    .cta-flex    { flex-direction: column !important; align-items: center !important; }
    .stat-block  { width: 100% !important; }
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StarSVG({ size = 48, fill = C.yellow }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon
        points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
        fill={fill}
        stroke="#000"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PUBLIC_NAV_ITEMS = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
  { label: "About", to: "/about" },
];

// ─── Ticker ───────────────────────────────────────────────────────────────────
function Ticker() {
  const words = [
    "AuraSync", "★", "Real-time AI coaching", "★", "Read your stress live", "★",
    "Smarter speaking", "★", "Speak better, live", "★", "Confidence, on demand", "★",
    "AuraSync", "★", "Your silent AI coach", "★", "Live tone & stress insights", "★",
    "Practice. Analyze. Improve.", "★", "Real-time AI coaching", "★", "Speak better, live", "★",
  ];
  return (
    <div style={{ background: C.black, overflow: "hidden", borderBottom: "4px solid #000", padding: "12px 0" }}>
      <div className="ticker-track">
        {[...words, ...words].map((w, i) => (
          <span key={i} style={{ ...font(900, "12px", true, "0.18em"), color: C.white, whiteSpace: "nowrap" }}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <nav style={{ background: C.bg, borderBottom: "4px solid #000", padding: "0 28px", position: "sticky", top: 0, zIndex: 200 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>

        {/* Logo */}
        <div style={{ textDecoration: "none", display: "flex", cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ background: C.yellow, ...b4, boxShadow: sh.sm, padding: "9px 18px" }}>
            <span style={{ ...font(900, "21px"), letterSpacing: "-0.04em", color: C.black }}>AuraSync</span>
          </div>
          <div style={{ background: C.red, ...b4, borderLeft: "none", padding: "9px 12px", display: "flex", alignItems: "center" }}>
            <span style={{ ...font(900, "10px", true, "0.15em"), color: C.white }}>v1.0</span>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display: "flex", gap: 2, alignItems: "center" }}>
          {PUBLIC_NAV_ITEMS.map((item) => (
            <button
              key={item.to}
              className="nav-link"
              onClick={() => navigate(item.to)}
              style={{ background: "transparent", borderRadius: 0 }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CTA — auth-aware */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {user ? (
            <>
              <span style={{ ...font(700, "13px"), color: "#555" }}>
                Hi, {user.displayName?.split(" ")[0]} · ⚡{user.xp} XP
              </span>
              <button className="btn" onClick={() => navigate("/profile")}
                style={{ background: C.violet, ...b4, boxShadow: sh.sm, padding: "11px 18px", ...font(700, "13px", true, "0.1em"), color: C.black }}>
                Profile
              </button>
              <button className="btn" onClick={() => navigate("/lobby")}
                style={{ background: C.yellow, ...b4, boxShadow: sh.sm, padding: "11px 22px", ...font(700, "13px", true, "0.1em"), color: C.black }}>
                Practice →
              </button>
              <button className="btn" onClick={logout}
                style={{ background: "none", border: "none", ...font(700, "13px"), cursor: "pointer", color: "#555" }}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => navigate("/signin")} style={{ background: "none", border: "none", ...font(700, "13px", true, "0.1em"), cursor: "pointer" }}>
                Sign In
              </button>
              <button className="btn" onClick={() => navigate("/signup")}
                style={{ background: C.red, ...b4, boxShadow: sh.sm, padding: "11px 22px", ...font(700, "13px", true, "0.1em"), color: C.white }}>
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleStart = () => navigate(user ? "/lobby" : "/signup");
  const handleProfile = () => navigate(user ? "/profile" : "/signup");

  return (
    <section className="grid-bg" style={{ padding: "88px 28px 104px", borderBottom: "4px solid #000", overflow: "hidden", position: "relative" }}>
      <div className="hero-grid" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

        {/* ── Left copy ── */}
        <div>
          {/* Eyebrow badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.violet, ...b4, boxShadow: sh.sm, padding: "8px 16px", marginBottom: 32, transform: "rotate(-1.5deg)" }}>
            <span style={{ ...font(900, "11px", true, "0.2em") }}>★ Bio-Responsive Coaching</span>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ ...font(900, "clamp(52px, 7.5vw, 92px)"), lineHeight: 0.88, letterSpacing: "-0.03em", color: C.black }}>
              <span style={{ display: "block" }}>SPEAK</span>

              <span style={{ display: "inline-block", background: C.yellow, ...b4, boxShadow: sh.md, padding: "4px 18px", margin: "10px 0", transform: "rotate(1.2deg)", lineHeight: 1.1 }}>
                ANALYZE
              </span>

              <span style={{ display: "block", WebkitTextStroke: "3px #000", color: "transparent", lineHeight: 1 }}>
                IMPROVE
              </span>
            </h1>
          </div>

          {/* Body copy */}
          <p style={{ ...font(700, "17px"), lineHeight: 1.65, color: C.black, maxWidth: 440, marginBottom: 40 }}>
            A bio-responsive AI coaching engine that reads your body language and stress in real-time to make you a better speaker.
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 56 }}>
            <button className="btn" onClick={handleStart} style={{ background: C.red, ...b4, boxShadow: sh.md, padding: "16px 32px", ...font(700, "14px", true, "0.1em"), color: C.white }}>
              Start Free  →
            </button>
            <button className="btn" onClick={handleProfile} style={{ background: C.white, ...b4, boxShadow: sh.md, padding: "16px 32px", ...font(700, "14px", true, "0.1em"), color: C.black }}>
              Profile & Badges →
            </button>
          </div>

          {/* Stats bar */}
          <div className="stat-block" style={{ display: "inline-flex", borderTop: "4px solid #000", borderLeft: "4px solid #000" }}>
            {[["3K+", "Active Users"], ["99.9%", "Success Rate"], ["4.8★", "Avg Rating"]].map(([n, l]) => (
              <div key={l} style={{ padding: "16px 28px", borderRight: "4px solid #000", borderBottom: "4px solid #000", textAlign: "center" }}>
                <div style={{ ...font(900, "26px"), lineHeight: 1 }}>{n}</div>
                <div style={{ ...font(700, "10px", true, "0.15em"), marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right visual ── */}
        <div className="hero-visual" style={{ position: "relative", height: 540 }}>

          {/* Spinning star */}
          <div className="spin" style={{ position: "absolute", top: -4, right: 24, zIndex: 10 }}>
            <StarSVG size={64} />
          </div>

          {/* Main board card */}
          <div className="card-lift" style={{ position: "absolute", top: 44, left: 0, right: 56, background: C.white, ...b4, boxShadow: sh.lg, overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ background: C.violet, borderBottom: "4px solid #000", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...font(900, "13px", true, "0.12em") }}>Q4 Sprint Board</span>
              <div style={{ display: "flex", gap: 6 }}>
                {[C.red, C.yellow, C.violet].map((c, i) => (
                  <div key={i} style={{ width: 13, height: 13, background: c, border: "2px solid #000", borderRadius: "50%" }} />
                ))}
              </div>
            </div>

            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "auto auto auto", borderBottom: "3px solid #000" }}>
              {[["TODO", C.bg], ["IN PROGRESS", C.violet], ["DONE", C.yellow]].map(([label, bg]) => (
                <div key={label} style={{ background: bg, borderRight: "3px solid #000", padding: "8px 12px", textAlign: "center" }}>
                  <span style={{ ...font(900, "9px", true, "0.18em") }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Task rows */}
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              {[
                { col: "todo",     bg: C.yellow, text: "Capture Input",   avatar: "AH", acol: C.violet },
                { col: "progress", bg: C.violet, text: "Analyze Signals",      avatar: "SK", acol: C.red    },
                { col: "progress", bg: C.violet, text: "Detect Emotions & Stress", avatar: "RB", acol: C.yellow },
                { col: "todo",     bg: C.bg,     text: "Generate Feedback",    avatar: "ML", acol: C.violet },
                { col: "todo",     bg: C.bg,     text: "Deliver Live Coaching",   avatar: "PK", acol: C.red    },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: t.bg, border: "2px solid #000" }}>
                  <div style={{ flexShrink: 0, width: 8, height: 8, background: t.col === "done" ? "#22c55e" : t.col === "progress" ? C.red : "#ccc", border: "2px solid #000", borderRadius: "50%" }} />
                  <span style={{ ...font(700, "13px"), flex: 1, lineHeight: 1.3 }}>{t.text}</span>
                  <div style={{ width: 26, height: 26, background: t.acol, border: "2px solid #000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ ...font(900, "9px", true), color: C.black }}>{t.avatar}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification toast */}
          <div className="float2" style={{ position: "absolute", bottom: 28, right: 0, width: 214, background: C.yellow, ...b4, boxShadow: sh.md, padding: "14px 16px" }}>
            <div style={{ ...font(700, "10px", true, "0.15em"), marginBottom: 5 }}>🔥 Just deployed</div>
            <div style={{ ...font(900, "15px"), lineHeight: 1.2 }}>API v1 is LIVE</div>
            <div style={{ ...font(700, "11px"), marginTop: 6, color: "rgba(0,0,0,0.6)" }}>3m ago · Ayan G.</div>
          </div>

          {/* Free plan badge */}
          <div className="float-badge" style={{ position: "absolute", top: 28, left: -12, background: C.red, ...b4, boxShadow: sh.sm, padding: "11px 14px", zIndex: 20, lineHeight: 1.1 }}>
            <div style={{ ...font(900, "13px", true, "0.15em"), color: C.white }}>FREE</div>
            <div style={{ ...font(900, "13px", true, "0.15em"), color: C.white }}>PLAN</div>
          </div>

          {/* Live users pill */}
          <div style={{ position: "absolute", bottom: 110, left: -8, background: C.black, ...b4, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, background: "#4ade80", borderRadius: "50%", border: "2px solid #fff" }} />
            <span style={{ ...font(700, "11px", true, "0.12em"), color: C.white }}>247 online now</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: "LIVE BODY SIGNALS",
    desc:  "Reads posture, facial expressions, and micro-movements through your webcam. Know how you look while you speak.",
    color: C.yellow,
    icon:  "🧍",
    route: "/features",
  },
  {
    title: "VOICE INTELLIGENCE",
    desc:  "Analyzes tone, pace, filler words, and clarity in real time. Speak sharper, sound more confident.",
    color: C.violet,
    icon:  "🎤",
    route: "/features",
  },
  {
    title: "STRESS DETECTION",
    desc:  "Estimates heart rate and stress levels using bio-signals. Catch nervousness before it shows.",
    color: C.red,
    icon:  "❤️",
    light: true,
    route: "/docs",
  },
  {
    title: "REAL-TIME COACHING",
    desc:  "Get instant AI prompts while you speak. Adjust tone, pace, and delivery on the fly.",
    color: C.yellow,
    icon:  "⚡",
    route: "/docs",
  },
  {
    title: "MOCK INTERVIEWS",
    desc:  "Practice with realistic interview scenarios. Train for pressure, not just preparation.",
    color: C.violet,
    icon:  "🎯",
    route: "/pricing",
  },
  {
    title: "PERFORMANCE INSIGHTS",
    desc:  "Detailed breakdowns after every session. Track improvement across confidence, clarity, and engagement.",
    color: C.bg,
    icon:  "📊",
    route: "/about",
  },
];

function Features() {
  const navigate = useNavigate();
  return (
    <section style={{ padding: "80px 28px", background: C.bg, borderBottom: "4px solid #000" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Section header */}
        <div style={{ marginBottom: 60, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ display: "inline-block", background: C.black, ...b4, padding: "6px 14px", marginBottom: 18 }}>
              <span style={{ ...font(900, "11px", true, "0.25em"), color: C.yellow }}>★ Features</span>
            </div>
            <h2 style={{ ...font(900, "clamp(38px, 5.5vw, 68px)"), lineHeight: 0.88, letterSpacing: "-0.03em", color: C.black }}>
              EVERY SIGNAL<br />
              <span style={{ display: "inline-block", background: C.yellow, ...b4, boxShadow: sh.sm, padding: "4px 16px", transform: "rotate(-1.2deg)", margin: "10px 0", lineHeight: 1.05 }}>
                YOU MISS
              </span>
              <br />
              WE TRACK.
            </h2>
          </div>

          <div style={{ maxWidth: 320 }}>
            <p style={{ ...font(700, "16px"), lineHeight: 1.65 }}>
              We built AuraSync because speaking tools were either too generic, too delayed, or gave feedback after it actually mattered. None of them helped you in the moment. This is the one that coaches you live — while it counts.
            </p>
          </div>
        </div>

        {/* Feature grid */}
        <div className="feats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "4px solid #000", borderLeft: "4px solid #000" }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="card-lift"
              style={{
                background: C.white,
                borderRight: "4px solid #000",
                borderBottom: "4px solid #000",
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
              {/* Colored header strip */}
              <div style={{ background: f.color, borderBottom: "4px solid #000", padding: "15px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ ...font(900, "13px", true, "0.14em"), color: f.light ? C.white : C.black }}>
                  {f.title}
                </span>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{f.icon}</span>
              </div>

              {/* Body */}
              <div style={{ padding: "26px 22px 28px" }}>
                <p style={{ ...font(700, "15px"), lineHeight: 1.7, color: C.black, marginBottom: 20 }}>
                  {f.desc}
                </p>
                <button
                  className="feat-link"
                  onClick={() => navigate(f.route)}
                  style={{ background: "transparent", borderLeft: "none", borderRight: "none", borderTop: "none", cursor: "pointer" }}
                >
                  Learn more →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
function CTABanner() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="halftone" style={{ background: C.yellow, borderBottom: "4px solid #000", padding: "88px 28px", position: "relative", overflow: "hidden" }}>

      {/* Decorative spins */}
      <div className="spin" style={{ position: "absolute", top: -20, left: 32, opacity: 0.35 }}>
        <StarSVG size={88} fill={C.red} />
      </div>
      <div className="spin" style={{ position: "absolute", bottom: -20, right: 64, opacity: 0.25, animationDirection: "reverse" }}>
        <StarSVG size={72} fill={C.black} />
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <h2 style={{ ...font(900, "clamp(44px, 7vw, 96px)"), lineHeight: 0.88, letterSpacing: "-0.03em", color: C.black, marginBottom: 28 }}>
          STOP GUESSING.<br />
          <span style={{ WebkitTextStroke: "3px #000", color: "transparent" }}>
            START SPEAKING.
          </span>
        </h2>

        <p style={{ ...font(700, "17px"), maxWidth: 460, margin: "0 auto 44px", lineHeight: 1.65, color: C.black }}>
          Join 12,000+ users improving their speaking with AuraSync in real time. Free forever — no credit card, no catch.
        </p>

        <div className="cta-flex" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn" onClick={() => navigate(user ? "/lobby" : "/signup")} style={{ background: C.black, ...b4, boxShadow: sh.md, padding: "18px 42px", ...font(700, "14px", true, "0.1em"), color: C.white }}>
            Start Free →
          </button>
          <button className="btn" onClick={() => navigate(user ? "/profile" : "/signin")} style={{ background: C.white, ...b4, boxShadow: sh.md, padding: "18px 42px", ...font(700, "14px", true, "0.1em"), color: C.black }}>
            View Profile →
          </button>
        </div>

        <p style={{ ...font(700, "11px", true, "0.16em"), marginTop: 28, color: C.black }}>
          ★ Real-time feedback · Live coaching · Instant insights ★
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
const FOOTER_COLS = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Docs", to: "/docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Practice", to: "/lobby" },
      { label: "Profile", to: "/profile" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", to: "/signin" },
      { label: "Start Free", to: "/signup" },
    ],
  },
];

function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{ background: C.black, padding: "64px 28px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Top grid */}
        <div
          className="footer-grid"
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 52 }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: "inline-flex", marginBottom: 20 }}>
              <div style={{ background: C.yellow, border: "4px solid #fff", padding: "8px 16px" }}>
                <span style={{ ...font(900, "21px"), letterSpacing: "-0.04em", color: C.black }}>AuraSync</span>
              </div>
            </div>

            <p style={{ ...font(700, "14px"), lineHeight: 1.7, color: "rgba(255,255,255,0.6)", maxWidth: 240, marginBottom: 24 }}>
              Real-time coaching for people who are serious about speaking better. No excuses.
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: 10 }}>
              {["TW", "GH", "LI", "YT"].map(s => (
                <button
                  key={s}
                  className="btn"
                  style={{ width: 38, height: 38, border: "2px solid rgba(255,255,255,0.5)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0px rgba(255,255,255,0.2)" }}
                >
                  <span style={{ ...font(700, "10px", true, "0.08em"), color: C.white }}>{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <div style={{ ...font(900, "11px", true, "0.22em"), color: C.yellow, marginBottom: 16 }}>
                {col.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {col.links.map((link) => (
                  <button
                    key={link.to}
                    onClick={() => navigate(link.to)}
                    className="footer-link"
                    style={{ background: "transparent", border: "none", textAlign: "left", padding: 0, cursor: "pointer" }}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: "2px solid rgba(255,255,255,0.15)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ ...font(700, "12px", true, "0.1em"), color: "rgba(255,255,255,0.4)" }}>
            © 2026 AuraSync Inc. — Built with Rage &amp; Coffee.
          </span>
          <span style={{ ...font(900, "12px", true, "0.22em"), color: C.yellow }}>
            SPEAK. IMPROVE. REPEAT.
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function BLOKLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ background: C.bg, fontFamily: "'Space Grotesk', sans-serif" }}
      onClick={(e) => {
        // Intercept CTA "#" links and route to /signup or /signin
        const a = e.target.closest('a');
        if (a && (a.href.endsWith('#') || a.href === window.location.href)) {
          const text = a.textContent?.toLowerCase() ?? '';
          e.preventDefault();
          if (text.includes('get started') || text.includes('start') || text.includes('sign up') || text.includes('free')) {
            navigate('/signup');
          } else if (text.includes('sign in') || text.includes('login')) {
            navigate('/signin');
          }
        }
      }}
    >
      <Ticker />
      <Nav />
      <Hero />
      <Features />
      <CTABanner />
      <Footer />
    </div>
  );
}
