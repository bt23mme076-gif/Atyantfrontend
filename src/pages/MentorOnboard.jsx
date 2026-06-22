import { useState } from "react";
import { Check, Loader2, ArrowRight, ArrowLeft, Camera, Sparkles, Link2, Upload, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profileAPI, mentorAPI } from "../api";
import Avatar from "../components/Avatar";

const C = {
  bg:          "var(--c-bg)",
  card:        "var(--c-card)",
  cardHover:   "var(--c-cardHover)",
  cardBorder:  "var(--c-cardBorder)",
  active:      "var(--c-active)",
  activeBorder:"var(--c-activeBorder)",
  accent:      "#7567C9",
  accentSoft:  "var(--c-accentSoft)",
  accentText:  "var(--c-accentText)",
  text:        "var(--c-text)",
  textSub:     "var(--c-textSub)",
  textMuted:   "var(--c-textMuted)",
  green:       "#3DBE82",
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
  const { user, signup, setUser, refreshUser } = useAuth();
  const [step, setStep] = useState(user ? 1 : 0); // 0 = signup, 1..3 = wizard
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  // signup fields
  const [su, setSu] = useState({ username: "", email: "", password: "", phone: "" });

  // linkedin import
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinImported, setLinkedinImported] = useState(false);
  const [linkedinBusy, setLinkedinBusy] = useState(false);
  const [importTab, setImportTab] = useState("url"); // "url" | "pdf"
  const [resumeFile, setResumeFile] = useState(null); // PDF file staged before signup

  // wizard form
  const [f, setF] = useState({
    name: "", college: "", branch: "", year: "", cgpa: "",
    topCompanies: "", expertise: [], bio: "", city: "", linkedinProfile: "",
    primaryDomain: "internship", companyDomain: "", specialTags: [], story: "",
  });
  const [importedSkills, setImportedSkills] = useState([]); // chips from LinkedIn
  const [importTimer, setImportTimer] = useState(0);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const handleSignup = async () => {
    setErr(""); setBusy(true);
    try {
      const phone = su.phone.replace(/\D/g, "").slice(-10);
      if (!/^[6-9]\d{9}$/.test(phone)) {
        setErr("Enter a valid 10-digit Indian mobile number");
        setBusy(false);
        return;
      }
      // If name is blank but LinkedIn URL is provided, use email prefix temporarily —
      // the LinkedIn import right below will overwrite it with the real name.
      const nameToUse = su.username.trim() || su.email.split("@")[0];
      await signup(nameToUse, su.email, su.password, phone, "mentor");
      // Auto-import after signup — resume PDF takes priority over LinkedIn URL
      if (resumeFile) {
        try {
          setLinkedinBusy(true);
          const res = await profileAPI.parseLinkedin(resumeFile);
          applyResumeData(res?.data || {});
        } catch { /* non-fatal */ }
        finally { setLinkedinBusy(false); }
      } else if (linkedinUrl.trim()) {
        try {
          setLinkedinBusy(true);
          const res = await mentorAPI.linkedinAutofill(linkedinUrl.trim());
          const d = res?.data?.fields || res?.fields || {};
          const skills = d.expertise || [];
          setImportedSkills(skills);
          setF(prev => ({
            ...prev,
            name:            d.username        || su.username || prev.name,
            college:         d.college         || prev.college,
            branch:          d.branch          || prev.branch,
            year:            d.year            || prev.year,
            bio:             d.bio             || prev.bio,
            city:            d.city            || prev.city,
            linkedinProfile: d.linkedinProfile || linkedinUrl.trim(),
            topCompanies:    (d.topCompanies || []).join(", ") || prev.topCompanies,
            expertise:       skills,
            story:           d.story           || prev.story,
          }));
          setLinkedinImported(true);
        } catch { /* non-fatal */ }
        finally { setLinkedinBusy(false); }
      }
      setStep(1);
    } catch (e) { setErr(e.message || "Signup failed"); }
    finally { setBusy(false); }
  };

  const handleLinkedInImport = async () => {
    if (!linkedinUrl.trim()) { setErr("Paste your LinkedIn profile URL first."); return; }
    setErr(""); setLinkedinBusy(true); setImportTimer(0);
    const timerRef = setInterval(() => setImportTimer(t => t + 1), 1000);
    try {
      const res = await mentorAPI.linkedinAutofill(linkedinUrl.trim());
      const d = res?.data?.fields || res?.fields || {};
      const skills = d.expertise || [];
      setImportedSkills(skills);
      setF(prev => ({
        ...prev,
        name:            d.username         || prev.name,
        college:         d.college          || prev.college,
        branch:          d.branch           || prev.branch,
        year:            d.year             || prev.year,
        bio:             d.bio              || prev.bio,
        city:            d.city             || prev.city,
        linkedinProfile: d.linkedinProfile  || linkedinUrl.trim() || prev.linkedinProfile,
        topCompanies:    (d.topCompanies || []).join(", ") || prev.topCompanies,
        expertise:       skills,
        story:           d.story            || prev.story,
      }));
      setLinkedinImported(true);
    } catch (e) { setErr(e.message || "Couldn't import — fill the fields manually."); }
    finally { setLinkedinBusy(false); clearInterval(timerRef); }
  };

  const applyResumeData = (d) => {
    const edu = d.education?.[0] || {};
    const skills = Array.isArray(d.expertise) ? d.expertise.slice(0, 5) : [];
    setImportedSkills(skills);
    setF(prev => ({
      ...prev,
      name:            d.name            || prev.name,
      college:         edu.institution   || prev.college,
      branch:          edu.field         || prev.branch,
      year:            edu.year          || prev.year,
      bio:             d.bio             || prev.bio,
      city:            d.city            || prev.city,
      linkedinProfile: d.linkedinProfile || prev.linkedinProfile,
      topCompanies:    (d.topCompanies || []).join(", ") || prev.topCompanies,
      expertise:       skills,
      primaryDomain:   d.primaryDomain   || prev.primaryDomain,
      companyDomain:   d.companyDomain   || prev.companyDomain,
    }));
    setLinkedinImported(true);
  };

  const handleResumePDF = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setErr("Please upload a PDF file."); return; }
    setErr("");
    // On Step 0 (before signup) we can't call the protected endpoint yet — stage the file
    if (step === 0) {
      setResumeFile(file);
      setLinkedinImported(true); // show "staged" green state
      return;
    }
    // On Step 1 (already signed in via Google or after email signup) — parse immediately
    setLinkedinBusy(true);
    try {
      const res = await profileAPI.parseLinkedin(file);
      applyResumeData(res?.data || {});
    } catch (e) { setErr(e.message || "Couldn't read PDF — fill the fields manually."); }
    finally { setLinkedinBusy(false); }
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
        username: f.name || undefined,
        college: f.college, branch: f.branch, year: f.year, cgpa: f.cgpa,
        topCompanies: f.topCompanies.split(",").map(s => s.trim()).filter(Boolean),
        expertise: Array.isArray(f.expertise) ? f.expertise : f.expertise.split(",").map(s => s.trim()).filter(Boolean),
        specialTags: f.specialTags,
        bio: f.bio, city: f.city, linkedinProfile: f.linkedinProfile,
        primaryDomain: f.primaryDomain, companyDomain: f.companyDomain || null,
        story: f.story,
      };
      const res = await mentorAPI.onboard(payload);
      // Refresh AuthContext so ProfilePage sees the saved mentor data immediately.
      try { await refreshUser(); } catch { /* non-fatal */ }
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
            <button
              onClick={() => {
                // Ask the profile page to pop the new answer card open on arrival.
                try { sessionStorage.setItem("atyant_open_answercard", "1"); } catch { /* ignore */ }
                onDone?.();
              }}
              style={{ ...btn(true) }}
            >
              {result.listed ? "See your answer card" : "Go to dashboard"}
            </button>
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
        <p style={{ color: C.textSub, fontSize: "0.9rem", marginBottom: 18 }}>Help juniors from a background like yours. Create your mentor account to start.</p>

        {/* Google one-click signup — fastest path */}
        <button
          onClick={() => {
            sessionStorage.setItem("mentor_intent", "1");
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
            window.location.href = `${apiBase}/api/auth/google`;
          }}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "11px 16px", fontSize: "0.9rem", fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: "inherit", marginBottom: 14 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: C.cardBorder }} />
          <span style={{ fontSize: "0.74rem", color: C.textMuted, fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: C.cardBorder }} />
        </div>

        {err && <Err msg={err} />}

        {/* Auto-import block — LinkedIn URL or Resume PDF */}
        <div style={{ background: C.card, border: `1px solid ${C.activeBorder}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
          {/* Tab header */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.cardBorder}` }}>
            {[
              { id: "url",  icon: <Link2 size={13}/>,     label: "LinkedIn URL" },
              { id: "pdf",  icon: <FileText size={13}/>,  label: "Resume PDF" },
            ].map(tab => (
              <button key={tab.id} type="button" onClick={() => setImportTab(tab.id)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 12px", border: "none", borderBottom: importTab === tab.id ? `2px solid ${C.accent}` : "2px solid transparent", background: "transparent", color: importTab === tab.id ? C.accentText : C.textMuted, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "14px 16px" }}>
            {importTab === "url" ? (
              <>
                <input
                  style={{ ...inp, width: "100%", boxSizing: "border-box" }}
                  type="url"
                  placeholder="https://linkedin.com/in/yourname"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                />
                {linkedinUrl.trim() ? (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10, background: "rgba(61,190,130,0.08)", border: "1px solid #3DBE8233", borderRadius: 8, padding: "10px 12px" }}>
                    <Check size={14} color={C.green} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                      <span style={{ color: C.green }}>LinkedIn URL added — your name, college, companies and skills will be auto-imported after signup.</span>
                      <br />
                      <span style={{ color: "#e53e3e", fontWeight: 700 }}>Please only fill in your email, mobile number, and password to complete your account.</span>
                    </span>
                  </div>
                ) : (
                  <div style={{ color: C.textMuted, fontSize: "0.74rem", marginTop: 6 }}>
                    Paste your LinkedIn URL — we'll auto-fill everything. You just review.
                  </div>
                )}
              </>
            ) : (
              <>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, border: `2px dashed ${C.cardBorder}`, borderRadius: 10, padding: "20px 16px", cursor: linkedinBusy ? "default" : "pointer", background: C.active }}>
                  <input type="file" accept="application/pdf" hidden disabled={linkedinBusy}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleResumePDF(f); e.target.value = ""; }} />
                  {linkedinBusy ? (
                    <><Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: C.accentText }} /><span style={{ fontSize: "0.82rem", color: C.accentText, fontWeight: 600 }}>Reading resume…</span></>
                  ) : resumeFile ? (
                    <><Check size={22} color={C.green} /><span style={{ fontSize: "0.82rem", color: C.green, fontWeight: 600 }}>{resumeFile.name} — will be parsed after signup</span><span style={{ fontSize: "0.72rem", color: C.textMuted }}>Tap to change file</span></>
                  ) : (
                    <><Upload size={22} color={C.textMuted} /><span style={{ fontSize: "0.82rem", color: C.textSub, fontWeight: 600 }}>Click to upload your Resume PDF</span><span style={{ fontSize: "0.72rem", color: C.textMuted }}>We extract your name, college, companies, skills automatically</span></>
                  )}
                </label>
                <div style={{ color: C.textMuted, fontSize: "0.72rem", marginTop: 8, textAlign: "center" }}>
                  Works with any resume PDF — no LinkedIn required
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <Field label="Name"><input style={inp} value={su.username} onChange={e => setSu({ ...su, username: e.target.value })} placeholder="Your name" /></Field>
          <Field label="Email"><input style={inp} type="email" value={su.email} onChange={e => setSu({ ...su, email: e.target.value })} placeholder="you@email.com" /></Field>
          <Field label="Password"><input style={inp} type="password" value={su.password} onChange={e => setSu({ ...su, password: e.target.value })} placeholder="Min 8 characters" /></Field>
          <Field label="Phone"><input style={inp} type="tel" value={su.phone} onChange={e => setSu({ ...su, phone: e.target.value })} placeholder="10-digit mobile number" /></Field>
        </div>
        {/* Show what's still missing so the mentor isn't confused by a gray button */}
        {(() => {
          const missing = [];
          if (!su.username && !linkedinUrl.trim() && !resumeFile) missing.push("name");
          if (!su.email) missing.push("email");
          if (su.password.length < 8) missing.push("password (8+ chars)");
          if (su.phone.replace(/\D/g, "").length < 10) missing.push("phone");
          return missing.length > 0 ? (
            <div style={{ fontSize: "0.75rem", color: C.textMuted, marginTop: 14, textAlign: "right" }}>
              Still needed: {missing.join(" · ")}
            </div>
          ) : null;
        })()}
        <Nav
          onNext={handleSignup}
          nextLabel={linkedinBusy ? "Importing…" : resumeFile ? "Create account & import resume" : linkedinUrl.trim() ? "Create account & import LinkedIn" : "Create account & continue"}
          busy={busy || linkedinBusy}
          nextDisabled={
            (!su.username && !linkedinUrl.trim() && !resumeFile) ||
            !su.email ||
            su.password.length < 8 ||
            su.phone.replace(/\D/g, "").length < 10
          }
        />
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
          Paste your LinkedIn profile URL — we'll fill everything automatically. Review and edit, then move forward.
        </p>
        {err && <Err msg={err} />}

        {/* LinkedIn URL import */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Link2 size={15} color={C.accentText} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              style={{ ...inp, paddingLeft: 32 }}
              type="url"
              placeholder="https://linkedin.com/in/yourname"
              value={linkedinUrl}
              onChange={e => { setLinkedinUrl(e.target.value); setLinkedinImported(false); }}
              disabled={linkedinBusy}
            />
          </div>
          <button
            onClick={handleLinkedInImport}
            disabled={linkedinBusy || !linkedinUrl.trim()}
            style={{ ...btn(true), whiteSpace: "nowrap", opacity: (linkedinBusy || !linkedinUrl.trim()) ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6, padding: "10px 16px" }}
          >
            {linkedinBusy ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {linkedinBusy ? `Importing… ${importTimer}s` : "Auto-fill"}
          </button>
        </div>

        {linkedinImported && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(61,190,130,0.08)", border: "1px solid #3DBE8244", borderRadius: 9, padding: "9px 12px", marginBottom: 16 }}>
            <Check size={14} color={C.green} />
            <span style={{ color: C.green, fontSize: "0.82rem", fontWeight: 500 }}>Imported from LinkedIn — review your details below</span>
          </div>
        )}

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
          <Field label="Companies / institutes (comma separated)"><input style={inp} value={f.topCompanies} onChange={e => set("topCompanies", e.target.value)} placeholder="Amazon, IIM Ahmedabad" /></Field>
        </div>
        <div style={{ marginTop: 14 }}>
          <span style={{ fontSize: "0.74rem", fontWeight: 600, color: C.textSub, marginBottom: 8, display: "block", letterSpacing: "0.02em" }}>
            TOP SKILLS {importedSkills.length > 0 ? `— tap to remove` : ""}
          </span>
          {importedSkills.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {importedSkills.map(skill => {
                const selected = f.expertise.includes(skill);
                return (
                  <button key={skill} type="button"
                    onClick={() => set("expertise", selected ? f.expertise.filter(s => s !== skill) : [...f.expertise, skill])}
                    style={{ background: selected ? C.accentSoft : C.active, border: `1px solid ${selected ? C.accent : C.cardBorder}`, color: selected ? C.accentText : C.textMuted, borderRadius: 999, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {selected ? "✓ " : ""}{skill}
                  </button>
                );
              })}
            </div>
          ) : (
            <input style={inp} value={Array.isArray(f.expertise) ? f.expertise.join(", ") : f.expertise}
              onChange={e => set("expertise", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              placeholder="Python, DSA, Guesstimates" />
          )}
        </div>

        <Nav onBack={user ? undefined : () => setStep(0)} onNext={() => setStep(2)} nextLabel="Next" busy={busy || linkedinBusy}
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
  background: on ? "#fff1f1" : C.active, border: `1px solid ${on ? "#e53e3e" : C.cardBorder}`,
  color: on ? "#c53030" : C.textSub, borderRadius: 999, padding: "8px 14px", fontSize: "0.85rem",
  fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
});
const Field = ({ label, children }) => (<div><span style={lbl}>{label}</span>{children}</div>);
const Err = ({ msg }) => (<div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid #f8717155", color: "#e05555", borderRadius: 9, padding: "9px 12px", fontSize: "0.82rem", marginBottom: 14 }}>{msg}</div>);

function Header({ step }) {
  const steps = [
    { label: "Account",   hint: "Basic info"      },
    { label: "Profile",   hint: "Your background" },
    { label: "Mentoring", hint: "What you teach"  },
  ];
  const total    = steps.length;         // 3
  const done     = step;                 // steps completed so far
  const left     = total - step - 1;    // steps still ahead
  const pct      = Math.round(((step) / (total - 1)) * 100);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Progress bar + "X steps left" */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.accentText, letterSpacing: "0.05em" }}>
          STEP {step + 1} OF {total}
        </span>
        {left > 0 ? (
          <span style={{ fontSize: "0.7rem", color: C.textMuted, fontWeight: 600 }}>
            {left} step{left > 1 ? "s" : ""} left
          </span>
        ) : (
          <span style={{ fontSize: "0.7rem", color: C.green, fontWeight: 700 }}>Last step 🎉</span>
        )}
      </div>

      {/* Thin progress bar */}
      <div style={{ height: 4, borderRadius: 99, background: C.cardBorder, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, background: C.accent, width: `${pct}%`, transition: "width 0.4s ease" }} />
      </div>

      {/* Step circles */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {steps.map((s, i) => {
          const isDone    = i < step;
          const isCurrent = i === step;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
              {/* Circle */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0,
                  background: isDone ? C.green : isCurrent ? C.accent : C.active,
                  border: `2px solid ${isDone ? C.green : isCurrent ? C.accent : C.cardBorder}`,
                  color: isDone || isCurrent ? "#fff" : C.textMuted,
                  transition: "all 0.3s",
                }}>
                  {isDone ? <Check size={13} /> : i + 1}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: isCurrent ? C.accentText : isDone ? C.green : C.textMuted, whiteSpace: "nowrap" }}>{s.label}</div>
                  {isCurrent && <div style={{ fontSize: "0.58rem", color: C.textMuted, whiteSpace: "nowrap" }}>{s.hint}</div>}
                </div>
              </div>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < step ? C.green : C.cardBorder, margin: "0 6px", marginBottom: 20, transition: "background 0.3s" }} />
              )}
            </div>
          );
        })}
      </div>
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
