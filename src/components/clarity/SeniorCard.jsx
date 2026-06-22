import { BadgeCheck } from "lucide-react";
import Avatar from "../Avatar";

const T = {
  bg:         "var(--c-bg)",
  card:       "var(--c-card)",
  cardBorder: "var(--c-cardBorder)",
  active:     "var(--c-active)",
  accent:     "#7567C9",
  accentSoft: "var(--c-accentSoft)",
  accentText: "var(--c-accentText)",
  text:       "var(--c-text)",
  textSub:    "var(--c-textSub)",
  textMuted:  "var(--c-textMuted)",
  green:      "#22C67A",
};

const DOMAIN_SHORT = {
  internship: "Internship",
  placement:  "Placement",
  both:       "Intern + Placement",
};

export default function SeniorCard({ mentor, isSelected, onClick }) {
  const domainLabel = DOMAIN_SHORT[mentor.primaryDomain] || null;
  const fieldLabel  = mentor.companyDomain || null;
  const isVerified  = mentor.isVerified || (mentor.completionPct ?? 0) >= 80;

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: 16,
        padding: "14px",
        background: isSelected ? T.accentSoft : T.card,
        border: `1.5px solid ${isSelected ? T.accent + "55" : T.cardBorder}`,
        boxShadow: isSelected
          ? `0 0 0 1px ${T.accent}25, 0 4px 20px ${T.accent}12`
          : "0 1px 4px rgba(0,0,0,0.06)",
        transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = T.accent + "40";
          e.currentTarget.style.boxShadow = `0 4px 16px ${T.accent}14`;
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = T.cardBorder;
          e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
          e.currentTarget.style.transform = "none";
        }
      }}
    >
      {/* Selected accent bar */}
      {isSelected && (
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0, width: 3,
          borderRadius: "16px 0 0 16px",
          background: `linear-gradient(180deg, ${T.accent}, #9F7AEA)`,
        }} />
      )}

      {/* Top row: avatar + name + match% */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 10 }}>
        {/* Avatar with gradient ring */}
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0, padding: 2,
          background: isSelected
            ? `linear-gradient(135deg, ${T.accent}, ${T.green})`
            : `linear-gradient(135deg, ${T.accent}50, ${T.green}40)`,
        }}>
          <Avatar
            src={mentor.profilePicture}
            name={mentor.name || mentor.initials}
            size={38}
            style={{ borderRadius: 10, display: "block" }}
          />
        </div>

        {/* Name + role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
            <p style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: 14, fontWeight: 700, color: T.text,
              margin: 0, lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {mentor.name}
            </p>
            {isVerified && (
              <BadgeCheck size={13} color={T.green} strokeWidth={2.2} style={{ flexShrink: 0 }} />
            )}
          </div>
          <p style={{
            fontSize: 11.5, color: T.textSub, margin: "2px 0 0",
            fontFamily: "Inter, sans-serif", fontWeight: 400,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {mentor.role || [mentor.college, mentor.branch].filter(Boolean).join(" · ")}
          </p>
        </div>

        {/* Match % */}
        {mentor.matchPct > 0 && (
          <div style={{
            flexShrink: 0, textAlign: "right",
            background: isSelected ? `${T.accent}18` : "transparent",
            borderRadius: 8, padding: isSelected ? "3px 7px" : "3px 0",
          }}>
            <span style={{
              fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 800,
              color: T.accent, lineHeight: 1, display: "block",
            }}>
              {mentor.matchPct}%
            </span>
            <span style={{ fontSize: 9.5, color: T.textMuted, fontFamily: "Inter, sans-serif" }}>match</span>
          </div>
        )}
      </div>

      {/* Domain pills */}
      {(domainLabel || fieldLabel) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 9 }}>
          {domainLabel && (
            <span style={{
              padding: "3px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 600,
              background: `${T.accent}14`, color: T.accentText,
              border: `1px solid ${T.accent}28`, fontFamily: "Inter, sans-serif",
            }}>
              {domainLabel}
            </span>
          )}
          {fieldLabel && (
            <span style={{
              padding: "3px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 600,
              background: `${T.green}12`, color: T.green,
              border: `1px solid ${T.green}28`, fontFamily: "Inter, sans-serif",
            }}>
              {fieldLabel}
            </span>
          )}
        </div>
      )}

      {/* Match reason */}
      {mentor.matchReason && (
        <p style={{
          fontSize: 12, lineHeight: 1.65, color: T.textSub,
          fontFamily: "Inter, sans-serif", margin: 0,
        }}>
          <span style={{ fontWeight: 600, color: T.textMuted }}>Why matched: </span>
          {mentor.matchReason}
        </p>
      )}
    </div>
  );
}
