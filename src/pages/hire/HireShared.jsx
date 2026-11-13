import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowRight, Moon, Sun, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import "./hire.css";
import { scoreTone, toneColor, clampQuestions } from "./hireUtils";
import { VoiceOrb } from "./HireFx";

// Founder-chosen interview length (backend: 5-15 min, 3-10 questions, at most
// one per minute, and every must-ask leaves room for the intro + one more).
const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

export function InterviewLength({ durationMin, questionCount, mustAskCount = 0, onChange }) {
  const max = Math.min(10, durationMin);
  const minQ = Math.max(3, mustAskCount + 2);
  const shown = clampQuestions(durationMin, questionCount, mustAskCount);
  return (
    <div className="hr-grid c2">
      <div>
        <label className="hr-label">Interview length</label>
        <select className="hr-select" value={durationMin}
          onChange={e => { const d = Number(e.target.value); onChange({ durationMin: d, questionCount: clampQuestions(d, questionCount, mustAskCount) }); }}>
          {range(5, 15).map(m => <option key={m} value={m}>{m} minutes</option>)}
        </select>
      </div>
      <div>
        <label className="hr-label">Questions asked</label>
        <select className="hr-select" value={shown} onChange={e => onChange({ durationMin, questionCount: Number(e.target.value) })}>
          {range(minQ, max).map(n => <option key={n} value={n}>{n} questions</option>)}
        </select>
        <div className="hr-hint">Includes the intro{mustAskCount ? ` and your ${mustAskCount} must-ask` : ""}. Up to one per minute.</div>
      </div>
    </div>
  );
}

export function HirePage({ children, className = "" }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className={`hr-page ${className}`}>{children}</div>
    </MotionConfig>
  );
}

export function Pill({ tone = "gray", dot, pulse, children }) {
  return (
    <span className={`hr-pill ${tone}`}>
      {(dot || pulse) && <span className={`hr-dot ${pulse ? "pulse" : ""}`} />}
      {children}
    </span>
  );
}

export function Score({ value }) {
  return <span className="hr-score" style={scoreTone(value)}>{value == null ? "—" : Math.round(value)}</span>;
}

export function ScoreBar({ value }) {
  return (
    <span className="hr-scorebar">
      <Score value={value} />
      <span className="hr-minibar">
        {value != null && (
          <motion.i style={{ background: `linear-gradient(90deg, #7567C9, ${toneColor(value)})` }}
            initial={{ width: 0 }} animate={{ width: `${Math.max(4, Math.min(100, value))}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
        )}
      </span>
    </span>
  );
}

export function Spinner() {
  return <div className="hr-spin" />;
}

export function Loading({ text = "Loading…" }) {
  return (
    <div className="hr-center">
      <div className="hr-col" style={{ alignItems: "center", gap: 14 }}>
        <VoiceOrb size={84} idle />
        <span className="hr-muted">{text}</span>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const theme = useTheme?.();
  if (!theme?.toggleTheme) return null;
  const dark = theme.theme === "dark";
  return (
    <button className="hr-btn sm ghost" onClick={theme.toggleTheme} aria-label="Toggle theme">
      <motion.span key={dark ? "sun" : "moon"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} style={{ display: "inline-flex" }}>
        {dark ? <Sun size={14} /> : <Moon size={14} />}
      </motion.span>
    </button>
  );
}

export function TopBar({ children, nav, home = "/hire", company }) {
  return (
    <header className="hr-top">
      <Link to={home} className="hr-brand">
        {company?.logoUrl
          ? <img src={company.logoUrl} alt="" style={{ width: 30, height: 30, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
          : <span className="hr-logo">A</span>}
        <span>{company?.name || "Atyant"}</span>
        {!company && <small>HIRE</small>}
      </Link>
      {nav && <nav className="hr-topnav">{nav}</nav>}
      <div className="hr-top-sp" />
      {children}
      <ThemeToggle />
    </header>
  );
}

// Centered modal with backdrop. Render inside <AnimatePresence> for the exit animation.
export function Modal({ as = "div", onClose, children, className = "", style, ...rest }) {
  const Panel = motion[as];
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <>
      <motion.div className="hr-drawer-bg" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <div className="hr-modal-wrap">
        <Panel className={`hr-modal hr-col ${className}`} style={{ gap: 16, ...style }} role="dialog" aria-modal="true"
          initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }} {...rest}>
          {children}
        </Panel>
      </div>
    </>
  );
}

export function ModalHead({ Icon, title, sub, onClose }) {
  return (
    <div className="hr-modal-head">
      {Icon && <span className="hr-icon-badge solid"><Icon size={18} /></span>}
      <div className="hr-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
        <span className="hr-h3" style={{ fontSize: "1.15rem" }}>{title}</span>
        {sub && <span className="hr-muted">{sub}</span>}
      </div>
      <button type="button" className="hr-btn sm ghost" onClick={onClose} aria-label="Close"><X size={14} /></button>
    </div>
  );
}

const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.25 } };

// Founder sign-in for /hire: email login, email + OTP signup, or Google.
export function HireAuth({ initialMode = "signup", initialError = "", dark = false }) {
  const { login, signupInitiate, signupVerify } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", otp: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const google = () => {
    sessionStorage.setItem("hire_intent", "1");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
    // intent=startup: new Google accounts are created as startups (backend routes/auth.js).
    window.location.href = `${apiBase}/api/auth/google?intent=startup`;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(form.email.trim(), form.password);
      } else if (mode === "signup") {
        const phone = form.phone.replace(/\D/g, "");
        if (phone.length !== 10) throw new Error("Enter a 10-digit mobile number");
        await signupInitiate(form.name.trim(), form.email.trim(), form.password, phone, "startup");
        setMode("otp");
      } else {
        await signupVerify(form.email.trim(), form.otp.trim());
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={`hr-card pad-lg hr-col hr-gborder`} style={{ gap: 14, color: "var(--c-text)", boxShadow: dark ? "0 40px 90px -30px rgba(0,0,0,.7)" : undefined }} onSubmit={submit}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mode} {...fade}>
          <div className="hr-h3" style={{ fontSize: "1.2rem" }}>
            {mode === "login" ? "Welcome back" : mode === "otp" ? "Check your email" : "Start hiring free"}
          </div>
          <div className="hr-muted" style={{ marginTop: 4 }}>
            {mode === "otp" ? `We sent a 6-digit code to ${form.email}` : mode === "login" ? "Sign in to your company's hiring account." : "Create a startup account. First 10 interviews are on us."}
          </div>
        </motion.div>
      </AnimatePresence>

      {mode !== "otp" && (
        <>
          <button type="button" className="hr-btn block" onClick={google} style={{ padding: "11px 16px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            Continue with Google
          </button>
          <div className="hr-row hr-muted" style={{ gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: "var(--c-cardBorder)" }} />or<div style={{ flex: 1, height: 1, background: "var(--c-cardBorder)" }} />
          </div>
        </>
      )}

      <AnimatePresence initial={false}>
        {mode === "signup" && (
          <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
            <label className="hr-label">Your name</label><input className="hr-input" value={form.name} onChange={set("name")} required autoComplete="name" />
          </motion.div>
        )}
      </AnimatePresence>
      {mode !== "otp" && (
        <div><label className="hr-label">Work email</label><input className="hr-input" type="email" value={form.email} onChange={set("email")} required autoComplete="email" /></div>
      )}
      <AnimatePresence initial={false}>
        {mode === "signup" && (
          <motion.div key="phone" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
            <label className="hr-label">Mobile (for WhatsApp alerts)</label>
            <input className="hr-input" inputMode="numeric" value={form.phone} onChange={set("phone")} placeholder="10-digit number" required autoComplete="tel" />
          </motion.div>
        )}
      </AnimatePresence>
      {mode !== "otp" && (
        <div>
          <label className="hr-label">Password</label>
          <input className="hr-input" type="password" value={form.password} onChange={set("password")} required minLength={mode === "login" ? 1 : 8}
            autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </div>
      )}
      {mode === "otp" && (
        <div><label className="hr-label">Verification code</label><input className="hr-input" inputMode="numeric" value={form.otp} onChange={set("otp")} required autoFocus style={{ letterSpacing: ".3em", fontWeight: 700, fontSize: "1.1rem" }} /></div>
      )}

      {error && <motion.div className="hr-error" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [6, -4, 2, 0] }}>{error}</motion.div>}
      <button className="hr-btn primary block lg" disabled={busy}>
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "otp" ? "Verify and continue" : "Create free account"}
        {!busy && <ArrowRight size={16} className="hr-arrow" />}
      </button>
      <div className="hr-muted" style={{ textAlign: "center", lineHeight: 1.5 }}>
        Startup accounts are separate from Atyant student and mentor accounts.
      </div>
      <div className="hr-muted" style={{ textAlign: "center" }}>
        {mode === "login"
          ? <>New here? <button type="button" className="hr-link" onClick={() => { setMode("signup"); setError(""); }}>Create an account</button></>
          : <>Already have an account? <button type="button" className="hr-link" onClick={() => { setMode("login"); setError(""); }}>Sign in</button></>}
      </div>
    </form>
  );
}
