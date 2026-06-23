import { Star, Briefcase, Video, BadgeCheck, MessageCircle, TrendingUp, GraduationCap, Target, Cpu, Code2, BarChart2, Users, Layers } from "lucide-react";
import DOMPurify from "dompurify";

function LinkedinIcon({ size = 9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
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
  green:      "#22C67A",
};

const DOMAIN_LABEL = {
  internship: "Internship Guidance",
  placement:  "Placement Guidance",
  both:       "Internship & Placement",
};

const DOMAIN_ICON = {
  internship: GraduationCap,
  placement:  Briefcase,
  both:       Target,
};

const FIELD_ICON = {
  "Tech":             Code2,
  "Data Analytics":   BarChart2,
  "Consulting":       Users,
  "Product":          Layers,
  "Core Engineering": Cpu,
};

const STARTING_PRICE = 49;

function Stars({ value }) {
  const n = parseFloat(value) || 0;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13}
          fill={i <= Math.round(n) ? "#F59E0B" : "none"}
          stroke={i <= Math.round(n) ? "#F59E0B" : "#d1d5db"}
        />
      ))}
    </div>
  );
}

export default function SeniorDetail({ mentor, onSelect, onTalkToMentor, onOpenChat }) {
  if (!mentor) return null;

  const domainLabel   = DOMAIN_LABEL[mentor.primaryDomain] || null;
  const DomainIcon    = DOMAIN_ICON[mentor.primaryDomain] || GraduationCap;
  const fieldLabel    = mentor.companyDomain || null;
  const FieldIcon     = FIELD_ICON[mentor.companyDomain] || Briefcase;
  const linkedinUrl   = mentor.linkedinProfile || null;
  const rawRating     = parseFloat(mentor.rating) || 0;
  const ratingDisplay = rawRating > 0 ? rawRating.toFixed(1) : null;
  const sessionsRaw   = parseInt(mentor.studentsHelped, 10) || 0;
  const sessionsLabel = sessionsRaw > 0 ? `${sessionsRaw}` : "New";
  const expLabel      = mentor.timeline || "Active";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: T.bg, overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <div style={{
        background: T.card,
        borderBottom: `1px solid ${T.cardBorder}`,
        padding: "20px 20px 16px",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Subtle decorative blob */}
        <div style={{
          position: "absolute", top: -30, right: -20, width: 130, height: 130,
          borderRadius: "50%", background: `${T.accent}10`, pointerEvents: "none",
        }} />

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", position: "relative" }}>
          {/* Avatar with ring */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 66, height: 66, borderRadius: 18,
              background: `linear-gradient(135deg, ${T.accent}60, ${T.green}40)`,
              padding: 2,
              boxShadow: `0 4px 16px ${T.accent}25`,
            }}>
              <Avatar
                src={mentor.profilePicture}
                name={mentor.name || mentor.initials}
                size={62}
                style={{ borderRadius: 16, display: "block" }}
              />
            </div>
            {(mentor.isVerified || (mentor.completionPct ?? 0) >= 80) && (
              <div style={{
                position: "absolute", bottom: -4, right: -4,
                width: 20, height: 20, borderRadius: "50%",
                background: T.green, display: "flex", alignItems: "center", justifyContent: "center",
                border: `2px solid ${T.card}`,
              }}>
                <BadgeCheck size={11} color="#fff" strokeWidth={2.5} />
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{
                  fontFamily: "Fraunces, Georgia, serif",
                  fontSize: 18, fontWeight: 700,
                  color: T.text, lineHeight: 1.15, margin: 0,
                }}>
                  {mentor.name}
                </h2>
                {mentor.role && (
                  <p style={{ fontSize: 12.5, color: T.textSub, marginTop: 3, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
                    {mentor.role}
                  </p>
                )}
                <p style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2, fontFamily: "Inter, sans-serif" }}>
                  {[mentor.college, mentor.branch].filter(Boolean).join(" · ")}
                </p>
              </div>

              {/* Match % badge */}
              {mentor.matchPct > 0 && (
                <div style={{
                  background: `linear-gradient(135deg, ${T.accent}18, ${T.accent}08)`,
                  border: `1.5px solid ${T.accent}35`,
                  borderRadius: 12, padding: "6px 12px", textAlign: "center", flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 800,
                    color: T.accent, lineHeight: 1, display: "block",
                  }}>
                    {mentor.matchPct}%
                  </span>
                  <span style={{ fontSize: 9.5, color: T.textMuted, fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: "0.04em" }}>
                    MATCH
                  </span>
                </div>
              )}
            </div>

            {/* Pills row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {linkedinUrl && (
                <a
                  href={linkedinUrl.startsWith("http") ? linkedinUrl : `https://${linkedinUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                    background: "rgba(10,102,194,0.10)", color: "#0A66C2",
                    border: "1px solid rgba(10,102,194,0.25)", textDecoration: "none",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <LinkedinIcon size={9} /> LinkedIn
                </a>
              )}
              {domainLabel && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                  background: `${T.accent}12`, color: T.accent,
                  border: `1px solid ${T.accent}30`, fontFamily: "Inter, sans-serif",
                }}>
                  <DomainIcon size={9} strokeWidth={2.5} /> {domainLabel}
                </span>
              )}
              {fieldLabel && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                  background: `${T.green}12`, color: T.green,
                  border: `1px solid ${T.green}30`, fontFamily: "Inter, sans-serif",
                }}>
                  <FieldIcon size={9} strokeWidth={2.5} /> {fieldLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18, maxWidth: 720, margin: "0 auto" }}>

          {/* Stats row — card-style, not table */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {/* Rating */}
            <div style={{
              borderRadius: 12, padding: "12px 8px", textAlign: "center",
              background: T.card, border: `1px solid ${T.cardBorder}`,
            }}>
              {ratingDisplay ? (
                <>
                  <Stars value={rawRating} />
                  <p style={{ fontSize: 14, fontWeight: 800, color: T.text, fontFamily: "Fraunces, serif", marginTop: 4, lineHeight: 1 }}>{ratingDisplay}</p>
                </>
              ) : (
                <p style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, fontFamily: "Fraunces, serif" }}>New</p>
              )}
              <p style={{ fontSize: 10, color: T.textMuted, fontFamily: "Inter, sans-serif", marginTop: 4 }}>Rating</p>
            </div>

            {/* Sessions */}
            <div style={{
              borderRadius: 12, padding: "12px 8px", textAlign: "center",
              background: T.card, border: `1px solid ${T.cardBorder}`,
            }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: T.text, fontFamily: "Fraunces, serif", lineHeight: 1 }}>{sessionsLabel}</p>
              <p style={{ fontSize: 10, color: T.textMuted, fontFamily: "Inter, sans-serif", marginTop: 4 }}>
                {sessionsRaw > 0 ? "Sessions done" : "First sessions"}
              </p>
            </div>

            {/* Experience */}
            <div style={{
              borderRadius: 12, padding: "12px 8px", textAlign: "center",
              background: T.card, border: `1px solid ${T.cardBorder}`,
            }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: T.text, fontFamily: "Fraunces, serif", lineHeight: 1 }}>{expLabel}</p>
              <p style={{ fontSize: 10, color: T.textMuted, fontFamily: "Inter, sans-serif", marginTop: 4 }}>Experience</p>
            </div>
          </div>

          {/* Outcome — most important, moved up */}
          {mentor.outcome && (
            <div style={{
              borderRadius: 14, padding: "14px 16px",
              background: `linear-gradient(135deg, ${T.green}0E, ${T.green}06)`,
              border: `1px solid ${T.green}28`,
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `${T.green}20`, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <TrendingUp size={14} color={T.green} strokeWidth={2.5} />
              </div>
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: T.green, marginBottom: 4, fontFamily: "Inter, sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Where they landed
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: "Fraunces, serif", lineHeight: 1.4 }}>
                  {mentor.outcome}
                </p>
              </div>
            </div>
          )}

          {/* Journey */}
          {mentor.story && (
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, color: T.textMuted,
                fontFamily: "Inter, sans-serif", letterSpacing: "0.06em",
                textTransform: "uppercase", marginBottom: 10,
              }}>
                Their story
              </p>
              <p
                style={{
                  fontSize: 13.5, lineHeight: 1.9, color: T.textSub,
                  fontFamily: "Inter, sans-serif", fontWeight: 400,
                }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mentor.story) }}
              />
            </div>
          )}

          {/* Why you match */}
          {(mentor.tags || []).length > 0 && (
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, color: T.textMuted,
                fontFamily: "Inter, sans-serif", letterSpacing: "0.06em",
                textTransform: "uppercase", marginBottom: 10,
              }}>
                Why you match
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {mentor.tags.map(tag => (
                  <span key={tag} style={{
                    padding: "5px 12px", borderRadius: 999,
                    fontSize: 11.5, fontWeight: 500,
                    background: `${T.accent}10`,
                    border: `1px solid ${T.accent}30`,
                    color: T.accent,
                    fontFamily: "Inter, sans-serif",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── CTA FOOTER ── */}
      <div style={{
        padding: "14px 20px",
        borderTop: `1px solid ${T.cardBorder}`,
        background: T.card,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 10, maxWidth: 720, margin: "0 auto" }}>
          <button
            onClick={() => { onSelect?.(); onTalkToMentor?.(mentor); }}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 12,
              background: "linear-gradient(135deg, #7567C9 0%, #5a52a8 100%)",
              color: "#fff", fontWeight: 700, fontSize: 14.5,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              border: "none", cursor: "pointer",
              boxShadow: `0 4px 18px ${T.accent}35`,
              fontFamily: "Inter, sans-serif", letterSpacing: "0.01em",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.92"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <Video size={15} />
            Book 1:1 — starting ₹{STARTING_PRICE}
          </button>

          {onOpenChat && (
            <button
              onClick={() => onOpenChat(mentor)}
              style={{
                padding: "13px 18px", borderRadius: 12,
                background: `${T.accent}10`,
                color: T.accent,
                border: `1px solid ${T.accent}35`,
                fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13.5,
                display: "flex", alignItems: "center", gap: 7,
                cursor: "pointer", transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <MessageCircle size={15} /> Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
