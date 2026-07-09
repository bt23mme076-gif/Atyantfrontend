import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "../context/ThemeContext";
import TPODashboard from "./TPODashboard";

const TPO_EMAIL  = "atyant.in@gmail.com";
const VNIT_LOGO  = "https://img.logokit.com/vnit.ac.in";
const ATYANT_LOGO = "https://res.cloudinary.com/dny6dtmox/image/upload/v1783630246/atyantlogo_a2k9xd.jpg";

function Spin({ size = 18 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: "2.5px solid rgba(117,103,201,0.25)",
      borderTop: "2.5px solid #7567C9",
      borderRadius: "50%", animation: "tpoSpin .7s linear infinite",
    }} />
  );
}

// ── Partnership Badge ─────────────────────────────────────────────────────────
function PartnershipLogos({ size = "md" }) {
  const imgSize = size === "sm" ? 28 : 44;
  const gap     = size === "sm" ? 8  : 14;
  const xSize   = size === "sm" ? "0.75rem" : "1.1rem";

  return (
    <div style={{ display:"flex", alignItems:"center", gap }}>
      <img
        src={VNIT_LOGO} alt="VNIT"
        style={{ width:imgSize, height:imgSize, borderRadius: size==="sm" ? 6 : 10, objectFit:"contain", background:"#fff", padding:2 }}
        onError={e => { e.target.style.display="none"; }}
      />
      <span style={{ fontSize:xSize, fontWeight:800, color:"var(--c-textMuted)", lineHeight:1 }}>×</span>
      <img
        src={ATYANT_LOGO} alt="Atyant"
        style={{ width:imgSize, height:imgSize, borderRadius: size==="sm" ? 6 : 10, objectFit:"contain", background:"#fff", padding:2 }}
        onError={e => { e.target.style.display="none"; }}
      />
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (email.trim().toLowerCase() !== TPO_EMAIL) {
      setError("Access restricted to VNIT T&P administrators.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      onLogin();
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--c-bg)",
      display: "flex", overflow: "hidden", position: "relative",
    }}>
      <style>{`
        @keyframes tpoSpin   { to { transform: rotate(360deg); } }
        @keyframes tpoFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes tpoPulse  { 0%,100% { opacity:.5; } 50% { opacity:1; } }
        @keyframes tpoFloat  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
        .tpo-input:focus { outline:none; border-color:#7567C9 !important; box-shadow:0 0 0 3px rgba(117,103,201,0.18); }
        .tpo-input { transition: border-color .2s, box-shadow .2s; }
        .tpo-btn { transition: all .2s; }
        .tpo-btn:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); box-shadow:0 8px 24px rgba(117,103,201,0.4); }
        .tpo-btn:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>

      {/* ── Left panel — branding ── */}
      <div style={{
        display: "none",
        flex: "0 0 52%",
        background: "linear-gradient(145deg, #1a1535 0%, #0f0d1a 60%, #12103d 100%)",
        position: "relative", overflow: "hidden", padding: "3rem",
        flexDirection: "column", justifyContent: "space-between",
        ...(typeof window !== "undefined" && window.innerWidth >= 900 ? { display:"flex" } : {}),
      }}
        className="tpo-left-panel"
      >
        <style>{`
          @media (min-width: 900px) { .tpo-left-panel { display:flex !important; } }
          @media (max-width: 899px) { .tpo-left-panel { display:none !important; } }
        `}</style>

        {/* Gradient orbs */}
        <div style={{ position:"absolute", top:-100, left:-100, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(117,103,201,0.3) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-80, right:-80, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:"40%", right:"15%", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)", animation:"tpoFloat 6s ease-in-out infinite", pointerEvents:"none" }} />

        {/* Top logos */}
        <div>
          <PartnershipLogos size="md" />
        </div>

        {/* Center copy */}
        <div style={{ animation:"tpoFadeUp .6s ease" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(117,103,201,0.2)", border:"1px solid rgba(117,103,201,0.4)", borderRadius:999, padding:"6px 16px", marginBottom:"1.5rem" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#a78bfa", display:"inline-block", animation:"tpoPulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#c4b5fd", letterSpacing:"0.1em", textTransform:"uppercase" }}>Phase 1 · Mock Interview Pilot</span>
          </div>

          <h1 style={{ fontSize:"clamp(2rem,3vw,2.8rem)", fontWeight:900, color:"#fff", margin:"0 0 1rem", lineHeight:1.1, letterSpacing:"-0.03em" }}>
            VNIT Nagpur<br />
            <span style={{ background:"linear-gradient(135deg,#a78bfa,#7567C9,#60a5fa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Placement Portal
            </span>
          </h1>

          <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.55)", maxWidth:380, lineHeight:1.7, margin:"0 0 2.5rem" }}>
            Schedule mock interviews, track student readiness, and manage placement sessions — all in one place.
          </p>

          {/* Stats row */}
          <div style={{ display:"flex", gap:"2rem" }}>
            {[
              { n:"1,000+", label:"Students enrolled" },
              { n:"50+",    label:"Verified mentors" },
              { n:"4.5★",   label:"Avg session rating" },
            ].map(({ n, label }) => (
              <div key={label}>
                <div style={{ fontSize:"1.4rem", fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>{n}</div>
                <div style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.45)", fontWeight:500, marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom attribution */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.3)", fontWeight:500 }}>Powered by Atyant Intelligence</span>
          <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.08)" }} />
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"2rem 1.5rem", background:"var(--c-bg)",
        position:"relative",
      }}>
        {/* Theme toggle */}
        <div style={{ position:"absolute", top:20, right:20 }}>
          <ThemeToggle size={15} />
        </div>

        <div style={{ width:"100%", maxWidth:400, animation:"tpoFadeUp .5s ease" }}>
          {/* Mobile: logos */}
          <div style={{ marginBottom:"1.75rem" }} className="tpo-mobile-logos">
            <style>{`@media (min-width:900px){ .tpo-mobile-logos { display:none !important; } }`}</style>
            <PartnershipLogos size="sm" />
          </div>

          {/* Heading */}
          <div style={{ marginBottom:"2rem" }}>
            <h2 style={{ fontSize:"1.65rem", fontWeight:900, color:"var(--c-text)", margin:"0 0 0.4rem", letterSpacing:"-0.025em" }}>
              Welcome back 👋
            </h2>
            <p style={{ fontSize:"0.85rem", color:"var(--c-textSub)", margin:0, lineHeight:1.6 }}>
              Sign in as <strong style={{ color:"#7567C9" }}>VNIT T&P administrator</strong> to access the placement dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:"1rem" }}>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:700, color:"var(--c-textMuted)", marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                Email
              </label>
              <input
                className="tpo-input"
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="atyant.in@gmail.com"
                required
                style={{
                  width:"100%", boxSizing:"border-box",
                  background:"var(--c-cardHover)", border:"1px solid var(--c-cardBorder)",
                  borderRadius:12, padding:"12px 16px",
                  color:"var(--c-text)", fontSize:"0.92rem", fontFamily:"inherit",
                }}
              />
            </div>

            <div style={{ marginBottom:"1.5rem" }}>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:700, color:"var(--c-textMuted)", marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                Password
              </label>
              <input
                className="tpo-input"
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width:"100%", boxSizing:"border-box",
                  background:"var(--c-cardHover)", border:"1px solid var(--c-cardBorder)",
                  borderRadius:12, padding:"12px 16px",
                  color:"var(--c-text)", fontSize:"0.92rem", fontFamily:"inherit",
                }}
              />
            </div>

            {error && (
              <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"11px 16px", marginBottom:"1.25rem", fontSize:"0.83rem", color:"#ef4444", display:"flex", alignItems:"center", gap:8 }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              className="tpo-btn"
              disabled={loading || !email || !password}
              style={{
                width:"100%", padding:"13px",
                background:"linear-gradient(135deg,#5a52c8 0%,#7567C9 50%,#8b7cf0 100%)",
                border:"none", borderRadius:12,
                color:"#fff", fontWeight:800, fontSize:"0.95rem",
                fontFamily:"inherit", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                letterSpacing:"0.01em",
              }}
            >
              {loading ? <><Spin size={16} /> Signing in…</> : "Sign In to Dashboard →"}
            </button>
          </form>

          <div style={{ marginTop:"2rem", padding:"1rem 1.25rem", background:"var(--c-card)", border:"1px solid var(--c-cardBorder)", borderRadius:12, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:"1.3rem" }}>🔒</span>
            <div>
              <div style={{ fontSize:"0.76rem", fontWeight:700, color:"var(--c-text)", marginBottom:2 }}>Secure access only</div>
              <div style={{ fontSize:"0.72rem", color:"var(--c-textMuted)", lineHeight:1.5 }}>Restricted to authorised VNIT T&P administrators. All sessions are encrypted.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Portal Header ─────────────────────────────────────────────────────────────
function PortalHeader({ user, onLogout }) {
  return (
    <div style={{
      position:"sticky", top:0, zIndex:100,
      background:"var(--c-card)",
      borderBottom:"1px solid var(--c-cardBorder)",
      padding:"0 1.5rem", height:56,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      boxShadow:"0 1px 12px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <PartnershipLogos size="sm" />
        <div style={{ width:1, height:24, background:"var(--c-cardBorder)" }} />
        <div>
          <div style={{ fontSize:"0.82rem", fontWeight:800, color:"var(--c-text)", lineHeight:1.2 }}>VNIT × Atyant</div>
          <div style={{ fontSize:"0.62rem", fontWeight:600, color:"var(--c-textMuted)", letterSpacing:"0.07em", textTransform:"uppercase" }}>T&P Portal</div>
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <ThemeToggle size={14} />
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 12px", background:"var(--c-accentSoft)", border:"1px solid var(--c-activeBorder)", borderRadius:999 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#10b981", boxShadow:"0 0 0 3px rgba(16,185,129,0.2)" }} />
          <span style={{ fontSize:"0.76rem", fontWeight:700, color:"var(--c-accentText)" }}>
            {user?.username || user?.name || "TPO Admin"}
          </span>
        </div>
        <button
          onClick={onLogout}
          style={{
            background:"transparent", border:"1px solid var(--c-cardBorder)",
            borderRadius:9, padding:"6px 14px",
            color:"var(--c-textSub)", fontSize:"0.78rem", fontWeight:600,
            cursor:"pointer", fontFamily:"inherit", transition:"all .2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#7567C9"; e.currentTarget.style.color="#7567C9"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="var(--c-cardBorder)"; e.currentTarget.style.color="var(--c-textSub)"; }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function TPOPortal() {
  const { user, logout, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => { if (!loading) setReady(true); }, [loading]);

  if (!ready) {
    return (
      <div style={{ minHeight:"100vh", background:"var(--c-bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{`@keyframes tpoSpin { to { transform: rotate(360deg); } }`}</style>
        <Spin size={32} />
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={() => setReady(true)} />;

  if (user.email !== TPO_EMAIL) {
    return (
      <div style={{ minHeight:"100vh", background:"var(--c-bg)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
        <style>{`@keyframes tpoSpin { to { transform: rotate(360deg); } }`}</style>
        <PartnershipLogos />
        <div style={{ color:"var(--c-text)", fontWeight:700, fontSize:"1.1rem", marginTop:8 }}>Wrong account</div>
        <div style={{ color:"var(--c-textSub)", fontSize:"0.85rem" }}>This portal is restricted to VNIT T&P administrators.</div>
        <button onClick={logout} style={{ marginTop:8, padding:"9px 22px", background:"var(--c-cardHover)", border:"1px solid var(--c-cardBorder)", borderRadius:9, color:"var(--c-textSub)", fontSize:"0.82rem", cursor:"pointer", fontFamily:"inherit" }}>
          Sign out and try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--c-bg)" }}>
      <style>{`@keyframes tpoSpin { to { transform: rotate(360deg); } }`}</style>
      <PortalHeader user={user} onLogout={logout} />
      <TPODashboard />
    </div>
  );
}
