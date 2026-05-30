import { motion } from "framer-motion";

// Design tokens
const T = {
  bg: "#0d0c0a",
  card: "#1a1714",
  cardBorder: "#2d2820",
  accent: "#d4891a",
  accentSoft: "#d4891a22",
  accentText: "#f0a93a",
  text: "#ede8de",
  textSub: "#967f68",
  textMuted: "#5a5040",
  green: "#2d8a5f",
};

const AVATAR = {
  AK: { bg: "rgba(117,103,201,0.28)", text: "#A99DF0" },
  PS: { bg: "rgba(59,130,246,0.22)",  text: "#7EB8F7" },
  RT: { bg: "rgba(61,190,130,0.22)",  text: "#3DBE82" },
};

export default function SeniorCard({ mentor, isSelected, onClick }) {
  const av = AVATAR[mentor.initials] || { bg: "rgba(150,144,171,0.2)", text: T.textSub };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.018, y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
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
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: av.bg, color: av.text, fontFamily: "Inter, sans-serif" }}
        >
          {mentor.initials}
        </div>
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
    </motion.div>
  );
}
