import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Share2, BadgeCheck, Star,
  MapPin, Briefcase, Video, MessageCircle, Copy, Check,
  GraduationCap, Building2, Lightbulb, User, Globe,
} from 'lucide-react';
import { api } from '../api';
import Avatar from '../components/Avatar';
import SEOHead from '../components/SEOHead';

function LinkedinSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function TwitterSVG() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

const T = {
  bg:         '#f5f4fb',
  card:       '#ffffff',
  cardBorder: '#e8e4f8',
  accent:     '#7567C9',
  accentSoft: '#f0eeff',
  accentText: '#5b4fc4',
  text:       '#1a1523',
  textSub:    '#4b4466',
  textMuted:  '#8b83a3',
  green:      '#22C67A',
  greenSoft:  '#f0fdf7',
  divider:    '#eeebf8',
};

const SERVICE_META = {
  'text-qa':       { label: 'Text Q&A',      icon: '💬', duration: '48hr reply',  price: 49  },
  'audio-call':    { label: 'Audio Call',    icon: '🎧', duration: '25 min',      price: 149 },
  'video-call':    { label: 'Video Call',    icon: '🎥', duration: '30 min',      price: 299 },
  'resume-review': { label: 'Resume Review', icon: '📄', duration: '48hr async',  price: 199 },
};

const DOMAIN_LABEL = {
  internship: 'Internship Guidance',
  placement:  'Placement Guidance',
  both:       'Internship & Placement',
};

function Stars({ value }) {
  const n = parseFloat(value) || 0;
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12}
          fill={i <= Math.round(n) ? '#F59E0B' : 'none'}
          stroke={i <= Math.round(n) ? '#F59E0B' : '#d1d5db'}
        />
      ))}
    </span>
  );
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.cardBorder}`,
      borderRadius: 16,
      padding: '24px 28px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: T.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={T.accentText} />
        </div>
        <h2 style={{
          margin: 0, fontSize: 16, fontWeight: 700,
          color: T.text, fontFamily: 'Inter, sans-serif',
        }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Chip({ label, color = T.textSub, bg = '#f4f2fc', border = T.divider }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px', borderRadius: 999,
      background: bg, border: `1px solid ${border}`,
      color, fontSize: 12.5, fontWeight: 500,
      fontFamily: 'Inter, sans-serif',
    }}>
      {label}
    </span>
  );
}

export default function PublicMentorProfile() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const [mentor,  setMentor]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.get(`/api/mentor/${slug}`)
      .then(res => { if (res.ok) setMentor(res.mentor); else setError(res.error || 'Mentor not found'); })
      .catch(e => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${mentor?.name} – Atyant`, url }); } catch {}
    } else {
      navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${T.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: T.textMuted, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Loading profile…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !mentor) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 8, fontFamily: 'Fraunces, serif' }}>
          Profile not found
        </h1>
        <p style={{ color: T.textMuted, fontSize: 14, marginBottom: 24, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
          {error || "This mentor profile doesn't exist or hasn't been made public yet."}
        </p>
        <button onClick={() => navigate('/')} style={{
          padding: '11px 24px', background: T.accent, color: '#fff',
          border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}>
          Back to Atyant
        </button>
      </div>
    </div>
  );

  // ── Derived data ──────────────────────────────────────────────────────────
  const edu           = mentor.education?.[0] || {};
  const allEdu        = mentor.education || [];
  const college       = edu.institutionName || edu.institution || '';
  const branch        = edu.field || '';
  const rawRating     = parseFloat(mentor.rating) || 0;
  const ratingDisplay = rawRating > 0 ? rawRating.toFixed(1) : null;
  const domainLabel   = DOMAIN_LABEL[mentor.primaryDomain] || null;

  const linkedinUrl = mentor.linkedinProfile
    ? (mentor.linkedinProfile.startsWith('http') ? mentor.linkedinProfile : `https://${mentor.linkedinProfile}`)
    : null;
  const twitterUrl  = mentor.socialLinks?.twitter
    ? (mentor.socialLinks.twitter.startsWith('http') ? mentor.socialLinks.twitter : `https://twitter.com/${mentor.socialLinks.twitter.replace(/^@/, '')}`)
    : null;

  const services    = mentor.servicesOffered?.length > 0 ? mentor.servicesOffered : ['video-call', 'audio-call'];
  const expertise   = mentor.expertise || [];
  const skills      = mentor.skills || [];
  const interests   = mentor.interests || [];
  const specialTags = mentor.specialTags || [];
  const allSkills   = [...new Set([...expertise, ...skills, ...interests, ...specialTags])];
  const companies   = mentor.topCompanies || [];
  const milestones  = mentor.milestones || [];
  const isVerified  = mentor.isVerified || (mentor.completionPct ?? 0) >= 80;
  const minPrice    = Math.min(...services.map(s => SERVICE_META[s]?.price || 49));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif' }}>
      <SEOHead
        title={`${mentor.name || mentor.username} – Mentor | Atyant`}
        description={`${mentor.name || mentor.username} mentors engineering students at ${college || 'top colleges'}. ${mentor.bio || ''}`}
        canonical={window.location.href}
      />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .pmp-back-btn:hover { background: rgba(255,255,255,0.25) !important; }
        .svc-card:hover { box-shadow: 0 6px 24px rgba(117,103,201,0.15) !important; border-color: ${T.accent}55 !important; }
        .book-btn:hover { opacity: 0.92; }
        @media (max-width: 820px) {
          .pmp-body { flex-direction: column !important; }
          .pmp-right { position: static !important; width: auto !important; }
        }
        @media (max-width: 600px) {
          .pmp-hero-inner { flex-direction: column !important; align-items: flex-start !important; }
          .pmp-hero-avatar { width: 72px !important; height: 72px !important; }
        }
      `}</style>

      {/* ── Top nav bar ── */}
      <div style={{
        background: '#fff',
        borderBottom: `1px solid ${T.cardBorder}`,
        padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            className="pmp-back-btn"
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: '1px solid transparent',
              borderRadius: 8, padding: '6px 10px',
              color: T.textSub, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleShare} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: T.accentSoft, border: `1px solid ${T.accent}30`,
              borderRadius: 8, padding: '6px 12px',
              color: T.accentText, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            }}>
              {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Share</>}
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: T.accent, border: 'none', borderRadius: 8,
                padding: '7px 16px',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <Video size={13} /> Book Session
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(135deg, #6457b8 0%, #7567C9 55%, #9585e0 100%)`,
        padding: '36px 24px 0',
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div className="pmp-hero-inner" style={{ display: 'flex', alignItems: 'flex-end', gap: 24, paddingBottom: 0 }}>
            {/* Avatar */}
            <div className="pmp-hero-avatar" style={{
              width: 100, height: 100, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.9)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
              overflow: 'hidden', flexShrink: 0,
              position: 'relative', top: 20, background: '#fff',
            }}>
              <Avatar src={mentor.profilePicture} name={mentor.name} size={96} style={{ display: 'block' }} />
            </div>

            {/* Name + quick info */}
            <div style={{ paddingBottom: 20, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 26, fontWeight: 800, color: '#fff',
                  margin: 0, lineHeight: 1.2,
                }}>
                  {mentor.name || mentor.username}
                </h1>
                {isVerified && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'rgba(34,198,122,0.2)', border: '1px solid rgba(34,198,122,0.4)',
                    color: '#6effc4', borderRadius: 999, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    <BadgeCheck size={11} /> Verified
                  </span>
                )}
              </div>

              {(mentor.role || domainLabel) && (
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', margin: '0 0 8px', lineHeight: 1.4 }}>
                  {mentor.role || domainLabel}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {(college || branch) && (
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.70)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <GraduationCap size={13} /> {[college, branch].filter(Boolean).join(' · ')}
                  </span>
                )}
                {mentor.city && (
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.70)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={12} /> {mentor.city}
                  </span>
                )}
                {mentor.yearsOfExperience > 0 && (
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.70)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Briefcase size={12} /> {mentor.yearsOfExperience}yr exp
                  </span>
                )}
                {ratingDisplay && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stars value={rawRating} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.90)', fontWeight: 600 }}>{ratingDisplay}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Social links (top-right of hero) */}
            {(linkedinUrl || twitterUrl) && (
              <div style={{ paddingBottom: 20, display: 'flex', gap: 8 }}>
                {linkedinUrl && (
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                    style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.30)', color: '#fff', textDecoration: 'none' }}>
                    <LinkedinSVG />
                  </a>
                )}
                {twitterUrl && (
                  <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
                    style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.30)', color: '#fff', textDecoration: 'none' }}>
                    <TwitterSVG />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${T.cardBorder}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'flex', gap: 0,
            paddingTop: 16, paddingBottom: 14,
            marginTop: 16,
            borderTop: `1px solid ${T.divider}`,
          }}>
            {[
              mentor.studentsHelped > 0 && { label: 'Sessions', value: mentor.studentsHelped },
              ratingDisplay           && { label: 'Rating',   value: ratingDisplay },
              mentor.responseRate > 0 && { label: 'Response', value: `${mentor.responseRate}%` },
              mentor.profileViews > 0 && { label: 'Views',    value: mentor.profileViews },
            ].filter(Boolean).map((stat, i) => (
              <div key={i} style={{
                paddingRight: 32, marginRight: 32,
                borderRight: `1px solid ${T.divider}`,
                lastChild: { borderRight: 'none' },
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: 'Fraunces, serif', lineHeight: 1.1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 11.5, color: T.textMuted, fontWeight: 500, marginTop: 2 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body: main + right sidebar ── */}
      <div className="pmp-body" style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 24px 100px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── LEFT MAIN ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* 1. Basic Information */}
          {mentor.bio && (
            <SectionCard icon={User} title="Basic Information">
              <p style={{ fontSize: 14.5, color: T.textSub, lineHeight: 1.8, margin: 0 }}>
                {mentor.bio}
              </p>
              {domainLabel && (
                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Chip label={domainLabel} color={T.accentText} bg={T.accentSoft} border={`${T.accent}30`} />
                  {mentor.yearsOfExperience > 0 && (
                    <Chip label={`${mentor.yearsOfExperience} years experience`} />
                  )}
                </div>
              )}
            </SectionCard>
          )}

          {/* 2. Education */}
          {allEdu.length > 0 && (
            <SectionCard icon={GraduationCap} title="Education">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {allEdu.map((e, i) => {
                  const inst = e.institutionName || e.institution || '';
                  const deg  = e.degree || '';
                  const fld  = e.field || '';
                  const yr   = [e.startYear, e.endYear].filter(Boolean).join(' – ');
                  if (!inst) return null;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: T.accentSoft,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <GraduationCap size={18} color={T.accentText} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text, marginBottom: 2 }}>
                          {inst}
                        </div>
                        {(deg || fld) && (
                          <div style={{ fontSize: 13.5, color: T.textSub, marginBottom: 2 }}>
                            {[deg, fld].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        {yr && (
                          <div style={{ fontSize: 12.5, color: T.textMuted }}>
                            {yr}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* 3. Professional Experience */}
          {(companies.length > 0 || milestones.length > 0 || mentor.companyDomain) && (
            <SectionCard icon={Building2} title="Professional Experience">
              {companies.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>
                    Companies & Organisations
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {companies.map((c, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 14px', borderRadius: 10,
                        background: T.bg, border: `1px solid ${T.cardBorder}`,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7,
                          background: `${T.accent}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: T.accentText,
                        }}>
                          {c[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {milestones.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>
                    Milestones
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {milestones.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, marginTop: 7, flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>{m}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* 4. Skills & Expertise */}
          {allSkills.length > 0 && (
            <SectionCard icon={Lightbulb} title="Skills & Expertise">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allSkills.map((s, i) => (
                  <Chip
                    key={i}
                    label={s}
                    color={T.green}
                    bg={T.greenSoft}
                    border={`${T.green}30`}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {/* 5. Ratings & Feedback (if data exists) */}
          {(ratingDisplay || mentor.feedbackScore > 0 || mentor.helpfulCount > 0) && (
            <SectionCard icon={Star} title="Student Feedback">
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {ratingDisplay && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: T.text, fontFamily: 'Fraunces, serif', lineHeight: 1 }}>
                      {ratingDisplay}
                    </div>
                    <Stars value={rawRating} />
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Session rating</div>
                  </div>
                )}
                {mentor.helpfulCount > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: T.green, fontFamily: 'Fraunces, serif', lineHeight: 1 }}>
                      {mentor.helpfulCount}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Found helpful</div>
                  </div>
                )}
                {mentor.studentsHelped > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: T.accentText, fontFamily: 'Fraunces, serif', lineHeight: 1 }}>
                      {mentor.studentsHelped}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Sessions done</div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── RIGHT: Services + Book ── */}
        <div className="pmp-right" style={{ width: 320, flexShrink: 0, position: 'sticky', top: 70 }}>
          <div style={{
            background: T.card, borderRadius: 16,
            border: `1px solid ${T.cardBorder}`,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${T.divider}` }}>
              <p style={{ margin: 0, fontSize: 12, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Book a session
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textSub }}>
                Starting at <strong style={{ color: T.text }}>₹{minPrice}</strong>
              </p>
            </div>

            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {services.map((id, i) => {
                const svc = SERVICE_META[id] || { label: id, icon: '✨', duration: '', price: 49 };
                return (
                  <div
                    key={id}
                    className="svc-card"
                    onClick={() => navigate('/')}
                    style={{
                      padding: '14px 16px', borderRadius: 12,
                      border: `1px solid ${i === 0 ? T.accent + '55' : T.cardBorder}`,
                      background: i === 0 ? T.accentSoft : T.bg,
                      cursor: 'pointer', transition: 'all 0.18s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                        {svc.icon} {svc.label}
                      </div>
                      <div style={{ fontSize: 12, color: T.textMuted }}>{svc.duration}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>₹{svc.price}</div>
                      {i === 0 && (
                        <div style={{ fontSize: 10.5, color: T.accentText, fontWeight: 700 }}>Popular</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '4px 16px 18px' }}>
              <button
                className="book-btn"
                onClick={() => navigate('/')}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 12,
                  background: `linear-gradient(135deg, ${T.accent} 0%, #5a52a8 100%)`,
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  border: 'none', cursor: 'pointer',
                  boxShadow: `0 4px 20px ${T.accent}35`,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'opacity 0.15s',
                }}
              >
                <Video size={15} /> Book 1:1 Session
              </button>

              {/* Share */}
              <button onClick={handleShare} style={{
                width: '100%', marginTop: 8, padding: '10px 0',
                background: 'transparent', border: `1px solid ${T.cardBorder}`,
                borderRadius: 12, color: T.textSub, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>
                {copied ? <><Check size={13} /> Copied!</> : <><Share2 size={13} /> Share profile</>}
              </button>
            </div>

            {/* Atyant branding */}
            <div style={{ borderTop: `1px solid ${T.divider}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>atyant.in</span>
              <button onClick={() => navigate('/')} style={{
                background: T.accentSoft, border: 'none', borderRadius: 7,
                padding: '5px 12px', fontSize: 11.5, fontWeight: 700,
                color: T.accentText, cursor: 'pointer',
              }}>
                Get your page →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky bottom CTA (mobile) ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(14px)',
        borderTop: `1px solid ${T.cardBorder}`,
        padding: '10px 16px',
        display: 'none',
      }} className="pmp-mobile-cta">
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 12,
            background: `linear-gradient(135deg, ${T.accent} 0%, #5a52a8 100%)`,
            color: '#fff', fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            border: 'none', cursor: 'pointer',
            boxShadow: `0 4px 20px ${T.accent}35`,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Video size={15} /> Book 1:1 session — from ₹{minPrice}
        </button>
        <style>{`@media (max-width: 820px) { .pmp-mobile-cta { display: block !important; } }`}</style>
      </div>
    </div>
  );
}
