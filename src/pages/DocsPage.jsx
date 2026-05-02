import MarketingShell, { BrutalCard, marketingColors as C, marketingFont as font, marketingBorder2 as b2 } from "../components/MarketingShell";

const STEPS = [
  {
    title: "1. Create an account",
    body: "Sign up, open the practice lobby, and create a session with a company and tier. AuraSync preloads the matching question set, including coding prompts when the track expects them.",
    tone: C.yellow,
  },
  {
    title: "2. Run the interview",
    body: "Grant camera and mic access. The session starts reading transcript pace, filler-word density, and live stress history while the mascot introduces the first prompt.",
    tone: C.violet,
  },
  {
    title: "3. Watch the coach stream",
    body: "Coaching notes appear in the right-side feed during the interview. If stress jumps too high, AuraSync pauses and gives the interviewer time to breathe and reset.",
    tone: C.mint,
  },
  {
    title: "4. Finish the report",
    body: "The report separates communication, answer quality, average stress, and pacing so the main score is not ambiguous. Eligible sessions can unlock collectible reward badges stored in history.",
    tone: C.red,
  },
];

export default function DocsPage() {
  return (
    <MarketingShell
      eyebrow="Documentation"
      title="SET UP FAST."
      accent="UNDERSTAND THE FLOW."
      intro="These docs focus on the actual product loop: start a session, speak, get coached, finish the report, and understand why a reward is either unlocked or still locked."
      ctaTitle="RUN A FULL DRY RUN."
      ctaBody="If you want the fastest validation path, start a free session, speak through three answers, trigger at least one coaching note, then open the report to confirm the scoring breakdown."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
        {STEPS.map((step) => (
          <BrutalCard key={step.title} title={step.title} tone={step.tone} accent={step.tone === C.red ? C.white : C.black}>
            <div style={{ ...font(700, "15px"), lineHeight: 1.75 }}>{step.body}</div>
          </BrutalCard>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
        <div style={{ background: C.white, border: "4px solid #000", boxShadow: "12px 12px 0px 0px #000", padding: "24px 22px" }}>
          <div style={{ ...font(900, "12px", true, "0.18em"), marginBottom: 14 }}>COMMON CHECKS</div>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              ["Mic blocked", "Use Chrome or Edge, allow microphone access, and retry recording."],
              ["No coaching notes yet", "Keep speaking long enough for transcript and telemetry to build, then watch the right-side coach feed."],
              ["Reward locked", "The report now requires both lower average stress and acceptable answer quality before a reward unlocks."],
              ["Profile looks empty", "Finish one session and open the report once so streaks, XP, and reward history have data to render."],
            ].map(([label, text]) => (
              <div key={label} style={{ ...b2, padding: "12px 14px", background: C.bg }}>
                <div style={{ ...font(900, "10px", true, "0.14em"), marginBottom: 6 }}>{label}</div>
                <div style={{ ...font(700, "14px"), lineHeight: 1.65 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.black, border: "4px solid #000", boxShadow: "12px 12px 0px 0px #000", padding: "22px", color: C.white }}>
          <div style={{ ...font(900, "12px", true, "0.18em"), color: C.yellow, marginBottom: 12 }}>SESSION PIPELINE</div>
          <div style={{ display: "grid", gap: 10 }}>
            {["Create session", "Load questions", "Capture transcript", "Compute stress + WPM", "Emit coaching note", "Score answers", "Unlock reward if valid"].map((item, index) => (
              <div key={item} style={{ background: index % 2 === 0 ? C.yellow : C.violet, color: C.black, ...b2, padding: "12px 14px" }}>
                <div style={{ ...font(900, "10px", true, "0.14em"), marginBottom: 4 }}>Step {index + 1}</div>
                <div style={{ ...font(700, "14px") }}>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
