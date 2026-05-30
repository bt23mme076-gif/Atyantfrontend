import { motion } from "framer-motion";
import { Star, Users, Clock, Phone } from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";

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

// SeniorDetail is NOT a modal — it renders inline in the center column,
// below the user query card. Parent controls visibility.
export default function SeniorDetail({ mentor, onTalkToMentor }) {
  if (!mentor) return null;
  const av = AVATAR[mentor.initials] || { bg: "rgba(150,144,171,0.2)", text: T.textSub };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: T.card,
        border: `1px solid ${T.cardBorder}`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.45), 0 0 0 1px ${T.accent}18`,
      }}
    >
      {/* ── Header ── */}
      <div className="p-5 pb-4" style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: av.bg, color: av.text, fontFamily: "Fraunces, serif" }}
          >
            {mentor.initials}
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold"
                style={{ color: T.text, fontFamily: "Fraunces, serif" }}>
                {mentor.name}
              </h2>
              <VerifiedBadge verifiedVia={mentor.verifiedVia} />
            </div>
            <p className="text-sm mt-0.5" style={{ color: T.textSub, fontFamily: "Inter, sans-serif" }}>
              {mentor.role}
            </p>
            <p className="text-xs mt-1" style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>
              {mentor.college} · {mentor.branch}
            </p>
          </div>

          {/* Match % */}
          <div className="text-right flex-shrink-0">
            <span className="text-2xl font-bold"
              style={{ color: T.accent, fontFamily: "Fraunces, serif" }}>
              {mentor.matchPct}%
            </span>
            <p className="text-xs" style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>match</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col gap-5">

        {/* Journey */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2.5"
            style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>
            Their Journey
          </p>
          <p className="text-sm leading-[1.85]"
            style={{ color: T.textSub, fontFamily: "Inter, sans-serif" }}
            dangerouslySetInnerHTML={{ __html: mentor.story }}
          />
        </div>

        {/* Outcome box */}
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: `${T.green}10`, border: `1px solid ${T.green}30` }}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${T.green}25` }}>
            <span style={{ color: T.green, fontSize: "10px", lineHeight: 1 }}>✓</span>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: T.green, fontFamily: "Inter, sans-serif" }}>
              Outcome
            </p>
            <p className="text-sm leading-relaxed" style={{ color: T.textSub, fontFamily: "Inter, sans-serif" }}>
              {mentor.outcome}
            </p>
          </div>
        </div>

        {/* Similarity tags */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2.5"
            style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>
            Why You Match
          </p>
          <div className="flex flex-wrap gap-2">
            {mentor.tags.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 380 }}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: T.accentSoft,
                  border: `1px solid ${T.accent}55`,
                  color: T.accentText,
                  fontFamily: "Inter, sans-serif",
                  boxShadow: `0 0 8px ${T.accent}14`,
                }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 rounded-xl overflow-hidden"
          style={{ border: `1px solid ${T.cardBorder}` }}>
          {[
            { icon: <Users size={13} />, label: "Students", value: mentor.studentsHelped },
            { icon: <Star size={13} />,  label: "Rating",   value: mentor.rating },
            { icon: <Clock size={13} />, label: "Timeline", value: mentor.timeline },
          ].map((s, i) => (
            <div key={s.label} className="p-3 text-center"
              style={{
                background: T.bg,
                borderRight: i < 2 ? `1px solid ${T.cardBorder}` : "none",
              }}>
              <div className="flex justify-center mb-1" style={{ color: T.textMuted }}>{s.icon}</div>
              <p className="text-sm font-bold" style={{ color: T.text, fontFamily: "Fraunces, serif" }}>
                {s.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Talk to mentor CTA — scrolled into view */}
        <motion.button
          onClick={onTalkToMentor}
          whileHover={{ scale: 1.02, boxShadow: `0 6px 28px ${T.accent}55` }}
          whileTap={{ scale: 0.975 }}
          className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, #d4891a, #f0a93a)",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            boxShadow: `0 4px 20px ${T.accent}40`,
            border: "none",
            letterSpacing: "0.01em",
          }}
        >
          <Phone size={15} />
          Talk to {mentor.name.split(" ")[0]}
        </motion.button>
      </div>
    </motion.div>
  );
}
