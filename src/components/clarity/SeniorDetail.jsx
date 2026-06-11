import { Star, Users, Clock, Video } from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";
import Avatar from "../Avatar";

// Design tokens
const T = {
  bg: "var(--c-bg)",
  card: "var(--c-card)",
  cardBorder: "var(--c-cardBorder)",
  accent: "#7567C9",
  accentSoft: "var(--c-accentSoft)",
  accentText: "var(--c-accentText)",
  text: "var(--c-text)",
  textSub: "var(--c-textSub)",
  textMuted: "var(--c-textMuted)",
  green: "#3DBE82",
};

// Cheapest session price (the platform "1:1 Chat" tier) — shown on the CTA so the
// student sees a price before tapping. The real, mentor-specific prices load from
// the service catalog on the full Book a Session page.
const STARTING_PRICE = 49;

export default function SeniorDetail({ mentor, user, onClose, onSelect, onTalkToMentor }) {
  if (!mentor) return null;

  return (
    <div
      className="flex flex-col overflow-hidden h-full"
      style={{ position: "relative", background: T.bg }}
    >
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 py-2.5 flex-shrink-0" style={{ borderBottom: `1px solid ${T.cardBorder}`, background: T.card }}>
        <div className="flex items-center gap-3.5 max-w-3xl mx-auto">
          {/* Avatar */}
          <Avatar src={mentor.profilePicture} name={mentor.name || mentor.initials} size={44} style={{ borderRadius: 12 }} />

          {/* Name block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold"
                style={{ color: T.text, fontFamily: "Fraunces, serif" }}>
                {mentor.name}
              </h2>
              <VerifiedBadge verifiedVia={mentor.verifiedVia} />
            </div>
            <p className="text-xs mt-0.5" style={{ color: T.textSub, fontFamily: "Inter, sans-serif" }}>
              {mentor.role}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>
              {mentor.college} · {mentor.branch}
            </p>
          </div>

          {/* Match % */}
          <div className="text-right flex-shrink-0">
            <span className="text-xl font-bold"
              style={{ color: T.accent, fontFamily: "Fraunces, serif" }}>
              {mentor.matchPct}%
            </span>
            <p className="text-xs" style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>match</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 flex flex-col gap-3.5 max-w-3xl mx-auto">
          {/* Journey */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1.5"
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
            className="rounded-xl p-3 flex items-start gap-3"
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
            <p className="text-xs font-bold uppercase tracking-widest mb-1.5"
              style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>
              Why You Match
            </p>
            <div className="flex flex-wrap gap-2">
              {mentor.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: T.accentSoft,
                    border: `1px solid ${T.accent}55`,
                    color: T.accentText,
                    fontFamily: "Inter, sans-serif",
                    boxShadow: `0 0 8px ${T.accent}14`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 rounded-xl overflow-hidden"
            style={{ border: `1px solid ${T.cardBorder}` }}>
            {[
              { icon: <Users size={13} />, label: "Students", value: mentor.studentsHelped },
              { icon: <Star size={13} />, label: "Rating", value: mentor.rating },
              { icon: <Clock size={13} />, label: "Timeline", value: mentor.timeline },
            ].map((s, i) => (
              <div key={s.label} className="p-2 text-center"
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

        </div>
      </div>

      {/* ── Fixed Footer CTA ── */}
      <div className="px-4 sm:px-6 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${T.cardBorder}`, background: T.card }}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => {
              if (onSelect) onSelect();
              // Go straight to the full Book a Session page (bigger, readable layout)
              // instead of a cramped in-place sheet.
              if (onTalkToMentor) onTalkToMentor(mentor);
            }}
            className="w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #7567C9, #5a52a8)",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              boxShadow: `0 4px 20px ${T.accent}40`,
              border: "none",
              letterSpacing: "0.01em",
              cursor: "pointer",
            }}
          >
            <Video size={16} />
            Book 1:1 session — starting ₹{STARTING_PRICE}
          </button>
        </div>
      </div>
    </div>
  );
}
