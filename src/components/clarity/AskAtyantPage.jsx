import { useState } from "react";
import { Send } from "lucide-react";

const C = {
  bg: "#13121A",
  sidebar: "#0D0C12",
  sidebarBorder: "#211F2B",
  card: "#1A1823",
  cardHover: "#211E2C",
  cardBorder: "#322E40",
  active: "#221E33",
  activeBorder: "#443A6B",
  accent: "#7567C9",
  accentSoft: "#7567C922",
  accentText: "#8E80DB",
  text: "#ECEAF3",
  textSub: "#978FAB",
  textMuted: "#5F576F",
  green: "#3DBE82",
};

export default function AskAtyantPage({ user, onGoToClarity }) {
  const [query, setQuery] = useState("");

  const quickActions = [
    { label: "Switch Field" },
    { label: "Build Skills" },
    { label: "Get Roadmap" },
    { label: "Talk to Senior" },
    { label: "Find My Match" },
  ];

  const handleSend = () => {
    if (query.trim().length < 3) return;
    onGoToClarity(query.trim());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "2rem" }}>
      <h1 style={{ textAlign: "center", fontSize: "clamp(1.9rem,4.5vw,2.8rem)", fontWeight: 400, lineHeight: 1.2, marginBottom: "2rem", color: C.text, fontFamily: "Georgia,'Times New Roman',serif" }}>
        Find someone exactly like you…
      </h1>

      <div
        style={{ width: "100%", maxWidth: 680, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: "1.1rem 1.4rem 1rem", marginBottom: "0.6rem" }}
        onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}22`; }}
        onBlurCapture={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = "none"; }}
      >
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="How do I get an AI/ML internship from VNIT Metallurgy with no prior experience?"
          rows={2}
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: C.text, fontSize: "1rem", lineHeight: 1.65, resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.6rem" }}>
          <button style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "1.3rem", lineHeight: 1, padding: 0 }}>+</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.74rem", color: C.textMuted, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 999, padding: "3px 11px", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block", flexShrink: 0 }} />
              23 VNIT students found their path this week
            </span>
            <button onClick={handleSend}
              style={{ background: query.trim().length > 2 ? C.accent : C.active, border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
              <Send size={15} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      <p style={{ fontSize: "0.78rem", color: C.textMuted, marginBottom: "1.5rem", textAlign: "center" }}>
        Matched to 800+ verified journeys from Tier-2 colleges across India
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {quickActions.map((a, i) => (
          <button key={i} onClick={() => onGoToClarity(a.label)}
            style={{ background: "#221E33", border: `1px solid #322E40`, borderRadius: 999, padding: "7px 18px", color: C.textSub, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.accent + "88"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#221E33"; e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = "#322E40"; }}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
