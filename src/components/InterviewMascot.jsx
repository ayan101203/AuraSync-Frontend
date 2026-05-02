import { useEffect, useRef, useState } from "react";

// ─── Keyframe CSS ─────────────────────────────────────────────────────────────
const MASCOT_CSS = `
  @keyframes aura-float {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    30%     { transform: translateY(-10px) rotate(-1.5deg); }
    70%     { transform: translateY(-6px) rotate(1deg); }
  }
  @keyframes aura-speak {
    0%,100% { transform: translateY(0px) scaleY(1); }
    20%     { transform: translateY(-6px) scaleY(1.02); }
    60%     { transform: translateY(3px) scaleY(0.99); }
  }
  @keyframes aura-listen {
    0%,100% { transform: translateY(0px) scaleX(1) rotate(0deg); }
    40%     { transform: translateY(-8px) scaleX(1.01) rotate(-1deg); }
    80%     { transform: translateY(-3px) scaleX(1) rotate(0.5deg); }
  }
  @keyframes aura-think {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    25%     { transform: translateY(-5px) rotate(-4deg); }
    75%     { transform: translateY(-2px) rotate(3deg); }
  }
  @keyframes ear-bounce {
    0%,85%,100% { transform: scaleY(1); }
    90%         { transform: scaleY(1.12); }
    95%         { transform: scaleY(0.92); }
  }
  @keyframes eye-blink {
    0%,93%,100% { transform: scaleY(1); }
    96%         { transform: scaleY(0.06); }
  }
  @keyframes bubble-pop {
    from { opacity:0; transform: scale(0.88) translateY(8px); }
    to   { opacity:1; transform: scale(1) translateY(0); }
  }
  @keyframes ring-wave {
    0%   { transform: scale(1);   opacity: 0.65; }
    100% { transform: scale(1.75); opacity: 0; }
  }
  @keyframes think-bounce {
    0%,80%,100% { opacity:0.25; transform:scale(0.75); }
    40%         { opacity:1;    transform:scale(1.25); }
  }
  @keyframes shine-sweep {
    0%   { opacity:0.55; }
    50%  { opacity:0.75; }
    100% { opacity:0.55; }
  }
  .aura-idle     { animation: aura-float  3.4s ease-in-out infinite; }
  .aura-speaking { animation: aura-speak  0.5s ease-in-out infinite; }
  .aura-listening{ animation: aura-listen 1.5s ease-in-out infinite; }
  .aura-thinking { animation: aura-think  2.2s ease-in-out infinite; }
  .ear-l { animation: ear-bounce 3.8s ease-in-out infinite; transform-origin: 54px 42px; }
  .ear-r { animation: ear-bounce 3.8s ease-in-out infinite 0.4s; transform-origin: 146px 42px; }
  .eye-l { animation: eye-blink 4.2s ease-in-out infinite; transform-origin: 74px 108px; }
  .eye-r { animation: eye-blink 4.2s ease-in-out infinite 0.1s; transform-origin: 126px 108px; }
  .bubble-pop { animation: bubble-pop 0.3s cubic-bezier(0.34,1.3,0.64,1) forwards; }
  .ring-w1 { animation: ring-wave 1.8s ease-out infinite; }
  .ring-w2 { animation: ring-wave 1.8s ease-out infinite 0.55s; }
  .think-d1 { animation: think-bounce 1.1s ease-in-out infinite; }
  .think-d2 { animation: think-bounce 1.1s ease-in-out infinite 0.28s; }
  .think-d3 { animation: think-bounce 1.1s ease-in-out infinite 0.56s; }
  .shine { animation: shine-sweep 2.8s ease-in-out infinite; }
`;

// ─── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(text, speed = 22) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

// ─── 3-D Panda SVG ───────────────────────────────────────────────────────────
function AuraSVG({ state }) {
  const mouthMap = {
    idle:      <path d="M 85 150 Q 100 163 115 150" stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" />,
    speaking:  <>
                 <ellipse cx="100" cy="154" rx="15" ry="10" fill="#111" />
                 <ellipse cx="100" cy="157" rx="10" ry="6" fill="#bb2244" />
                 <path d="M 85 148 Q 100 142 115 148" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
               </>,
    listening: <path d="M 88 152 L 112 152" stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" />,
    thinking:  <path d="M 88 151 Q 96 146 100 151 Q 104 157 112 149" stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" />,
  }[state];

  const lPupil = state === "thinking" ? { cx: 71, cy: 105 } : { cx: 74, cy: 110 };
  const rPupil = state === "thinking" ? { cx: 129, cy: 103 } : { cx: 126, cy: 110 };
  const eyeRx  = state === "listening" ? 18 : 15;
  const eyeRy  = state === "listening" ? 17 : 14;

  return (
    <svg viewBox="0 0 200 210" width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        {/* Head: top-left lit sphere illusion */}
        <radialGradient id="headGrad" cx="38%" cy="28%" r="65%">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="30%"  stopColor="#F9F6EF" />
          <stop offset="70%"  stopColor="#EDE4D4" />
          <stop offset="100%" stopColor="#D4C8B4" />
        </radialGradient>

        {/* Ear: dark sphere */}
        <radialGradient id="earGrad" cx="35%" cy="28%" r="65%">
          <stop offset="0%"   stopColor="#555555" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </radialGradient>

        {/* Eye patch: very dark with faint rim */}
        <radialGradient id="patchGrad" cx="42%" cy="32%" r="60%">
          <stop offset="0%"   stopColor="#1e1e1e" />
          <stop offset="100%" stopColor="#060606" />
        </radialGradient>

        {/* Eye iris: glassy blue depth */}
        <radialGradient id="irisGrad" cx="40%" cy="32%" r="58%">
          <stop offset="0%"   stopColor="#ddf0ff" />
          <stop offset="22%"  stopColor="#90caf9" />
          <stop offset="65%"  stopColor="#1565c0" />
          <stop offset="100%" stopColor="#0a2860" />
        </radialGradient>

        {/* Nose depth */}
        <radialGradient id="noseGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#383838" />
          <stop offset="100%" stopColor="#080808" />
        </radialGradient>

        {/* Bow-tie red */}
        <radialGradient id="bowGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#ff8fa3" />
          <stop offset="100%" stopColor="#cc2244" />
        </radialGradient>

        {/* Soft drop shadow */}
        <filter id="charShadow" x="-25%" y="-15%" width="150%" height="145%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="rgba(0,0,0,0.22)" />
        </filter>

        {/* Subtle inner glow on head for premium look */}
        <filter id="headGlow" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ── Ears (behind head) ── */}
      <g className="ear-l">
        <ellipse cx="54" cy="42" rx="30" ry="32" fill="url(#earGrad)" />
        <ellipse cx="54" cy="44" rx="16" ry="18" fill="#2a2a2a" />
      </g>
      <g className="ear-r">
        <ellipse cx="146" cy="42" rx="30" ry="32" fill="url(#earGrad)" />
        <ellipse cx="146" cy="44" rx="16" ry="18" fill="#2a2a2a" />
      </g>

      {/* ── Head (with shadow) ── */}
      <ellipse cx="100" cy="118" rx="84" ry="82" fill="url(#headGrad)" filter="url(#charShadow)" stroke="#111" strokeWidth="3.5" />

      {/* ── Specular shine (top-left glass-like highlight) ── */}
      <ellipse cx="66" cy="68" rx="26" ry="16"
        fill="white" opacity="0.42" className="shine"
        transform="rotate(-22, 66, 68)" />

      {/* ── Eye patches (large rounded squares for panda) ── */}
      <ellipse cx="74" cy="110" rx="29" ry="27" fill="url(#patchGrad)" />
      <ellipse cx="126" cy="110" rx="29" ry="27" fill="url(#patchGrad)" />

      {/* ── Eye whites ── */}
      <ellipse cx="74" cy="108" rx={eyeRx} ry={eyeRy} fill="white" className="eye-l" style={{ transformOrigin: "74px 108px" }} />
      <ellipse cx="126" cy="108" rx={eyeRx} ry={eyeRy} fill="white" className="eye-r" style={{ transformOrigin: "126px 108px" }} />

      {/* ── Iris (glassy) ── */}
      <circle cx={lPupil.cx} cy={lPupil.cy} r="10" fill="url(#irisGrad)" />
      <circle cx={rPupil.cx} cy={rPupil.cy} r="10" fill="url(#irisGrad)" />

      {/* ── Pupils ── */}
      <circle cx={lPupil.cx + 1} cy={lPupil.cy + 1} r="5.5" fill="#050a18" />
      <circle cx={rPupil.cx + 1} cy={rPupil.cy + 1} r="5.5" fill="#050a18" />

      {/* ── Pupil highlights (specular) ── */}
      <circle cx={lPupil.cx - 2} cy={lPupil.cy - 2} r="2.5" fill="white" opacity="0.92" />
      <circle cx={rPupil.cx - 2} cy={rPupil.cy - 2} r="2.5" fill="white" opacity="0.92" />
      <circle cx={lPupil.cx + 3} cy={lPupil.cy + 2} r="1.2" fill="white" opacity="0.5" />
      <circle cx={rPupil.cx + 3} cy={rPupil.cy + 2} r="1.2" fill="white" opacity="0.5" />

      {/* ── Cheek blush (speaking / listening) ── */}
      {(state === "speaking" || state === "listening") && (
        <>
          <ellipse cx="38" cy="136" rx="16" ry="9" fill="#FFB6C1" opacity="0.5" />
          <ellipse cx="162" cy="136" rx="16" ry="9" fill="#FFB6C1" opacity="0.5" />
        </>
      )}

      {/* ── Nose ── */}
      <ellipse cx="100" cy="140" rx="11" ry="7.5" fill="url(#noseGrad)" />
      <ellipse cx="97" cy="137.5" rx="3.5" ry="2.2" fill="#555" opacity="0.6" />

      {/* ── Mouth ── */}
      {mouthMap}

      {/* ── Thinking sweat drop ── */}
      {state === "thinking" && (
        <g>
          <ellipse cx="164" cy="76" rx="7" ry="10" fill="#AEE6F8" stroke="#111" strokeWidth="1.5" />
          <polygon points="157,76 171,76 164,63" fill="#AEE6F8" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      )}

      {/* ── Headset (listening) ── */}
      {state === "listening" && (
        <g>
          <path d="M 18 108 Q 18 48 100 48 Q 182 48 182 108" stroke="#222" strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="11" y="104" width="16" height="22" rx="6" fill="#222" />
          <rect x="173" y="104" width="16" height="22" rx="6" fill="#222" />
          <line x1="100" y1="176" x2="124" y2="176" stroke="#222" strokeWidth="4" strokeLinecap="round" />
          <circle cx="124" cy="176" r="6" fill="#FF6B6B" stroke="#222" strokeWidth="2" />
        </g>
      )}

      {/* ── Bow tie (idle / speaking / thinking) ── */}
      {state !== "listening" && (
        <g>
          <polygon points="85,190 100,197 115,190 100,183" fill="url(#bowGrad)" stroke="#111" strokeWidth="2" />
          <polygon points="85,190 68,181 68,199" fill="url(#bowGrad)" stroke="#111" strokeWidth="2" />
          <polygon points="115,190 132,181 132,199" fill="url(#bowGrad)" stroke="#111" strokeWidth="2" />
          <circle cx="100" cy="190" r="6" fill="#cc1133" stroke="#111" strokeWidth="1.5" />
          {/* Bow-tie shine */}
          <ellipse cx="88" cy="187" rx="5" ry="3" fill="white" opacity="0.28" transform="rotate(-15,88,187)" />
        </g>
      )}
    </svg>
  );
}

// ─── Thinking dots ────────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 7, alignItems: "center", justifyContent: "center" }}>
      {["think-d1", "think-d2", "think-d3"].map((c) => (
        <div key={c} className={c} style={{ width: 11, height: 11, borderRadius: "50%", background: "#C4B5FD", border: "2px solid #000" }} />
      ))}
    </div>
  );
}

// ─── Listening rings ──────────────────────────────────────────────────────────
function ListeningRings() {
  return (
    <>
      <div className="ring-w1" style={{ position: "absolute", inset: -8, border: "3px solid #FF6B6B", borderRadius: "50%", pointerEvents: "none" }} />
      <div className="ring-w2" style={{ position: "absolute", inset: -8, border: "3px solid #FF6B6B", borderRadius: "50%", pointerEvents: "none" }} />
    </>
  );
}

// ─── Speech bubble ────────────────────────────────────────────────────────────
function SpeechBubble({ text, questionIndex, totalQuestions }) {
  const displayed = useTypewriter(text, 20);
  const done = displayed.length >= text.length;
  return (
    <div className="bubble-pop" key={text} style={{
      background: "#fff", border: "3px solid #1a1a1a",
      boxShadow: "5px 5px 0 #1a1a1a", borderRadius: 16,
      padding: "12px 16px 14px", position: "relative",
      width: "100%", maxWidth: 300,
    }}>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.12em", color: "#888",
        marginBottom: 6, display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ background: "#FFD93D", border: "2px solid #000", padding: "1px 7px", borderRadius: 4, color: "#000", fontSize: 11 }}>
          Q{questionIndex + 1}
        </span>
        <span style={{ opacity: 0.5 }}>of {totalQuestions}</span>
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 500, lineHeight: 1.55, color: "#111" }}>
        {displayed}{!done && <span style={{ opacity: 0.4 }}>|</span>}
      </div>
      {/* Bubble tail pointing down */}
      <div style={{ position: "absolute", bottom: -13, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "10px solid #1a1a1a" }} />
      <div style={{ position: "absolute", bottom: -9, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "8px solid #fff" }} />
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ state }) {
  const cfg = {
    idle:      { dot: "#A8F0C6", label: "Ready" },
    speaking:  { dot: "#FFD93D", label: "Speaking" },
    listening: { dot: "#FF6B6B", label: "Listening" },
    thinking:  { dot: "#C4B5FD", label: "Thinking..." },
  }[state];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, border: "1.5px solid #000", display: "inline-block" }} />
      {cfg.label}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function InterviewMascot({
  state = "idle",
  question = "",
  questionIndex = 0,
  totalQuestions = 6,
  compact = false,
}) {
  const showBubble = state === "speaking" && question;
  const size = compact ? 140 : 180;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: "100%" }}>
      {/* ── Bubble / status banner ── */}
      {!compact && (
        <div style={{ minHeight: 80, display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%", paddingBottom: 0 }}>
          {showBubble && <SpeechBubble text={question} questionIndex={questionIndex} totalQuestions={totalQuestions} />}
          {!showBubble && state === "listening" && (
            <div style={{ background: "#FFF3F3", border: "3px solid #FF6B6B", borderRadius: 12, padding: "8px 18px", fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 700, color: "#FF6B6B", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 8, boxShadow: "4px 4px 0 #FF6B6B" }}>
              <span>🎙</span> I'm listening...
            </div>
          )}
          {!showBubble && state === "thinking" && (
            <div style={{ background: "#F5F3FF", border: "3px solid #C4B5FD", borderRadius: 12, padding: "8px 18px", fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 10, boxShadow: "4px 4px 0 #C4B5FD" }}>
              <ThinkingDots /> Processing
            </div>
          )}
          {!showBubble && state === "idle" && (
            <div style={{ background: "#FFFDF5", border: "2px dashed #ccc", borderRadius: 12, padding: "7px 18px", fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 500, color: "#bbb" }}>
              Hold the button to respond
            </div>
          )}
        </div>
      )}

      {/* ── Gap for bubble tail ── */}
      {!compact && <div style={{ height: 14 }} />}

      {/* ── Character ── */}
      <div style={{ position: "relative" }}>
        {state === "listening" && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: size + 16, height: size + 16, borderRadius: "50%" }}>
            <ListeningRings />
          </div>
        )}
        <div className={`aura-${state}`} style={{ width: size, height: size, borderRadius: "50%", overflow: "visible", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <AuraSVG state={state} />
        </div>
      </div>

      {/* ── Name tag ── */}
      <div style={{
        background: "#1a1a1a", border: "3px solid #1a1a1a", borderRadius: 8,
        padding: "4px 14px", fontFamily: "'Space Grotesk',sans-serif",
        fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#FFD93D",
        marginTop: 4,
      }}>
        AURA · AI Interviewer
      </div>

      <StatusPill state={state} />
    </div>
  );
}

// ─── CSS injection ────────────────────────────────────────────────────────────
export function MascotStyles() {
  useEffect(() => {
    if (document.getElementById("mascot-css")) return;
    const s = document.createElement("style");
    s.id = "mascot-css";
    s.innerHTML = MASCOT_CSS;
    document.head.appendChild(s);
  }, []);
  return null;
}
