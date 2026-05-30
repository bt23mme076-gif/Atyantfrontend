import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Users, Clock } from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";

const avatarColors = {
  AK: { bg: "rgba(139,92,246,0.25)", text: "#a78bfa" },
  PS: { bg: "rgba(59,130,246,0.25)", text: "#60a5fa" },
  RT: { bg: "rgba(245,158,11,0.25)", text: "#fbbf24" },
};

export default function SeniorDetail({ mentor, onClose, onSelect }) {
  if (!mentor) return null;
  const colors = avatarColors[mentor.initials] || { bg: "rgba(107,114,128,0.25)", text: "#9ca3af" };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.93, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
          style={{
            background: "#141414",
            border: "1px solid #262626",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "#262626", color: "#A8A29E" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.color = "#F5F5F4"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#262626"; e.currentTarget.style.color = "#A8A29E"; }}
          >
            <X size={14} />
          </button>

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ background: colors.bg, color: colors.text, fontFamily: "Fraunces, serif" }}
              >
                {mentor.initials}
              </div>
              <div className="flex-1">
                <h2
                  className="text-xl font-semibold leading-tight"
                  style={{ color: "#F5F5F4", fontFamily: "Fraunces, serif" }}
                >
                  {mentor.name}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "#A8A29E", fontFamily: "Inter, sans-serif" }}>
                  {mentor.role}
                </p>
                <p className="text-xs mt-1" style={{ color: "#737373", fontFamily: "Inter, sans-serif" }}>
                  {mentor.college} · {mentor.branch}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-2xl font-bold" style={{ color: "#FB923C", fontFamily: "Fraunces, serif" }}>
                  {mentor.matchPct}%
                </span>
                <p className="text-xs" style={{ color: "#737373", fontFamily: "Inter, sans-serif" }}>match</p>
              </div>
            </div>

            {/* Verified Badge */}
            <div className="mb-5">
              <VerifiedBadge verifiedVia={mentor.verifiedVia} />
            </div>

            {/* Divider */}
            <div className="mb-5" style={{ height: "1px", background: "#262626" }} />

            {/* Full Story */}
            <div className="mb-5">
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#737373", fontFamily: "Inter, sans-serif" }}
              >
                Their Journey
              </h3>
              <p
                className="text-sm leading-loose"
                style={{ color: "#A8A29E", fontFamily: "Inter, sans-serif" }}
                dangerouslySetInnerHTML={{ __html: mentor.story }}
              />
            </div>

            {/* Outcome Box */}
            <div
              className="rounded-xl p-4 mb-5 flex items-start gap-3"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(16,185,129,0.2)" }}
              >
                <span style={{ color: "#10B981", fontSize: "10px" }}>✓</span>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "#10B981", fontFamily: "Inter, sans-serif" }}>
                  Outcome
                </p>
                <p className="text-sm" style={{ color: "#A8A29E", fontFamily: "Inter, sans-serif" }}>
                  {mentor.outcome}
                </p>
              </div>
            </div>

            {/* Similarity Tags */}
            <div className="mb-5">
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#737373", fontFamily: "Inter, sans-serif" }}
              >
                Why You Match
              </h3>
              <div className="flex flex-wrap gap-2">
                {mentor.tags.map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 400 }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      color: "#F59E0B",
                      fontFamily: "Inter, sans-serif",
                      boxShadow: "0 0 8px rgba(245,158,11,0.08)",
                    }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Stats Row */}
            <div
              className="grid grid-cols-3 rounded-xl overflow-hidden mb-6"
              style={{ border: "1px solid #262626" }}
            >
              {[
                { icon: <Users size={14} />, label: "Students helped", value: mentor.studentsHelped },
                { icon: <Star size={14} />, label: "Rating", value: mentor.rating },
                { icon: <Clock size={14} />, label: "Timeline", value: mentor.timeline },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="p-3 text-center"
                  style={{
                    background: "#0f0f0f",
                    borderRight: i < 2 ? "1px solid #262626" : "none",
                  }}
                >
                  <div className="flex justify-center mb-1.5" style={{ color: "#737373" }}>
                    {stat.icon}
                  </div>
                  <p
                    className="text-base font-bold"
                    style={{ color: "#F5F5F4", fontFamily: "Fraunces, serif" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#737373", fontFamily: "Inter, sans-serif" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.button
              onClick={onSelect}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #FB923C)",
                color: "#0A0A0A",
                fontFamily: "Inter, sans-serif",
                boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
                border: "none",
              }}
            >
              Select This Mentor
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
