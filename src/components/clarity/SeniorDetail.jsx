import { Star, Users, Clock, Video, ExternalLink, BadgeCheck, MessageCircle } from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";
import Avatar from "../Avatar";
import { useAuth } from "../../context/AuthContext";

const T = {
  bg:         "var(--c-bg)",
  card:       "var(--c-card)",
  cardBorder: "var(--c-cardBorder)",
  accent:     "#7567C9",
  accentSoft: "var(--c-accentSoft)",
  accentText: "var(--c-accentText)",
  text:       "var(--c-text)",
  textSub:    "var(--c-textSub)",
  textMuted:  "var(--c-textMuted)",
  green:      "#3DBE82",
};

const DOMAIN_LABEL = {
  internship: "Internship Guidance",
  placement:  "Placement Guidance",
  both:       "Internship & Placement",
};

const STARTING_PRICE = 49;

function StarRow({ value }) {
  const num = parseFloat(value) || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={11}
          fill={n <= Math.round(num) ? "#F59E0B" : "none"}
          stroke={n <= Math.round(num) ? "#F59E0B" : T.textMuted}
        />
      ))}
    </div>
  );
}

export default function SeniorDetail({ mentor, user, onClose, onSelect, onTalkToMentor, onOpenChat }) {
  if (!mentor) return null;
  const { user: currentUser } = useAuth();

  const domainLabel    = DOMAIN_LABEL[mentor.primaryDomain] || null;
  const fieldLabel     = mentor.companyDomain || null;
  const linkedinUrl    = mentor.linkedinProfile || null;
  const rawRating      = parseFloat(mentor.rating) || 0;
  const ratingDisplay  = rawRating > 0 ? rawRating.toFixed(1) : null;
  const sessionsRaw    = parseInt(mentor.studentsHelped, 10) || 0;
  const sessionsLabel  = sessionsRaw > 0 ? String(sessionsRaw) : "New";
  const expLabel       = mentor.timeline || "Active";

  return (
    <div className="flex flex-col overflow-hidden h-full" style={{ background: T.bg }}>

      {/* ── Hero header ── */}
      <div
        className="px-5 sm:px-6 pt-5 pb-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${T.cardBorder}`, background: T.card }}
      >
        <div className="flex gap-4 max-w-3xl mx-auto">
          {/* Avatar — larger for trust */}
          <div style={{ flexShrink: 0 }}>
            <Avatar
              src={mentor.profilePicture}
              name={mentor.name || mentor.initials}
              size={58}
              style={{ borderRadius: 14, border: `2px solid ${T.accent}40` }}
            />
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div>
                <h2
                  style={{ fontSize: 17, fontWeight: 700, color: T.text, fontFamily: "Fraunces, serif", lineHeight: 1.2 }}
                >
                  {mentor.name}
                </h2>
                <p style={{ fontSize: 12, color: T.textSub, marginTop: 2, fontFamily: "Inter, sans-serif" }}>
                  {mentor.role}
                </p>
                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 1, fontFamily: "Inter, sans-serif" }}>
                  {[mentor.college, mentor.branch].filter(Boolean).join(" · ")}
                </p>
              </div>
              {/* Match % — kept here only, removed from card pill */}
              {mentor.matchPct > 0 && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: T.accent, fontFamily: "Fraunces, serif", lineHeight: 1 }}>
                    {mentor.matchPct}%
                  </span>
                  <p style={{ fontSize: 10, color: T.textMuted, fontFamily: "Inter, sans-serif", marginTop: 1 }}>match</p>
                </div>
              )}
            </div>

            {/* Trust badges row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {(mentor.isVerified || (mentor.completionPct ?? 0) >= 80) && (
                <span
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: "rgba(61,190,130,0.12)", color: T.green, border: `1px solid ${T.green}35`, fontFamily: "Inter, sans-serif" }}
                >
                  <BadgeCheck size={11} /> Verified Mentor
                </span>
              )}
              {linkedinUrl && (
                <a
                  href={linkedinUrl.startsWith("http") ? linkedinUrl : `https://${linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: "rgba(10,102,194,0.12)", color: "#0A66C2", border: "1px solid rgba(10,102,194,0.28)", textDecoration: "none", fontFamily: "Inter, sans-serif" }}
                >
                  <ExternalLink size={10} /> LinkedIn Profile
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-5 flex flex-col gap-4 max-w-3xl mx-auto">

          {/* Stats strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              borderRadius: 12,
              overflow: "hidden",
              border: `1px solid ${T.cardBorder}`,
            }}
          >
            {[
              {
                top: ratingDisplay
                  ? <StarRow value={rawRating} />
                  : <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "Inter, sans-serif" }}>New</span>,
                label: ratingDisplay ? `${ratingDisplay} rating` : "Rating",
              },
              {
                top: <span style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: "Fraunces, serif" }}>{sessionsLabel}</span>,
                label: sessionsRaw > 0 ? "Sessions" : "First sessions",
              },
              {
                top: <span style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: "Fraunces, serif" }}>{expLabel}</span>,
                label: "Experience",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 6px",
                  textAlign: "center",
                  background: T.bg,
                  borderRight: i < 2 ? `1px solid ${T.cardBorder}` : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 3 }}>{s.top}</div>
                <p style={{ fontSize: 10, color: T.textMuted, fontFamily: "Inter, sans-serif" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Specialization */}
          {(domainLabel || fieldLabel) && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, fontFamily: "Inter, sans-serif", marginBottom: 7 }}>
                Specializes In
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {domainLabel && (
                  <span style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: `${T.accent}18`, color: T.accentText, border: `1px solid ${T.accent}40`, fontFamily: "Inter, sans-serif" }}>
                    {domainLabel}
                  </span>
                )}
                {fieldLabel && (
                  <span style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: `${T.green}14`, color: T.green, border: `1px solid ${T.green}40`, fontFamily: "Inter, sans-serif" }}>
                    {fieldLabel}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Journey */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, fontFamily: "Inter, sans-serif", marginBottom: 7 }}>
              Their Journey
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.85, color: T.textSub, fontFamily: "Inter, sans-serif" }}
              dangerouslySetInnerHTML={{ __html: mentor.story }}
            />
          </div>

          {/* Outcome */}
          <div
            style={{ borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10, background: `${T.green}0D`, border: `1px solid ${T.green}30` }}
          >
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${T.green}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <span style={{ color: T.green, fontSize: 10, fontWeight: 700 }}>✓</span>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 3, fontFamily: "Inter, sans-serif" }}>Outcome</p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: T.textSub, fontFamily: "Inter, sans-serif" }}>{mentor.outcome}</p>
            </div>
          </div>

          {/* Why you match tags */}
          {(mentor.tags || []).length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, fontFamily: "Inter, sans-serif", marginBottom: 7 }}>
                Why You Match
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {mentor.tags.map(tag => (
                  <span
                    key={tag}
                    style={{ padding: "4px 11px", borderRadius: 999, fontSize: 11, fontWeight: 500, background: T.accentSoft, border: `1px solid ${T.accent}50`, color: T.accentText, fontFamily: "Inter, sans-serif" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── CTA footer ── */}
      <div className="px-4 sm:px-6 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${T.cardBorder}`, background: T.card }}>
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={() => {
              if (onSelect) onSelect();
              if (onTalkToMentor) onTalkToMentor(mentor);
            }}
            className="flex-1 py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition hover:opacity-90"
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 12,
              background: "linear-gradient(135deg, #7567C9, #5a52a8)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: "none",
              cursor: "pointer",
              boxShadow: `0 4px 20px ${T.accent}40`,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.01em",
            }}
          >
            <Video size={16} />
            Book 1:1 session — starting ₹{STARTING_PRICE}
          </button>
          {onOpenChat && (
            <button
              onClick={() => onOpenChat(mentor)}
              className="py-3.5 px-5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition hover:opacity-90"
              style={{
                background: T.accentSoft,
                color: T.accentText,
                border: `1px solid ${T.accent}55`,
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
              }}
            >
              <MessageCircle size={16} />
              Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
