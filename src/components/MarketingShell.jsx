import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const C = {
  bg: "#FFFDF5",
  black: "#000000",
  red: "#FF6B6B",
  yellow: "#FFD93D",
  violet: "#C4B5FD",
  mint: "#A8F0C6",
  white: "#FFFFFF",
};

const sh = {
  sm: "4px 4px 0px 0px #000",
  md: "8px 8px 0px 0px #000",
  lg: "12px 12px 0px 0px #000",
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

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=block');

  body { background: ${C.bg}; }
  .marketing-btn {
    cursor: pointer;
    transition: transform 0.1s linear, box-shadow 0.1s linear;
  }
  .marketing-btn:hover {
    transform: translate(-2px, -2px);
  }
  .marketing-btn:active {
    transform: translate(4px, 4px);
    box-shadow: none !important;
  }
  .marketing-link {
    border: 2px solid transparent;
    background: transparent;
    color: #000;
    cursor: pointer;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    padding: 8px 12px;
    text-transform: uppercase;
  }
  .marketing-link:hover {
    border-color: #000;
    background: ${C.yellow};
    box-shadow: 3px 3px 0px #000;
  }
  .marketing-card {
    transition: transform 0.14s ease, box-shadow 0.14s ease;
  }
  .marketing-card:hover {
    transform: translateY(-6px);
    box-shadow: ${sh.lg};
  }
  .marketing-grid {
    background-image:
      linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px);
    background-size: 42px 42px;
  }
  @media (max-width: 900px) {
    .marketing-nav-links { display: none !important; }
    .marketing-header { grid-template-columns: 1fr !important; }
    .marketing-footer { grid-template-columns: 1fr !important; }
  }
`;

const NAV_LINKS = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
  { label: "About", to: "/about" },
];

const FOOTER_LINKS = [
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
      { label: "Practice", to: "/lobby", authOnly: true },
      { label: "Sign Up", to: "/signup", guestOnly: true },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Profile", to: "/profile", authOnly: true },
      { label: "Sign In", to: "/signin", guestOnly: true },
      { label: "Start Free", to: "/signup", guestOnly: true },
    ],
  },
];

function StarBurst({ size = 70, fill = C.yellow, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <polygon
        points="50,4 61,32 93,23 74,48 98,63 67,68 70,98 50,79 30,98 33,68 2,63 26,48 7,23 39,32"
        fill={fill}
        stroke="#000"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TopNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <nav style={{ background: C.bg, borderBottom: "4px solid #000", padding: "0 28px", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", height: 76, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <button
          className="marketing-btn"
          onClick={() => navigate("/")}
          style={{ display: "flex", textDecoration: "none", background: "transparent", border: "none", padding: 0 }}
        >
          <div style={{ background: C.yellow, ...b4, boxShadow: sh.sm, padding: "10px 18px" }}>
            <span style={{ ...font(900, "20px"), letterSpacing: "-0.04em" }}>AuraSync</span>
          </div>
          <div style={{ background: C.red, ...b4, borderLeft: "none", padding: "10px 12px", display: "flex", alignItems: "center" }}>
            <span style={{ ...font(900, "10px", true, "0.15em"), color: C.white }}>v1.0</span>
          </div>
        </button>

        <div className="marketing-nav-links" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {NAV_LINKS.map((item) => (
            <button
              key={item.to}
              className="marketing-link"
              onClick={() => navigate(item.to)}
              style={{ borderRadius: 0 }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <span style={{ ...font(700, "13px"), color: "#555" }}>
                Hi, {user.displayName?.split(" ")[0]} · ⚡{user.xp} XP
              </span>
              <button
                className="marketing-btn"
                onClick={() => navigate("/profile")}
                style={{ background: C.violet, ...b4, boxShadow: sh.sm, padding: "11px 16px", ...font(700, "12px", true, "0.12em") }}
              >
                Profile
              </button>
              <button
                className="marketing-btn"
                onClick={() => navigate("/lobby")}
                style={{ background: C.yellow, ...b4, boxShadow: sh.sm, padding: "11px 18px", ...font(700, "12px", true, "0.12em") }}
              >
                Practice →
              </button>
              <button
                className="marketing-btn"
                onClick={logout}
                style={{ border: "none", background: "transparent", ...font(700, "13px"), color: "#555" }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                className="marketing-btn"
                onClick={() => navigate("/signin")}
                style={{ border: "none", background: "transparent", ...font(700, "13px"), color: "#555" }}
              >
                Sign In
              </button>
              <button
                className="marketing-btn"
                onClick={() => navigate("/signup")}
                style={{ background: C.red, color: C.white, ...b4, boxShadow: sh.sm, padding: "11px 18px", ...font(700, "12px", true, "0.12em") }}
              >
                Start Free →
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <footer style={{ background: C.black, color: C.white, padding: "54px 28px 28px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div className="marketing-footer" style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr", gap: 28, marginBottom: 36 }}>
          <div>
            <div style={{ display: "inline-flex", marginBottom: 18 }}>
              <div style={{ background: C.yellow, border: "4px solid #fff", padding: "8px 16px" }}>
                <span style={{ ...font(900, "20px"), letterSpacing: "-0.04em", color: C.black }}>AuraSync</span>
              </div>
            </div>
            <p style={{ ...font(700, "14px"), lineHeight: 1.7, color: "rgba(255,255,255,0.72)", maxWidth: 300 }}>
              Real-time interview coaching with stress-aware guidance, sharper feedback loops, and collectible session rewards.
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <div style={{ ...font(900, "11px", true, "0.22em"), color: C.yellow, marginBottom: 14 }}>{group.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {group.links
                  .filter((link) => (link.authOnly ? Boolean(user) : true))
                  .filter((link) => (link.guestOnly ? !user : true))
                  .map((link) => (
                    <button
                      key={link.to}
                      onClick={() => navigate(link.to)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,255,255,0.72)",
                        textAlign: "left",
                        padding: 0,
                        cursor: "pointer",
                        ...font(700, "14px"),
                      }}
                    >
                      {link.label}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "2px solid rgba(255,255,255,0.2)", paddingTop: 18, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ ...font(700, "11px", true, "0.12em"), color: "rgba(255,255,255,0.45)" }}>
            © 2026 AuraSync Inc. · Built for calmer, sharper interviews.
          </span>
          <span style={{ ...font(900, "11px", true, "0.22em"), color: C.yellow }}>
            SPEAK. ANALYZE. IMPROVE.
          </span>
        </div>
      </div>
    </footer>
  );
}

export function SectionTitle({ eyebrow, title, accent, body }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "inline-flex", background: C.violet, ...b4, boxShadow: sh.sm, padding: "8px 14px", transform: "rotate(-1deg)", width: "fit-content" }}>
        <span style={{ ...font(900, "11px", true, "0.18em") }}>{eyebrow}</span>
      </div>
      <div>
        <h1 style={{ ...font(900, "clamp(42px, 7vw, 80px)"), lineHeight: 0.9, letterSpacing: "-0.04em", maxWidth: 820 }}>
          {title}
          {accent ? (
            <>
              <br />
              <span style={{ display: "inline-block", background: C.yellow, ...b4, boxShadow: sh.md, padding: "4px 16px", transform: "rotate(1deg)" }}>
                {accent}
              </span>
            </>
          ) : null}
        </h1>
      </div>
      {body ? (
        <p style={{ ...font(700, "17px"), lineHeight: 1.7, maxWidth: 720 }}>
          {body}
        </p>
      ) : null}
    </div>
  );
}

export function BrutalCard({ title, tone = C.white, accent = C.black, children }) {
  return (
    <div className="marketing-card" style={{ background: C.white, ...b4, boxShadow: sh.md, overflow: "hidden" }}>
      <div style={{ background: tone, borderBottom: "4px solid #000", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ ...font(900, "12px", true, "0.14em"), color: accent }}>{title}</span>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: accent, border: "2px solid #000" }} />
      </div>
      <div style={{ padding: "20px 18px 22px" }}>{children}</div>
    </div>
  );
}

export default function MarketingShell({
  eyebrow,
  title,
  accent,
  intro,
  children,
  ctaTitle = "TRY A SESSION WITHOUT THE DEAD AIR.",
  ctaBody = "Practice with the same neo-brutalist energy as the product: direct, bold, and useful.",
  ctaPrimaryLabel = "Start Free →",
  ctaPrimaryTo = "/signup",
  ctaSecondaryLabel = "Open Practice →",
  ctaSecondaryTo = "/lobby",
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <TopNav />

      <section className="marketing-grid" style={{ position: "relative", overflow: "hidden", borderBottom: "4px solid #000", padding: "78px 28px 82px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="marketing-header" style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 36, alignItems: "center" }}>
            <SectionTitle eyebrow={eyebrow} title={title} accent={accent} body={intro} />

            <div style={{ position: "relative", minHeight: 260 }}>
              <div style={{ position: "absolute", top: 0, right: 28 }}>
                <StarBurst fill={C.red} />
              </div>
              <div className="marketing-card" style={{ position: "absolute", inset: "48px 0 0 0", background: C.white, ...b4, boxShadow: sh.lg, padding: 20 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { label: "Live signals", bg: C.yellow },
                    { label: "Coaching stream", bg: C.violet },
                    { label: "Stress pause", bg: C.mint },
                    { label: "Session rewards", bg: C.red },
                  ].map((item) => (
                    <div key={item.label} style={{ background: item.bg, ...b2, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ ...font(700, "14px") }}>{item.label}</span>
                      <span style={{ ...font(900, "10px", true, "0.14em") }}>LIVE</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main style={{ padding: "60px 28px 72px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 28 }}>
          {children}

          <div style={{ background: C.yellow, ...b4, boxShadow: sh.lg, padding: "28px 24px", display: "grid", gap: 16 }}>
            <div style={{ ...font(900, "11px", true, "0.22em") }}>FINAL PUSH</div>
            <div style={{ ...font(900, "clamp(28px, 4vw, 52px)"), lineHeight: 0.95, letterSpacing: "-0.04em" }}>{ctaTitle}</div>
            <p style={{ ...font(700, "16px"), lineHeight: 1.7, maxWidth: 700 }}>{ctaBody}</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button
                className="marketing-btn"
                onClick={() => navigate(user ? "/lobby" : ctaPrimaryTo)}
                style={{ background: C.black, color: C.white, ...b4, boxShadow: sh.md, padding: "15px 24px", ...font(700, "13px", true, "0.12em") }}
              >
                {ctaPrimaryLabel}
              </button>
              <button
                className="marketing-btn"
                onClick={() => navigate(user ? "/profile" : ctaSecondaryTo)}
                style={{ background: C.white, ...b4, boxShadow: sh.md, padding: "15px 24px", ...font(700, "13px", true, "0.12em") }}
              >
                {user ? "Profile & Badges →" : ctaSecondaryLabel}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export { C as marketingColors, sh as marketingShadows, font as marketingFont, b4 as marketingBorder4, b2 as marketingBorder2 };
