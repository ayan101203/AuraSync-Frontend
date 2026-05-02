import { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSessionWebSocket } from "../hooks/useWebSocket";
import { useBiometric } from "../hooks/useBiometric";
import InterviewMascot, { MascotStyles } from "../components/InterviewMascot";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import BackButton from "../components/BackButton";

const C = { bg: "#FFFDF5", black: "#000", red: "#FF6B6B", yellow: "#FFD93D", violet: "#C4B5FD", white: "#fff", green: "#A8F0C6", orange: "#FFA552", dark: "#0d1117" };
const sh = { sm: "4px 4px 0px 0px #000", md: "8px 8px 0px 0px #000" };
const font = (w = 700, sz = "16px", caps = false) => ({
  fontFamily: "'Space Grotesk', sans-serif", fontWeight: w, fontSize: sz,
  ...(caps ? { textTransform: "uppercase", letterSpacing: "0.1em" } : {}),
});
const b4 = { border: "4px solid #000" };
const b2 = { border: "2px solid #000" };

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&display=block');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #FFFDF5; }
  .btn { cursor:pointer; transition:transform 0.1s,box-shadow 0.1s; user-select:none; outline:none; }
  .btn:hover:not(:disabled) { transform:translate(-2px,-2px); }
  .btn:active:not(:disabled) { transform:translate(4px,4px); box-shadow:none !important; }
  .btn:disabled { opacity:0.45; cursor:not-allowed; }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(255,107,107,0.7), 4px 4px 0px 0px #000; }
    70%  { box-shadow: 0 0 0 16px rgba(255,107,107,0), 4px 4px 0px 0px #000; }
    100% { box-shadow: 0 0 0 0 rgba(255,107,107,0), 4px 4px 0px 0px #000; }
  }
  .rec-pulse { animation: pulse-ring 1.1s ease-out infinite; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .fade-up { animation: fadeUp 0.28s ease-out forwards; }
  @keyframes soundbar { 0%,100%{height:4px;} 50%{height:16px;} }
  .sb1{animation:soundbar 0.65s ease-in-out infinite;}
  .sb2{animation:soundbar 0.65s ease-in-out infinite 0.09s;}
  .sb3{animation:soundbar 0.65s ease-in-out infinite 0.18s;}
  .sb4{animation:soundbar 0.65s ease-in-out infinite 0.27s;}
  .sb5{animation:soundbar 0.65s ease-in-out infinite 0.36s;}
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; display: inline-block; }
`;

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const MASCOT_SELF_INTRO = "Hi, I'm your AuraSync interview mascot. Let's start with a quick introduction.";

function buildQuestionPrompt(question, questionIndex) {
  if (!question) return "";
  return questionIndex === 0 ? `${MASCOT_SELF_INTRO} ${question}` : question;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function normalizeCoachEvent(event, startedAtMs, fallbackId) {
  const createdAtMs = event?.createdAt ? new Date(event.createdAt).getTime() : Date.now();
  const safeStartedAt = Number.isFinite(startedAtMs) && startedAtMs > 0 ? startedAtMs : createdAtMs;
  const explicitElapsed = Number.isFinite(event?.elapsed) ? event.elapsed : null;
  return {
    id: event?._id ?? event?.id ?? fallbackId ?? `${event?.trigger ?? "periodic"}-${createdAtMs}`,
    note: event?.coachingNote ?? event?.note ?? "",
    trigger: event?.trigger ?? "periodic",
    elapsed: explicitElapsed ?? Math.max(0, Math.floor((createdAtMs - safeStartedAt) / 1000)),
    createdAtMs,
  };
}

function isSameCoachEvent(a, b) {
  if (a?.id && b?.id && a.id === b.id) return true;
  return (
    a?.trigger === b?.trigger &&
    (a?.note ?? "").trim() === (b?.note ?? "").trim() &&
    Math.abs((a?.elapsed ?? 0) - (b?.elapsed ?? 0)) <= 8
  );
}

function mergeCoachEvents(existing, incoming) {
  const next = [...existing];
  for (const event of incoming) {
    const matchIndex = next.findIndex((current) => isSameCoachEvent(current, event));
    if (matchIndex === -1) next.push(event);
    else next[matchIndex] = { ...next[matchIndex], ...event, id: event.id ?? next[matchIndex].id };
  }
  return next.sort((a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0));
}

// ─── Code Editor ──────────────────────────────────────────────────────────────
function CodeEditor({ value, onChange }) {
  const taRef = useRef(null);
  const lineCount = (value.match(/\n/g) || []).length + 1;

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end   = e.target.selectionEnd;
      const next  = value.substring(0, start) + "  " + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        if (taRef.current) {
          taRef.current.selectionStart = start + 2;
          taRef.current.selectionEnd   = start + 2;
        }
      });
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: C.dark }}>
      {/* Line numbers */}
      <div style={{
        background: "#161b22", color: "#484f58", padding: "14px 10px 14px 8px",
        textAlign: "right", userSelect: "none", flexShrink: 0, minWidth: 44,
        fontFamily: "monospace", fontSize: 13, lineHeight: "20px", overflowY: "hidden",
      }}>
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      {/* Textarea */}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        style={{
          flex: 1, background: "transparent", color: "#e6edf3",
          border: "none", outline: "none", resize: "none",
          padding: "14px 14px 14px 10px",
          fontFamily: "'Fira Code', 'Courier New', monospace",
          fontSize: 13, lineHeight: "20px", tabSize: 2,
        }}
      />
    </div>
  );
}

// ─── Test Runner ──────────────────────────────────────────────────────────────
function runTestCase(code, testCase) {
  try {
    // Wrap in IIFE with solution extraction
    // eslint-disable-next-line no-new-func
    const fn = new Function(`${code}\nif(typeof solution !== 'undefined') return solution; throw new Error('solution function not defined');`)();
    const result = fn(...testCase.args);
    const pass = JSON.stringify(result) === JSON.stringify(testCase.expected);
    return { pass, result: JSON.stringify(result), error: null };
  } catch (e) {
    return { pass: false, result: null, error: e.message };
  }
}

function TestPanel({ testCases, codeValue, onRun, results }) {
  const allPass = results.length > 0 && results.every((r) => r.pass);
  const passCount = results.filter((r) => r.pass).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "2px solid #000", flexShrink: 0 }}>
        <span style={{ ...font(700, "11px", true), color: "#555" }}>
          Test Cases {results.length > 0 && `— ${passCount}/${results.length} Pass`}
        </span>
        <button
          className="btn"
          onClick={onRun}
          style={{ ...b2, padding: "5px 14px", background: C.yellow, boxShadow: sh.sm, ...font(700, "11px", true) }}
        >
          ▶ Run All
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {testCases.map((tc, i) => {
          const r = results[i];
          const status = !r ? "idle" : r.pass ? "pass" : "fail";
          return (
            <div key={i} style={{
              ...b2, padding: "10px 12px",
              background: status === "pass" ? "#F0FDF4" : status === "fail" ? "#FFF3F3" : "#fafaf8",
              borderColor: status === "pass" ? "#22c55e" : status === "fail" ? C.red : "#ddd",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ ...font(700, "10px", true), color: "#555" }}>Test {i + 1}</span>
                {r && (
                  <span style={{ ...font(700, "10px", true), color: r.pass ? "#22c55e" : C.red }}>
                    {r.pass ? "✓ PASS" : "✗ FAIL"}
                  </span>
                )}
              </div>
              <div style={{ ...font(400, "11px"), color: "#444", fontFamily: "monospace", lineHeight: 1.5 }}>
                {tc.display}
              </div>
              {r && !r.pass && (
                <div style={{ marginTop: 6, ...font(400, "11px"), color: C.red, fontFamily: "monospace" }}>
                  {r.error ? `Error: ${r.error}` : `Got: ${r.result}`}
                </div>
              )}
              <div style={{ marginTop: 4, ...font(400, "10px"), color: "#aaa" }}>{tc.description}</div>
            </div>
          );
        })}
      </div>
      {allPass && (
        <div style={{ padding: "10px 14px", background: "#F0FDF4", borderTop: "2px solid #22c55e", ...font(700, "12px"), color: "#16a34a", textAlign: "center", flexShrink: 0 }}>
          ✓ All tests passed!
        </div>
      )}
    </div>
  );
}

// ─── Stress mini chart ────────────────────────────────────────────────────────
function StressChart({ data }) {
  if (!data || data.length < 2) return (
    <div style={{ height: 75, display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", ...font(400, "10px") }}>
      Stress data...
    </div>
  );
  const latest = data[data.length - 1]?.stress ?? 0;
  const color  = latest >= 70 ? C.red : latest >= 40 ? C.orange : C.green;
  return (
    <ResponsiveContainer width="100%" height={75}>
      <AreaChart data={data} margin={{ top: 3, right: 3, left: -30, bottom: 0 }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.5} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="t" tick={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 8, fontFamily: "Space Grotesk" }} />
        <Tooltip formatter={(v) => [`${v}%`, "Stress"]} contentStyle={{ fontFamily: "Space Grotesk", fontSize: 10, border: "2px solid #000", padding: "3px 7px" }} />
        <Area type="monotoneX" dataKey="stress" stroke={color} fill="url(#sg)" strokeWidth={2} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Biometric HUD ────────────────────────────────────────────────────────────
function BiometricHUD({ biometrics, sessionTime, wsConnected, stressHistory }) {
  const { stressScore, heartRate, wpm, fillerWordsPerMin } = biometrics;
  const stressPct   = Math.round(stressScore * 100);
  const stressColor = stressPct >= 70 ? C.red : stressPct >= 40 ? C.orange : C.green;
  return (
    <div style={{ ...b4, background: C.white, padding: "12px", boxShadow: sh.md, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...font(700, "9px", true), color: "#555" }}>Presage Biometrics</span>
        <div style={{ ...b2, padding: "2px 6px", background: wsConnected ? C.green : C.red, ...font(700, "8px", true) }}>
          {wsConnected ? "LIVE" : "OFFLINE"}
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ ...font(700, "9px", true) }}>Stress</span>
          <span style={{ ...font(900, "16px"), color: stressColor, transition: "color 0.5s" }}>{stressPct}%</span>
        </div>
        <div style={{ height: 9, background: "#eee", ...b2, overflow: "hidden", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${stressPct}%`, background: stressColor, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1), background 1s" }} />
        </div>
        <div style={{ ...font(400, "9px"), color: "#888", marginTop: 2 }}>
          {stressPct >= 70 ? "High — breathe" : stressPct >= 40 ? "Moderate" : "Low — great"}
        </div>
      </div>
      <div style={{ ...b2, padding: "4px 3px 2px", background: "#fafaf8" }}>
        <div style={{ ...font(700, "8px", true), color: "#aaa", paddingLeft: 3, marginBottom: 1 }}>Timeline</div>
        <StressChart data={stressHistory} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { label: "HR",      value: heartRate, unit: "BPM", warn: heartRate > 100 },
          { label: "WPM",     value: wpm,       unit: "wpm", warn: wpm > 0 && (wpm < 80 || wpm > 210) },
          { label: "Fillers", value: `${fillerWordsPerMin.toFixed(1)}`, unit: "/min", warn: fillerWordsPerMin >= 5 },
          { label: "Time",    value: formatTime(sessionTime), unit: "", warn: false },
        ].map((m) => (
          <div key={m.label} style={{ ...b2, padding: "6px 8px", background: m.warn ? "#FFF3F3" : "#f9f9f7" }}>
            <div style={{ ...font(700, "8px", true), color: "#888", marginBottom: 1 }}>{m.label}</div>
            <div style={{ ...font(900, "15px"), color: m.warn ? C.red : C.black }}>{m.value}</div>
            {m.unit && <div style={{ ...font(400, "8px"), color: "#aaa" }}>{m.unit}</div>}
          </div>
        ))}
      </div>
      <div style={{ ...font(400, "8px"), color: "#ccc", textAlign: "center" }}>Presage SDK</div>
    </div>
  );
}

// ─── Coach Feed ───────────────────────────────────────────────────────────────
function CoachFeed({ events }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [events.length]);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <span style={{ ...font(700, "11px", true), color: "#555", padding: "12px 14px 10px", flexShrink: 0, borderBottom: "2px solid #eee" }}>Coach Notes</span>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {events.length === 0 && (
          <div style={{ ...font(400, "11px"), color: "#ccc", textAlign: "center", marginTop: 20, lineHeight: 1.7 }}>
            Real-time coaching will appear here.
          </div>
        )}
        {events.map((ev, i) => (
          <div key={i} className="fade-up" style={{
            ...b2, padding: "8px 10px",
            background: ev.trigger === "stress_spike" ? "#FFF3F3" : ev.trigger === "filler_surge" ? "#FFFBF0" : "#F5F3FF",
            fontSize: 0,
          }}>
            <div style={{ ...font(700, "9px", true), color: "#888", marginBottom: 3 }}>
              {ev.trigger?.replace(/_/g, " ")} · {formatTime(ev.elapsed ?? 0)}
            </div>
            <div style={{ ...font(400, "11px"), lineHeight: 1.5 }}>{ev.note}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function SoundBars() {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 18 }}>
      {["sb1","sb2","sb3","sb4","sb5"].map((c) => (
        <div key={c} className={c} style={{ width: 4, background: "#fff", borderRadius: 2, minHeight: 4 }} />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LiveSession() {
  const { sessionId } = useParams();
  const { token }     = useAuth();
  const navigate      = useNavigate();

  const videoRef          = useRef(null);
  const mediaStreamRef    = useRef(null);
  const recognitionRef    = useRef(null);
  const stressPauseTimerRef = useRef(null);
  const startTimeRef      = useRef(Date.now());
  const transcriptRef     = useRef("");
  const finalSegmentRef   = useRef("");
  const liveInterimRef    = useRef("");
  const sessionStartedAtRef = useRef(Date.now());
  const isRecordingRef    = useRef(false);
  const hasSpokenOpeningRef = useRef(false);
  const questionStartedAtRef = useRef(Date.now());
  // ★ These refs always hold the latest state so rec.onend (stale closure) can read them
  const currentQRef       = useRef(0);
  const questionsRef      = useRef([]);
  const perQAnswersRef    = useRef({});
  const processSpokenRef  = useRef(null);  // ref to processSpokenText

  const [session,           setSession]           = useState(null);
  const [questions,         setQuestions]         = useState([]);
  const [questionMeta,      setQuestionMeta]      = useState([]);
  const [currentQ,          setCurrentQ]          = useState(0);
  const [wsConnected,       setWsConnected]       = useState(false);
  const [recording,         setRecording]         = useState(false);
  const [processing,        setProcessing]        = useState(false);
  const [displayTranscript, setDisplayTranscript] = useState("");
  const [liveInterim,       setLiveInterim]       = useState("");
  const [coachEvents,       setCoachEvents]       = useState([]);
  const [sessionTime,       setSessionTime]       = useState(0);
  const [ending,            setEnding]            = useState(false);
  const [endingMsg,         setEndingMsg]         = useState("");
  const [camReady,          setCamReady]          = useState(false);
  const [sttAvailable,      setSttAvailable]      = useState(false);
  const [sttError,          setSttError]          = useState("");
  const [mascotState,       setMascotState]       = useState("idle");
  const [perQAnswers,       setPerQAnswers]       = useState({});
  const [codeByQ,           setCodeByQ]           = useState({});
  const [testResults,       setTestResults]       = useState({});
  const [ttsVoice,          setTtsVoice]          = useState(null);
  const [stressPause,       setStressPause]       = useState({ active: false, note: "" });

  // Keep refs in sync with state so stale-closure callbacks always read current values
  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { perQAnswersRef.current = perQAnswers; }, [perQAnswers]);

  const mergeFetchedCoachEvents = useCallback((events, startedAt) => {
    if (startedAt) {
      const startedAtMs = new Date(startedAt).getTime();
      if (Number.isFinite(startedAtMs)) sessionStartedAtRef.current = startedAtMs;
    }
    const normalized = (events ?? []).map((event, index) =>
      normalizeCoachEvent(event, sessionStartedAtRef.current, `coach-${index}-${event?._id ?? event?.createdAt ?? Date.now()}`)
    );
    if (normalized.length === 0) return;
    setCoachEvents((prev) => mergeCoachEvents(prev, normalized));
  }, []);

  const buildCurrentAnswerDraft = useCallback((
    questionIndex = currentQRef.current,
    finalText = finalSegmentRef.current,
    interimText = liveInterimRef.current
  ) => {
    const savedAnswer = perQAnswersRef.current[questionIndex] ?? "";
    return [savedAnswer, finalText, interimText].filter(Boolean).join(" ").trim();
  }, []);

  const playCoachingAudio = useCallback((audioBase64) => {
    if (!audioBase64) return;
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audio.volume = 0.85;
      audio.play().catch(() => {});
    } catch {
      // Text note is still shown in the coach feed.
    }
  }, []);

  useEffect(() => {
    const s = document.createElement("style");
    s.innerHTML = GLOBAL_CSS;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  useEffect(() => {
    return () => {
      if (stressPauseTimerRef.current) clearTimeout(stressPauseTimerRef.current);
    };
  }, []);

  // Webcam init — keep stream ref for cleanup
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        mediaStreamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.muted = true; videoRef.current.play(); }
        setCamReady(true);
      })
      .catch(() => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          .then((s) => { mediaStreamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; setCamReady(true); })
          .catch(() => setCamReady(false));
      });

    // Stop all tracks on unmount
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // TTS voice
  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find((v) => /en[-_](US|GB)/i.test(v.lang) && /female|woman|samantha|zira|susan|karen|moira|victoria/i.test(v.name))
             || voices.find((v) => /en[-_](US|GB|AU)/i.test(v.lang) && v.localService)
             || voices.find((v) => /en/i.test(v.lang))
             || null;
      setTtsVoice(v);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // STT
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSttError("Speech recognition unavailable — use Chrome or Edge."); return; }
    setSttAvailable(true);
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalSegmentRef.current += (finalSegmentRef.current ? " " : "") + t.trim();
        } else { interim += t; }
      }
      liveInterimRef.current = interim;
      setLiveInterim(interim);
      const combined = buildCurrentAnswerDraft(currentQRef.current, finalSegmentRef.current, interim);
      setDisplayTranscript(combined);
    };

    rec.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      if (event.error === "network") {
        setSttError("Speech API blocked (network/VPN). Try Chrome without VPN, or allow mic in site settings.");
      } else { setSttError(`Mic error: ${event.error}`); }
    };

    rec.onend = () => {
      liveInterimRef.current = "";
      setLiveInterim("");
      if (isRecordingRef.current) {
        isRecordingRef.current = false;
        setRecording(false);
        const spoken = finalSegmentRef.current.trim();
        // ★ use ref so we always get the latest version — avoids stale closure
        if (spoken) processSpokenRef.current?.(spoken);
        else setSttError("No speech detected — click Start Recording and speak clearly.");
      }
    };

    recognitionRef.current = rec;
    return () => { try { rec.abort(); } catch { /**/ } };
  }, [buildCurrentAnswerDraft]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const id = setInterval(() => setSessionTime(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!sessionId || !token) return;
    fetch(`${API}/api/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.session) {
          const startedAtMs = new Date(d.session.startedAt ?? Date.now()).getTime();
          if (Number.isFinite(startedAtMs)) sessionStartedAtRef.current = startedAtMs;
          setSession(d.session);
          setQuestions(d.session.questions ?? []);
          setQuestionMeta(d.session.questionMeta ?? []);
          mergeFetchedCoachEvents(d.events ?? [], d.session.startedAt);
          // Pre-fill starter code for coding questions
          const initCode = {};
          (d.session.questionMeta ?? []).forEach((m, i) => {
            if (m?.type === "coding" && m?.starterCode) initCode[i] = m.starterCode;
          });
          setCodeByQ(initCode);
        }
      })
      .catch(console.error);
  }, [sessionId, token, mergeFetchedCoachEvents]);

  useEffect(() => {
    if (!sessionId || !token) return;
    const intervalId = setInterval(() => {
      fetch(`${API}/api/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d?.session) return;
          mergeFetchedCoachEvents(d.events ?? [], d.session.startedAt);
        })
        .catch(() => {});
    }, 9000);
    return () => clearInterval(intervalId);
  }, [sessionId, token, mergeFetchedCoachEvents]);

  const speakTextRef = useRef(null);
  const speakText = useCallback((text, onDone) => {
    if (!text) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.91; utt.pitch = 1.05;
    if (ttsVoice) utt.voice = ttsVoice;
    utt.onend = () => { setMascotState("idle"); onDone?.(); };
    utt.onerror = () => { setMascotState("idle"); onDone?.(); };
    window.speechSynthesis.speak(utt);
  }, [ttsVoice]);
  speakTextRef.current = speakText;

  const speakQuestion = useCallback((questionText, questionIndex) => {
    const prompt = buildQuestionPrompt(questionText, questionIndex);
    questionStartedAtRef.current = Date.now();
    finalSegmentRef.current = "";
    liveInterimRef.current = "";
    setLiveInterim("");
    setDisplayTranscript("");
    setSttError("");
    if (!prompt) {
      setMascotState("idle");
      return;
    }
    setMascotState("speaking");
    speakTextRef.current?.(prompt);
  }, []);

  // Auto-speak first question
  useEffect(() => {
    if (questions.length === 0 || hasSpokenOpeningRef.current) return;
    hasSpokenOpeningRef.current = true;
    speakQuestion(questions[0], 0);
  }, [questions, speakQuestion]);

  const { biometrics, tick: tickBiometric, stressHistory } = useBiometric({ videoRef });

  const clearStressPause = useCallback(() => {
    if (stressPauseTimerRef.current) {
      clearTimeout(stressPauseTimerRef.current);
      stressPauseTimerRef.current = null;
    }
    setStressPause((prev) => (prev.active ? { ...prev, active: false } : prev));
    setMascotState("idle");
  }, []);

  const pauseForStressSpike = useCallback((note, audioBase64) => {
    const calmNote = note?.trim() || "Pause for a breath. Relax your shoulders, take your time, and continue only when you feel steady.";
    window.speechSynthesis.cancel();

    if (recording || isRecordingRef.current) {
      isRecordingRef.current = true;
      try { recognitionRef.current?.stop(); } catch { /**/ }
      setRecording(false);
    }

    setProcessing(false);
    setStressPause({ active: true, note: calmNote });
    setMascotState("speaking");

    if (audioBase64) playCoachingAudio(audioBase64);
    else speakTextRef.current?.(calmNote, () => setMascotState("idle"));

    if (stressPauseTimerRef.current) clearTimeout(stressPauseTimerRef.current);
    stressPauseTimerRef.current = setTimeout(() => {
      setStressPause((prev) => ({ ...prev, active: false }));
      setMascotState("idle");
      stressPauseTimerRef.current = null;
    }, 12000);
  }, [playCoachingAudio, recording]);

  const onWsMessage = useCallback((msg) => {
    if (msg.type === "connected" && msg.questions?.length) { setQuestions(msg.questions); }
    if (msg.type === "coaching") {
      const liveEvent = normalizeCoachEvent(
        {
          id: `live-${msg.trigger ?? "periodic"}-${Date.now()}`,
          coachingNote: msg.coachingNote,
          trigger: msg.trigger,
          createdAt: new Date().toISOString(),
        },
        sessionStartedAtRef.current,
      );
      setCoachEvents((prev) => mergeCoachEvents(prev, [liveEvent]));
      if (msg.trigger === "stress_spike") pauseForStressSpike(msg.coachingNote, msg.audioBase64);
      else playCoachingAudio(msg.audioBase64);
    }
  }, [pauseForStressSpike, playCoachingAudio]);

  const { send } = useSessionWebSocket({ token, sessionId, onMessage: onWsMessage, onConnected: () => setWsConnected(true), onDisconnected: () => setWsConnected(false) });

  useEffect(() => {
    const id = setInterval(() => {
      const answerElapsed = Math.max(1, (Date.now() - questionStartedAtRef.current) / 1000);
      const currentAnswerDraft = buildCurrentAnswerDraft();
      const reading = tickBiometric(currentAnswerDraft, answerElapsed);
      send({
        type: "telemetry",
        ...reading,
        transcriptSoFar: currentAnswerDraft,
        currentQuestion: questionsRef.current[currentQRef.current] ?? "",
      });
    }, 3000);
    return () => clearInterval(id);
  }, [send, tickBiometric, buildCurrentAnswerDraft]);

  // ★ useCallback so we can assign to processSpokenRef and always have latest closure via refs
  const processSpokenText = useCallback(async (spokenText) => {
    // Read current values from refs — safe even inside stale-closure callbacks
    const qIdx      = currentQRef.current;
    const qList     = questionsRef.current;
    const existingAnswer = perQAnswersRef.current[qIdx] ?? "";
    const nextAnswer = [existingAnswer, spokenText].filter(Boolean).join(" ").trim();

    setSttError("");
    setMascotState("thinking");
    setProcessing(true);

    // Store answer for this specific question index
    setPerQAnswers((prev) => {
      const next = { ...prev };
      next[qIdx] = nextAnswer;
      perQAnswersRef.current = next;
      return next;
    });

    const updated = (transcriptRef.current + " " + spokenText).trim();
    transcriptRef.current = updated;
    finalSegmentRef.current = "";
    liveInterimRef.current = "";
    setLiveInterim("");
    setDisplayTranscript(nextAnswer);
    send({ type: "transcript", segment: spokenText, question: qList[qIdx] ?? "", fullTranscript: updated });
    setMascotState("idle");
    setProcessing(false);
  }, [send]); // send is stable; all other values read via refs

  // Keep processSpokenRef pointing at the latest version
  processSpokenRef.current = processSpokenText;

  const toggleMic = useCallback(() => {
    if (!sttAvailable || !recognitionRef.current) return;
    if (recording) {
      isRecordingRef.current = true;
      try { recognitionRef.current.stop(); } catch { /**/ }
      setRecording(false);
    } else {
      setSttError(""); finalSegmentRef.current = ""; liveInterimRef.current = ""; setLiveInterim("");
      isRecordingRef.current = false;
      try { recognitionRef.current.start(); setRecording(true); setMascotState("listening"); window.speechSynthesis.cancel(); }
      catch (e) { setSttError("Could not start mic: " + e.message); }
    }
  }, [recording, sttAvailable]);

  const nextQuestion = useCallback(() => {
    if (stressPause.active) return;
    const next = Math.min(currentQRef.current + 1, Math.max(questionsRef.current.length - 1, 0));
    if (next === currentQRef.current) return;
    window.speechSynthesis.cancel();
    currentQRef.current = next;
    setCurrentQ(next);
    finalSegmentRef.current = "";
    liveInterimRef.current = "";
    setLiveInterim("");
    setSttError("");
    setDisplayTranscript("");
    speakQuestion(questionsRef.current[next] ?? "", next);
  }, [speakQuestion, stressPause.active]);

  // Run test cases for current coding question
  const runTests = useCallback(() => {
    const meta = questionMeta[currentQ];
    if (!meta?.testCases) return;
    const code = codeByQ[currentQ] ?? "";
    const results = meta.testCases.map((tc) => runTestCase(code, tc));
    setTestResults((prev) => ({ ...prev, [currentQ]: results }));
    // Store code as answer for coding questions
    setPerQAnswers((prev) => ({ ...prev, [currentQ]: code }));
  }, [questionMeta, currentQ, codeByQ]);

  // ── Stop camera + end session ─────────────────────────────────────────────
  const endSession = useCallback(async () => {
    if (ending) return;
    setEnding(true);
    setEndingMsg("Stopping recording...");
    window.speechSynthesis.cancel();

    // Stop speech recognition
    if (isRecordingRef.current) { try { recognitionRef.current?.abort(); } catch { /**/ } }
    isRecordingRef.current = false;
    setRecording(false);

    // ★ Stop all camera/mic tracks — turns off the camera light
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;

    // Collect all answers (code answers for coding questions)
    const finalAnswers = questions.map((_, i) => {
      const meta = questionMeta[i];
      if (meta?.type === "coding") return codeByQ[i] ?? "";
      return perQAnswers[i] ?? "";
    });

    const avgStress     = biometrics.stressScore;
    const fillerPenalty = Math.min(30, biometrics.fillerWordsPerMin * 3);
    const biometricScore = Math.max(0, Math.min(100, 100 - Math.round(avgStress * 40) - Math.round(fillerPenalty)));

    try {
      setEndingMsg("Saving session...");
      await fetch(`${API}/api/sessions/${sessionId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: biometricScore, transcript: transcriptRef.current, answers: finalAnswers }),
      });

      setEndingMsg("Evaluating answers with AI...");
      let reviewData = null;
      try {
        const reviewRes = await fetch(`${API}/api/sessions/${sessionId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ answers: finalAnswers, biometricScore }),
        });
        if (reviewRes.ok) reviewData = await reviewRes.json();
      } catch { /* evaluation failure shouldn't block navigation */ }

      navigate(`/report/${sessionId}`, {
        state: {
          perQAnswers: Object.fromEntries(finalAnswers.map((a, i) => [i, a])),
          questions,
          questionMeta,
          biometricHistory: stressHistory,
          reviewData,
          biometricScore,
        },
      });
    } catch {
      navigate(`/report/${sessionId}`, {
        state: { perQAnswers: Object.fromEntries(finalAnswers.map((a, i) => [i, a])), questions, questionMeta, biometricHistory: stressHistory },
      });
    }
  }, [ending, biometrics, sessionId, token, navigate, perQAnswers, questions, questionMeta, codeByQ, stressHistory]);

  const currentMeta     = questionMeta[currentQ] ?? {};
  const isCoding        = currentMeta.type === "coding";
  const rawCurrentQuestion = questions[currentQ] ?? "";
  const currentQuestion = rawCurrentQuestion
    ? buildQuestionPrompt(rawCurrentQuestion, currentQ)
    : (questions.length === 0 ? "Loading questions..." : "");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <MascotStyles />

      {/* Top bar */}
      <div style={{ ...b4, borderTop: "none", borderLeft: "none", borderRight: "none", padding: "0 20px", height: 52, display: "flex", alignItems: "center", gap: 12, background: C.bg, flexShrink: 0 }}>
        <BackButton to="/lobby" label="Lobby" style={{ padding: "6px 12px", fontSize: "11px" }} />
        <span style={{ ...font(900, "17px"), cursor: "pointer" }} onClick={() => navigate("/lobby")}>
          AURA<span style={{ color: C.red }}>SYNC</span>
        </span>
        {session && <div style={{ ...b2, padding: "3px 10px", background: C.yellow, ...font(700, "11px", true) }}>{session.company} · {session.tier}</div>}
        {isCoding && <div style={{ ...b2, padding: "3px 10px", background: C.dark, color: C.green, ...font(700, "11px", true) }}>⌨ CODE CHALLENGE</div>}
        <div style={{ flex: 1 }} />
        <span style={{ ...font(700, "13px") }}>Q {currentQ + 1} / {questions.length || 6}</span>
        <div style={{ ...b2, padding: "3px 10px", background: "#f0f0f0", ...font(700, "12px") }}>⏱ {formatTime(sessionTime)}</div>
        <button className="btn" onClick={endSession} disabled={ending}
          style={{ ...b4, padding: "7px 18px", background: C.red, boxShadow: sh.sm, ...font(700, "12px", true) }}>
          {ending ? <><span className="spin">⚙</span> {endingMsg || "Ending..."}</> : "End Session"}
        </button>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 260px", gap: 14, padding: 14, flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* LEFT — biometrics + mascot */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden", minHeight: 0 }}>
          <BiometricHUD biometrics={biometrics} sessionTime={sessionTime} wsConnected={wsConnected} stressHistory={stressHistory} />
          <div style={{ flex: 1, ...b4, background: C.white, boxShadow: sh.md, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 10px", overflow: "hidden", minHeight: 160 }}>
            <InterviewMascot state={mascotState} question={currentQuestion} questionIndex={currentQ} totalQuestions={questions.length || 6} compact />
          </div>
        </div>

        {/* CENTER */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "hidden", minHeight: 0 }}>

          {isCoding ? (
            /* ── CODING VIEW ── */
            <>
              {/* Problem statement */}
              <div style={{ flexShrink: 0, ...b4, background: C.white, padding: "12px 16px", boxShadow: sh.sm }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ background: C.yellow, border: "2px solid #000", padding: "2px 9px", borderRadius: 5, ...font(700, "11px", true), flexShrink: 0 }}>Q{currentQ + 1}</span>
                  <div style={{ ...font(500, "13px"), lineHeight: 1.6, color: "#111" }}>{currentQuestion}</div>
                </div>
              </div>

              {/* Code editor */}
              <div style={{ flex: 1, ...b4, overflow: "hidden", boxShadow: sh.md, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ ...font(700, "10px", true), color: C.green, background: "#161b22", padding: "7px 14px", flexShrink: 0, borderBottom: "2px solid #30363d", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>solution.js</span>
                  <span style={{ marginLeft: "auto", color: "#484f58" }}>JavaScript</span>
                </div>
                <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
                  <CodeEditor
                    value={codeByQ[currentQ] ?? currentMeta.starterCode ?? "function solution() {\n  \n}"}
                    onChange={(v) => setCodeByQ((prev) => ({ ...prev, [currentQ]: v }))}
                  />
                </div>
              </div>

              {/* Controls */}
              <div style={{ flexShrink: 0, display: "flex", gap: 10 }}>
                <button className="btn" onClick={runTests} disabled={stressPause.active}
                  style={{ ...b4, padding: "12px 20px", background: C.green, boxShadow: sh.sm, ...font(700, "13px", true), display: "flex", alignItems: "center", gap: 8 }}>
                  ▶ Run Tests
                </button>
                {currentQ < (questions.length || 6) - 1 && (
                  <button className="btn" onClick={nextQuestion} disabled={stressPause.active}
                    style={{ ...b4, padding: "12px 16px", background: "#f0f0f0", boxShadow: sh.sm, ...font(700, "12px") }}>
                    Next Q →
                  </button>
                )}
              </div>
            </>
          ) : (
            /* ── VIDEO / VERBAL VIEW ── */
            <>
              {/* Full-size video */}
              <div style={{ flex: 1, position: "relative", ...b4, background: "#080808", overflow: "hidden", boxShadow: sh.md, minHeight: 0 }}>
                <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted playsInline />
                {!camReady && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "#555" }}>
                    <span style={{ fontSize: 32 }}>📷</span><span style={{ ...font(500, "13px") }}>Camera unavailable</span>
                  </div>
                )}
                {/* Question overlay */}
                {currentQuestion && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "14px 16px", background: "linear-gradient(to bottom,rgba(0,0,0,0.86) 65%,rgba(0,0,0,0))" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ background: C.yellow, border: "2px solid #000", padding: "2px 9px", borderRadius: 5, ...font(700, "11px", true), flexShrink: 0, marginTop: 2 }}>
                        Q{currentQ + 1} · {currentMeta.type ?? "behavioral"}
                      </div>
                      <div style={{ ...font(500, "14px"), color: "#fff", lineHeight: 1.6, textShadow: "0 1px 5px rgba(0,0,0,0.7)" }}>{currentQuestion}</div>
                    </div>
                  </div>
                )}
                {stressPause.active && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255,253,245,0.92)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                    zIndex: 4,
                  }}>
                    <div style={{ ...b4, background: C.violet, boxShadow: sh.md, maxWidth: 480, width: "100%", padding: "20px 22px", textAlign: "center" }}>
                      <div style={{ ...font(700, "11px", true), marginBottom: 10 }}>Quick Breather</div>
                      <div style={{ ...font(900, "28px"), lineHeight: 1.1, marginBottom: 12 }}>Pause. You are still doing fine.</div>
                      <div style={{ ...font(400, "14px"), lineHeight: 1.7, marginBottom: 16 }}>
                        {stressPause.note}
                      </div>
                      <button
                        className="btn"
                        onClick={clearStressPause}
                        style={{ ...b4, padding: "11px 18px", background: C.yellow, boxShadow: sh.sm, ...font(700, "12px", true) }}
                      >
                        I’m Ready To Continue
                      </button>
                    </div>
                  </div>
                )}
                {/* YOU + REC badges */}
                <div style={{ position: "absolute", bottom: 10, left: 12, display: "flex", gap: 8 }}>
                  <div style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", padding: "3px 10px", borderRadius: 5, ...font(700, "10px", true), color: "rgba(255,255,255,0.8)" }}>YOU</div>
                  {recording && (
                    <div style={{ background: C.red, padding: "3px 9px", borderRadius: 5, ...font(700, "10px", true), color: "#fff", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block" }} /> REC
                    </div>
                  )}
                </div>
                {/* Mascot state */}
                <div style={{ position: "absolute", bottom: 10, right: 12, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", padding: "3px 10px", borderRadius: 5, ...font(700, "10px", true), color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 6 }}>
                  {mascotState === "listening" && <><span style={{ color: C.red }}>●</span> Listening</>}
                  {mascotState === "thinking"  && <><span style={{ color: C.violet }}>●</span> Thinking</>}
                  {mascotState === "speaking"  && <><span style={{ color: C.yellow }}>●</span> Speaking</>}
                  {mascotState === "idle"      && <><span style={{ color: C.green }}>●</span> Ready</>}
                </div>
              </div>

              {/* Live transcript */}
              <div style={{ flexShrink: 0, ...b2, padding: "8px 14px", background: C.white, minHeight: 50, maxHeight: 88, overflowY: "auto" }}>
                <div style={{ ...font(700, "9px", true), color: stressPause.active ? C.red : recording ? C.red : "#aaa", marginBottom: 2 }}>
                  {stressPause.active ? "Recovery pause" : recording ? "● Listening..." : processing ? "⚙ Processing..." : "Your response"}
                </div>
                <div style={{ ...font(400, "12px"), lineHeight: 1.6, color: displayTranscript ? C.black : "#ccc" }}>
                  {stressPause.active ? "Take one slow breath, reset, and continue when you feel steady." : (displayTranscript || "Click Start Recording and speak your answer...")}
                  {liveInterim && <span style={{ color: "#999", fontStyle: "italic" }}> {liveInterim}</span>}
                </div>
              </div>

              {sttError && (
                <div style={{ flexShrink: 0, ...b2, padding: "8px 12px", background: "#FFF3F3", borderColor: C.red, ...font(500, "11px"), color: C.red, lineHeight: 1.5 }}>
                  {sttError}
                </div>
              )}

              {/* Controls */}
              <div style={{ flexShrink: 0, display: "flex", gap: 10 }}>
                <button
                  className={`btn ${recording ? "rec-pulse" : ""}`}
                  onClick={toggleMic}
                  disabled={processing || !camReady || !sttAvailable || stressPause.active}
                  style={{ flex: 1, padding: "13px", ...b4, background: recording ? C.red : C.yellow, boxShadow: recording ? "none" : sh.md, ...font(700, "13px", true), color: recording ? "#fff" : C.black, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}
                >
                  {processing ? <><span>⚙</span> Processing...</> : recording ? <><SoundBars /> Stop Recording</> : <><span style={{ fontSize: 16 }}>🎙</span> Start Recording</>}
                </button>
                {currentQ < (questions.length || 6) - 1 && !recording && (
                  <button className="btn" onClick={nextQuestion} disabled={processing || stressPause.active}
                    style={{ padding: "13px 15px", ...b4, background: "#f0f0f0", boxShadow: sh.sm, ...font(700, "12px") }}>Next Q →</button>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT — test cases (coding) or coach feed */}
        <div style={{ ...b4, background: C.white, boxShadow: sh.md, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {isCoding && currentMeta.testCases ? (
            <TestPanel
              testCases={currentMeta.testCases}
              codeValue={codeByQ[currentQ] ?? ""}
              onRun={runTests}
              results={testResults[currentQ] ?? []}
            />
          ) : (
            <CoachFeed events={coachEvents} />
          )}
        </div>
      </div>
    </div>
  );
}
