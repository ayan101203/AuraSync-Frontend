const C = {
  black: "#000",
  white: "#fff",
  bg: "#FFFDF5",
  yellow: "#FFD93D",
  violet: "#C4B5FD",
  red: "#FF6B6B",
  green: "#A8F0C6",
};

const sh = { sm: "4px 4px 0px 0px #000", md: "8px 8px 0px 0px #000" };
const font = (w = 700, sz = "16px", caps = false) => ({
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: w,
  fontSize: sz,
  ...(caps ? { textTransform: "uppercase", letterSpacing: "0.1em" } : {}),
});

export default function RewardCollectibleCard({
  title,
  summary,
  imageUrl,
  eyebrow = "AuraSync Collectible",
  metaLeft = "Neo-Brut",
  metaRight = "1 of 1",
  accent = C.yellow,
  panel = C.white,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <div style={{
      border: "4px solid #000",
      background: panel,
      boxShadow: sh.md,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        padding: compact ? "10px 12px" : "12px 14px",
        borderBottom: "4px solid #000",
        background: accent,
      }}>
        <div style={{ ...font(900, compact ? "10px" : "11px", true) }}>{eyebrow}</div>
        <div style={{ ...font(700, compact ? "10px" : "11px", true) }}>{metaRight}</div>
      </div>

      <div style={{ padding: compact ? 12 : 16, background: "linear-gradient(135deg, #fffdf5 0%, #f6f1ff 48%, #fff7d6 100%)" }}>
        <div style={{
          border: "4px solid #000",
          background: "#fff",
          boxShadow: sh.sm,
          padding: compact ? 10 : 14,
        }}>
          <div style={{
            border: "3px solid #000",
            background: C.bg,
            padding: compact ? 8 : 10,
            marginBottom: compact ? 10 : 12,
          }}>
            <img
              src={imageUrl}
              alt={title ?? "Reward collectible"}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                display: "block",
                border: "3px solid #000",
                background: "#fff",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <div style={{ ...font(700, "9px", true), color: "#555" }}>{metaLeft}</div>
            <div style={{ ...font(700, "9px", true), color: "#555" }}>Collectible Badge</div>
          </div>
          <div style={{ ...font(900, compact ? "18px" : "20px"), lineHeight: 1.05, marginBottom: 8 }}>
            {title}
          </div>
          <div style={{ ...font(400, compact ? "12px" : "13px"), color: "#444", lineHeight: 1.55 }}>
            {summary}
          </div>
        </div>
      </div>

      {actionLabel && onAction && (
        <div style={{ padding: compact ? "0 12px 12px" : "0 16px 16px" }}>
          <button
            className="btn"
            onClick={onAction}
            style={{
              width: "100%",
              padding: compact ? "10px 12px" : "12px 14px",
              border: "3px solid #000",
              background: C.black,
              color: C.white,
              boxShadow: sh.sm,
              ...font(700, "12px", true),
            }}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
