import Avatar from "../Avatar";

// Design tokens
const T = {
  bg: "var(--c-bg)",
  card: "var(--c-card)",
  cardBorder: "var(--c-cardBorder)",
  active: "var(--c-active)",
  activeBorder: "#7567C955",
  accent: "#7567C9",
  accentSoft: "var(--c-accentSoft)",
  accentText: "var(--c-accentText)",
  text: "var(--c-text)",
  textSub: "var(--c-textSub)",
  textMuted: "var(--c-textMuted)",
  green: "#3DBE82",
};

const DOMAIN_LABEL = {
  internship: "Internship",
  placement:  "Placement",
  both:       "Intern + Placement",
};

export default function SeniorCard({ mentor, isSelected, onClick }) {
  const domainLabel = DOMAIN_LABEL[mentor.primaryDomain] || null;
  const fieldLabel  = mentor.companyDomain || null;

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer rounded-2xl p-4"
      style={{
        background: isSelected ? T.active : T.card,
        border: `1px solid ${isSelected ? T.activeBorder : T.cardBorder}`,
        boxShadow: isSelected
          ? `0 0 0 1px ${T.accent}30, 0 4px 24px ${T.accent}14`
          : "0 1px 6px rgba(0,0,0,0.35)",
        transition: "background 0.18s, border-color 0.18s, box-shadow 0.18s",
      }}
    >
      {/* Avatar + Name + Match% */}
      <div className="flex items-start gap-3 mb-2.5">
        <Avatar src={mentor.profilePicture} name={mentor.name || mentor.initials} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate"
            style={{ color: T.text, fontFamily: "Fraunces, serif" }}>
            {mentor.name}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: T.textSub, fontFamily: "Inter, sans-serif" }}>
            {mentor.role}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-lg font-bold leading-none"
            style={{ color: T.accent, fontFamily: "Fraunces, serif" }}>
            {mentor.matchPct}%
          </span>
          <p className="text-xs" style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>match</p>
        </div>
      </div>

      {/* Specialization pills */}
      {(domainLabel || fieldLabel) && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {domainLabel && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: `${T.accent}18`, color: T.accentText, border: `1px solid ${T.accent}35`, fontFamily: "Inter, sans-serif" }}>
              {domainLabel}
            </span>
          )}
          {fieldLabel && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: `${T.green}14`, color: T.green, border: `1px solid ${T.green}35`, fontFamily: "Inter, sans-serif" }}>
              {fieldLabel}
            </span>
          )}
        </div>
      )}

      {/* Why matched */}
      <p className="text-xs leading-relaxed" style={{ color: T.textSub, fontFamily: "Inter, sans-serif" }}>
        <span className="font-semibold" style={{ color: T.textMuted }}>Why matched: </span>
        {mentor.matchReason}
      </p>

      {/* Selected glow dot */}
      {isSelected && (
        <div className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full"
          style={{ background: T.accent, boxShadow: `0 0 6px ${T.accent}` }} />
      )}
    </div>
  );
}
