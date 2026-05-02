import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/BackButton";
import RewardCollectibleCard from "../components/RewardCollectibleCard";

const C = { bg: "#FFFDF5", black: "#000", red: "#FF6B6B", yellow: "#FFD93D", violet: "#C4B5FD", white: "#fff" };
const sh = { sm: "4px 4px 0px 0px #000", md: "8px 8px 0px 0px #000", lg: "12px 12px 0px 0px #000" };
const font = (w = 700, sz = "16px", caps = false) => ({
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: w,
  fontSize: sz,
  ...(caps ? { textTransform: "uppercase", letterSpacing: "0.1em" } : {}),
});
const b4 = { border: "4px solid #000" };
const b3 = { border: "3px solid #000" };
const b2 = { border: "2px solid #000" };

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=block');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; }
  .btn { cursor: pointer; transition: transform 0.1s linear, box-shadow 0.1s linear; user-select: none; outline: none; }
  .btn:hover { transform: translate(-2px,-2px); }
  .btn:active { transform: translate(4px,4px); box-shadow: none !important; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }
  .company-card { cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; }
  .company-card:hover { transform: translate(-3px,-3px); box-shadow: 11px 11px 0px 0px #000 !important; }
  .tier-card { cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; }
  .tier-card:hover { transform: translate(-3px,-3px); box-shadow: 11px 11px 0px 0px #000 !important; }
  @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .ticker-track { display: flex; animation: ticker 28s linear infinite; width: max-content; gap: 40px; }
`;

const COMPANIES = [
  { name: "Google", logo: "G", color: C.yellow },
  { name: "Meta", logo: "M", color: "#E7F0FF" },
  { name: "Amazon", logo: "A", color: "#FFF0D9" },
  { name: "Apple", logo: "⌘", color: "#F0F0F0" },
  { name: "Microsoft", logo: "⊞", color: "#E8F4FD" },
  { name: "Netflix", logo: "N", color: "#FFE5E5" },
  { name: "Stripe", logo: "S", color: "#EEF0FF" },
  { name: "Airbnb", logo: "◈", color: "#FFE8EC" },
  { name: "Uber", logo: "U", color: "#F0F0F0" },
  { name: "Figma", logo: "❖", color: "#F0E8FF" },
];

const TIERS = [
  { id: "junior", label: "Junior", xp: 100, desc: "0–2 years experience", bg: C.violet, passAt: 55 },
  { id: "mid", label: "Mid-Level", xp: 200, desc: "2–5 years experience", bg: C.yellow, passAt: 60 },
  { id: "senior", label: "Senior", xp: 350, desc: "5–8 years experience", bg: C.red, passAt: 65 },
  { id: "staff", label: "Staff / Principal", xp: 500, desc: "8+ years experience", bg: "#222", passAt: 70, light: true },
];

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Lobby() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    const s = document.createElement("style");
    s.innerHTML = GLOBAL_CSS;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/sessions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setRecentSessions(d.sessions ?? []))
      .catch(() => {});
  }, [token]);

  const startSession = useCallback(async () => {
    if (!selectedCompany || !selectedTier) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ company: selectedCompany, tier: selectedTier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create session");
      navigate(`/session/${data.session._id}`);
    } catch (err) {
      setError(err.message ?? "Failed to start session");
    } finally {
      setCreating(false);
    }
  }, [selectedCompany, selectedTier, token, navigate]);

  const rewardSessions = recentSessions.filter((s) => s.passed).slice(0, 4);

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* Nav */}
      <nav style={{
        ...b4, borderTop: "none", borderLeft: "none", borderRight: "none",
        padding: "0 32px", display: "flex", alignItems: "center", height: "64px", background: C.bg, gap: "16px",
      }}>
        <BackButton to="/" label="Home" />
        <span style={{ ...font(900, "22px"), cursor: "pointer" }} onClick={() => navigate("/")}>
          AURA<span style={{ color: C.red }}>SYNC</span>
        </span>
        <div style={{ flex: 1 }} />
        {user && (
          <div style={{ ...b3, padding: "8px 16px", background: C.violet, boxShadow: sh.sm, ...font(700, "13px") }}>
            ⚡ {user.xp} XP &nbsp;|&nbsp; 🔥 {user.streak}d streak
          </div>
        )}
        <button className="btn" onClick={() => navigate("/profile")} style={{ ...b4, padding: "8px 16px", background: C.yellow, boxShadow: sh.sm, ...font(700, "12px", true) }}>
          Profile →
        </button>
        <span style={{ ...font(700, "13px"), cursor: "pointer" }} onClick={logout}>Sign Out</span>
      </nav>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <h1 style={{ ...font(900, "42px"), lineHeight: 1.1, marginBottom: "12px" }}>
            Pick your<br /><span style={{ background: C.yellow, padding: "0 8px" }}>battlefield.</span>
          </h1>
          <p style={{ ...font(400, "16px"), color: "#555" }}>
            Choose a company and difficulty tier. AuraSync will monitor your biometrics and coach you in real-time.
          </p>
        </div>

        {user && (
          <div style={{ ...b4, background: C.white, padding: "18px 20px", boxShadow: sh.sm, marginBottom: "28px", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ ...font(700, "11px", true), color: "#666", marginBottom: "6px" }}>Profile Snapshot</div>
              <div style={{ ...font(900, "24px"), lineHeight: 1 }}>{user.displayName}</div>
              <div style={{ ...font(400, "13px"), color: "#555", marginTop: 6 }}>Track streak days, session history, and collectible badges from one place.</div>
            </div>
            <button className="btn" onClick={() => navigate("/profile")} style={{ ...b4, padding: "12px 18px", background: C.violet, boxShadow: sh.sm, ...font(700, "12px", true) }}>
              Open Profile →
            </button>
          </div>
        )}

        {error && (
          <div style={{ ...b4, background: C.red, padding: "12px 16px", marginBottom: "24px", ...font(700, "14px") }}>
            {error}
          </div>
        )}

        {/* Company Grid */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ ...font(700, "13px", true), marginBottom: "16px", color: "#555" }}>
            Step 1 — Select Company
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
            {COMPANIES.map((co) => {
              const selected = selectedCompany === co.name;
              return (
                <div
                  key={co.name}
                  className="company-card"
                  onClick={() => setSelectedCompany(co.name)}
                  style={{
                    ...b4,
                    padding: "20px 16px",
                    background: selected ? co.color : C.white,
                    boxShadow: selected ? sh.md : sh.sm,
                    textAlign: "center",
                    outline: selected ? `4px solid ${C.black}` : "none",
                    outlineOffset: "2px",
                  }}
                >
                  <div style={{ ...font(900, "28px"), marginBottom: "8px" }}>{co.logo}</div>
                  <div style={{ ...font(700, "14px") }}>{co.name}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tier Grid */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ ...font(700, "13px", true), marginBottom: "16px", color: "#555" }}>
            Step 2 — Select Tier
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
            {TIERS.map((t) => {
              const selected = selectedTier === t.id;
              return (
                <div
                  key={t.id}
                  className="tier-card"
                  onClick={() => setSelectedTier(t.id)}
                  style={{
                    ...b4,
                    padding: "24px 20px",
                    background: selected ? t.bg : C.white,
                    color: selected && t.light ? C.white : C.black,
                    boxShadow: selected ? sh.lg : sh.sm,
                    outlineOffset: "2px",
                    outline: selected ? `4px solid ${C.black}` : "none",
                  }}
                >
                  <div style={{ ...font(900, "20px"), marginBottom: "8px" }}>{t.label}</div>
                  <div style={{ ...font(400, "13px"), marginBottom: "12px", opacity: 0.75 }}>{t.desc}</div>
                  <div style={{ ...b2, display: "inline-block", padding: "4px 10px", background: selected && t.light ? "#444" : "#f5f5f5", color: selected && t.light ? "#fff" : C.black, ...font(700, "12px") }}>
                    {t.xp} XP to earn
                  </div>
                  <div style={{ ...font(700, "11px", true), marginTop: "8px", opacity: 0.6 }}>
                    Pass at {t.passAt}+
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <button
            className="btn"
            onClick={startSession}
            disabled={!selectedCompany || !selectedTier || creating}
            style={{
              padding: "18px 40px",
              ...b4,
              background: selectedCompany && selectedTier ? C.red : "#ccc",
              color: C.black,
              boxShadow: selectedCompany && selectedTier ? sh.lg : "none",
              ...font(700, "16px", true),
            }}
          >
            {creating ? "Starting..." : selectedCompany && selectedTier
              ? `Start ${selectedTier} interview at ${selectedCompany} →`
              : "Select company and tier to start"}
          </button>

          {selectedCompany && selectedTier && (
            <p style={{ ...font(400, "13px"), color: "#555" }}>
              ~30 min session · 6 questions · live coaching
            </p>
          )}
        </div>

        <section style={{ marginTop: "56px" }}>
          <h2 style={{ ...font(700, "13px", true), marginBottom: "16px", color: "#555" }}>
            Reward Locker
          </h2>
          {rewardSessions.length === 0 ? (
            <div style={{ ...b4, background: C.white, padding: "22px 24px", boxShadow: sh.sm }}>
              <div style={{ ...font(900, "24px"), marginBottom: "8px" }}>No badges yet.</div>
              <p style={{ ...font(400, "14px"), color: "#555", lineHeight: 1.6 }}>
                Pass a session and AuraSync will forge an original reward badge for your history.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "14px" }}>
              {rewardSessions.map((s) => (
                s.rewardImageUrl ? (
                  <RewardCollectibleCard
                    key={s._id}
                    title={s.rewardName ?? "Badge Pending"}
                    summary={s.rewardSummary ?? `Passed with ${s.score ?? 0}/100.`}
                    imageUrl={s.rewardImageUrl}
                    eyebrow={`${s.company} • ${s.tier}`}
                    metaLeft="Reward Locker"
                    metaRight="1 of 1"
                    accent={C.yellow}
                    panel={C.white}
                    compact
                    actionLabel="View Report →"
                    onAction={() => navigate(`/report/${s._id}`)}
                  />
                ) : (
                  <div key={s._id} style={{ ...b4, background: "#f3efe6", boxShadow: sh.md, overflow: "hidden", padding: "18px 16px" }}>
                    <div style={{ ...font(700, "10px", true), marginBottom: "8px" }}>{s.company} · {s.tier}</div>
                    <div style={{ ...font(900, "20px"), lineHeight: 1.05, marginBottom: "10px" }}>{s.rewardName ?? "Badge Pending"}</div>
                    <div style={{ ...font(400, "13px"), color: "#555", lineHeight: 1.5, marginBottom: "14px" }}>
                      Open the report to forge this badge.
                    </div>
                    <button
                      className="btn"
                      onClick={() => navigate(`/report/${s._id}`)}
                      style={{ width: "100%", padding: "10px 12px", ...b3, background: C.red, boxShadow: sh.sm, ...font(700, "12px", true) }}
                    >
                      View Report →
                    </button>
                  </div>
                )
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
