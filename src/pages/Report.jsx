import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceDot, ReferenceLine,
} from "recharts";
import BackButton from "../components/BackButton";
import RewardCollectibleCard from "../components/RewardCollectibleCard";

const C = { bg: "#FFFDF5", black: "#000", red: "#FF6B6B", yellow: "#FFD93D", violet: "#C4B5FD", white: "#fff", green: "#A8F0C6" };
const sh = { sm: "4px 4px 0px 0px #000", md: "8px 8px 0px 0px #000", lg: "12px 12px 0px 0px #000" };
const font = (w = 700, sz = "16px", caps = false) => ({
  fontFamily: "'Space Grotesk', sans-serif", fontWeight: w, fontSize: sz,
  ...(caps ? { textTransform: "uppercase", letterSpacing: "0.1em" } : {}),
});
const b4 = { border: "4px solid #000" };
const b2 = { border: "2px solid #000" };

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=block');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; }
  .btn { cursor:pointer; transition:transform 0.1s,box-shadow 0.1s; user-select:none; outline:none; }
  .btn:hover { transform:translate(-2px,-2px); }
  .btn:active { transform:translate(4px,4px); box-shadow:none !important; }
  .btn:disabled { opacity:0.45; cursor:not-allowed; transform:none !important; }
  @keyframes pop { from{transform:scale(0.85);opacity:0;} to{transform:scale(1);opacity:1;} }
  .pop-in { animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
`;

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const REWARD_STRESS_THRESHOLD = 65;
const REWARD_ANSWER_THRESHOLD = 50;

function getStressLevel(stressPct) {
  if (stressPct >= 65) return "High";
  if (stressPct >= 40) return "Moderate";
  return "Low";
}

function getStressColor(stressPct) {
  if (stressPct >= 65) return C.red;
  if (stressPct >= 40) return "#FFA552";
  return C.green;
}

function getAverageQuestionScore(reviews = []) {
  if (!Array.isArray(reviews) || reviews.length === 0) return 0;
  return Math.round(reviews.reduce((sum, review) => sum + (Number(review?.score) || 0), 0) / reviews.length);
}

function getQuestionStressBreakdown(chartData = [], markers = []) {
  if (!Array.isArray(markers) || markers.length === 0) return [];

  return markers.map((marker, index) => {
    const prevT = index === 0 ? 0 : markers[index - 1].tSec;
    const nextT = index === markers.length - 1 ? marker.tSec : markers[index + 1].tSec;
    const startT = index === 0 ? 0 : Math.round((prevT + marker.tSec) / 2);
    const endT = index === markers.length - 1 ? nextT : Math.round((marker.tSec + nextT) / 2);

    const samples = chartData.filter((point) => {
      const t = Number(point?.t ?? 0);
      return t >= startT && t <= endT;
    });

    const fallbackSample = chartData.reduce((closest, point) => {
      const currentDistance = Math.abs(Number(point?.t ?? 0) - marker.tSec);
      const bestDistance = Math.abs(Number(closest?.t ?? 0) - marker.tSec);
      return currentDistance < bestDistance ? point : closest;
    }, chartData[0] ?? { t: marker.tSec, stress: 0 });

    const avgStressPct = samples.length > 0
      ? Math.round(samples.reduce((sum, point) => sum + (Number(point?.stress) || 0), 0) / samples.length)
      : Math.round(Number(fallbackSample?.stress) || 0);

    return {
      ...marker,
      avgStressPct,
      stressLevel: getStressLevel(avgStressPct),
      stressColor: getStressColor(avgStressPct),
      displayStressPct: Math.max(6, Math.min(96, avgStressPct || 0)),
    };
  });
}

function ScoreGauge({ score, passed, title, subtitle, chips = [] }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 24px" }}>
      <div style={{ ...font(700, "12px", true), color: "#555", marginBottom: "14px" }}>{title}</div>
      <div style={{ ...font(900, "80px"), lineHeight: 1, color: passed ? C.black : C.red }}>{score}</div>
      <div style={{ ...font(700, "14px", true), marginTop: "8px", color: "#555" }}>out of 100</div>
      <div style={{
        display: "inline-block",
        marginTop: "16px",
        padding: "8px 24px",
        ...b4,
        background: passed ? C.green : C.red,
        boxShadow: sh.sm,
        ...font(700, "14px", true),
      }}>
        {passed ? "✓ PASSED" : "✗ NOT PASSED"}
      </div>
      {subtitle && (
        <div style={{ ...font(400, "13px"), lineHeight: 1.6, color: "#555", marginTop: "14px" }}>
          {subtitle}
        </div>
      )}
      {chips.length > 0 && (
        <div style={{ display: "grid", gap: "8px", marginTop: "18px" }}>
          {chips.map((chip) => (
            <div key={chip.label} style={{ ...b2, background: "#fafaf8", padding: "8px 12px", textAlign: "left" }}>
              <div style={{ ...font(700, "9px", true), color: "#888", marginBottom: "3px" }}>{chip.label}</div>
              <div style={{ ...font(700, "13px"), color: chip.color ?? C.black }}>{chip.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RewardCard({
  session,
  rewarding,
  rewardError,
  onRetry,
  eligible,
  blockers,
  avgStressPct,
  stressLevel,
  avgAnswerScore,
}) {
  if (!session?.passed) return (
    <div style={{ ...b4, background: "#f6f1e8", padding: "24px", boxShadow: sh.md }}>
      <h3 style={{ ...font(700, "12px", true), marginBottom: "10px" }}>Reward Locked</h3>
      <p style={{ ...font(400, "13px"), lineHeight: 1.6 }}>
        Pass the session to unlock an original AuraSync reward badge.
      </p>
    </div>
  );

  if (session.rewardImageUrl) {
    return (
      <div className="pop-in">
        <RewardCollectibleCard
          title={session.rewardName}
          summary={session.rewardSummary || "Stored in your AuraSync history."}
          imageUrl={session.rewardImageUrl}
          eyebrow="Validated Reward"
          metaLeft="Report Vault"
          metaRight="1 of 1"
          accent={C.yellow}
          panel={C.violet}
        />
      </div>
    );
  }

  if (!eligible) {
    return (
      <div style={{ ...b4, background: "#f6f1e8", padding: "24px", boxShadow: sh.md }}>
        <h3 style={{ ...font(700, "12px", true), marginBottom: "10px" }}>Reward Validation Locked</h3>
        <p style={{ ...font(400, "13px"), marginBottom: "14px", lineHeight: 1.6 }}>
          This badge only becomes valid when answers are strong enough and average stress stays under control.
        </p>
        <div style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
          <div style={{ ...b2, background: "#fff", padding: "10px 12px" }}>
            <div style={{ ...font(700, "9px", true), color: "#888", marginBottom: "3px" }}>Answer Quality</div>
            <div style={{ ...font(700, "13px") }}>{avgAnswerScore}/100 · need {REWARD_ANSWER_THRESHOLD}+</div>
          </div>
          <div style={{ ...b2, background: "#fff", padding: "10px 12px" }}>
            <div style={{ ...font(700, "9px", true), color: "#888", marginBottom: "3px" }}>Average Stress</div>
            <div style={{ ...font(700, "13px") }}>{avgStressPct}% · {stressLevel} · need {REWARD_STRESS_THRESHOLD}% or lower</div>
          </div>
        </div>
        <div style={{ ...b2, background: "#FFF3F3", padding: "10px 12px" }}>
          <div style={{ ...font(700, "10px", true), color: C.red, marginBottom: "4px" }}>What Needs Work</div>
          <div style={{ ...font(400, "12px"), lineHeight: 1.6 }}>
            {blockers.join(" ")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...b4, background: C.violet, padding: "24px", boxShadow: sh.md }}>
      <h3 style={{ ...font(700, "12px", true), marginBottom: "8px" }}>
        {rewarding ? "Forging Validated Reward" : "Generate Your Validated Reward"}
      </h3>
      <p style={{ ...font(400, "13px"), marginBottom: "16px", lineHeight: 1.5 }}>
        Original neo-brutalist badge art, generated for sessions with calm enough average stress and strong enough answers, then saved to your AuraSync history.
      </p>
      {rewardError && (
        <div style={{ ...b2, padding: "10px", background: C.red, marginBottom: "12px", ...font(700, "13px") }}>{rewardError}</div>
      )}
      <button
        className="btn"
        onClick={onRetry}
        disabled={rewarding}
        style={{ width: "100%", padding: "14px", ...b4, background: C.black, color: C.white, boxShadow: sh.md, ...font(700, "13px", true) }}
      >
        {rewarding ? "Generating..." : "Generate Badge →"}
      </button>
    </div>
  );
}

export default function Report() {
  const { sessionId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState(location.state?.session ?? null);
  const [events, setEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(!session);
  const [rewarding, setRewarding] = useState(false);
  const [rewardError, setRewardError] = useState("");
  const xpEarned = location.state?.xpEarned ?? session?.xpEarned ?? 0;
  const passed = location.state?.passed ?? session?.passed ?? false;

  const perQAnswers      = location.state?.perQAnswers     ?? {};
  const sessionQuestions = location.state?.questions      ?? session?.questions ?? [];
  const questionMeta     = location.state?.questionMeta   ?? session?.questionMeta ?? [];
  const biometricHistory = location.state?.biometricHistory ?? [];
  const reviewData       = location.state?.reviewData     ?? { questionReviews: session?.answerReviews ?? [], overallReview: session?.overallReview ?? null };
  const biometricScore   = location.state?.biometricScore ?? 60;
  const questionReviews  = reviewData?.questionReviews ?? [];
  const overallReview    = reviewData?.overallReview ?? null;

  useEffect(() => {
    const s = document.createElement("style");
    s.innerHTML = GLOBAL_CSS;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  useEffect(() => {
    if (!sessionId || !token) return;
    Promise.all([
      fetch(`${API}/api/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/api/sessions/leaderboard/top`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([sessionData, lbData]) => {
      if (sessionData.session) setSession(sessionData.session);
      if (sessionData.events) setEvents(sessionData.events);
      if (lbData.leaderboard) setLeaderboard(lbData.leaderboard);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId, token]);

  // Prefer live history from LiveSession (already in {t, stress, hr} shape)
  const biometricChartData = biometricHistory.length > 2
    ? biometricHistory
    : (() => {
        const bioSamples = session?.biometrics ?? [];
        const t0 = bioSamples[0]?.timestamp ?? 0;
        return bioSamples
          .filter((_, i) => i % 2 === 0)
          .map((b) => ({
            t: Math.round((b.timestamp - t0) / 1000),
            stress: Math.round(b.stressScore * 100),
            hr: b.heartRate ?? 72,
            wpm: b.wpm ?? 0,
          }));
      })();

  const sessionDuration = biometricChartData.length > 1
    ? (biometricChartData[biometricChartData.length - 1].t ?? 0)
    : 1;

  // Average stress from chart data
  const avgStressPct = biometricChartData.length > 0
    ? Math.round(biometricChartData.reduce((s, b) => s + (b.stress ?? 0), 0) / biometricChartData.length)
    : Math.round((session?.biometrics ?? []).reduce((s, b) => s + b.stressScore, 0) / Math.max(1, (session?.biometrics ?? []).length) * 100);
  const stressLevel = getStressLevel(avgStressPct);
  const avgAnswerScore = getAverageQuestionScore(questionReviews);
  const communicationScore = Math.round(overallReview?.communicationScore ?? session?.score ?? biometricScore ?? 0);
  const overallScore = Math.round(overallReview?.score ?? session?.score ?? 0);
  const rewardBlockers = [];
  if (avgAnswerScore < REWARD_ANSWER_THRESHOLD) {
    rewardBlockers.push(`Bring answer quality up to at least ${REWARD_ANSWER_THRESHOLD}/100.`);
  }
  if (avgStressPct > REWARD_STRESS_THRESHOLD) {
    rewardBlockers.push(`Keep average stress at ${REWARD_STRESS_THRESHOLD}% or lower.`);
  }
  const rewardEligible = passed && rewardBlockers.length === 0;

  // Question markers evenly spread across session
  const allQuestions = sessionQuestions.length > 0 ? sessionQuestions : (session?.questions ?? []);
  const totalQ = allQuestions.length;
  const markerPadding = Math.max(2, Math.round(sessionDuration * 0.06));
  const questionMarkers = totalQ > 0
    ? allQuestions.map((q, i) => ({
        tSec: totalQ === 1
          ? Math.round(sessionDuration / 2)
          : markerPadding + Math.round((i / Math.max(totalQ - 1, 1)) * Math.max(sessionDuration - markerPadding * 2, 1)),
        label: `Q${i + 1}`,
        question: q,
      }))
    : [];
  const questionStressBreakdown = getQuestionStressBreakdown(biometricChartData, questionMarkers);

  const generateReward = async () => {
    setRewarding(true);
    setRewardError("");
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}/reward`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reward generation failed");
      setSession((prev) => (prev ? {
        ...prev,
        rewardName: data.rewardName,
        rewardSummary: data.rewardSummary,
        rewardImageUrl: data.rewardImageUrl,
        rewardGeneratedAt: data.rewardGeneratedAt,
      } : prev));
    } catch (err) {
      setRewardError(err.message ?? "Reward generation failed");
    } finally {
      setRewarding(false);
    }
  };

  useEffect(() => {
    if (!sessionId || !token || !passed || !session || session.rewardImageUrl || rewarding || !rewardEligible) return;
    generateReward().catch(() => {});
  }, [sessionId, token, passed, session, rewarding, rewardEligible]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ ...font(700, "20px") }}>Loading report...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* Nav */}
      <nav style={{ ...b4, borderTop: "none", borderLeft: "none", borderRight: "none", padding: "0 32px", display: "flex", alignItems: "center", height: "60px", background: C.bg, gap: "16px" }}>
        <BackButton to="/lobby" label="Lobby" />
        <span style={{ ...font(900, "20px"), cursor: "pointer" }} onClick={() => navigate("/")}>
          AURA<span style={{ color: C.red }}>SYNC</span>
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={() => navigate("/profile")} style={{ ...b4, padding: "8px 18px", background: C.violet, boxShadow: sh.sm, ...font(700, "13px", true) }}>
          Profile →
        </button>
        <button className="btn" onClick={() => navigate("/lobby")} style={{ ...b4, padding: "8px 20px", background: C.yellow, boxShadow: sh.sm, ...font(700, "13px", true) }}>
          New Session →
        </button>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ ...font(900, "36px"), marginBottom: "8px" }}>Session Report</h1>
          <p style={{ ...font(400, "15px"), color: "#555" }}>
            {session?.company} · {session?.tier} tier · {new Date(session?.startedAt ?? Date.now()).toLocaleDateString()}
          </p>
        </div>

        {/* Top row: score + XP + reward */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          {/* Score */}
          <div style={{ ...b4, background: C.white, boxShadow: sh.md }}>
            <ScoreGauge
              score={overallScore}
              passed={passed}
              title={overallReview ? "Overall Interview Score" : "Communication & Composure Score"}
              subtitle={overallReview
                ? "60% answer quality and 40% communication/composure."
                : "This score reflects delivery, pacing, fillers, and composure."}
              chips={[
                { label: "Communication & Composure", value: `${communicationScore}/100` },
                { label: "Average Answer Quality", value: `${avgAnswerScore}/100` },
              ]}
            />
          </div>

          {/* XP + Stats */}
          <div style={{ ...b4, background: passed ? C.green : C.white, padding: "24px", boxShadow: sh.md }}>
            <div style={{ ...font(700, "12px", true), marginBottom: "20px" }}>Session Results</div>
            <div style={{ ...font(900, "48px"), lineHeight: 1 }}>+{xpEarned}</div>
            <div style={{ ...font(700, "14px", true), marginBottom: "20px" }}>XP EARNED</div>
            <div style={{ ...b2, padding: "10px 12px", background: "rgba(255,255,255,0.72)", marginBottom: "10px" }}>
              <div style={{ ...font(700, "9px", true), color: "#666", marginBottom: "4px" }}>Score Meaning</div>
              <div style={{ ...font(400, "12px"), lineHeight: 1.6 }}>
                The {communicationScore}/100 number is your communication and composure score. Answer correctness is tracked separately and folded into the overall score above.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "Communication & composure", value: `${communicationScore}/100` },
                { label: "Avg answer quality", value: `${avgAnswerScore}/100` },
                { label: "Avg stress", value: `${avgStressPct}%` },
                { label: "Stress level", value: stressLevel, color: getStressColor(avgStressPct) },
                { label: "Questions answered", value: totalQ || (session?.questions?.length ?? 0) },
                { label: "Coaching notes", value: events.length },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", ...b2, padding: "8px 12px", background: "rgba(255,255,255,0.6)" }}>
                  <span style={{ ...font(400, "13px") }}>{s.label}</span>
                  <span style={{ ...font(700, "13px"), color: s.color ?? C.black }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reward */}
          <RewardCard
            session={session}
            rewarding={rewarding}
            rewardError={rewardError}
            onRetry={generateReward}
            eligible={rewardEligible}
            blockers={rewardBlockers}
            avgStressPct={avgStressPct}
            stressLevel={stressLevel}
            avgAnswerScore={avgAnswerScore}
          />
        </div>

        {/* Biometric charts */}
        {biometricChartData.length > 0 && (
          <>
          <div style={{ ...b4, background: C.white, padding: "24px", boxShadow: sh.md, marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ ...font(700, "12px", true) }}>Stress Timeline with Questions</h3>
              <div style={{ display: "flex", gap: "16px" }}>
                <span style={{ ...font(400, "12px"), display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 3, background: C.red, display: "inline-block" }} /> Stress %
                </span>
                <span style={{ ...font(400, "12px"), display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 3, background: "#000", borderTop: "2px dashed #000", display: "inline-block" }} /> Question
                </span>
                <span style={{ ...font(400, "12px"), display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.yellow, border: "2px solid #000", display: "inline-block" }} /> Question Avg Stress
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={biometricChartData} margin={{ top: 24, right: 18, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" padding={{ left: 16, right: 16 }} tick={{ fontFamily: "Space Grotesk", fontSize: 11 }} tickFormatter={(v) => `${v}s`} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: "Space Grotesk", fontSize: 11 }} />
                <Tooltip
                  formatter={(v, name) => [`${v}${name === "stress" ? "%" : " wpm"}`, name === "stress" ? "Stress" : "WPM"]}
                  labelFormatter={(v) => `${v}s`}
                  contentStyle={{ fontFamily: "Space Grotesk", fontSize: 12, border: "2px solid #000" }}
                />
                <Area type="monotone" dataKey="stress" stroke={C.red} fill={C.red} fillOpacity={0.15} name="stress" strokeWidth={2} />
                {questionMarkers.map((m) => (
                  <ReferenceLine
                    key={m.label}
                    x={m.tSec}
                    stroke="#000"
                    strokeDasharray="5 3"
                    strokeWidth={1.5}
                    label={{ value: m.label, position: "insideTop", offset: 6, fontFamily: "Space Grotesk", fontSize: 10, fontWeight: 700, fill: "#000" }}
                  />
                ))}
                {questionStressBreakdown.map((m) => (
                  <ReferenceDot
                    key={`${m.label}-stress`}
                    x={m.tSec}
                    y={m.displayStressPct}
                    r={6}
                    fill={m.stressColor}
                    stroke="#000"
                    strokeWidth={2}
                    label={{
                      value: `${m.label} ${m.avgStressPct}%`,
                      position: "right",
                      fontFamily: "Space Grotesk",
                      fontSize: 10,
                      fontWeight: 700,
                      fill: m.stressColor,
                    }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            {questionStressBreakdown.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginTop: "16px" }}>
                {questionStressBreakdown.map((item) => (
                  <div key={`${item.label}-chip`} style={{ ...b2, background: "#fafaf8", padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                      <span style={{ ...font(700, "10px", true), color: "#666" }}>{item.label}</span>
                      <span style={{ ...font(700, "10px", true), color: item.stressColor }}>{item.stressLevel}</span>
                    </div>
                    <div style={{ ...font(900, "20px"), color: item.stressColor, lineHeight: 1 }}>{item.avgStressPct}%</div>
                    <div style={{ ...font(400, "11px"), color: "#777", marginTop: 4 }}>Avg stress around this question</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...b4, background: C.white, padding: "24px", boxShadow: sh.md, marginBottom: "16px" }}>
            <h3 style={{ ...font(700, "12px", true), marginBottom: "16px" }}>Speech Speed (WPM) with Questions</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={biometricChartData} margin={{ top: 24, right: 18, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" padding={{ left: 16, right: 16 }} tick={{ fontFamily: "Space Grotesk", fontSize: 11 }} tickFormatter={(v) => `${v}s`} />
                <YAxis tick={{ fontFamily: "Space Grotesk", fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: "Space Grotesk", fontSize: 12, border: "2px solid #000" }} />
                <Area type="monotone" dataKey="wpm" stroke={C.violet} fill={C.violet} fillOpacity={0.25} name="WPM" strokeWidth={2} />
                {questionMarkers.map((m) => (
                  <ReferenceLine key={m.label} x={m.tSec} stroke="#000" strokeDasharray="5 3" strokeWidth={1.5}
                    label={{ value: m.label, position: "insideTop", offset: 6, fontFamily: "Space Grotesk", fontSize: 10, fontWeight: 700, fill: "#000" }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          </>
        )}

        {/* Coach Feed + Leaderboard */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          {/* Coaching Events */}
          <div style={{ ...b4, background: C.white, padding: "24px", boxShadow: sh.md }}>
            <h3 style={{ ...font(700, "12px", true), marginBottom: "16px" }}>Coaching Interventions ({events.length})</h3>
            {events.length === 0 && <p style={{ ...font(400, "13px"), color: "#888" }}>No coaching interventions in this session.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {events.map((ev, i) => (
                <div key={i} style={{ ...b2, padding: "12px 14px", background: "#F5F3FF" }}>
                  <div style={{ ...font(700, "11px", true), color: "#888", marginBottom: "4px" }}>
                    {ev.trigger?.replace(/_/g, " ")}
                  </div>
                  <div style={{ ...font(400, "13px"), lineHeight: 1.5 }}>{ev.coachingNote}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div style={{ ...b4, background: C.white, padding: "24px", boxShadow: sh.md }}>
            <h3 style={{ ...font(700, "12px", true), marginBottom: "16px" }}>Leaderboard</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {leaderboard.slice(0, 10).map((u, i) => (
                <div key={u._id} style={{ display: "flex", alignItems: "center", gap: "12px", ...b2, padding: "10px 14px", background: u._id === user?.id ? C.yellow : "#fafafa" }}>
                  <span style={{ ...font(900, "16px"), width: "24px", flexShrink: 0 }}>#{i + 1}</span>
                  <span style={{ ...font(500, "14px"), flex: 1 }}>{u.displayName}</span>
                  <span style={{ ...font(700, "14px") }}>⚡ {u.xp} XP</span>
                  <span style={{ ...font(400, "12px"), color: "#888" }}>🔥 {u.streak}d</span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p style={{ ...font(400, "13px"), color: "#888" }}>Leaderboard loading...</p>
              )}
            </div>
          </div>
        </div>

        {/* Q&A Transcript — question + candidate answer side by side */}
        {allQuestions.length > 0 && (
          <div style={{ ...b4, background: C.white, padding: "24px", boxShadow: sh.md, marginBottom: "32px" }}>
            <h3 style={{ ...font(700, "12px", true), marginBottom: "20px" }}>
              Interview Transcript ({allQuestions.length} Questions)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {allQuestions.map((q, i) => {
                const rev   = reviewData.questionReviews?.[i];
                const meta  = questionMeta[i];
                const isCoding = meta?.type === "coding";
                const answer = perQAnswers[i] ?? "";
                const questionStress = questionStressBreakdown[i];
                const scoreColor = !rev ? "#888" : rev.score >= 75 ? "#22c55e" : rev.score >= 50 ? C.orange : C.red;
                const verdictBg = !rev ? "#fafafa" : rev.verdict === "Excellent" ? "#F0FDF4" : rev.verdict === "Good" ? "#FFFBF0" : rev.verdict === "Adequate" ? "#F5F3FF" : rev.verdict === "No Answer" ? "#fafafa" : "#FFF3F3";

                return (
                  <div key={i} style={{ border: "4px solid #000", padding: 0, overflow: "hidden", boxShadow: sh.sm }}>
                    {/* Q header */}
                    <div style={{ background: "#111", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ background: C.yellow, border: "2px solid #000", padding: "1px 9px", borderRadius: 4, ...font(700, "10px", true) }}>Q{i + 1}</span>
                      <span style={{ ...font(700, "10px", true), color: "#888", textTransform: "uppercase" }}>{meta?.type ?? "behavioral"}</span>
                      {questionStress && (
                        <span style={{ ...b2, padding: "2px 8px", background: "#fff", ...font(700, "10px", true), color: questionStress.stressColor, borderColor: questionStress.stressColor }}>
                          Stress {questionStress.avgStressPct}% · {questionStress.stressLevel}
                        </span>
                      )}
                      {rev && <span style={{ marginLeft: "auto", ...font(900, "16px"), color: scoreColor }}>{rev.score}/100</span>}
                      {rev && <span style={{ ...b2, padding: "2px 8px", background: verdictBg, ...font(700, "10px", true), color: scoreColor, borderColor: scoreColor }}>{rev.verdict}</span>}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                      {/* Left: Question + Review */}
                      <div style={{ padding: "14px 16px", borderRight: "2px solid #eee" }}>
                        <div style={{ ...font(700, "9px", true), color: "#aaa", marginBottom: 6 }}>QUESTION</div>
                        <div style={{ ...font(400, "13px"), lineHeight: 1.6, color: "#111", marginBottom: rev ? 12 : 0 }}>{q}</div>
                        {rev && (
                          <>
                            <div style={{ ...font(700, "9px", true), color: "#aaa", marginBottom: 6, marginTop: 12 }}>AI FEEDBACK</div>
                            <div style={{ ...font(400, "12px"), lineHeight: 1.6, color: "#333", marginBottom: 10 }}>{rev.feedback}</div>
                            {rev.strengths?.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <div style={{ ...font(700, "9px", true), color: "#22c55e", marginBottom: 4 }}>STRENGTHS</div>
                                {rev.strengths.map((s, si) => <div key={si} style={{ ...font(400, "11px"), color: "#333", paddingLeft: 8, marginBottom: 2 }}>• {s}</div>)}
                              </div>
                            )}
                            {rev.improvements?.length > 0 && (
                              <div>
                                <div style={{ ...font(700, "9px", true), color: C.red, marginBottom: 4 }}>IMPROVEMENTS</div>
                                {rev.improvements.map((s, si) => <div key={si} style={{ ...font(400, "11px"), color: "#333", paddingLeft: 8, marginBottom: 2 }}>• {s}</div>)}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Right: Candidate answer */}
                      <div style={{ padding: "14px 16px", background: answer ? (isCoding ? "#0d1117" : "#FAFAF8") : "#fafafa" }}>
                        <div style={{ ...font(700, "9px", true), color: isCoding && answer ? C.green : "#aaa", marginBottom: 6 }}>
                          {isCoding ? "YOUR CODE" : "YOUR ANSWER"}
                        </div>
                        {isCoding && answer ? (
                          <pre style={{ fontFamily: "monospace", fontSize: 12, color: "#e6edf3", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
                            {answer}
                          </pre>
                        ) : (
                          <div style={{ ...font(400, "13px"), lineHeight: 1.6, color: answer ? "#111" : "#ccc", fontStyle: answer ? "normal" : "italic" }}>
                            {answer || "No answer recorded."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Overall AI Review */}
        {reviewData.overallReview && (
          <div style={{ ...b4, background: C.black, color: C.white, padding: "32px", boxShadow: sh.md, marginBottom: "32px" }}>
            <div style={{ ...font(700, "11px", true), color: "#666", marginBottom: 20 }}>AI HIRING COMMITTEE REVIEW</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "32px", alignItems: "start" }}>
              {/* Recommendation */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  padding: "16px 24px", border: "4px solid",
                  borderColor: reviewData.overallReview.recommendation === "Strong Hire" ? C.green : reviewData.overallReview.recommendation === "Hire" ? C.yellow : reviewData.overallReview.recommendation === "Maybe" ? C.orange : C.red,
                  ...font(900, "15px", true),
                  color: reviewData.overallReview.recommendation === "Strong Hire" ? C.green : reviewData.overallReview.recommendation === "Hire" ? C.yellow : reviewData.overallReview.recommendation === "Maybe" ? C.orange : C.red,
                  marginBottom: 12,
                }}>
                  {reviewData.overallReview.recommendation}
                </div>
                <div style={{ ...font(900, "42px"), color: C.white, lineHeight: 1 }}>{reviewData.overallReview.score}</div>
                <div style={{ ...font(700, "10px", true), color: "#666" }}>OVERALL SCORE</div>
              </div>
              {/* Details */}
              <div>
                <div style={{ ...font(700, "10px", true), color: "#666", marginBottom: 10 }}>
                  Score mix: 60% answer quality · 40% communication and composure
                </div>
                <div style={{ ...font(400, "14px"), color: "#bbb", lineHeight: 1.7, marginBottom: 20 }}>{reviewData.overallReview.summary}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { label: "Technical", value: reviewData.overallReview.technicalStrength },
                    { label: "Communication & Composure", value: reviewData.overallReview.communicationScore },
                    { label: "Cultural Fit", value: reviewData.overallReview.culturalFit },
                  ].map((m) => (
                    <div key={m.label} style={{ border: "2px solid #333", padding: "12px 14px" }}>
                      <div style={{ ...font(700, "9px", true), color: "#555", marginBottom: 6 }}>{m.label}</div>
                      <div style={{ height: 6, background: "#222", borderRadius: 3, marginBottom: 4 }}>
                        <div style={{ height: "100%", width: `${m.value}%`, background: m.value >= 70 ? C.green : m.value >= 50 ? C.yellow : C.red, borderRadius: 3, transition: "width 1s" }} />
                      </div>
                      <div style={{ ...font(900, "20px"), color: C.white }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
