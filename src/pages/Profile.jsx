import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/BackButton";
import RewardCollectibleCard from "../components/RewardCollectibleCard";

const C = { bg: "#FFFDF5", black: "#000", red: "#FF6B6B", yellow: "#FFD93D", violet: "#C4B5FD", white: "#fff", green: "#A8F0C6" };
const sh = { sm: "4px 4px 0px 0px #000", md: "8px 8px 0px 0px #000" };
const font = (w = 700, sz = "16px", caps = false) => ({
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: w,
  fontSize: sz,
  ...(caps ? { textTransform: "uppercase", letterSpacing: "0.1em" } : {}),
});
const b4 = { border: "4px solid #000" };
const b2 = { border: "2px solid #000" };
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=block');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; }
  .btn { cursor: pointer; transition: transform 0.1s linear, box-shadow 0.1s linear; user-select: none; }
  .btn:hover { transform: translate(-2px,-2px); }
  .btn:active { transform: translate(4px,4px); box-shadow: none !important; }
`;

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function buildAttendance(sessions) {
  const dailyCounts = new Map();
  sessions.forEach((session) => {
    const key = dayKey(session.startedAt ?? session.endedAt ?? Date.now());
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
  });

  const today = new Date();
  const cells = [];
  for (let offset = 34; offset >= 0; offset -= 1) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(today.getDate() - offset);
    const key = dayKey(d);
    const count = dailyCounts.get(key) ?? 0;
    cells.push({
      key,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
      isToday: offset === 0,
    });
  }
  return cells;
}

function cellColor(count) {
  if (count >= 3) return C.red;
  if (count >= 2) return C.yellow;
  if (count >= 1) return C.green;
  return "#F1ECDD";
}

export default function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

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
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => {});
  }, [token]);

  const rewardSessions = useMemo(() => sessions.filter((session) => session.rewardImageUrl), [sessions]);
  const attendance = useMemo(() => buildAttendance(sessions), [sessions]);
  const activeDays = attendance.filter((cell) => cell.count > 0).length;
  const completedSessions = sessions.filter((session) => session.status === "completed").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <nav style={{ ...b4, borderTop: "none", borderLeft: "none", borderRight: "none", padding: "0 24px", height: 66, display: "flex", alignItems: "center", gap: 12, background: C.bg }}>
        <BackButton to="/lobby" label="Lobby" />
        <span style={{ ...font(900, "21px"), cursor: "pointer" }} onClick={() => navigate("/")}>
          AURA<span style={{ color: C.red }}>SYNC</span>
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={() => navigate("/lobby")} style={{ ...b4, padding: "9px 16px", background: C.yellow, boxShadow: sh.sm, ...font(700, "12px", true) }}>
          New Session →
        </button>
        <button className="btn" onClick={logout} style={{ background: "none", border: "none", ...font(700, "13px") }}>
          Sign Out
        </button>
      </nav>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "36px 24px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 18, marginBottom: 22 }}>
          <div style={{ ...b4, background: C.white, boxShadow: sh.md, padding: "26px 24px" }}>
            <div style={{ ...font(700, "11px", true), color: "#666", marginBottom: 10 }}>Profile</div>
            <h1 style={{ ...font(900, "40px"), lineHeight: 1, marginBottom: 8 }}>
              {user?.displayName ?? "AuraSync User"}
            </h1>
            <p style={{ ...font(400, "14px"), color: "#555", lineHeight: 1.7, maxWidth: 560 }}>
              Your streak board fills in every day you attend a session. Badges live here too, so the profile becomes your interview archive instead of a one-off report.
            </p>
          </div>

          <div style={{ ...b4, background: C.violet, boxShadow: sh.md, padding: "20px 18px", display: "grid", gap: 10 }}>
            {[
              { label: "Current streak", value: `${user?.streak ?? 0} days` },
              { label: "XP", value: `${user?.xp ?? 0}` },
              { label: "Active days (35d)", value: `${activeDays}` },
              { label: "Badges unlocked", value: `${rewardSessions.length}` },
              { label: "Completed sessions", value: `${completedSessions}` },
            ].map((stat) => (
              <div key={stat.label} style={{ ...b2, background: "rgba(255,255,255,0.65)", padding: "10px 12px", display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ ...font(400, "13px") }}>{stat.label}</span>
                <span style={{ ...font(700, "13px") }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <section style={{ ...b4, background: C.white, boxShadow: sh.md, padding: "24px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
            <div>
              <div style={{ ...font(700, "12px", true), color: "#666", marginBottom: 6 }}>Streak Board</div>
              <div style={{ ...font(900, "28px"), lineHeight: 1 }}>Days Attended</div>
            </div>
            <div style={{ ...font(400, "13px"), color: "#666" }}>Last 35 days · darker cells mean more sessions that day</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8 }}>
            {attendance.map((cell) => (
              <div key={cell.key} title={`${cell.label}: ${cell.count} session${cell.count === 1 ? "" : "s"}`} style={{
                ...b2,
                background: cellColor(cell.count),
                minHeight: 62,
                padding: "8px 10px",
                boxShadow: cell.isToday ? sh.sm : "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}>
                <div style={{ ...font(700, "10px", true), color: "#555" }}>{cell.label}</div>
                <div style={{ ...font(900, "18px"), lineHeight: 1 }}>{cell.count > 0 ? cell.count : "·"}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
            <div>
              <div style={{ ...font(700, "12px", true), color: "#666", marginBottom: 6 }}>Badge Vault</div>
              <div style={{ ...font(900, "28px"), lineHeight: 1 }}>Collectible Rewards</div>
            </div>
          </div>

          {rewardSessions.length === 0 ? (
            <div style={{ ...b4, background: C.white, boxShadow: sh.md, padding: "22px 24px" }}>
              <div style={{ ...font(900, "24px"), marginBottom: "8px" }}>No badges forged yet.</div>
              <p style={{ ...font(400, "14px"), color: "#555", lineHeight: 1.6 }}>
                Pass a validated session and your collectible badge will show up here.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 16 }}>
              {rewardSessions.map((session) => (
                <RewardCollectibleCard
                  key={session._id}
                  title={session.rewardName ?? "AuraSync Collectible"}
                  summary={session.rewardSummary ?? "Saved in your profile vault."}
                  imageUrl={session.rewardImageUrl}
                  eyebrow={`${session.company} • ${session.tier}`}
                  metaLeft="Profile Vault"
                  metaRight="1 of 1"
                  accent={C.yellow}
                  panel={C.white}
                  actionLabel="Open Report →"
                  onAction={() => navigate(`/report/${session._id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
