import { ArrowLeft } from "lucide-react";

// One header for every page: serif title (same face as the home headline),
// a plain-language subtitle, optional back button and right-side actions.
export default function PageHeader({ title, subtitle, onBack, actions, style }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22, ...style }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
        {onBack && (
          <button onClick={onBack} aria-label="Back"
            style={{ marginTop: 3, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: "1px solid var(--c-cardBorder)", background: "var(--c-card)", color: "var(--c-text)", cursor: "pointer", padding: 0 }}>
            <ArrowLeft size={16} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.45rem, 3vw, 1.8rem)", lineHeight: 1.2, letterSpacing: "-0.005em", color: "var(--c-text)", textWrap: "balance" }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: "6px 0 0", fontSize: "0.88rem", lineHeight: 1.5, color: "var(--c-textSub)", maxWidth: 560 }}>{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
