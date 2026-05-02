import { useNavigate } from "react-router-dom";

export default function BackButton({
  to,
  label = "Back",
  background = "#fff",
  color = "#000",
  shadow = "4px 4px 0px 0px #000",
  border = "4px solid #000",
  style = {},
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="btn"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      style={{
        border,
        background,
        color,
        boxShadow: shadow,
        padding: "8px 16px",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        ...style,
      }}
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}
