import MarketingShell, { BrutalCard, marketingColors as C, marketingFont as font, marketingBorder2 as b2 } from "../components/MarketingShell";

const FEATURE_SETS = [
  {
    title: "Bio-Responsive Input",
    tone: C.yellow,
    points: [
      "Tracks stress, pace, and answer momentum while the session is still happening.",
      "Uses webcam-guided biometric simulation to keep pressure visible, not hidden.",
      "Turns silent signals into readable coaching prompts instead of vague post-session advice.",
    ],
  },
  {
    title: "Live Coaching",
    tone: C.violet,
    points: [
      "Pushes short notes when filler words spike, delivery drifts, or stress climbs too fast.",
      "Interrupts with a calming breather when the interview pressure gets too high.",
      "Keeps coaching in-session instead of making the user wait for a final report.",
    ],
  },
  {
    title: "Actionable Reports",
    tone: C.mint,
    points: [
      "Breaks down communication, answer quality, stress, and pacing in one report.",
      "Shows question-linked graphs so Q1, Q2, and later moments are easy to read.",
      "Unlocks collectible reward badges only when both calm delivery and answer quality are strong.",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <MarketingShell
      eyebrow="Feature Set"
      title="SEE EVERY SIGNAL."
      accent="COACH IN THE MOMENT."
      intro="AuraSync is built for pressure practice. The product does not wait until the end to tell you what went wrong, and it does not flatten everything into one generic confidence score."
      ctaTitle="MAKE FEEDBACK FEEL IMMEDIATE."
      ctaBody="Run a live interview, trigger coaching notes in real time, and finish with a report that actually explains what the numbers mean."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        {FEATURE_SETS.map((feature) => (
          <BrutalCard key={feature.title} title={feature.title} tone={feature.tone}>
            <div style={{ display: "grid", gap: 10 }}>
              {feature.points.map((point) => (
                <div key={point} style={{ ...b2, padding: "12px 14px", background: "#fff" }}>
                  <div style={{ ...font(700, "14px"), lineHeight: 1.65 }}>{point}</div>
                </div>
              ))}
            </div>
          </BrutalCard>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        {[
          ["Stress spikes", "Gentle pause overlays with calm-down guidance instead of letting the spiral continue."],
          ["Speech speed", "WPM is tracked alongside question markers so pacing changes have context."],
          ["Coding rounds", "Code-editor prompts stay intact instead of being overwritten by generic verbal questions."],
          ["Reward locker", "Collectible web2 badges stay attached to session history and profile streaks."],
        ].map(([label, text], index) => (
          <div key={label} style={{ background: index % 2 === 0 ? C.white : C.bg, border: "4px solid #000", boxShadow: "8px 8px 0px 0px #000", padding: "18px 18px 20px" }}>
            <div style={{ ...font(900, "11px", true, "0.14em"), marginBottom: 10 }}>{label}</div>
            <div style={{ ...font(700, "15px"), lineHeight: 1.7 }}>{text}</div>
          </div>
        ))}
      </div>
    </MarketingShell>
  );
}
