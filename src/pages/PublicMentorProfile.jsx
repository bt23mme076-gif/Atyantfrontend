import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Share2, BadgeCheck, Star,
  MapPin, Briefcase, Video, MessageCircle, Copy, Check,
  TrendingUp, Zap, Users, Mail, ExternalLink
} from 'lucide-react';

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
import { api } from '../api';
import Avatar from '../components/Avatar';
import SEOHead from '../components/SEOHead';

const T = {
  bg:         '#f8f7ff',
  card:       '#ffffff',
  cardBorder: '#ede9fe',
  accent:     '#7567C9',
  accentSoft: '#f0eeff',
  accentText: '#5b4fc4',
  text:       '#1a1523',
  textSub:    '#4b4466',
  textMuted:  '#8b83a3',
  green:      '#22C67A',
  greenSoft:  '#f0fdf7',
};

const SERVICE_META = {
  'text-qa':       { label: 'Text Q&A',      icon: '💬', duration: '48hr reply' },
  'audio-call':    { label: 'Audio Call',    icon: '🎧', duration: '25 min' },
  'video-call':    { label: 'Video Call',    icon: '🎥', duration: '30 min' },
  'resume-review': { label: 'Resume Review', icon: '📄', duration: '48hr async' },
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
        <Star key={i} size={13}
          fill={i <= Math.round(n) ? '#F59E0B' : 'none'}
          stroke={i <= Math.round(n) ? '#F59E0B' : '#d1d5db'}
        />
      ))}
    </span>
  );
}

export default function PublicMentorProfile() {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const [mentor,  setMentor]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
  if (!slug) return;

  api.get(`/api/profile/${slug}`)
  .then(res => {
    console.log("PROFILE RESPONSE =", res);

    if (res.mentor) {
      setMentor(res.mentor);
    } else {
      setMentor(res);
    }
  })
  .catch(err => {
    console.log("PROFILE ERROR =", err);
    setError('Failed to load mentor profile');
  })
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
          {error || "This mentor profile doesn’t exist or hasn’t been made public yet."}
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

  const edu = mentor.education?.[0] || {};
  const college = edu.institutionName || edu.institution || '';
  const branch  = edu.field || '';
  const rawRating = parseFloat(mentor.rating) || 0;
  const ratingDisplay = rawRating > 0 ? rawRating.toFixed(1) : null;
  const domainLabel = DOMAIN_LABEL[mentor.primaryDomain] || null;
  const linkedinUrl = mentor.linkedinProfile
    ? (mentor.linkedinProfile.startsWith('http') ? mentor.linkedinProfile : `https://${mentor.linkedinProfile}`)
    : null;
  const twitterUrl  = mentor.socialLinks?.twitter
    ? (mentor.socialLinks.twitter.startsWith('http') ? mentor.socialLinks.twitter : `https://twitter.com/${mentor.socialLinks.twitter.replace(/^@/, '')}`)
    : null;
  const mailUrl     = mentor.email ? `mailto:${mentor.email}` : null;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif' }}>
      <SEOHead
        title={`${mentor.name || mentor.username} – Mentor | Atyant`}
        description={`${mentor.name || mentor.username} mentors engineering students at ${college || 'top colleges'}. ${mentor.bio || ''}`}
        canonical={window.location.href}
      />

      {/* ── Top nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(248,247,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.cardBorder}`,
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={() => navigate('/')} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: T.card, border: `1px solid ${T.cardBorder}`,
          borderRadius: 9, padding: '7px 13px',
          color: T.textSub, fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          <ArrowLeft size={14} /> Back to Atyant
        </button>
        <button onClick={handleShare} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: T.card, border: `1px solid ${T.cardBorder}`,
          borderRadius: 9, padding: '7px 13px',
          color: copied ? T.green : T.textSub, fontSize: 13, fontWeight: 500, cursor: 'pointer',
          transition: 'color 0.2s',
        }}>
          {copied ? <><Check size={14} /> Copied!</> : <><Share2 size={14} /> Share</>}
        </button>
      </nav>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* ── Profile card ── */}
        <div style={{
          background: T.card, borderRadius: 20,
          border: `1px solid ${T.cardBorder}`,
          overflow: 'hidden', marginBottom: 16,
          boxShadow: '0 2px 20px rgba(117,103,201,0.08)',
        }}>
          {/* Banner */}
          <div style={{
            height: 90,
            background: 'linear-gradient(135deg, #7567C9 0%, #9F7AEA 55%, #5A4CB0 100%)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% -10%, rgba(255,255,255,0.22), transparent 60%)' }} />
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            {/* Avatar — overlaps banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -36 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20, padding: 3, flexShrink: 0,
                background: `linear-gradient(135deg, ${T.accent}80, ${T.green}60)`,
                boxShadow: `0 4px 16px ${T.accent}30`,
              }}>
                <Avatar src={mentor.profilePicture} name={mentor.name} size={74}
                  style={{ borderRadius: 17, display: 'block' }} />
              </div>

              {(mentor.isVerified || (mentor.completionPct ?? 0) >= 80) && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: `${T.green}15`, border: `1px solid ${T.green}35`,
                  color: T.green, borderRadius: 999, padding: '5px 12px',
                  fontSize: 11.5, fontWeight: 700,
                }}>
                  <BadgeCheck size={13} /> Verified Mentor
                </span>
              )}
            </div>

            {/* Identity */}
            <div style={{ marginTop: 14 }}>
              <h1 style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 26, fontWeight: 800, color: T.text, margin: 0, lineHeight: 1.15,
              }}>
                {mentor.name}
              </h1>
              {mentor.role && (
                <p style={{ fontSize: 14, color: T.textSub, marginTop: 4, fontWeight: 500 }}>
                  {mentor.role}
                </p>
              )}
              {(college || branch) && (
                <p style={{ fontSize: 13, color: T.textMuted, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={12} /> {[college, branch].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {/* Domain + LinkedIn pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
              {domainLabel && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: T.accentSoft, border: `1px solid ${T.accent}30`,
                  color: T.accentText, borderRadius: 999, padding: '5px 13px',
                  fontSize: 12, fontWeight: 600,
                }}>
                  <Zap size={10} strokeWidth={2.5} /> {domainLabel}
                </span>
              )}
              {mentor.companyDomain && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: T.greenSoft, border: `1px solid ${T.green}30`,
                  color: T.green, borderRadius: 999, padding: '5px 13px',
                  fontSize: 12, fontWeight: 600,
                }}>
                  <Briefcase size={10} strokeWidth={2.5} /> {mentor.companyDomain}
                </span>
              )}
              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(10,102,194,0.08)', border: '1px solid rgba(10,102,194,0.22)',
                  color: '#0A66C2', borderRadius: 999, padding: '5px 13px',
                  fontSize: 12, fontWeight: 600, textDecoration: 'none',
                }}>
                  <ExternalLink size={10} /> LinkedIn
                </a>
              )}
            </div>

            {/* Bio */}
            {mentor.bio && (
              <p style={{
                fontSize: 14, color: T.textSub, lineHeight: 1.8,
                marginTop: 18, padding: '14px 16px',
                background: T.bg, borderRadius: 12,
                border: `1px solid ${T.cardBorder}`,
              }}>
                {mentor.bio}
              </p>
            )}

            {/* Social icon buttons */}
            {(linkedinUrl || twitterUrl || mailUrl) && (
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="LinkedIn"
                    style={{
                      width: 38, height: 38, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(10,102,194,0.10)',
                      border: '1px solid rgba(10,102,194,0.22)',
                      color: '#0A66C2', textDecoration: 'none',
                      transition: 'background 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(10,102,194,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,102,194,0.10)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <LinkedinSVG />
                  </a>
                )}
                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Twitter / X"
                    style={{
                      width: 38, height: 38, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.06)',
                      border: '1px solid rgba(0,0,0,0.12)',
                      color: '#0f1419', textDecoration: 'none',
                      transition: 'background 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <TwitterSVG />
                  </a>
                )}
                {mailUrl && (
                  <a
                    href={mailUrl}
                    title={mentor.email}
                    style={{
                      width: 38, height: 38, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${T.accent}10`,
                      border: `1px solid ${T.accent}22`,
                      color: T.accentText, textDecoration: 'none',
                      transition: 'background 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${T.accent}18`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${T.accent}10`; e.currentTarget.style.transform = 'none'; }}
                  >
                    <Mail size={16} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            {
              icon: <Star size={15} color="#F59E0B" fill="#F59E0B" />,
              value: ratingDisplay || '—',
              label: ratingDisplay ? `${ratingDisplay} rating` : 'No rating yet',
              sub: ratingDisplay ? <Stars value={rawRating} /> : null,
            },
            {
              icon: <Users size={15} color={T.accent} />,
              value: mentor.studentsHelped > 0 ? mentor.studentsHelped : 'New',
              label: mentor.studentsHelped > 0 ? 'students helped' : 'First sessions',
            },
            {
              icon: <TrendingUp size={15} color={T.green} />,
              value: mentor.timeline || 'Active',
              label: 'Experience',
            },
          ].map((s, i) => (
            <div key={i} style={{
              background: T.card, borderRadius: 14, padding: '14px 12px',
              border: `1px solid ${T.cardBorder}`, textAlign: 'center',
              boxShadow: '0 1px 6px rgba(117,103,201,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
              {s.sub
                ? <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{s.sub}</div>
                : <p style={{ fontSize: 18, fontWeight: 800, color: T.text, fontFamily: 'Fraunces, serif', margin: '0 0 4px' }}>{s.value}</p>
              }
              <p style={{ fontSize: 10.5, color: T.textMuted, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Where they landed ── */}
        {mentor.outcome && (
          <div style={{
            background: T.card, borderRadius: 16, padding: '16px 20px', marginBottom: 16,
            border: `1px solid ${T.green}25`,
            boxShadow: '0 1px 6px rgba(34,198,122,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: `${T.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <TrendingUp size={15} color={T.green} />
              </div>
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: T.green, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' }}>
                  Where they landed
                </p>
                <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: 0, fontFamily: 'Fraunces, serif' }}>
                  {mentor.outcome}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Companies ── */}
        {mentor.topCompanies?.length > 0 && (
          <div style={{ background: T.card, borderRadius: 16, padding: '18px 20px', marginBottom: 16, border: `1px solid ${T.cardBorder}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
              Experience at
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {mentor.topCompanies.map((c, i) => (
                <span key={i} style={{
                  padding: '6px 14px', borderRadius: 999,
                  background: T.accentSoft, border: `1px solid ${T.accent}25`,
                  color: T.accentText, fontSize: 13, fontWeight: 600,
                }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Expertise ── */}
        {mentor.expertise?.length > 0 && (
          <div style={{ background: T.card, borderRadius: 16, padding: '18px 20px', marginBottom: 16, border: `1px solid ${T.cardBorder}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
              Expertise
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {mentor.expertise.map((s, i) => (
                <span key={i} style={{
                  padding: '6px 14px', borderRadius: 999,
                  background: `${T.green}10`, border: `1px solid ${T.green}25`,
                  color: T.green, fontSize: 13, fontWeight: 500,
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Services ── */}
        {mentor.servicesOffered?.length > 0 && (
          <div style={{ background: T.card, borderRadius: 16, padding: '18px 20px', marginBottom: 16, border: `1px solid ${T.cardBorder}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
              Services
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {mentor.servicesOffered.map(id => {
                const svc = SERVICE_META[id] || { label: id, icon: '✨', duration: '' };
                return (
                  <div key={id} style={{
                    padding: '12px 14px', borderRadius: 12,
                    background: T.bg, border: `1px solid ${T.cardBorder}`,
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{svc.icon}</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: '0 0 3px' }}>{svc.label}</p>
                    {svc.duration && <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>{svc.duration}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Public URL copy ── */}
        <div style={{
          background: T.card, borderRadius: 14, padding: '14px 18px',
          border: `1px solid ${T.cardBorder}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {window.location.href}
          </p>
          <button onClick={handleShare} style={{
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            background: T.accentSoft, border: `1px solid ${T.accent}30`,
            borderRadius: 8, padding: '6px 12px',
            color: copied ? T.green : T.accentText, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy link</>}
          </button>
        </div>
      </main>

      {/* ── Sticky CTA ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(248,247,255,0.95)', backdropFilter: 'blur(14px)',
        borderTop: `1px solid ${T.cardBorder}`,
        padding: '12px 16px',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              flex: 1, padding: '13px 0', borderRadius: 12,
              background: `linear-gradient(135deg, ${T.accent} 0%, #5a52a8 100%)`,
              color: '#fff', fontWeight: 700, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              border: 'none', cursor: 'pointer',
              boxShadow: `0 4px 20px ${T.accent}35`,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Video size={16} /> Book 1:1 session — starting ₹49
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '13px 18px', borderRadius: 12,
              background: T.accentSoft, border: `1px solid ${T.accent}35`,
              color: T.accentText, fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 7,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            <MessageCircle size={15} /> Chat
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
