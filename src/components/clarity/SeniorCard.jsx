import Avatar from "../Avatar";

// Design tokens
const T = {
  bg: "#13121A",
  card: "#1A1823",
  cardBorder: "#322E40",
  active: "#221E33",
  activeBorder: "#7567C955",
  accent: "#7567C9",
  accentSoft: "#7567C922",
  accentText: "#8E80DB",
  text: "#ECEAF3",
  textSub: "#978FAB",
  textMuted: "#5F576F",
  green: "#3DBE82",
};

const AVATAR = {
  AK: { bg: "rgba(117,103,201,0.28)", text: "#8E80DB" },
  PS: { bg: "rgba(59,130,246,0.22)",  text: "#7EB8F7" },
  RT: { bg: "rgba(61,190,130,0.22)",  text: "#3DBE82" },
};

export default function SeniorCard({ mentor, isSelected, onClick }) {
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
