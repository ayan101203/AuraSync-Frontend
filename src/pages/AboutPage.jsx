import MarketingShell, { BrutalCard, marketingColors as C, marketingFont as font, marketingBorder2 as b2 } from "../components/MarketingShell";

export default function AboutPage() {
  return (
    <MarketingShell
      eyebrow="About AuraSync"
      title="WE BUILT THIS"
      accent="FOR HIGH-PRESSURE SPEAKING."
      intro="AuraSync exists because most interview tools either feel too soft, too generic, or too late. We wanted the feedback loop to be immediate, honest, and visually unmistakable."
      ctaTitle="MAKE PRACTICE FEEL REAL."
      ctaBody="The product is opinionated on purpose: bold typography, heavy borders, and clear state changes so the user never has to guess what the system is doing."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        <BrutalCard title="What We Care About" tone={C.yellow}>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              "Calm users down when pressure spikes instead of letting the session quietly derail.",
              "Explain the score so communication, answer quality, and stress are not mashed together.",
              "Keep reports memorable enough that users actually come back and improve.",
            ].map((item) => (
              <div key={item} style={{ ...b2, padding: "12px 14px", background: "#fff" }}>
                <div style={{ ...font(700, "14px"), lineHeight: 1.65 }}>{item}</div>
              </div>
            ))}
          </div>
        </BrutalCard>

        <BrutalCard title="Why The Style Looks Like This" tone={C.violet}>
          <div style={{ ...font(700, "15px"), lineHeight: 1.8 }}>
            Neo-brutalism fits the product. Interview prep already carries enough ambiguity, so the interface leans hard into contrast, direct labels, visible state, and a little swagger. It should feel sharp, not sleepy.
          </div>
        </BrutalCard>

        <BrutalCard title="What Makes AuraSync Different" tone={C.red} accent={C.white}>
          <div style={{ ...font(700, "15px"), lineHeight: 1.8 }}>
            The live coach feed, stress-aware breather, profile streaks, and collectible reward locker all connect. This is not just a transcript scorer. It is a full feedback ritual.
          </div>
        </BrutalCard>
      </div>

      <div style={{ background: C.mint, border: "4px solid #000", boxShadow: "12px 12px 0px 0px #000", padding: "24px 22px" }}>
        <div style={{ ...font(900, "12px", true, "0.18em"), marginBottom: 12 }}>PRODUCT PRINCIPLES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          {[
            "Be clear before being clever.",
            "Interrupt stress with kindness.",
            "Show the user what each score means.",
            "Let rewards mean something.",
            "Never ship dead links on the main path.",
          ].map((rule, index) => (
            <div key={rule} style={{ background: index % 2 === 0 ? C.white : C.bg, ...b2, padding: "14px 16px" }}>
              <div style={{ ...font(700, "14px"), lineHeight: 1.6 }}>{rule}</div>
            </div>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
