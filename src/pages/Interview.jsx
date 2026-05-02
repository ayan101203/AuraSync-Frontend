import { useRef, useState, useEffect, useCallback } from 'react';

// ─── Design Tokens (matches AuraSync) ────────────────────────────────────────
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

  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(255,107,107,0.6), 8px 8px 0px 0px #000; }
    70%  { box-shadow: 0 0 0 16px rgba(255,107,107,0), 8px 8px 0px 0px #000; }
    100% { box-shadow: 0 0 0 0 rgba(255,107,107,0), 8px 8px 0px 0px #000; }
  }
  .recording-pulse { animation: pulse-ring 1.4s ease-out infinite; }

  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .spin { animation: spin-slow 14s linear infinite; }

  @keyframes soundbar {
    0%, 100% { height: 6px; }
    50%       { height: 28px; }
  }
  .bar1 { animation: soundbar 0.9s ease-in-out infinite; }
  .bar2 { animation: soundbar 0.9s ease-in-out infinite 0.15s; }
  .bar3 { animation: soundbar 0.9s ease-in-out infinite 0.3s; }
  .bar4 { animation: soundbar 0.9s ease-in-out infinite 0.45s; }
  .bar5 { animation: soundbar 0.9s ease-in-out infinite 0.6s; }

  @keyframes ai-think {
    0%, 100% { opacity: 0.3; transform: scaleY(0.5); }
    50%       { opacity: 1;   transform: scaleY(1.4); }
  }
  .ai-bar1 { animation: ai-think 1.2s ease-in-out infinite; }
  .ai-bar2 { animation: ai-think 1.2s ease-in-out infinite 0.2s; }
  .ai-bar3 { animation: ai-think 1.2s ease-in-out infinite 0.4s; }
  .ai-bar4 { animation: ai-think 1.2s ease-in-out infinite 0.2s; }
  .ai-bar5 { animation: ai-think 1.2s ease-in-out infinite 0.0s; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeSlideUp 0.35s ease-out forwards; }

  @keyframes spin-cw {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .spin-cw { animation: spin-cw 1.1s linear infinite; }

  .btn-main {
    cursor: pointer;
    transition: transform 0.1s linear, box-shadow 0.1s linear;
    user-select: none;
    outline: none;
  }
  .btn-main:hover  { transform: translate(-2px,-2px); }
  .btn-main:active { transform: translate(4px,4px); box-shadow: none !important; }
  .btn-main:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }

  .grid-bg {
    background-image:
      linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px);
    background-size: 44px 44px;
  }
  .halftone {
    background-image: radial-gradient(#000 1.5px, transparent 1.5px);
    background-size: 22px 22px;
  }

  .panel-card {
    transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  }
  .panel-card:hover {
    transform: translateY(-4px);
  }

  @media (max-width: 800px) {
    .interview-grid { grid-template-columns: 1fr !important; }
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StarSVG({ size = 48, fill = C.yellow }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon
        points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
        fill={fill} stroke="#000" strokeWidth="5" strokeLinejoin="round"
      />
    </svg>
  );
}

function Ticker() {
  const words = [
    "AuraSync", "★", "Interview Mode", "★", "Live AI Coaching", "★",
    "Speak with Confidence", "★", "Real-time Feedback", "★", "Mock Interview", "★",
    "AuraSync", "★", "Your AI Interviewer", "★", "Analyze. Improve. Succeed.", "★",
  ];
  return (
    <div style={{ background: C.black, overflow: "hidden", borderBottom: "4px solid #000", padding: "11px 0" }}>
      <div className="ticker-track">
        {[...words, ...words].map((w, i) => (
          <span key={i} style={{ ...font(900, "11px", true, "0.18em"), color: C.white, whiteSpace: "nowrap" }}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

function Nav() {
  return (
    <nav style={{ background: C.bg, borderBottom: "4px solid #000", padding: "0 28px", position: "sticky", top: 0, zIndex: 200 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
        <a href="#" style={{ textDecoration: "none", display: "flex" }}>
          <div style={{ background: C.yellow, ...b4, boxShadow: sh.sm, padding: "8px 16px" }}>
            <span style={{ ...font(900, "20px"), letterSpacing: "-0.04em", color: C.black }}>AuraSync</span>
          </div>
          <div style={{ background: C.red, ...b4, borderLeft: "none", padding: "8px 12px", display: "flex", alignItems: "center" }}>
            <span style={{ ...font(900, "10px", true, "0.15em"), color: C.white }}>INTERVIEW</span>
          </div>
        </a>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ background: C.violet, ...b2, padding: "6px 14px" }}>
            <span style={{ ...font(900, "11px", true, "0.2em") }}>Session Active</span>
          </div>
          <div style={{ width: 10, height: 10, background: "#4ade80", border: "2px solid #000", borderRadius: "50%" }} />
        </div>
      </div>
    </nav>
  );
}

// ─── Sound bars (animated) ─────────────────────────────────────────────────────
function SoundBars({ color = C.black, active = false }) {
  const classes = ["bar1","bar2","bar3","bar4","bar5"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, height: 36 }}>
      {classes.map((cls, i) => (
        <div
          key={i}
          className={active ? cls : ""}
          style={{
            width: 5,
            height: active ? undefined : 6,
            background: color,
            border: "1.5px solid #000",
            borderRadius: 2,
            transition: "height 0.2s",
          }}
        />
      ))}
    </div>
  );
}

function AISoundBars({ active = false }) {
  const classes = ["ai-bar1","ai-bar2","ai-bar3","ai-bar4","ai-bar5"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, height: 36 }}>
      {classes.map((cls, i) => (
        <div
          key={i}
          className={active ? cls : ""}
          style={{
            width: 5,
            height: 20,
            background: C.white,
            opacity: active ? 1 : 0.3,
            borderRadius: 2,
            transition: "opacity 0.3s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="spin-cw" style={{
      width: 20, height: 20,
      border: "3px solid rgba(0,0,0,0.15)",
      borderTop: "3px solid #000",
      borderRadius: "50%",
      display: "inline-block"
    }} />
  );
}

// ─── Candidate Video Panel (with live webcam + WebSocket streaming) ──────────
//
// Streaming approach:
//   1. getUserMedia({ video, audio }) → shown live in <video> element
//   2. A hidden <canvas> captures frames at ~15 fps via requestAnimationFrame
//   3. canvas.toBlob('image/jpeg') sends each JPEG frame over a WebSocket
//      to ws://localhost:<VIDEO_STREAM_PORT>/video
//   4. The backend receives raw JPEG blobs — no base64 overhead on the wire.
//
// Controls exposed:
//   • "Start Camera"  — opens webcam, begins WS connection + frame streaming
//   • "Stop Camera"   — stops tracks, closes WS, clears preview
//   The mic recording (audio path) is unchanged and driven from the parent.

function CandidatePanel({ isRecording, isProcessing }) {
  const videoRef        = useRef(null);
  const canvasRef       = useRef(null);
  const wsRef           = useRef(null);
  const rafRef          = useRef(null);
  const camStreamRef    = useRef(null);

  const [camState,    setCamState]    = useState('off');   // 'off' | 'starting' | 'on' | 'error'
  const [wsState,     setWsState]     = useState('closed'); // 'closed' | 'connecting' | 'open' | 'error'
  const [camError,    setCamError]    = useState('');
  const [frameCount,  setFrameCount]  = useState(0);
  const [streamPort,  setStreamPort]  = useState(VIDEO_STREAM_PORT);

  // ── frame loop ──────────────────────────────────────────────────────────────
  const startFrameLoop = useCallback((stream) => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    video.srcObject = stream;
    video.play().catch(() => {});

    const ctx = canvas.getContext('2d');
    let lastSent = 0;
    const FPS_INTERVAL = 1000 / 15; // ~15 fps

    const loop = (ts) => {
      rafRef.current = requestAnimationFrame(loop);
      if (ts - lastSent < FPS_INTERVAL) return;
      lastSent = ts;

      if (video.readyState < 2) return;
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        canvas.toBlob(
          (blob) => {
            if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(blob);
              setFrameCount(n => n + 1);
            }
          },
          'image/jpeg',
          0.7,
        );
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stopFrameLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (videoRef.current) { videoRef.current.srcObject = null; }
  }, []);

  // ── WebSocket ────────────────────────────────────────────────────────────────
  const openWS = useCallback((port) => {
    const url = `ws://localhost:${port}/video`;
    setWsState('connecting');
    const ws = new WebSocket(url);
    ws.binaryType = 'blob';
    ws.onopen    = () => setWsState('open');
    ws.onerror   = () => setWsState('error');
    ws.onclose   = () => setWsState(s => s !== 'error' ? 'closed' : s);
    wsRef.current = ws;
  }, []);

  const closeWS = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setWsState('closed');
  }, []);

  // ── Camera on/off ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamError('');
    setCamState('starting');
    setFrameCount(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      camStreamRef.current = stream;
      openWS(streamPort);
      startFrameLoop(stream);
      setCamState('on');
    } catch (err) {
      setCamError(err.message || 'Camera access denied.');
      setCamState('error');
    }
  }, [openWS, startFrameLoop, streamPort]);

  const stopCamera = useCallback(() => {
    stopFrameLoop();
    closeWS();
    camStreamRef.current?.getTracks().forEach(t => t.stop());
    camStreamRef.current = null;
    setCamState('off');
    setFrameCount(0);
  }, [stopFrameLoop, closeWS]);

  // cleanup on unmount
  useEffect(() => () => { stopFrameLoop(); closeWS(); camStreamRef.current?.getTracks().forEach(t => t.stop()); }, [stopFrameLoop, closeWS]);

  const wsColor = { closed: '#888', connecting: C.yellow, open: '#4ade80', error: C.red }[wsState];
  const wsLabel = { closed: 'WS Disconnected', connecting: 'WS Connecting…', open: 'WS Streaming', error: 'WS Error' }[wsState];

  return (
    <div
      className="panel-card"
      style={{ background: C.white, ...b4, boxShadow: sh.lg, overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <div style={{
        background: C.yellow, borderBottom: "4px solid #000",
        padding: "14px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span style={{ ...font(900, "13px", true, "0.14em") }}>📷 Candidate</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* WS badge */}
          <div style={{ background: C.black, ...b2, padding: "3px 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, background: wsColor, borderRadius: "50%", border: "1.5px solid #fff" }} />
            <span style={{ ...font(900, "9px", true, "0.16em"), color: wsColor }}>{wsLabel}</span>
          </div>
          {/* LIVE dot when recording */}
          {isRecording && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 9, height: 9, background: C.red, border: "2px solid #000", borderRadius: "50%" }} className="recording-pulse" />
              <span style={{ ...font(900, "10px", true, "0.15em"), color: C.red }}>LIVE</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 5 }}>
            {[C.red, C.yellow, C.violet].map((c, i) => (
              <div key={i} style={{ width: 11, height: 11, background: c, border: "2px solid #000", borderRadius: "50%" }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Video viewport ── */}
      <div style={{ position: "relative", background: "#111", flex: 1, minHeight: 300, overflow: "hidden" }}>

        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px", zIndex: 1,
        }} />

        {/* Live <video> — fills viewport when cam is on */}
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            display: camState === 'on' ? 'block' : 'none',
            zIndex: 2,
          }}
        />

        {/* Hidden canvas used for frame capture */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Offline placeholder */}
        {camState !== 'on' && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 3 }}>
            <div style={{
              width: 88, height: 88, borderRadius: "50%",
              background: camState === 'error' ? C.red : C.violet,
              ...b4, display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px", boxShadow: sh.md,
            }}>
              <span style={{ fontSize: 38 }}>{camState === 'error' ? '⚠️' : camState === 'starting' ? '⏳' : '👤'}</span>
            </div>
            <div style={{ background: C.black, ...b2, padding: "6px 14px" }}>
              <span style={{ ...font(700, "11px", true, "0.16em"), color: C.white }}>
                {camState === 'error' ? camError || 'Camera Error' : camState === 'starting' ? 'Opening Camera…' : 'Camera Off'}
              </span>
            </div>
          </div>
        )}

        {/* "YOU" corner badge */}
        <div style={{ position: "absolute", top: 12, left: 12, background: C.yellow, ...b2, padding: "4px 10px", zIndex: 10 }}>
          <span style={{ ...font(900, "10px", true, "0.14em") }}>YOU</span>
        </div>

        {/* Frame counter (top-right) when streaming */}
        {wsState === 'open' && (
          <div className="fade-up" style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.75)", border: "2px solid #4ade80", padding: "4px 10px", zIndex: 10 }}>
            <span style={{ ...font(900, "9px", true, "0.12em"), color: "#4ade80" }}>
              ▶ {frameCount} frames sent
            </span>
          </div>
        )}

        {/* Mic-on overlay */}
        {isRecording && camState === 'on' && (
          <div className="fade-up" style={{
            position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
            background: C.red, ...b2, padding: "8px 16px",
            display: "flex", alignItems: "center", gap: 10, zIndex: 10,
          }}>
            <SoundBars color={C.white} active={true} />
            <span style={{ ...font(900, "11px", true, "0.14em"), color: C.white }}>MIC ON</span>
          </div>
        )}
      </div>

      {/* ── Camera controls strip ── */}
      <div style={{ borderTop: "4px solid #000", background: C.bg, padding: "14px 18px" }}>

        {/* Port selector row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ ...font(700, "11px", true, "0.12em"), color: "rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
            WS PORT
          </span>
          <input
            type="number"
            value={streamPort}
            disabled={camState === 'on' || camState === 'starting'}
            onChange={e => setStreamPort(Number(e.target.value))}
            style={{
              width: 90,
              padding: "6px 10px",
              ...font(900, "13px"),
              border: "3px solid #000",
              background: camState === 'on' ? "#eee" : C.white,
              outline: "none",
            }}
          />
          <div style={{
            flex: 1, background: "#f0f0f0", border: "2px solid #ccc",
            padding: "5px 10px", overflow: "hidden",
          }}>
            <span style={{ ...font(700, "10px", true, "0.1em"), color: "#888" }}>
              ws://localhost:{streamPort}/video
            </span>
          </div>
        </div>

        {/* Button row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn-main"
              onClick={startCamera}
              disabled={camState === 'on' || camState === 'starting'}
              style={{
                background: C.yellow, ...b4, boxShadow: sh.sm,
                padding: "10px 18px",
                ...font(700, "12px", true, "0.1em"),
              }}
            >
              {camState === 'starting' ? '⏳ Starting…' : '📷 Start Camera'}
            </button>
            <button
              className="btn-main"
              onClick={stopCamera}
              disabled={camState === 'off' || camState === 'error'}
              style={{
                background: C.red, ...b4, boxShadow: sh.sm,
                padding: "10px 18px",
                ...font(700, "12px", true, "0.1em"),
                color: C.white,
              }}
            >
              ⏹ Stop Camera
            </button>
          </div>

          {/* Status chip */}
          <div style={{
            background: camState === 'on' ? C.black : "#e5e5e5",
            ...b2, padding: "6px 14px",
            display: "flex", alignItems: "center", gap: 7,
            transition: "background 0.2s",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: { off: '#888', starting: C.yellow, on: '#4ade80', error: C.red }[camState],
              border: "1.5px solid rgba(255,255,255,0.4)",
            }} />
            <span style={{ ...font(900, "10px", true, "0.15em"), color: camState === 'on' ? C.white : "#666" }}>
              {{off:'Camera Off', starting:'Starting', on:'Streaming', error:'Error'}[camState]}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom info strip */}
      <div style={{
        borderTop: "4px solid #000", background: C.white,
        padding: "11px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ ...font(900, "13px") }}>Candidate</div>
          <div style={{ ...font(700, "11px", true, "0.12em"), color: "rgba(0,0,0,0.5)", marginTop: 2 }}>
            {isProcessing ? "Uploading answer…" : isRecording ? "Speaking now" : camState === 'on' ? "Camera active" : "Ready to answer"}
          </div>
        </div>
        <div style={{
          background: isRecording ? C.red : camState === 'on' ? C.violet : "#e5e5e5",
          ...b2, padding: "5px 12px", transition: "background 0.2s",
        }}>
          <span style={{ ...font(900, "10px", true, "0.15em"), color: isRecording || camState === 'on' ? C.black : "#888" }}>
            {isRecording ? "● REC" : camState === 'on' ? "● CAM" : "● IDLE"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── AI Interviewer Panel ─────────────────────────────────────────────────────
function AIPanel({ geminiOutput, isProcessing, lastQuestion }) {
  return (
    <div
      className="panel-card"
      style={{
        background: C.black,
        ...b4,
        boxShadow: sh.lg,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{
        background: C.violet, borderBottom: "4px solid #000",
        padding: "14px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ ...font(900, "13px", true, "0.14em") }}>🤖 AI Interviewer</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 5 }}>
            {[C.red, C.yellow, C.violet].map((c, i) => (
              <div key={i} style={{ width: 11, height: 11, background: c, border: "2px solid #000", borderRadius: "50%" }} />
            ))}
          </div>
        </div>
      </div>

      {/* AI visual area */}
      <div style={{
        position: "relative",
        background: "#0a0a0a",
        flex: 1,
        minHeight: 280,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: 28,
      }}>
        {/* Halftone overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(196,181,253,0.08) 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }} />

        {/* Spinning star decoration */}
        <div className="spin" style={{ position: "absolute", top: 12, right: 12, opacity: 0.4 }}>
          <StarSVG size={36} fill={C.violet} />
        </div>

        {/* AI avatar */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.violet} 0%, #8b5cf6 100%)`,
            border: "4px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
            boxShadow: "0 0 0 4px #000, 8px 8px 0px 0px #fff",
          }}>
            <span style={{ fontSize: 42 }}>🧠</span>
          </div>

          {/* AI sound bars */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <AISoundBars active={isProcessing} />
          </div>

          {/* Status label */}
          <div style={{
            background: isProcessing ? C.violet : "rgba(255,255,255,0.08)",
            border: isProcessing ? "2px solid #000" : "2px solid rgba(255,255,255,0.2)",
            padding: "6px 16px",
            display: "inline-flex", alignItems: "center", gap: 8,
            transition: "background 0.3s",
          }}>
            {isProcessing && <Spinner />}
            <span style={{ ...font(900, "10px", true, "0.18em"), color: isProcessing ? C.black : "rgba(255,255,255,0.5)" }}>
              {isProcessing ? "Analyzing..." : "Awaiting your answer"}
            </span>
          </div>
        </div>
      </div>

      {/* AI response box */}
      <div style={{
        borderTop: "4px solid #000",
        background: "#111",
        padding: "16px 20px",
        minHeight: 80,
        position: "relative",
      }}>
        <div style={{
          ...font(900, "10px", true, "0.2em"),
          color: C.violet,
          marginBottom: 8,
        }}>
          ★ Interviewer says
        </div>
        <p style={{
          ...font(700, "14px"),
          color: C.white,
          lineHeight: 1.7,
          maxHeight: 80,
          overflowY: "auto",
        }}>
          {geminiOutput || lastQuestion}
        </p>
      </div>
    </div>
  );
}

// ─── Main Interview Screen ────────────────────────────────────────────────────
const END_POINT = 'http://localhost:3000';
const VIDEO_STREAM_PORT = 8765; // ← change this to match your backend WS port
const DEFAULT_JOB_DESCRIPTION = 'Role: Software Engineer. Assess communication clarity, problem solving, and practical coding experience.';
const DEFAULT_INTERVIEW_TYPE = 'behavioural';
const DEFAULT_INTERVIEWER_INTRO = "Hi, thanks for joining today. Let's start with a brief introduction about yourself.";

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize)
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  return window.btoa(binary);
}

function getSupportedMimeType() {
  const types = ['audio/webm', 'audio/ogg', 'audio/mp4'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
}

function releaseAudio(audioEl) {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.src = '';
  audioEl.load();
}

export default function Interview() {
  const recorderRef       = useRef(null);
  const streamRef         = useRef(null);
  const latestAudioRef    = useRef(null);
  const collectedChunksRef = useRef([]);
  const hasSubmittedRef   = useRef(false);

  const [isRecording,  setIsRecording]  = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript,   setTranscript]   = useState('');
  const [geminiOutput, setGeminiOutput] = useState('');
  const [lastQuestion, setLastQuestion] = useState(DEFAULT_INTERVIEWER_INTRO);
  const [error,        setError]        = useState('');
  const [sessionTime,  setSessionTime]  = useState(0);

  // Session timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const playAIAudio = async (audioBase64) => {
    if (!audioBase64) return;
    try {
      releaseAudio(latestAudioRef.current);
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      latestAudioRef.current = audio;
      await audio.play();
    } catch {}
  };

  const sendFullAudio = async (mimeType) => {
    if (hasSubmittedRef.current) return;
    const chunks = collectedChunksRef.current;
    if (!chunks.length) return;
    const fullBlob = new Blob(chunks, { type: mimeType });
    if (fullBlob.size === 0) return;
    setIsProcessing(true);
    hasSubmittedRef.current = true;
    try {
      const base64 = arrayBufferToBase64(await fullBlob.arrayBuffer());
      const res = await fetch(`${END_POINT}/api/interview/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, mimeType, jobDescription: DEFAULT_JOB_DESCRIPTION, interviewType: DEFAULT_INTERVIEW_TYPE, lastInterviewerAnswer: lastQuestion }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed.');
      setTranscript(typeof payload.text === 'string' ? payload.text : '');
      setGeminiOutput(payload.aiText || 'No response returned.');
      if (typeof payload.aiText === 'string' && payload.aiText.trim()) setLastQuestion(payload.aiText);
      await playAIAudio(payload.aiAudioBase64);
    } catch (err) {
      hasSubmittedRef.current = false;
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      setError(''); setGeminiOutput(''); setTranscript('');
      collectedChunksRef.current = [];
      hasSubmittedRef.current = false;
      setSessionTime(0);
      const mimeType = getSupportedMimeType();
      if (!mimeType) { setError('No supported audio format found.'); return; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) collectedChunksRef.current.push(e.data); };
      recorder.onstop = () => sendFullAudio(mimeType);
      recorder.start(1000);
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start recording.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state !== 'inactive') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsRecording(false);
  };

  const resetAll = async () => {
    stopRecording();
    releaseAudio(latestAudioRef.current);
    latestAudioRef.current = null;
    collectedChunksRef.current = [];
    setTranscript(''); setGeminiOutput('');
    setLastQuestion(DEFAULT_INTERVIEWER_INTRO);
    setError(''); setIsProcessing(false); setSessionTime(0);
  };

  return (
    <div style={{ background: C.bg, fontFamily: "'Space Grotesk', sans-serif", minHeight: "100vh" }}>
      <Ticker />
      <Nav />

      {/* Main content */}
      <main className="grid-bg" style={{ padding: "48px 28px 64px", minHeight: "calc(100vh - 120px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Page header */}
          <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "inline-block", background: C.black, ...b4, padding: "5px 14px", marginBottom: 14 }}>
                <span style={{ ...font(900, "11px", true, "0.25em"), color: C.yellow }}>★ Mock Interview Session</span>
              </div>
              <h1 style={{ ...font(900, "clamp(36px, 5vw, 60px)"), lineHeight: 0.9, letterSpacing: "-0.03em" }}>
                SPEAK.<br />
                <span style={{ display: "inline-block", background: C.violet, ...b4, boxShadow: sh.sm, padding: "4px 16px", transform: "rotate(-1.2deg)", margin: "8px 0", lineHeight: 1.1 }}>
                  IMPRESS.
                </span>
                <br />GET HIRED.
              </h1>
            </div>

            {/* Session stats */}
            <div style={{ display: "flex", gap: 0, ...b4, boxShadow: sh.sm, overflow: "hidden" }}>
              {[
                ["⏱", formatTime(sessionTime), "Duration"],
                ["🎤", isRecording ? "Active" : "Idle", "Mic Status"],
                ["🧠", isProcessing ? "Working" : "Ready", "AI Status"],
              ].map(([icon, val, label]) => (
                <div key={label} style={{ padding: "14px 22px", borderRight: "4px solid #000", background: C.white, textAlign: "center" }}>
                  <div style={{ ...font(700, "18px") }}>{icon} {val}</div>
                  <div style={{ ...font(700, "10px", true, "0.12em"), color: "rgba(0,0,0,0.5)", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="fade-up" style={{ background: C.red, ...b4, boxShadow: sh.sm, padding: "14px 20px", marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span style={{ ...font(700, "14px"), color: C.white }}>{error}</span>
            </div>
          )}

          {/* ── Two panels ── */}
          <div className="interview-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 32 }}>
            <CandidatePanel isRecording={isRecording} isProcessing={isProcessing} />
            <AIPanel geminiOutput={geminiOutput} isProcessing={isProcessing} lastQuestion={lastQuestion} />
          </div>

          {/* ── Control bar ── */}
          <div style={{
            background: C.white, ...b4, boxShadow: sh.md,
            padding: "24px 28px",
            display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
          }}>
            {/* Big Mic button */}
            <button
              className={`btn-main ${isRecording ? "recording-pulse" : ""}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              style={{
                background: isRecording ? C.red : C.yellow,
                ...b4,
                boxShadow: isRecording ? "8px 8px 0px 0px #000" : sh.md,
                padding: "18px 36px",
                display: "flex", alignItems: "center", gap: 14,
                transition: "background 0.2s",
              }}
            >
              <span style={{ fontSize: 26 }}>{isRecording ? "⏹" : "🎙️"}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ ...font(900, "15px", true, "0.1em") }}>
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </div>
                <div style={{ ...font(700, "11px"), marginTop: 2, opacity: 0.7 }}>
                  {isRecording ? "Click to submit answer" : "Click to begin speaking"}
                </div>
              </div>
            </button>

            {/* Live sound bars */}
            <div style={{
              background: C.bg, ...b4, padding: "14px 20px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <SoundBars color={C.black} active={isRecording} />
              <span style={{ ...font(700, "11px", true, "0.14em"), color: isRecording ? C.red : "rgba(0,0,0,0.3)" }}>
                {isRecording ? "Recording..." : "Mic idle"}
              </span>
            </div>

            {/* Processing indicator */}
            {isProcessing && (
              <div className="fade-up" style={{
                background: C.violet, ...b4, boxShadow: sh.sm,
                padding: "14px 20px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <Spinner />
                <span style={{ ...font(900, "12px", true, "0.14em") }}>AI is responding...</span>
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Reset */}
            <button
              className="btn-main"
              onClick={resetAll}
              disabled={isRecording || isProcessing}
              style={{
                background: C.white, ...b4, boxShadow: sh.sm,
                padding: "14px 22px",
                ...font(700, "13px", true, "0.1em"),
                color: C.black,
              }}
            >
              ↺ Reset
            </button>
          </div>

          {/* ── Transcript & Response ── */}
          {(transcript || geminiOutput) && (
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 28 }}>
              {/* Transcript */}
              <div style={{ background: C.white, ...b4, boxShadow: sh.sm, overflow: "hidden" }}>
                <div style={{ background: C.yellow, borderBottom: "4px solid #000", padding: "12px 18px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ ...font(900, "12px", true, "0.14em") }}>📝 Your Answer</span>
                  <span style={{ ...font(700, "11px"), opacity: 0.6 }}>Transcript</span>
                </div>
                <div style={{ padding: "18px 20px" }}>
                  <p style={{ ...font(700, "14px"), lineHeight: 1.75, color: C.black }}>
                    {transcript || <span style={{ opacity: 0.4 }}>No transcript yet.</span>}
                  </p>
                </div>
              </div>

              {/* AI response */}
              <div style={{ background: C.black, ...b4, boxShadow: sh.sm, overflow: "hidden" }}>
                <div style={{ background: C.violet, borderBottom: "4px solid #000", padding: "12px 18px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ ...font(900, "12px", true, "0.14em") }}>🤖 AI Feedback</span>
                  <span style={{ ...font(700, "11px"), opacity: 0.7 }}>Response</span>
                </div>
                <div style={{ padding: "18px 20px" }}>
                  <p style={{ ...font(700, "14px"), lineHeight: 1.75, color: C.white }}>
                    {geminiOutput || <span style={{ opacity: 0.4, color: C.white }}>No AI response yet.</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer strip */}
      <div style={{ background: C.black, borderTop: "4px solid #000", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ ...font(700, "12px", true, "0.1em"), color: "rgba(255,255,255,0.4)" }}>
          © 2026 AuraSync Inc.
        </span>
        <span style={{ ...font(900, "12px", true, "0.22em"), color: C.yellow }}>
          SPEAK. ANALYZE. IMPROVE.
        </span>
      </div>
    </div>
  );
}