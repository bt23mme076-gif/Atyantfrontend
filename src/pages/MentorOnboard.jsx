import { useState } from "react";
import { Upload, Check, Loader2, ArrowRight, ArrowLeft, Camera, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profileAPI, mentorAPI } from "../api";
import Avatar from "../components/Avatar";

const C = {
  bg: "#13121A", card: "#1A1823", cardHover: "#211E2C", cardBorder: "#322E40",
  active: "#221E33", activeBorder: "#443A6B", accent: "#7567C9", accentSoft: "#7567C922",
  accentText: "#8E80DB", text: "#ECEAF3", textSub: "#978FAB", textMuted: "#5F576F", green: "#3DBE82",
};

const SPECIAL_TAGS = [
  "IIM", "IIT", "IIIT", "BITS", "FAANG", "Off Campus Internship", "Research Intern",
  "Foreign Internship", "PPO", "GATE", "Consulting", "Product", "Quant", "SDE", "Startup",
];
const DOMAINS = [
  { v: "internship", label: "Internships" },
  { v: "placement", label: "Placements" },
  { v: "both", label: "Both" },
];
const COMPANY_DOMAINS = ["Tech", "Data Analytics", "Consulting", "Product", "Core Engineering"];

const inp = { width: "100%", background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 9, padding: "10px 12px", color: C.text, fontSize: "0.9rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const lbl = { fontSize: "0.74rem", fontWeight: 600, color: C.textSub, marginBottom: 5, display: "block", letterSpacing: "0.02em" };

export default function MentorOnboard({ onDone }) {
  const { user, signup, setUser } = useAuth();
  const [step, setStep] = useState(user ? 1 : 0); // 0 = signup, 1..3 = wizard
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  // signup fields
  const [su, setSu] = useState({ username: "", email: "", password: "", phone: "" });

  // wizard form
  const [f, setF] = useState({
    name: "", college: "", branch: "", year: "", cgpa: "",
    topCompanies: "", expertise: "", bio: "", city: "", linkedinProfile: "",
    primaryDomain: "internship", companyDomain: "", specialTags: [], story: "",
  });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const handleSignup = async () => {
    setErr(""); setBusy(true);
    try {
      // Normalize phone → bare 10-digit Indian number (strip +91 / spaces / leading 0).
      const phone = su.phone.replace(/\D/g, "").slice(-10);
      if (!/^[6-9]\d{9}$/.test(phone)) {
        setErr("Enter a valid 10-digit Indian mobile number");
        setBusy(false);
        return;
      }
      await signup(su.username, su.email, su.password, phone, "mentor");
      setStep(1);
    } catch (e) { setErr(e.message || "Signup failed"); }
    finally { setBusy(false); }
  };

  const handleParse = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setErr("Please upload a PDF (LinkedIn → More → Save to PDF)."); return; }
    setErr(""); setBusy(true);
    try {
      const res = await profileAPI.parseLinkedin(file);
      const d = res?.data || {};
      const edu = d.education?.[0] || {};
      setF(prev => ({
        ...prev,
        name: d.name || prev.name,
        college: edu.institution || prev.college,
        branch: edu.field || prev.branch,
        year: edu.year || prev.year,
        bio: d.bio || prev.bio,
        city: d.city || prev.city,
        linkedinProfile: d.linkedinProfile || prev.linkedinProfile,
        topCompanies: (d.topCompanies || []).join(", ") || prev.topCompanies,
        expertise: (d.expertise || []).join(", ") || prev.expertise,
        specialTags: Array.from(new Set([...(prev.specialTags || []), ...(d.specialTags || [])])).filter(t => SPECIAL_TAGS.includes(t)),
        primaryDomain: d.primaryDomain || prev.primaryDomain,
        companyDomain: d.companyDomain || prev.companyDomain,
      }));
      setStep(1);
    } catch (e) { setErr(e.message || "Couldn't read that PDF — fill it manually."); }
    finally { setBusy(false); }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const res = await profileAPI.uploadPicture(file);
      setUser(prev => ({ ...(prev || {}), profilePicture: res.profilePicture }));
    } catch (e2) { setErr(e2.message || "Photo upload failed"); }
    finally { setBusy(false); e.target.value = ""; }
  };

  const toggleTag = (t) =>
    set("specialTags", f.specialTags.includes(t) ? f.specialTags.filter(x => x !== t) : [...f.specialTags, t]);

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      const payload = {
        college: f.college, branch: f.branch, year: f.year, cgpa: f.cgpa,
        topCompanies: f.topCompanies.split(",").map(s => s.trim()).filter(Boolean),
        expertise: f.expertise.split(",").map(s => s.trim()).filter(Boolean),
        specialTags: f.specialTags,
        bio: f.bio, city: f.city, linkedinProfile: f.linkedinProfile,
        primaryDomain: f.primaryDomain, companyDomain: f.companyDomain || null,
        story: f.story,
      };
      const res = await mentorAPI.onboard(payload);
      setResult(res);
    } catch (e) { setErr(e.message || "Could not save. Try again."); }
    finally { setBusy(false); }
  };

  // ── Result screen ──
  if (result) {
    return (
      <Wrap>
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: result.listed ? C.green + "22" : C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            {result.listed ? <Check size={30} color={C.green} /> : <Sparkles size={28} color={C.accentText} />}
          </div>
          <h2 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 600, marginBottom: 8 }}>
            {result.listed ? "You're live on Atyant! 🎉" : "Almost there"}
          </h2>
          <p style={{ color: C.textSub, fontSize: "0.92rem", lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>{result.message}</p>
          {!result.listed && result.missing?.length > 0 && (
            <div style={{ marginTop: 16, display: "inline-block", textAlign: "left", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: C.textMuted, marginBottom: 6 }}>STILL NEEDED</div>
              {result.missing.map((m, i) => <div key={i} style={{ color: C.textSub, fontSize: "0.85rem", padding: "2px 0" }}>• {m}</div>)}
            </div>
          )}
          <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center" }}>
            {!result.listed && <button onClick={() => setResult(null)} style={{ ...btn(false) }}>Edit profile</button>}
            <button onClick={() => onDone?.()} style={{ ...btn(true) }}>Go to dashboard</button>
          </div>
        </div>
      </Wrap>
    );
  }

  // ── Signup ──
  if (step === 0) {
    return (
      <Wrap>
        <Header step={0} />
        <h2 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 600, marginBottom: 6 }}>Become an Atyant mentor</h2>
        <p style={{ color: C.textSub, fontSize: "0.9rem", marginBottom: 22 }}>Help juniors from a background like yours. Create your mentor account to start.</p>
        {err && <Err msg={err} />}
        <div style={{ display: "grid", gap: 14 }}>
          <Field label="Name"><input style={inp} value={su.username} onChange={e => setSu({ ...su, username: e.target.value })} placeholder="Your name" /></Field>
          <Field label="Email"><input style={inp} type="email" value={su.email} onChange={e => setSu({ ...su, email: e.target.value })} placeholder="you@email.com" /></Field>
          <Field label="Password"><input style={inp} type="password" value={su.password} onChange={e => setSu({ ...su, password: e.target.value })} placeholder="Min 8 characters" /></Field>
          <Field label="Phone"><input style={inp} type="tel" value={su.phone} onChange={e => setSu({ ...su, phone: e.target.value })} placeholder="10-digit mobile number" /></Field>
        </div>
        <Nav onNext={handleSignup} nextLabel="Create account & continue" busy={busy}
          nextDisabled={!su.username || !su.email || su.password.length < 8 || su.phone.replace(/\D/g, "").length < 10} />
      </Wrap>
    );
  }

  // ── Step 1: Import + basics ──
  if (step === 1) {
    return (
      <Wrap>
        <Header step={1} />
        <h2 style={{ color: C.text, fontSize: "1.35rem", fontWeight: 600, marginBottom: 6 }}>Import from LinkedIn</h2>
        <p style={{ color: C.textSub, fontSize: "0.88rem", marginBottom: 18 }}>
          On LinkedIn: <b style={{ color: C.text }}>Profile → More → Save to PDF</b>, then drop it here. We'll auto-fill everything — you just review.
        </p>
        {err && <Err msg={err} />}

        <label style={{ display: "block", border: `1.5px dashed ${C.activeBorder}`, borderRadius: 14, padding: "1.6rem", textAlign: "center", cursor: "pointer", background: C.card, marginBottom: 20 }}>
          <input type="file" accept="application/pdf" hidden onChange={e => handleParse(e.target.files?.[0])} disabled={busy} />
          {busy ? <Loader2 size={22} color={C.accentText} style={{ animation: "spin 1s linear infinite" }} />
            : <Upload size={22} color={C.accentText} />}
          <div style={{ color: C.text, fontWeight: 500, marginTop: 8, fontSize: "0.92rem" }}>{busy ? "Reading your profile…" : "Upload LinkedIn PDF"}</div>
          <div style={{ color: C.textMuted, fontSize: "0.78rem", marginTop: 3 }}>PDF only · we never post anything</div>
        </label>

        {/* Photo + basics (pre-filled after parse) */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <label style={{ position: "relative", cursor: "pointer" }} title="Add photo">
            <Avatar src={user?.profilePicture} name={f.name || user?.username || "You"} size={56} bg="7567c9" />
            <input type="file" accept="image/*" hidden onChange={handlePhoto} />
            <span style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: "50%", background: C.accent, border: `2px solid ${C.bg}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={10} color="#fff" /></span>
          </label>
          <div style={{ flex: 1 }}>
            <Field label="Name"><input style={inp} value={f.name} onChange={e => set("name", e.target.value)} placeholder="Your name" /></Field>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
          <Field label="College"><input style={inp} value={f.college} onChange={e => set("college", e.target.value)} placeholder="VNIT Nagpur" /></Field>
          <Field label="Branch"><input style={inp} value={f.branch} onChange={e => set("branch", e.target.value)} placeholder="Metallurgy" /></Field>
          <Field label="Grad year"><input style={inp} value={f.year} onChange={e => set("year", e.target.value)} placeholder="2024" /></Field>
          <Field label="City"><input style={inp} value={f.city} onChange={e => set("city", e.target.value)} placeholder="Bengaluru" /></Field>
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label="Companies / institutes (comma separated)"><input style={inp} value={f.topCompanies} onChange={e => set("topCompanies", e.target.value)} placeholder="IIM Ahmedabad, Amazon" /></Field>
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label="Skills / expertise (comma separated)"><input style={inp} value={f.expertise} onChange={e => set("expertise", e.target.value)} placeholder="Python, DSA, Guesstimates" /></Field>
        </div>

        <Nav onBack={() => setStep(user ? 1 : 0)} onNext={() => setStep(2)} nextLabel="Next" busy={busy}
          nextDisabled={!f.college || !f.branch} />
      </Wrap>
    );
  }

  // ── Step 2: Domain, tags, story ──
  return (
    <Wrap>
      <Header step={2} />
      <h2 style={{ color: C.text, fontSize: "1.35rem", fontWeight: 600, marginBottom: 6 }}>What you mentor on</h2>
      <p style={{ color: C.textSub, fontSize: "0.88rem", marginBottom: 18 }}>This is what matches you to the right students.</p>
      {err && <Err msg={err} />}

      <Field label="I mostly help with">
        <div style={{ display: "flex", gap: 8 }}>
          {DOMAINS.map(d => (
            <button key={d.v} onClick={() => set("primaryDomain", d.v)}
              style={{ flex: 1, ...chip(f.primaryDomain === d.v) }}>{d.label}</button>
          ))}
        </div>
      </Field>

      <div style={{ marginTop: 16 }}>
        <Field label="Field">
          <select style={{ ...inp, cursor: "pointer" }} value={f.companyDomain} onChange={e => set("companyDomain", e.target.value)}>
            <option value="">Select…</option>
            {COMPANY_DOMAINS.map(d => <option key={d} value={d} style={{ background: C.bg }}>{d}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <span style={lbl}>Achievements / tags (pick all that apply)</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SPECIAL_TAGS.map(t => (
            <button key={t} onClick={() => toggleTag(t)} style={{ ...chip(f.specialTags.includes(t)), padding: "6px 12px", fontSize: "0.8rem" }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <Field label="Your story — how did you crack it?">
          <textarea style={{ ...inp, minHeight: 120, resize: "vertical", lineHeight: 1.5 }} value={f.story}
            onChange={e => set("story", e.target.value)}
            placeholder="e.g. As a Metallurgy student at VNIT with no CS background, I cold-mailed 40 labs, landed an IIM research internship, and used guesstimates + 2 case projects to convert…" />
        </Field>
        <div style={{ textAlign: "right", fontSize: "0.72rem", color: f.story.length >= 120 ? C.green : C.textMuted, marginTop: 4 }}>
          {f.story.length}/120 min
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Field label="Short bio"><input style={inp} value={f.bio} onChange={e => set("bio", e.target.value)} placeholder="One line about who you are" /></Field>
      </div>

      <Nav onBack={() => setStep(1)} onNext={submit} nextLabel="Finish & go live" busy={busy} />
    </Wrap>
  );
}

// ── Small UI helpers ──
const Wrap = ({ children }) => (
  <div style={{ minHeight: "100%", background: C.bg, padding: "2.5rem 1.5rem", overflowY: "auto" }}>
    <div style={{ maxWidth: 620, margin: "0 auto" }}>{children}</div>
  </div>
);
const btn = (primary) => ({
  background: primary ? C.accent : "transparent", border: primary ? "none" : `1px solid ${C.cardBorder}`,
  color: primary ? "#fff" : C.textSub, borderRadius: 10, padding: "10px 18px", fontSize: "0.88rem",
  fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
});
const chip = (on) => ({
  background: on ? C.accentSoft : C.active, border: `1px solid ${on ? C.accent : C.cardBorder}`,
  color: on ? C.accentText : C.textSub, borderRadius: 999, padding: "8px 14px", fontSize: "0.85rem",
  fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
});
const Field = ({ label, children }) => (<div><span style={lbl}>{label}</span>{children}</div>);
const Err = ({ msg }) => (<div style={{ background: "#3a1a1f", border: "1px solid #f8717155", color: "#fca5a5", borderRadius: 9, padding: "9px 12px", fontSize: "0.82rem", marginBottom: 14 }}>{msg}</div>);

function Header({ step }) {
  const steps = ["Account", "Profile", "Mentoring"];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ flex: 1 }}>
          <div style={{ height: 3, borderRadius: 2, background: i <= step ? C.accent : C.cardBorder }} />
          <div style={{ fontSize: "0.68rem", color: i <= step ? C.accentText : C.textMuted, marginTop: 5, fontWeight: 600 }}>{s}</div>
        </div>
      ))}
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel, nextDisabled, busy }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
      {onBack ? <button onClick={onBack} disabled={busy} style={{ ...btn(false), display: "flex", alignItems: "center", gap: 6 }}><ArrowLeft size={15} /> Back</button> : <span />}
      <button onClick={onNext} disabled={busy || nextDisabled}
        style={{ ...btn(true), opacity: (busy || nextDisabled) ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}>
        {busy ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null}
        {nextLabel} {!busy && <ArrowRight size={15} />}
      </button>
    </div>
  );
}
