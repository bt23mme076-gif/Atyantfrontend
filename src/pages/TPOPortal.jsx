import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "../context/ThemeContext";
import TPODashboard from "./TPODashboard";

const TPO_EMAIL = "atyant.in@gmail.com";

function Spin({ size = 18 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: "2px solid var(--c-cardBorder)",
      borderTop: "2px solid var(--c-accentText)",
      borderRadius: "50%", animation: "tpoSpin .7s linear infinite",
    }} />
  );
}

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
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "2rem 1rem", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes tpoSpin { to { transform: rotate(360deg); } }
        @keyframes tpoFade { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .tpo-input { transition: border-color .2s, box-shadow .2s; }
        .tpo-input:focus { outline: none; border-color: #7567C9 !important; box-shadow: 0 0 0 3px rgba(117,103,201,0.18); }
        .tpo-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .tpo-btn { transition: all .2s; }
        .tpo-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* Ambient glows */}
      <div style={{ position:"absolute", top:-160, left:-160, width:500, height:500, borderRadius:"50%", background:"rgba(117,103,201,0.07)", filter:"blur(120px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-100, right:-100, width:400, height:400, borderRadius:"50%", background:"rgba(117,103,201,0.05)", filter:"blur(100px)", pointerEvents:"none" }} />

      {/* Theme toggle top-right */}
      <div style={{ position:"absolute", top:20, right:20 }}>
        <ThemeToggle size={15} />
      </div>

      <div style={{
        position: "relative", width: "100%", maxWidth: 420,
        background: "var(--c-card)", border: "1px solid var(--c-cardBorder)",
        borderRadius: 20, padding: "2.5rem 2rem",
        boxShadow: "var(--shadow)", animation: "tpoFade .4s ease",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:"2rem" }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#7567C9,#5a52c8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", boxShadow:"0 8px 20px rgba(117,103,201,0.35)" }}>
            🎓
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:"1.05rem", color:"var(--c-text)", letterSpacing:"-0.01em" }}>VNIT × Atyant</div>
            <div style={{ fontSize:"0.72rem", color:"var(--c-textMuted)", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>Training & Placement Portal</div>
          </div>
        </div>

        <h2 style={{ fontSize:"1.45rem", fontWeight:800, color:"var(--c-text)", margin:"0 0 0.3rem", letterSpacing:"-0.02em" }}>
          TPO Sign In
        </h2>
        <p style={{ fontSize:"0.83rem", color:"var(--c-textSub)", margin:"0 0 1.8rem" }}>
          Sign in with your T&P administrator account to access the placement dashboard.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:"1rem" }}>
            <label style={{ display:"block", fontSize:"0.78rem", fontWeight:700, color:"var(--c-textSub)", marginBottom:6, letterSpacing:"0.04em" }}>
              EMAIL
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
                borderRadius:10, padding:"10px 14px",
                color:"var(--c-text)", fontSize:"0.9rem", fontFamily:"inherit",
              }}
            />
          </div>

          <div style={{ marginBottom:"1.5rem" }}>
            <label style={{ display:"block", fontSize:"0.78rem", fontWeight:700, color:"var(--c-textSub)", marginBottom:6, letterSpacing:"0.04em" }}>
              PASSWORD
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
                borderRadius:10, padding:"10px 14px",
                color:"var(--c-text)", fontSize:"0.9rem", fontFamily:"inherit",
              }}
            />
          </div>

          {error && (
            <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"10px 14px", marginBottom:"1.2rem", fontSize:"0.82rem", color:"#ef4444" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="tpo-btn"
            disabled={loading || !email || !password}
            style={{
              width:"100%", padding:"12px",
              background:"linear-gradient(135deg,#5a52c8,#7567C9)",
              border:"none", borderRadius:10,
              color:"#fff", fontWeight:700, fontSize:"0.92rem",
              fontFamily:"inherit", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}
          >
            {loading ? <><Spin size={16} /> Signing in…</> : "Sign In →"}
          </button>
        </form>

        <div style={{ marginTop:"1.6rem", paddingTop:"1.4rem", borderTop:"1px solid var(--c-cardBorder)", fontSize:"0.75rem", color:"var(--c-textMuted)", textAlign:"center" }}>
          Powered by <span style={{ color:"#7567C9", fontWeight:700 }}>Atyant</span> · Only authorised T&P administrators can access this portal.
        </div>
      </div>
    </div>
  );
}

function PortalHeader({ user, onLogout }) {
  return (
    <div style={{
      position: "sticky", top:0, zIndex:100,
      background: "var(--c-card)",
      borderBottom: "1px solid var(--c-cardBorder)",
      padding: "0 1.5rem", height: 54,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      {/* Left: brand */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#7567C9,#5a52c8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.95rem" }}>
          🎓
        </div>
        <span style={{ fontWeight:800, fontSize:"0.95rem", color:"var(--c-text)" }}>VNIT</span>
        <span style={{ color:"var(--c-textMuted)", fontSize:"0.85rem" }}>×</span>
        <span style={{ fontWeight:700, fontSize:"0.95rem", color:"#7567C9" }}>Atyant</span>
        <span style={{ marginLeft:6, fontSize:"0.65rem", fontWeight:700, color:"var(--c-accentText)", textTransform:"uppercase", letterSpacing:"0.08em", background:"var(--c-accentSoft)", border:"1px solid var(--c-activeBorder)", borderRadius:999, padding:"2px 8px" }}>
          T&P Portal
        </span>
      </div>

      {/* Right: theme toggle + user + logout */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <ThemeToggle size={14} />
        <span style={{ fontSize:"0.8rem", color:"var(--c-textSub)" }}>
          {user?.username || user?.name || "TPO Admin"}
        </span>
        <button
          onClick={onLogout}
          style={{
            background:"var(--c-cardHover)", border:"1px solid var(--c-cardBorder)",
            borderRadius:8, padding:"6px 14px",
            color:"var(--c-textSub)", fontSize:"0.78rem", fontWeight:600,
            cursor:"pointer", fontFamily:"inherit", transition:"all .2s",
          }}
          onMouseEnter={e => { e.target.style.color="var(--c-text)"; }}
          onMouseLeave={e => { e.target.style.color="var(--c-textSub)"; }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function TPOPortal() {
  const { user, logout, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => { if (!loading) setReady(true); }, [loading]);

  if (!ready) {
    return (
      <div style={{ minHeight:"100vh", background:"var(--c-bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{`@keyframes tpoSpin { to { transform: rotate(360deg); } }`}</style>
        <Spin size={28} />
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={() => setReady(true)} />;

  if (user.email !== TPO_EMAIL) {
    return (
      <div style={{ minHeight:"100vh", background:"var(--c-bg)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
        <style>{`@keyframes tpoSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize:"2.5rem" }}>🔒</div>
        <div style={{ color:"var(--c-text)", fontWeight:700, fontSize:"1.1rem" }}>Wrong account</div>
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
