import MarketingShell, { BrutalCard, marketingColors as C, marketingFont as font, marketingBorder2 as b2 } from "../components/MarketingShell";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    tone: C.yellow,
    features: ["Guided interview practice", "Live stress and WPM tracking", "Profile streaks and reward locker"],
  },
  {
    name: "Focus",
    price: "$12/mo",
    tone: C.violet,
    features: ["Unlimited sessions", "Priority AI review runs", "Expanded coaching history and exports"],
  },
  {
    name: "Hiring Loop",
    price: "$39/mo",
    tone: C.red,
    features: ["Team-ready mock loops", "Session packs for recruiters or clubs", "Shared feedback snapshots"],
  },
];

export default function PricingPage() {
  return (
    <MarketingShell
      eyebrow="Pricing"
      title="PICK A PLAN."
      accent="KEEP THE EDGE."
      intro="AuraSync stays simple on purpose: one free lane to get started, one focused lane for serious solo practice, and one team lane when interview prep becomes collaborative."
      ctaTitle="START ON THE FREE LANE."
      ctaBody="The free plan already includes the core loop: practice, biometrics, coaching notes, reports, profile streaks, and reward badges."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        {PLANS.map((plan) => (
          <BrutalCard key={plan.name} title={plan.name} tone={plan.tone} accent={plan.tone === C.red ? C.white : C.black}>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ ...font(900, "38px"), lineHeight: 1 }}>{plan.price}</div>
              <div style={{ ...font(700, "14px"), lineHeight: 1.7 }}>
                {plan.name === "Starter"
                  ? "Best for first-time users and quick practice runs."
                  : plan.name === "Focus"
                    ? "Best for candidates training every week."
                    : "Best for bootcamps, clubs, and interview cohorts."}
              </div>
              {plan.features.map((feature) => (
                <div key={feature} style={{ ...b2, padding: "12px 14px", background: "#fff" }}>
                  <div style={{ ...font(700, "14px"), lineHeight: 1.6 }}>{feature}</div>
                </div>
              ))}
            </div>
          </BrutalCard>
        ))}
      </div>

      <div style={{ background: C.white, border: "4px solid #000", boxShadow: "12px 12px 0px 0px #000", padding: "24px 22px" }}>
        <div style={{ ...font(900, "12px", true, "0.18em"), marginBottom: 10 }}>WHAT NEVER CHANGES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            "Heavy-feedback, low-fluff UI.",
            "Session reports with stress and answer quality context.",
            "Coaching notes written for real interview recovery, not motivational wallpaper.",
            "Neo-brutalist product style across practice, reports, and profile pages.",
          ].map((item, index) => (
            <div key={item} style={{ background: index % 2 === 0 ? C.bg : C.mint, ...b2, padding: "14px 16px" }}>
              <div style={{ ...font(700, "14px"), lineHeight: 1.65 }}>{item}</div>
            </div>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
