import { motion } from "framer-motion";

export default function SeniorCard({ mentor, isSelected, onClick }) {
  const avatarColors = {
    AK: { bg: "rgba(139,92,246,0.25)", text: "#a78bfa" },
    PS: { bg: "rgba(59,130,246,0.25)", text: "#60a5fa" },
    RT: { bg: "rgba(245,158,11,0.25)", text: "#fbbf24" },
  };
  const colors = avatarColors[mentor.initials] || { bg: "rgba(107,114,128,0.25)", text: "#9ca3af" };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.015, y: -1 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="relative cursor-pointer rounded-2xl p-4 transition-all duration-200"
      style={{
        background: isSelected ? "rgba(245,158,11,0.06)" : "#141414",
        border: isSelected ? "1px solid rgba(245,158,11,0.5)" : "1px solid #262626",
        boxShadow: isSelected
          ? "0 0 0 1px rgba(245,158,11,0.2), 0 4px 24px rgba(245,158,11,0.08)"
          : "0 1px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top row: avatar + name + match % */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: colors.bg, color: colors.text, fontFamily: "Inter, sans-serif" }}
        >
          {mentor.initials}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-tight truncate"
            style={{ color: "#F5F5F4", fontFamily: "Fraunces, serif" }}
          >
            {mentor.name}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: "#A8A29E", fontFamily: "Inter, sans-serif" }}>
            {mentor.role}
          </p>
        </div>

        {/* Match % */}
        <div className="flex-shrink-0 text-right">
          <span
            className="text-lg font-bold leading-none"
            style={{ color: "#FB923C", fontFamily: "Fraunces, serif" }}
          >
            {mentor.matchPct}%
          </span>
          <p className="text-xs mt-0.5" style={{ color: "#737373", fontFamily: "Inter, sans-serif" }}>
            match
          </p>
        </div>
      </div>

      {/* Why matched */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: "#A8A29E", fontFamily: "Inter, sans-serif" }}
      >
        <span className="font-semibold" style={{ color: "#737373" }}>
          Why matched:{" "}
        </span>
        {mentor.matchReason}
      </p>

      {/* Selected indicator dot */}
      {isSelected && (
        <div
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ background: "#F59E0B" }}
        />
      )}
    </motion.div>
  );
}
