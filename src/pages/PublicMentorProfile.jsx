import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiLinkedin, FiTwitter, FiMail, FiMapPin, FiStar, FiUsers, FiClock, FiAward, FiMessageCircle, FiVideo, FiPhone, FiCalendar, FiShare2, FiExternalLink, FiArrowLeft } from 'react-icons/fi';
import { MdVerified, MdWorkspacePremium } from 'react-icons/md';
import { HiSparkles } from 'react-icons/hi2';
import { api } from '../api';
import Avatar from '../components/Avatar';
import SEOHead from '../components/SEOHead';

const SERVICE_META = {
  'text-qa': { label: 'Text Q&A', icon: '💬', duration: '48hr async' },
  'audio-call': { label: 'Audio Call', icon: '🎧', duration: '25 min' },
  'video-call': { label: 'Video Call', icon: '🎥', duration: '30 min' },
  'resume-review': { label: 'Resume Review', icon: '📄', duration: '48hr async' },
};

export default function PublicMentorProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/mentor/${slug}`);
        if (response.data.ok) {
          setMentor(response.data.mentor);
        } else {
          setError(response.data.error || 'Mentor not found');
        }
      } catch (err) {
        setError('Failed to load mentor profile');
        console.error('Error fetching mentor:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMentor();
    }
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${mentor.name} - Mentor Profile`,
          text: `Check out ${mentor.name}'s mentor profile on Atyant`,
          url: url,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Profile URL copied to clipboard!');
    }
  };

  const handleBookSession = () => {
    navigate('/book', { state: { mentor } });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #7567C9', borderTop: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280' }}>Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>Mentor Not Found</h1>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>{error || 'This mentor profile does not exist or is not publicly available.'}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#7567C9',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go to Atyant Home
          </button>
        </div>
      </div>
    );
  }

  const edu = mentor.education?.[0] || {};
  const initials = (mentor.name || mentor.username || 'M').split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <SEOHead
        title={`${mentor.name} - Mentor Profile | Atyant`}
        description={`Connect with ${mentor.name}, a mentor at ${edu.institutionName || edu.institution || 'top company'}. ${mentor.bio || 'Expert guidance for your career journey.'}`}
        canonical={window.location.href}
      />
      
      {/* Header */}
      <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#374151', fontSize: 14, fontWeight: 500 }}
          >
            <FiArrowLeft size={16} />
            Back to Atyant
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleShare}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#374151', fontSize: 14, fontWeight: 500 }}
            >
              <FiShare2 size={16} />
              Share
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 32 }}>
          {/* Left Column - Profile */}
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Profile Header */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
              <Avatar src={mentor.profilePicture} name={mentor.name} size={120} style={{ borderRadius: 16 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', margin: 0 }}>
                    {mentor.name}
                  </h1>
                  {mentor.isVerified && <MdVerified style={{ color: '#3b82f6', fontSize: 24 }} />}
                </div>
                <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 12 }}>
                  {mentor.primaryDomain === 'placement' ? 'Placement Expert' : mentor.primaryDomain === 'internship' ? 'Internship Expert' : 'Career Mentor'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 14, color: '#6b7280' }}>
                  {edu.institutionName && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiMapPin size={14} />
                      {edu.institutionName}
                    </span>
                  )}
                  {edu.field && <span>• {edu.field}</span>}
                  {mentor.yearsOfExperience > 0 && <span>• {mentor.yearsOfExperience} years experience</span>}
                </div>
              </div>
            </div>

            {/* Bio */}
            {mentor.bio && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 12 }}>About</h2>
                <p style={{ color: '#4b5563', lineHeight: 1.6 }}>{mentor.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32, padding: 20, backgroundColor: '#f9fafb', borderRadius: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#7567C9' }}>{mentor.rating.toFixed(1)}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Rating</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#7567C9' }}>{mentor.totalChats || 0}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Sessions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#7567C9' }}>{mentor.responseRate}%</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Response Rate</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#7567C9' }}>{mentor.outcomeScore > 0 ? Math.round(mentor.outcomeScore * 100) : 0}%</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Success Rate</div>
              </div>
            </div>

            {/* Expertise */}
            {mentor.expertise && mentor.expertise.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 12 }}>Expertise</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {mentor.expertise.map((skill, idx) => (
                    <span key={idx} style={{ padding: '6px 12px', backgroundColor: '#ede9fe', color: '#5b21b6', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Companies */}
            {mentor.topCompanies && mentor.topCompanies.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 12 }}>Experience At</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {mentor.topCompanies.map((company, idx) => (
                    <span key={idx} style={{ padding: '6px 12px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {mentor.servicesOffered && mentor.servicesOffered.length > 0 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 12 }}>Services Offered</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {mentor.servicesOffered.map((serviceId) => {
                    const service = SERVICE_META[serviceId] || { label: serviceId, icon: '✨', duration: 'Custom' };
                    return (
                      <div key={serviceId} style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{service.icon}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>{service.label}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{service.duration}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div style={{ position: 'sticky', top: 24, height: 'fit-content' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 16 }}>Book a Session</h3>
              
              {mentor.price > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#7567C9' }}>₹{mentor.price}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>Starting price</div>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>Free</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>First session</div>
                </div>
              )}

              <button
                onClick={handleBookSession}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  backgroundColor: '#7567C9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: 16,
                }}
              >
                Book Session
              </button>

              <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
                Secure payment via Razorpay
              </div>

              {/* Social Links */}
              {mentor.linkedinProfile && (
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
                  <a
                    href={mentor.linkedinProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', textDecoration: 'none', fontSize: 14 }}
                  >
                    <FiLinkedin size={16} />
                    LinkedIn Profile
                    <FiExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Public URL Card */}
            <div style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Public Profile URL</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  style={{ flex: 1, padding: '8px 12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, color: '#374151' }}
                />
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#374151', fontSize: 13 }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
