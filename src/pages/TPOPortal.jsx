import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import TPODashboard from "./TPODashboard";

const TPO_EMAIL = "atyant.in@gmail.com";

// ── Brand colours ─────────────────────────────────────────────────────────────
const P = {
  bg:       "#0a0e1a",
  card:     "rgba(255,255,255,0.04)",
  border:   "rgba(255,255,255,0.09)",
  purple:   "#7c6ff7",
  purpleDk: "#5a52c8",
  text:     "#f1f5f9",
  sub:      "#94a3b8",
  muted:    "#475569",
  error:    "#f87171",
  input:    "rgba(255,255,255,0.06)",
};

// ── Tiny spinner ──────────────────────────────────────────────────────────────
function Spin({ size = 18 }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `2px solid rgba(255,255,255,0.25)`,
        borderTop: `2px solid #fff`,
        borderRadius: "50%",
        animation: "tpoSpin .7s linear infinite",
      }}
    />
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
    <div
      style={{
        minHeight: "100vh",
        background: P.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes tpoSpin { to { transform: rotate(360deg); } }
        @keyframes tpoFade { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .tpo-input:focus { outline: none; border-color: ${P.purple} !important; box-shadow: 0 0 0 3px rgba(124,111,247,0.18); }
        .tpo-btn:hover:not(:disabled) { background: ${P.purple} !important; transform: translateY(-1px); }
        .tpo-btn:disabled { opacity: 0.55; cursor: not-allowed; }
      `}</style>

      {/* Ambient glows */}
      <div style={{ position:"absolute", top:-160, left:-160, width:500, height:500, borderRadius:"50%", background:"rgba(124,111,247,0.12)", filter:"blur(120px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-100, right:-100, width:400, height:400, borderRadius:"50%", background:"rgba(99,102,241,0.08)", filter:"blur(100px)", pointerEvents:"none" }} />

      {/* Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          background: P.card,
          border: `1px solid ${P.border}`,
          borderRadius: 20,
          padding: "2.5rem 2rem",
          backdropFilter: "blur(20px)",
          animation: "tpoFade .4s ease",
        }}
      >
        {/* Logo row */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:"2rem" }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#7c6ff7,#5a52c8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", boxShadow:"0 8px 20px rgba(124,111,247,0.35)" }}>
            🎓
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:"1.05rem", color:P.text, letterSpacing:"-0.01em" }}>VNIT × Atyant</div>
            <div style={{ fontSize:"0.72rem", color:P.muted, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>Training & Placement Portal</div>
          </div>
        </div>

        <h2 style={{ fontSize:"1.45rem", fontWeight:800, color:P.text, margin:"0 0 0.3rem", letterSpacing:"-0.02em" }}>
          TPO Sign In
        </h2>
        <p style={{ fontSize:"0.83rem", color:P.sub, margin:"0 0 1.8rem" }}>
          Sign in with your T&P administrator account to access the placement dashboard.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:"1rem" }}>
            <label style={{ display:"block", fontSize:"0.78rem", fontWeight:700, color:P.sub, marginBottom:6, letterSpacing:"0.04em" }}>
              EMAIL
            </label>
            <input
              className="tpo-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="atyant.in@gmail.com"
              required
              style={{
                width:"100%", boxSizing:"border-box",
                background:P.input, border:`1px solid ${P.border}`,
                borderRadius:10, padding:"10px 14px",
                color:P.text, fontSize:"0.9rem",
                fontFamily:"inherit", transition:"border-color .2s, box-shadow .2s",
              }}
            />
          </div>

          <div style={{ marginBottom:"1.5rem" }}>
            <label style={{ display:"block", fontSize:"0.78rem", fontWeight:700, color:P.sub, marginBottom:6, letterSpacing:"0.04em" }}>
              PASSWORD
            </label>
            <input
              className="tpo-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width:"100%", boxSizing:"border-box",
                background:P.input, border:`1px solid ${P.border}`,
                borderRadius:10, padding:"10px 14px",
                color:P.text, fontSize:"0.9rem",
                fontFamily:"inherit", transition:"border-color .2s, box-shadow .2s",
              }}
            />
          </div>

          {error && (
            <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:"1.2rem", fontSize:"0.82rem", color:P.error }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="tpo-btn"
            disabled={loading || !email || !password}
            style={{
              width:"100%", padding:"12px",
              background:"linear-gradient(135deg,#5a52c8,#7c6ff7)",
              border:"none", borderRadius:10,
              color:"#fff", fontWeight:700, fontSize:"0.92rem",
              fontFamily:"inherit", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              transition:"all .2s",
            }}
          >
            {loading ? <><Spin size={16} /> Signing in…</> : "Sign In →"}
          </button>
        </form>

        <div style={{ marginTop:"1.6rem", paddingTop:"1.4rem", borderTop:`1px solid ${P.border}`, fontSize:"0.75rem", color:P.muted, textAlign:"center" }}>
          Powered by <span style={{ color:P.purple, fontWeight:700 }}>Atyant</span> · Only authorised T&P administrators can access this portal.
        </div>
      </div>
    </div>
  );
}

// ── Portal Header ─────────────────────────────────────────────────────────────
function PortalHeader({ user, onLogout }) {
  return (
    <div
      style={{
        position: "sticky", top:0, zIndex:100,
        background: "rgba(10,14,26,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${P.border}`,
        padding: "0 1.5rem",
        height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#7c6ff7,#5a52c8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.95rem" }}>
          🎓
        </div>
        <span style={{ fontWeight:800, fontSize:"0.95rem", color:P.text }}>VNIT</span>
        <span style={{ color:P.muted, fontSize:"0.85rem" }}>×</span>
        <span style={{ fontWeight:700, fontSize:"0.95rem", color:P.purple }}>Atyant</span>
        <span style={{ marginLeft:6, fontSize:"0.65rem", fontWeight:700, color:P.muted, textTransform:"uppercase", letterSpacing:"0.08em", background:"rgba(124,111,247,0.12)", border:"1px solid rgba(124,111,247,0.25)", borderRadius:999, padding:"2px 8px" }}>
          T&P Portal
        </span>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:"0.8rem", color:P.sub }}>
          {user?.username || user?.name || "TPO Admin"}
        </span>
        <button
          onClick={onLogout}
          style={{
            background:"rgba(255,255,255,0.06)", border:`1px solid ${P.border}`,
            borderRadius:8, padding:"6px 14px",
            color:P.sub, fontSize:"0.78rem", fontWeight:600,
            cursor:"pointer", fontFamily:"inherit",
            transition:"all .2s",
          }}
          onMouseEnter={e => { e.target.style.background="rgba(255,255,255,0.1)"; e.target.style.color=P.text; }}
          onMouseLeave={e => { e.target.style.background="rgba(255,255,255,0.06)"; e.target.style.color=P.sub; }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function TPOPortal() {
  const { user, logout, loading } = useAuth();
  const [ready, setReady] = useState(false);

  // After auth context loads, mark ready
  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  if (!ready) {
    return (
      <div style={{ minHeight:"100vh", background:P.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{`@keyframes tpoSpin { to { transform: rotate(360deg); } }`}</style>
        <Spin size={28} />
      </div>
    );
  }

  // Not logged in → show login
  if (!user) {
    return <LoginScreen onLogin={() => setReady(true)} />;
  }

  // Logged in but not TPO → wrong account
  if (user.email !== TPO_EMAIL) {
    return (
      <div style={{ minHeight:"100vh", background:P.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
        <style>{`@keyframes tpoSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize:"2.5rem" }}>🔒</div>
        <div style={{ color:P.text, fontWeight:700, fontSize:"1.1rem" }}>Wrong account</div>
        <div style={{ color:P.sub, fontSize:"0.85rem" }}>This portal is restricted to VNIT T&P administrators.</div>
        <button
          onClick={logout}
          style={{ marginTop:8, padding:"9px 22px", background:"rgba(255,255,255,0.07)", border:`1px solid ${P.border}`, borderRadius:9, color:P.sub, fontSize:"0.82rem", cursor:"pointer", fontFamily:"inherit" }}
        >
          Sign out and try again
        </button>
      </div>
    );
  }

  // Authenticated TPO → show dashboard
  return (
    <div style={{ minHeight:"100vh", background:P.bg }}>
      <style>{`@keyframes tpoSpin { to { transform: rotate(360deg); } }`}</style>
      <PortalHeader user={user} onLogout={logout} />
      {/* TPODashboard already gates on email; it will pass since user.email === TPO_EMAIL */}
      <TPODashboard />
    </div>
  );
}
