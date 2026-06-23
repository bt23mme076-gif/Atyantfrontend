import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Share2, BadgeCheck, Star,
  MapPin, Briefcase, Video, MessageCircle, Copy, Check,
  TrendingUp, Zap, Users, Mail,
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
    api.get(`/api/mentor/${slug}`)
      .then(res => {
        if (res.ok) setMentor(res.mentor);
        else setError(res.error || 'Mentor not found');
      })
      .catch(() => setError('Failed to load mentor profile'))
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

  const services = mentor.servicesOffered?.length > 0
    ? mentor.servicesOffered
    : ['video-call', 'audio-call'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      <SEOHead
        title={`${mentor.name} – Mentor | Atyant`}
        description={`${mentor.name} mentors engineering students at ${college || 'top colleges'}. ${mentor.bio || ''}`}
        canonical={window.location.href}
      />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 767px) {
          .pmp-layout { flex-direction: column !important; }
          .pmp-sidebar { width: 100% !important; min-height: unset !important; position: relative !important; padding: 32px 24px 28px !important; }
          .pmp-main { padding: 24px 16px 48px !important; }
        }
        .svc-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.10) !important; transform: translateY(-1px); }
        .svc-arrow:hover { background: #1a1523 !important; }
      `}</style>

      <div className="pmp-layout" style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside className="pmp-sidebar" style={{
          width: 300, flexShrink: 0,
          background: 'linear-gradient(160deg, #6457b8 0%, #7567C9 45%, #8e7fda 100%)',
          minHeight: '100vh', position: 'sticky', top: 0, alignSelf: 'flex-start',
          padding: '44px 28px 32px',
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          {/* Back */}
          <button onClick={() => navigate('/')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 8, padding: '6px 12px',
            color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            marginBottom: 28, width: 'fit-content',
          }}>
            <ArrowLeft size={13} /> Back
          </button>

          {/* Avatar */}
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.9)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            overflow: 'hidden', marginBottom: 18, flexShrink: 0,
          }}>
            <Avatar src={mentor.profilePicture} name={mentor.name} size={90} style={{ display: 'block' }} />
          </div>

          {/* Name */}
          <h1 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 26, fontWeight: 800, color: '#fff',
            margin: '0 0 6px', lineHeight: 1.2,
          }}>
            {mentor.name}
          </h1>

          {/* Tagline */}
          {(mentor.role || mentor.outcome) && (
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.82)', margin: '0 0 10px', lineHeight: 1.5 }}>
              {mentor.role || mentor.outcome}
            </p>
          )}

          {/* College · Branch */}
          {(college || branch) && (
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={11} /> {[college, branch].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Sessions badge */}
          {mentor.studentsHelped > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.95)', borderRadius: 12,
              padding: '10px 16px', marginBottom: 20, width: 'fit-content',
            }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: 'Fraunces, serif', display: 'block', lineHeight: 1 }}>
                {mentor.studentsHelped}
              </span>
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>Sessions</span>
            </div>
          )}

          {/* Rating */}
          {ratingDisplay && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
              <Stars value={rawRating} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{ratingDisplay}</span>
            </div>
          )}

          {/* Verified badge */}
          {(mentor.isVerified || (mentor.completionPct ?? 0) >= 80) && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(34,198,122,0.20)', border: '1px solid rgba(34,198,122,0.45)',
              color: '#6effc4', borderRadius: 999, padding: '4px 11px',
              fontSize: 11.5, fontWeight: 700, marginBottom: 20, width: 'fit-content',
            }}>
              <BadgeCheck size={12} /> Verified Mentor
            </span>
          )}

          {/* Social links */}
          {(linkedinUrl || twitterUrl || mailUrl) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" title="LinkedIn"
                  style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', color: '#fff', textDecoration: 'none' }}>
                  <LinkedinSVG />
                </a>
              )}
              {twitterUrl && (
                <a href={twitterUrl} target="_blank" rel="noopener noreferrer" title="X / Twitter"
                  style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', color: '#fff', textDecoration: 'none' }}>
                  <TwitterSVG />
                </a>
              )}
              {mailUrl && (
                <a href={mailUrl} title={mentor.email}
                  style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', color: '#fff', textDecoration: 'none' }}>
                  <Mail size={15} />
                </a>
              )}
            </div>
          )}

          {/* Spacer pushes branding to bottom */}
          <div style={{ flex: 1 }} />

          {/* Share on LinkedIn */}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.30)',
              borderRadius: 10, padding: '10px 0',
              color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              marginBottom: 10,
            }}
          >
            <LinkedinSVG /> Share on LinkedIn
          </a>

          {/* Copy link */}
          <button onClick={handleShare} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)',
            borderRadius: 10, padding: '9px 0',
            color: copied ? '#6effc4' : 'rgba(255,255,255,0.75)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
            marginBottom: 24, transition: 'color 0.2s',
          }}>
            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy link</>}
          </button>

          {/* Atyant branding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.01em' }}>
              atyant.in
            </span>
            <button onClick={() => navigate('/')} style={{
              background: '#fff', border: 'none', borderRadius: 8,
              padding: '7px 14px', fontSize: 12, fontWeight: 700,
              color: T.accentText, cursor: 'pointer',
            }}>
              Start your page →
            </button>
          </div>
        </aside>

        {/* ── RIGHT CONTENT ── */}
        <main className="pmp-main" style={{
          flex: 1, background: '#f0eeea',
          padding: '40px 32px 60px', minHeight: '100vh',
        }}>

          {/* Service cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
            {services.map((id, i) => {
              const svc = SERVICE_META[id] || { label: id, icon: '✨', duration: '' };
              const isFirst = i === 0;
              return (
                <div key={id} className="svc-card" style={{
                  background: '#fff', borderRadius: 18,
                  padding: '22px 24px', cursor: 'pointer',
                  border: '1px solid rgba(0,0,0,0.07)',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}>
                  <div>
                    <p style={{ fontSize: 12.5, color: '#888', margin: '0 0 5px', fontWeight: 500 }}>
                      {svc.icon} {svc.label} · {svc.duration}
                    </p>
                    <h3 style={{ fontSize: 19, fontWeight: 700, color: T.text, margin: 0, fontFamily: 'Fraunces, Georgia, serif' }}>
                      {id === 'video-call' ? 'Video session' :
                       id === 'audio-call' ? 'Audio call' :
                       id === 'text-qa'    ? 'Ask a question' :
                       id === 'resume-review' ? 'Resume review' : svc.label}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>
                        ₹{id === 'video-call' ? 299 : id === 'audio-call' ? 149 : id === 'resume-review' ? 199 : 49}
                      </span>
                      {isFirst && (
                        <span style={{
                          fontSize: 11.5, fontWeight: 700,
                          background: 'rgba(117,103,201,0.12)', color: T.accentText,
                          borderRadius: 999, padding: '3px 10px',
                        }}>
                          Popular
                        </span>
                      )}
                    </div>
                    <button
                      className="svc-arrow"
                      onClick={() => navigate('/')}
                      style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: T.text, border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* About me */}
          {(mentor.bio || mentor.expertise?.length > 0 || mentor.topCompanies?.length > 0) && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 16px', fontFamily: 'Fraunces, Georgia, serif' }}>
                About me
              </h2>
              {mentor.bio && (
                <p style={{ fontSize: 14.5, color: T.textSub, lineHeight: 1.75, margin: '0 0 16px' }}>
                  {mentor.bio}
                </p>
              )}
              {mentor.topCompanies?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {mentor.topCompanies.map((c, i) => (
                    <span key={i} style={{
                      padding: '5px 13px', borderRadius: 999,
                      background: '#fff', border: '1px solid rgba(0,0,0,0.12)',
                      color: T.textSub, fontSize: 13, fontWeight: 500,
                    }}>{c}</span>
                  ))}
                </div>
              )}
              {mentor.expertise?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {mentor.expertise.map((s, i) => (
                    <span key={i} style={{
                      padding: '5px 13px', borderRadius: 999,
                      background: `${T.green}12`, border: `1px solid ${T.green}30`,
                      color: T.green, fontSize: 13, fontWeight: 500,
                    }}>{s}</span>
                  ))}
                </div>
              )}
              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 42, height: 42, borderRadius: 10, marginTop: 14,
                    background: 'rgba(10,102,194,0.10)', border: '1px solid rgba(10,102,194,0.22)',
                    color: '#0A66C2', textDecoration: 'none',
                  }}>
                  <LinkedinSVG />
                </a>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.10)', paddingTop: 16, display: 'flex', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#aaa', cursor: 'pointer' }}>Terms</span>
            <span style={{ fontSize: 12, color: '#aaa', cursor: 'pointer' }}>Privacy</span>
          </div>
        </main>
      </div>
    </div>
  );
}
