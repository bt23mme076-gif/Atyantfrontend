import { useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import "./hire.css";
import { scoreTone } from "./hireUtils";

export function Pill({ tone = "gray", children }) {
  return <span className={`hr-pill ${tone}`}>{children}</span>;
}

export function Score({ value }) {
  return <span className="hr-score" style={scoreTone(value)}>{value == null ? "—" : Math.round(value)}</span>;
}

export function Spinner() {
  return <div className="hr-spin" />;
}

export function Loading({ text = "Loading…" }) {
  return (
    <div className="hr-center">
      <div className="hr-col" style={{ alignItems: "center" }}><Spinner /><span className="hr-muted">{text}</span></div>
    </div>
  );
}

function ThemeToggle() {
  const theme = useTheme?.();
  if (!theme?.toggleTheme) return null;
  const dark = theme.theme === "dark";
  return (
    <button className="hr-btn sm" onClick={theme.toggleTheme} aria-label="Toggle theme">
      {dark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}

export function TopBar({ children, home = "/hire", company }) {
  return (
    <header className="hr-top">
      <Link to={home} className="hr-brand">
        {company?.logoUrl
          ? <img src={company.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }} />
          : <span className="hr-logo">A</span>}
        <span>{company?.name || "Atyant"}</span>
        {!company && <small>Hire</small>}
      </Link>
      <div className="hr-top-sp" />
      {children}
      <ThemeToggle />
    </header>
  );
}

// Founder sign-in for /hire: email login, email + OTP signup, or Google.
export function HireAuth() {
  const { login, signupInitiate, signupVerify } = useAuth();
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", otp: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const google = () => {
    sessionStorage.setItem("hire_intent", "1");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
    window.location.href = `${apiBase}/api/auth/google`;
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
        await signupInitiate(form.name.trim(), form.email.trim(), form.password, phone, "user");
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
    <form className="hr-card pad-lg hr-col" style={{ gap: 14 }} onSubmit={submit}>
      <div>
        <div className="hr-h3" style={{ fontSize: "1.1rem" }}>
          {mode === "login" ? "Sign in to your hiring dashboard" : mode === "otp" ? "Check your email" : "Start hiring free"}
        </div>
        <div className="hr-muted" style={{ marginTop: 4 }}>
          {mode === "otp" ? `We sent a 6-digit code to ${form.email}` : "First 10 interviews are on us. No card needed."}
        </div>
      </div>

      {mode !== "otp" && (
        <>
          <button type="button" className="hr-btn block" onClick={google}>
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

      {mode === "signup" && (
        <div><label className="hr-label">Your name</label><input className="hr-input" value={form.name} onChange={set("name")} required autoComplete="name" /></div>
      )}
      {mode !== "otp" && (
        <div><label className="hr-label">Work email</label><input className="hr-input" type="email" value={form.email} onChange={set("email")} required autoComplete="email" /></div>
      )}
      {mode === "signup" && (
        <div>
          <label className="hr-label">Mobile (for WhatsApp alerts)</label>
          <input className="hr-input" inputMode="numeric" value={form.phone} onChange={set("phone")} placeholder="10-digit number" required autoComplete="tel" />
        </div>
      )}
      {mode !== "otp" && (
        <div>
          <label className="hr-label">Password</label>
          <input className="hr-input" type="password" value={form.password} onChange={set("password")} required minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </div>
      )}
      {mode === "otp" && (
        <div><label className="hr-label">Verification code</label><input className="hr-input" inputMode="numeric" value={form.otp} onChange={set("otp")} required autoFocus /></div>
      )}

      {error && <div className="hr-error">{error}</div>}
      <button className="hr-btn primary block lg" disabled={busy}>
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "otp" ? "Verify and continue" : "Create account"}
      </button>
      <div className="hr-muted" style={{ textAlign: "center" }}>
        {mode === "login"
          ? <>New here? <button type="button" className="hr-link" onClick={() => { setMode("signup"); setError(""); }}>Create an account</button></>
          : <>Already have an account? <button type="button" className="hr-link" onClick={() => { setMode("login"); setError(""); }}>Sign in</button></>}
      </div>
    </form>
  );
}
