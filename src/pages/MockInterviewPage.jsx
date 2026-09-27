import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, Upload, ArrowRight, Loader2, FileText, Building2, Play, Briefcase, Video, MessageSquareText, Search, TrendingUp, XCircle, CircleDot, ListChecks, Lightbulb,
  AlertTriangle, RotateCcw, CheckCircle2, Check, Gift, Target, ShieldAlert, Clock, ChevronDown, LogIn, Users, Lock, Star, Code2, Factory, Palette,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { mockInterviewAPI, reviewAPI } from "../api";
import FeedbackModal from "../components/FeedbackModal";
import { wasAsked, markAsked, RATING_WORDS } from "../lib/feedback";
import { loadRazorpay } from "../lib/checkout";
import MockInterviewRoom from "../components/mockInterview/MockInterviewRoom";

// Theme palette — maps to CSS vars defined in index.css (light + dark).
const C = {
  bg:           "var(--c-bg)",
  card:         "var(--c-card)",
  cardBorder:   "var(--c-cardBorder)",
  active:       "var(--c-active)",
  accent:       "#7567C9",
  accentSoft:   "var(--c-accentSoft)",
  accentText:   "var(--c-accentText)",
  text:         "var(--c-text)",
  textSub:      "var(--c-textSub)",
  textMuted:    "var(--c-textMuted)",
  green:        "#3DBE82",
  red:          "#F87171",
  orange:       "#FB923C",
};

const POLL_MS = 3000;
const PREP_STATUSES = ["draft", "parsing", "parsed", "planning"];
// Same minimums the backend enforces on create (routes/mockInterviewRoutes.js).
const MIN_JD_CHARS = 200;
const MIN_RESUME_CHARS = 300;

const PHASE_LABEL = { intro: "Intro", resume: "Resume deep-dive", technical: "Technical", behavioral: "Behavioral", closing: "Closing" };
// Dimension scores are 0-100; a dimension is null when the interview had no questions for it.
const DIMENSION_LABEL = {
  technicalDepth: "Technical depth", resumeCredibility: "Resume credibility", behavioral: "Behavioral",
  communication: "Communication", confidence: "Confidence",
};

function Spin({ size = 16 }) {
  return <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />;
}

const PageStyles = () => (
  <style>{`
    @keyframes miFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .mi-card { animation: miFadeUp .3s ease-out both; }
    .mi-row { transition: border-color .15s ease, background-color .15s ease; cursor:pointer; }
    .mi-row:hover { border-color:var(--c-activeBorder); }
    .mi-input { width:100%; box-sizing:border-box; background:var(--c-active); border:1px solid var(--c-cardBorder); border-radius:10px; padding:9px 12px; color:var(--c-text); font-size:.82rem; outline:none; font-family:inherit; transition:border-color .15s, box-shadow .15s; }
    .mi-input:focus { border-color:#7567C9; box-shadow:0 0 0 3px #7567C926; }
    .mi-input::placeholder { color:var(--c-textMuted); }
    .mi-btn { transition: filter .15s ease, background-color .15s ease; }
    .mi-btn:hover:not(:disabled) { filter:brightness(0.94); }
    .mi-btn:disabled { opacity:.55; cursor:not-allowed; }
    .mi-btn:focus-visible, .mi-seg button:focus-visible { outline:2px solid #7567C9; outline-offset:2px; }
    .mi-field { display:flex; align-items:center; gap:9px; background:var(--c-active); border:1px solid var(--c-cardBorder); border-radius:10px; padding:0 12px; transition:border-color .15s, box-shadow .15s; }
    .mi-field:focus-within { border-color:#7567C9; box-shadow:0 0 0 3px #7567C926; }
    .mi-field input { flex:1; min-width:0; border:none; outline:none; background:transparent; color:var(--c-text); font-size:.88rem; font-family:inherit; padding:11px 0; }
    .mi-field input::placeholder { color:var(--c-textMuted); }
    .mi-seg { display:grid; grid-auto-flow:column; grid-auto-columns:1fr; gap:4px; padding:4px; background:var(--c-active); border:1px solid var(--c-cardBorder); border-radius:10px; }
    .mi-seg button { font-family:inherit; font-size:.8rem; font-weight:600; border:none; border-radius:7px; padding:8px 6px; cursor:pointer; background:transparent; color:var(--c-textSub); transition:background-color .12s, color .12s; }
    .mi-seg button.on { background:var(--c-card); color:var(--c-text); box-shadow:0 1px 3px rgba(20,16,40,.12); }
    /* Start screen: form + side column; one column on narrow screens */
    .mi-start { display:grid; grid-template-columns:minmax(0,1.5fr) minmax(0,1fr); gap:20px; align-items:start; }
    .mi-start > aside { display:flex; flex-direction:column; gap:16px; position:sticky; top:12px; }
    @media (max-width: 980px) { .mi-start { grid-template-columns:minmax(0,1fr); } .mi-start > aside { position:static; } }
    .mi-start > * { min-width:0; }
    .mi-start > .mi-main { display:flex; flex-direction:column; gap:16px; }
    /* Example report: in the side column on wide screens, above the form on narrow ones */
    .mi-narrow-only { display:none; }
    @media (max-width: 980px) { .mi-narrow-only { display:block; } .mi-wide-only { display:none; } }
    .mi-steps { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    /* Report: main column (summary, answers) + side column (prep plan, progress, retake) */
    .mi-report { display:grid; grid-template-columns:minmax(0,1.65fr) minmax(0,1fr); gap:20px; align-items:start; }
    .mi-report > * { min-width:0; display:flex; flex-direction:column; gap:16px; }
    .mi-report > aside { position:sticky; top:12px; }
    @media (max-width: 980px) { .mi-report { grid-template-columns:minmax(0,1fr); } .mi-report > aside { position:static; } }
    .mi-score { display:grid; grid-template-columns:auto minmax(0,1fr); gap:28px; align-items:center; }
    @media (max-width: 640px) { .mi-score { grid-template-columns:minmax(0,1fr); gap:18px; justify-items:center; } .mi-score > .mi-dims { width:100%; } }
    @keyframes miSlide { 0% { transform:translateX(-100%) } 100% { transform:translateX(250%) } }
    .mi-indet { position:relative; height:6px; border-radius:3px; background:var(--c-active); overflow:hidden; }
    .mi-indet::after { content:""; position:absolute; inset:0 auto 0 0; width:40%; border-radius:3px; background:#7567C9; animation:miSlide 1.4s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .mi-indet::after { animation:none; width:100%; opacity:.5; } }
    .mi-ready { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:9px; border:1px solid var(--c-cardBorder); background:var(--c-card); cursor:pointer; font-size:.84rem; color:var(--c-textSub); transition:border-color .12s, background-color .12s; }
    .mi-ready:hover { border-color:var(--c-activeBorder); }
    .mi-ready.on { border-color:#3DBE8266; background:#3DBE820f; color:var(--c-text); }
    .mi-ready input { position:absolute; opacity:0; width:1px; height:1px; }
    .mi-ready:focus-within { outline:2px solid #7567C9; outline-offset:2px; }
    .mi-tab { font-family:inherit; font-size:.8rem; font-weight:600; border-radius:999px; padding:6px 12px; cursor:pointer; border:1px solid var(--c-cardBorder); background:var(--c-card); color:var(--c-textSub); }
    .mi-tab.on { background:var(--c-accentSoft); border-color:#7567C9; color:var(--c-accentText); }
    @media (max-width: 720px) { .mi-steps { grid-template-columns:1fr; } }
  `}</style>
);

const card = { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 18 };

function Button({ children, onClick, disabled, variant = "primary", style }) {
  const primary = variant === "primary";
  return (
    <button className="mi-btn" onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8,
      border: primary ? "none" : `1px solid ${C.cardBorder}`, background: primary ? C.accent : C.active,
      color: primary ? "#fff" : C.text, fontWeight: 600, fontSize: ".82rem", cursor: "pointer", fontFamily: "inherit", ...style,
    }}>{children}</button>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", borderRadius: 10, background: "#F8717118", color: C.red, fontSize: ".8rem", marginTop: 12 }}>
      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {message}
    </div>
  );
}

function scoreColor(score, max = 5) {
  const r = score / max;
  return r >= 0.7 ? C.green : r >= 0.45 ? C.orange : C.red;
}

// ─── Start screen pieces ─────────────────────────────────────────────────────
// Same deterministic company colour as the Jobs and Profile pages.
const COMPANY_HUES = ["#7567C9", "#3DBE82", "#FB923C", "#3B82F6", "#EC4899", "#F59E0B", "#14B8A6"];
function companyHue(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COMPANY_HUES[Math.abs(hash) % COMPANY_HUES.length];
}

function CompanyTile({ name, size = 40 }) {
  const hue = companyHue(name);
  return (
    <div aria-hidden="true" style={{ width: size, height: size, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${hue}1f`, border: `1px solid ${hue}44`, color: hue, fontWeight: 700, fontSize: size * 0.42, textTransform: "uppercase" }}>
      {name?.[0] || "?"}
    </div>
  );
}

function Hero() {
  const facts = [
    { Icon: Video, text: "Live video round" },
    { Icon: Clock, text: "About 30 minutes" },
    { Icon: MessageSquareText, text: "Feedback on every answer" },
  ];
  return (
    <section style={{ textAlign: "center", padding: "10px 0 24px" }}>
      <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.8rem, 3.6vw, 2.5rem)", lineHeight: 1.15, color: C.text, textWrap: "balance" }}>
        Practice the interview before the real one
      </h1>
      <p style={{ margin: "10px auto 0", maxWidth: 560, fontSize: ".95rem", lineHeight: 1.55, color: C.textSub, textWrap: "balance" }}>
        An AI interviewer asks what this company would ask, digs into your projects, and pushes back when an answer is thin.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 18px", marginTop: 16 }}>
        {facts.map(({ Icon, text }) => (
          <span key={text} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".84rem", color: C.textSub }}>
            <Icon size={15} color={C.accentText} /> {text}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────
const HOW_STEPS = [
  { title: "Add the JD and your resume", body: "Questions come from the JD, your own projects, and what seniors were asked at this company." },
  { title: "Take the interview on video", body: "Camera on, answers out loud. Thin or vague answers get follow-up questions." },
  { title: "Read your report", body: "A score out of 100, feedback on each answer, and what to prepare next." },
];

function HowItWorks() {
  return (
    <ol className="mi-steps" style={{ listStyle: "none", margin: "0 0 22px", padding: 0 }}>
      {HOW_STEPS.map((s, i) => (
        <li key={s.title} style={{ display: "flex", gap: 12, padding: "14px 16px", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12 }}>
          <span style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.accentSoft, color: C.accentText, fontWeight: 700, fontSize: ".86rem" }}>{i + 1}</span>
          <div>
            <div style={{ fontSize: ".88rem", fontWeight: 700, color: C.text }}>{s.title}</div>
            <div style={{ fontSize: ".78rem", color: C.textSub, marginTop: 3, lineHeight: 1.45 }}>{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

// Illustrative only — clearly labelled as an example, never the user's own numbers.
const SAMPLE_DIMENSIONS = [
  { label: "Technical depth", value: 68 },
  { label: "Communication", value: 81 },
  { label: "Resume credibility", value: 74 },
  { label: "Behavioral", value: 62 },
];

function SampleReport() {
  return (
    <div style={{ ...card, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: ".9rem", fontWeight: 700, color: C.text }}>What your report looks like</div>
        <span style={{ fontSize: ".66rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.textMuted, border: `1px solid ${C.cardBorder}`, borderRadius: 4, padding: "2px 6px" }}>Example</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", lineHeight: 1, color: C.orange }}>72</div>
          <div style={{ fontSize: ".7rem", color: C.textMuted, marginTop: 4 }}>out of 100</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {SAMPLE_DIMENSIONS.map(d => (
            <div key={d.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem", color: C.textSub, marginBottom: 3 }}>
                <span>{d.label}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{d.value}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: C.active, overflow: "hidden" }}>
                <div style={{ width: `${d.value}%`, height: "100%", background: scoreColor(d.value, 100) }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 14, padding: "10px 12px", background: C.active, borderRadius: 8, fontSize: ".78rem", color: C.textSub, lineHeight: 1.5 }}>
        <b style={{ color: C.text }}>On your caching project:</b> you named Redis but not why you picked it over an in-memory map. Lead with the trade-off.
      </div>
    </div>
  );
}

// "Practice" on a job card (JobsPage) leaves the job here so the form opens pre-filled.
// Read once and cleared, so a later visit starts blank.
const MI_PREFILL_KEY = "atyant_mi_prefill";   // also written by JobsPage
function takePrefill() {
  try {
    const raw = sessionStorage.getItem(MI_PREFILL_KEY);
    if (!raw) return {};
    sessionStorage.removeItem(MI_PREFILL_KEY);
    return JSON.parse(raw) || {};
  } catch { return {}; }
}

// ─── Interview category ──────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "tech",      label: "Tech",      Icon: Code2 },
  { id: "analytics", label: "Analytics", Icon: TrendingUp },
  { id: "core",      label: "Core",      Icon: Factory },
  { id: "business",  label: "Business",  Icon: Briefcase },
  { id: "product",   label: "Product",   Icon: Palette },
  { id: "hr",        label: "HR",        Icon: Users },
];

// Best-effort guess from company + role text, so the picker starts on a
// sensible default; the user can always override it.
function detectCategory(company, role) {
  const t = `${company} ${role}`.toLowerCase();
  if (/\b(sde|software|developer|engineer|frontend|backend|full[\s-]?stack|devops|qa|sdet)\b/.test(t)) return "tech";
  if (/\b(data|analyst|analytics|business intelligence|\bbi\b|ml|machine learning)\b/.test(t)) return "analytics";
  if (/\b(mechanical|civil|electrical|metallurg|manufactur|core|production|chemical eng)\b/.test(t)) return "core";
  if (/\b(product manager|\bpm\b|product owner)\b/.test(t)) return "product";
  if (/\b(hr|human resource|recruiter|talent)\b/.test(t)) return "hr";
  if (/\b(consult|strategy|operations|business analyst|mba)\b/.test(t)) return "business";
  return null;
}

// ─── New interview form ──────────────────────────────────────────────────────
function NewInterviewForm({ onCreated }) {
  const [prefill] = useState(takePrefill);
  const [company, setCompany] = useState(prefill.company || "");
  const [role, setRole] = useState(prefill.role || "");
  const [category, setCategory] = useState(() => detectCategory(prefill.company || "", prefill.role || ""));
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [jdText, setJdText] = useState(prefill.jdText || "");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const { user } = useAuth();
  const hasProfileResume = !!user?.resumeUrl;
  // "profile" = the resume already on the student's profile; "upload" = pick a PDF; "paste" = paste text.
  // Until the student picks one, the profile resume is the default whenever they have one
  // (the profile can finish loading after this form mounts, so the default is derived, not stored).
  const [chosenMode, setResumeMode] = useState(null);
  const resumeMode = chosenMode ?? (hasProfileResume ? "profile" : "upload");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") { setError("Only PDF files are accepted."); return; }
    setError("");
    setResumeFile(file);
  };

  useEffect(() => {
    if (categoryTouched) return;
    setCategory(detectCategory(company, role));
  }, [company, role, categoryTouched]);

  const jdShort = jdText.trim().length < MIN_JD_CHARS;
  const resumeShort = resumeText.trim().length < MIN_RESUME_CHARS;
  const hasResume = resumeMode === "paste" ? !resumeShort : resumeMode === "upload" ? !!resumeFile : hasProfileResume;
  const canSubmit = company.trim() && !jdShort && hasResume && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await mockInterviewAPI.create({
        company: company.trim(), role: role.trim(), jdText: jdText.trim(),
        resumeFile: resumeMode === "upload" ? resumeFile : null,
        resumeText: resumeMode === "paste" ? resumeText.trim() : "",
        useProfileResume: resumeMode === "profile",
        interviewCategory: category,
      });
      onCreated(res.id);
    } catch (err) {
      setError(err.message || "Could not create interview");
    } finally {
      setSubmitting(false);
    }
  };

  const label = { fontSize: ".78rem", fontWeight: 700, color: C.text, marginBottom: 7, display: "block" };
  const jdLen = jdText.trim().length;
  const resumeOptions = [
    ...(hasProfileResume ? [{ id: "profile", text: "My profile resume" }] : []),
    { id: "upload", text: hasProfileResume ? "Upload another" : "Upload PDF" },
    { id: "paste", text: "Paste text" },
  ];

  return (
    <div className="mi-card" style={{ ...card, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: C.text }}>Set up your interview</h2>
          <div style={{ fontSize: ".82rem", color: C.textSub, marginTop: 4 }}>It takes about a minute to build once you submit.</div>
        </div>
      </div>

      {prefill.company && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 16, borderRadius: 10, background: C.accentSoft, border: `1px solid ${C.accent}44` }}>
          <CompanyTile name={prefill.company} size={30} />
          <div style={{ fontSize: ".8rem", color: C.text, lineHeight: 1.4 }}>
            Filled in from <b>{prefill.role || "the job"}</b> at <b>{prefill.company}</b> on Jobs. Check it and pick a resume.
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={label} htmlFor="mi-company">Company</label>
          <div className="mi-field">
            <Building2 size={16} color={C.textMuted} />
            <input id="mi-company" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Razorpay" />
          </div>
        </div>
        <div>
          <label style={label} htmlFor="mi-role">Role <span style={{ fontWeight: 500, color: C.textMuted }}>(optional)</span></label>
          <div className="mi-field">
            <Briefcase size={16} color={C.textMuted} />
            <input id="mi-role" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. SDE Intern" />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={label}>Interview focus <span style={{ fontWeight: 500, color: C.textMuted }}>(optional — we'll guess from company/role)</span></span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map(({ id, label: text, Icon }) => {
            const on = category === id;
            return (
              <button key={id} type="button" aria-pressed={on}
                onClick={() => { setCategoryTouched(true); setCategory(on ? null : id); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 999,
                  border: `1.5px solid ${on ? C.accent : C.cardBorder}`, background: on ? C.accentSoft : C.active,
                  color: on ? C.accentText : C.textSub, fontSize: ".8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                <Icon size={14} /> {text}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={label} htmlFor="mi-jd">Job description</label>
        <textarea id="mi-jd" className="mi-input" rows={8} value={jdText} onChange={e => setJdText(e.target.value)}
          placeholder="Paste the full job description: responsibilities, required skills, about the company…" style={{ resize: "vertical", fontSize: ".86rem", lineHeight: 1.55, padding: "11px 12px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 6, fontSize: ".74rem" }}>
          <span style={{ color: C.textMuted }}>The more complete the JD, the sharper the questions.</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, fontVariantNumeric: "tabular-nums", color: jdShort ? C.textMuted : C.green, fontWeight: 600 }}>
            {!jdShort && <Check size={12} />}
            {jdShort ? `${jdLen} / ${MIN_JD_CHARS} min` : `${jdLen.toLocaleString("en-IN")} characters`}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <span style={label}>Resume</span>
        <div className="mi-seg" role="radiogroup" aria-label="Resume source" style={{ marginBottom: 10 }}>
          {resumeOptions.map(opt => (
            <button key={opt.id} type="button" role="radio" aria-checked={resumeMode === opt.id} className={resumeMode === opt.id ? "on" : ""}
              onClick={() => { setResumeMode(opt.id); setError(""); }}>
              {opt.text}
            </button>
          ))}
        </div>

        {resumeMode === "profile" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: C.active, border: `1px solid ${C.cardBorder}` }}>
            <FileText size={18} color={C.accent} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: ".84rem", fontWeight: 600, color: C.text }}>Resume from your profile</div>
              <div style={{ fontSize: ".74rem", color: C.textMuted }}>The latest version you uploaded.</div>
            </div>
            <a href={user.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: ".78rem", fontWeight: 600, color: C.accentText }}>View</a>
          </div>
        )}

        {resumeMode === "paste" && (
          <>
            <textarea className="mi-input" rows={6} value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your resume text…" style={{ resize: "vertical", fontSize: ".86rem" }} />
            {resumeText.trim() && resumeShort && (
              <div style={{ fontSize: ".74rem", color: C.textMuted, marginTop: 4 }}>
                Paste your full resume: at least {MIN_RESUME_CHARS} characters ({resumeText.trim().length} so far).
              </div>
            )}
          </>
        )}

        {resumeMode === "upload" && (
          <>
            <input ref={fileRef} type="file" accept="application/pdf" onChange={onPickFile} style={{ display: "none" }} />
            <button type="button" onClick={() => fileRef.current?.click()} className="mi-btn" style={{
              width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "20px 12px",
              border: `1.5px dashed ${resumeFile ? C.accent : C.cardBorder}`, borderRadius: 10, background: C.active,
              color: resumeFile ? C.accentText : C.textSub, fontSize: ".86rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              {resumeFile
                ? <><FileText size={20} /> {resumeFile.name}<span style={{ fontSize: ".72rem", fontWeight: 500, color: C.textMuted }}>Click to change</span></>
                : <><Upload size={20} /> Upload resume PDF<span style={{ fontSize: ".72rem", fontWeight: 500, color: C.textMuted }}>PDF only</span></>}
            </button>
          </>
        )}
      </div>

      <ErrorBox message={error} />

      <button onClick={submit} disabled={!canSubmit} className="mi-btn" style={{
        width: "100%", marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "13px 18px", borderRadius: 10, border: "none", background: C.accent, color: "#fff",
        fontSize: ".95rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
      }}>
        {submitting ? <><Spin size={16} /> Building your interview…</> : <>Build my interview <ArrowRight size={17} /></>}
      </button>
      {!canSubmit && !submitting && (
        <div style={{ fontSize: ".74rem", color: C.textMuted, textAlign: "center", marginTop: 8 }}>
          {!company.trim() ? "Add the company name to continue." : jdShort ? `Paste at least ${MIN_JD_CHARS} characters of the job description.` : "Pick a resume to continue."}
        </div>
      )}
    </div>
  );
}

// ─── Past interviews list ────────────────────────────────────────────────────
const STATUS_CHIP = {
  completed: { label: "Completed", color: C.green },
  failed:    { label: "Failed", color: C.red },
  live:      { label: "In progress", color: C.orange },
  evaluating:{ label: "Scoring", color: C.orange },
  planned:   { label: "Ready", color: C.accent },
  ready:     { label: "Ready", color: C.accent },
};

function InterviewList({ interviews, onOpen }) {
  if (!interviews.length) return null;
  return (
    <div style={{ ...card, padding: "16px 18px" }}>
      <div style={{ fontSize: ".9rem", fontWeight: 700, color: C.text, marginBottom: 12 }}>Your interviews ({interviews.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {interviews.map(iv => {
          const chip = STATUS_CHIP[iv.status] || { label: "Preparing", color: C.textMuted };
          const overall = iv.overall;
          return (
            <button key={iv.id} type="button" className="mi-row" onClick={() => onOpen(iv.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "10px 12px", border: `1px solid ${C.cardBorder}`, borderRadius: 10, background: C.card, fontFamily: "inherit", cursor: "pointer", color: C.text }}>
              <CompanyTile name={iv.company || "?"} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: ".86rem", fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "capitalize" }}>
                  {iv.company || "Untitled"}
                </div>
                <div style={{ fontSize: ".74rem", color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {iv.role ? `${iv.role} · ` : ""}Attempt {iv.attempt || 1} · {new Date(iv.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                {overall != null && (
                  <span style={{ fontSize: ".95rem", fontWeight: 700, color: scoreColor(overall, 100), fontVariantNumeric: "tabular-nums" }}>{Math.round(overall)}<span style={{ fontSize: ".66rem", color: C.textMuted, fontWeight: 500 }}>/100</span></span>
                )}
                <span style={{ fontSize: ".68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 6, color: chip.color, background: `${chip.color}1f` }}>{chip.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Interview tips — shown while an interview builds and on its plan screen.
const TIPS = [
  { title: "Lead with the why", body: "Say why you picked a tool or approach before describing it. That's what follow-ups dig for." },
  { title: "Put numbers on impact", body: "Users, latency, time saved. One real number beats three adjectives." },
  { title: "Thinking out loud is fine", body: "\"Let me think for a second\" reads better than a rushed, vague answer." },
];

// ─── Waiting states (prep / evaluation) ──────────────────────────────────────
// Building has real progress we can show (status moves through these); scoring is one step.
const PREP_STEPS = [
  { status: ["draft", "parsing"], label: "Reading your JD and resume", hint: "Pulling out the skills, projects and requirements that matter." },
  { status: ["parsed", "planning"], label: "Planning your questions", hint: "Mixing JD questions, your projects, and what seniors were asked here." },
  { status: [], label: "Interview ready", hint: "You'll see the plan and can start when you're set." },
];

const SCORING_OUTPUT = [
  "A score out of 100 and one for each skill",
  "Feedback on every answer, quoting what you said",
  "Stronger sample answers",
  "What to prepare before the real one",
];

// "0:42", "3:05" — time since this screen opened.
function useElapsed() {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = Math.max(0, Math.floor((now - startedAt) / 1000));
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

function Waiting({ interview }) {
  const evaluating = interview.status === "evaluating";
  const activeIdx = Math.max(0, PREP_STEPS.findIndex(st => st.status.includes(interview.status)));
  const elapsed = useElapsed();
  const company = interview.company || "";

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="mi-card" style={{ ...card, padding: "26px 24px" }}>
        {/* Headline */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <CompanyTile name={company || "?"} size={48} />
            <span style={{ position: "absolute", right: -6, bottom: -6, width: 22, height: 22, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
              <Spin size={16} />
            </span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
              {evaluating ? "Scoring your answers" : <>Building your <span style={{ textTransform: "capitalize" }}>{company}</span> interview</>}
            </h2>
            <div style={{ fontSize: ".84rem", color: C.textSub, marginTop: 3 }}>
              {evaluating ? "Usually about a minute." : "Usually under a minute. Up to three when it's busy."}
            </div>
          </div>
          <span style={{ flexShrink: 0, fontSize: ".8rem", fontWeight: 600, color: C.textMuted, fontVariantNumeric: "tabular-nums" }} aria-label={`${elapsed} elapsed`}>
            {elapsed}
          </span>
        </div>

        {/* Progress */}
        {evaluating ? (
          <div style={{ marginTop: 22 }}>
            <div className="mi-indet" role="progressbar" aria-label="Scoring in progress" />
            <div style={{ fontSize: ".82rem", color: C.textSub, marginTop: 10 }}>Checking each answer against what a strong answer covers.</div>
          </div>
        ) : (
          <ol style={{ listStyle: "none", margin: "22px 0 0", padding: 0 }}>
            {PREP_STEPS.map((st, i) => {
              const done = i < activeIdx;
              const current = i === activeIdx;
              const last = i === PREP_STEPS.length - 1;
              return (
                <li key={st.label} style={{ display: "flex", gap: 14 }}>
                  {/* marker + connecting line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? C.green : current ? C.accentSoft : C.active,
                      border: current ? `2px solid ${C.accent}` : "none",
                      color: done ? "#fff" : current ? C.accentText : C.textMuted,
                    }}>
                      {done ? <Check size={14} strokeWidth={3} /> : current ? <Spin size={13} /> : <span style={{ fontSize: ".72rem", fontWeight: 700 }}>{i + 1}</span>}
                    </span>
                    {!last && <span style={{ width: 2, flex: 1, minHeight: 18, background: done ? C.green : C.cardBorder, margin: "4px 0" }} />}
                  </div>
                  <div style={{ paddingBottom: last ? 0 : 16, paddingTop: 3 }}>
                    <div style={{ fontSize: ".9rem", fontWeight: current ? 700 : 600, color: done || current ? C.text : C.textMuted }}>{st.label}</div>
                    {(current || done) && <div style={{ fontSize: ".8rem", color: C.textSub, marginTop: 2, lineHeight: 1.45 }}>{st.hint}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20, padding: "10px 12px", borderRadius: 8, background: C.active, fontSize: ".8rem", color: C.textSub }}>
          <CheckCircle2 size={15} color={C.green} style={{ flexShrink: 0 }} />
          You can leave this page. It keeps going, and it'll be here when you come back.
        </div>
      </div>

      {/* Something useful to read meanwhile */}
      {evaluating ? (
        <div className="mi-card" style={{ ...card, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".9rem", fontWeight: 700, color: C.text, marginBottom: 10 }}>
            <ListChecks size={16} color={C.accentText} /> What your report will show
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
            {SCORING_OUTPUT.map(x => (
              <li key={x} style={{ display: "flex", gap: 7, fontSize: ".84rem", color: C.textSub, lineHeight: 1.4 }}>
                <Check size={14} color={C.green} strokeWidth={3} style={{ flexShrink: 0, marginTop: 2 }} /> {x}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mi-card" style={{ ...card, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".9rem", fontWeight: 700, color: C.text, marginBottom: 12 }}>
            <Lightbulb size={16} color={C.accentText} /> While you wait
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
            {TIPS.map(t => (
              <div key={t.title}>
                <div style={{ fontSize: ".84rem", fontWeight: 700, color: C.text }}>{t.title}</div>
                <div style={{ fontSize: ".8rem", color: C.textSub, marginTop: 3, lineHeight: 1.5 }}>{t.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Failed({ interview, onRetry, onBack, busy }) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="mi-card" style={{ ...card, padding: "28px 24px", textAlign: "center" }}>
        <span style={{ width: 52, height: 52, borderRadius: 12, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: `${C.red}18`, color: C.red }}>
          <AlertTriangle size={24} />
        </span>
        <h2 style={{ margin: "14px 0 6px", fontSize: "1.15rem", fontWeight: 700, color: C.text }}>We couldn't build this interview</h2>
        <div style={{ fontSize: ".86rem", color: C.textSub, maxWidth: 440, margin: "0 auto", lineHeight: 1.5 }}>
          {interview.error || "Something went wrong while preparing it."}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          {interview.canRetryPrep && (
            <Button onClick={onRetry} disabled={busy} style={{ padding: "11px 18px", fontSize: ".88rem" }}>
              {busy ? <Spin size={15} /> : <RotateCcw size={15} />} Try again
            </Button>
          )}
          {onBack && (
            <Button variant="secondary" onClick={onBack} style={{ padding: "11px 18px", fontSize: ".88rem" }}>
              Back to your interviews
            </Button>
          )}
        </div>
        {!interview.canRetryPrep && <div style={{ fontSize: ".78rem", color: C.textMuted, marginTop: 12 }}>This one can't be retried. Start a new interview from your list.</div>}
      </div>
    </div>
  );
}

// ─── Blueprint (before starting) ─────────────────────────────────────────────
// One colour per interview section, used by the plan bar and its legend.
const PHASE_COLOR = { intro: "#94A3B8", resume: "#7567C9", technical: "#3B82F6", behavioral: "#3DBE82", closing: "#F59E0B" };
const PHASE_ORDER = ["intro", "resume", "technical", "behavioral", "closing"];


function Blueprint({ interview, onStart, onPaid, busy }) {
  const { blueprint } = interview;
  const phases = Object.entries(interview.phases || {})
    .sort(([a], [b]) => (PHASE_ORDER.indexOf(a) + 99) % 99 - (PHASE_ORDER.indexOf(b) + 99) % 99);
  const totalQ = interview.questionCount || phases.reduce((n, [, c]) => n + c, 0);
  const bankCount = blueprint?.bankHits || 0;

  return (
    <div className="mi-report">
      {/* ── Main: the plan ── */}
      <div>
        <div className="mi-card" style={{ ...card, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: C.text }}>Your interview plan</h2>
            <span style={{ fontSize: ".84rem", color: C.textSub }}>
              <b style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>{totalQ}</b> questions · about 30 min
            </span>
          </div>
          {blueprint?.coverageNote && <p style={{ margin: "8px 0 0", fontSize: ".86rem", color: C.textSub, lineHeight: 1.55 }}>{blueprint.coverageNote}</p>}

          {phases.length > 0 && totalQ > 0 && (
            <>
              <div style={{ display: "flex", gap: 3, height: 12, borderRadius: 6, overflow: "hidden", marginTop: 16 }} aria-hidden="true">
                {phases.map(([phase, n]) => (
                  <div key={phase} style={{ flex: n, background: PHASE_COLOR[phase] || C.accent }} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", marginTop: 12 }}>
                {phases.map(([phase, n]) => (
                  <span key={phase} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: ".82rem", color: C.textSub }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: PHASE_COLOR[phase] || C.accent }} />
                    {PHASE_LABEL[phase] || phase} <b style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>{n}</b>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {bankCount > 0 && (
          <div className="mi-card" style={{ ...card, padding: "14px 18px", display: "flex", gap: 12, alignItems: "center", background: C.accentSoft, border: `1px solid ${C.accent}44` }}>
            <span style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.accent, color: "#fff" }}><Users size={18} /></span>
            <div style={{ fontSize: ".86rem", color: C.text, lineHeight: 1.5 }}>
              <b>{bankCount} question{bankCount > 1 ? "s" : ""}</b> come from real <span style={{ textTransform: "capitalize" }}>{interview.company}</span> interviews that seniors reported.
              <span style={{ color: C.textSub }}> Your report marks which ones.</span>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <div className="mi-card" style={{ ...card, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".9rem", fontWeight: 700, color: C.green, marginBottom: 12 }}>
              <Target size={16} /> Your strengths for this JD
            </div>
            {blueprint?.strengths?.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {blueprint.strengths.map(x => (
                  <span key={x} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: ".78rem", padding: "4px 9px", borderRadius: 6, background: `${C.green}18`, color: C.green, fontWeight: 600 }}>
                    <Check size={12} strokeWidth={3} /> {x}
                  </span>
                ))}
              </div>
            ) : <div style={{ fontSize: ".82rem", color: C.textMuted }}>No direct skill matches with this JD.</div>}
          </div>

          <div className="mi-card" style={{ ...card, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".9rem", fontWeight: 700, color: C.orange, marginBottom: 12 }}>
              <ShieldAlert size={16} /> Expect to be pushed on
            </div>
            {blueprint?.weakSpots?.length ? (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {blueprint.weakSpots.map(w => (
                  <li key={w} style={{ display: "flex", gap: 8, fontSize: ".84rem", color: C.text, lineHeight: 1.45 }}>
                    <AlertTriangle size={14} color={C.orange} style={{ flexShrink: 0, marginTop: 3 }} /> {w}
                  </li>
                ))}
              </ul>
            ) : <div style={{ fontSize: ".82rem", color: C.textMuted }}>Nothing stood out. Expect general follow-ups.</div>}
          </div>
        </div>

        <div className="mi-card" style={{ ...card, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".9rem", fontWeight: 700, color: C.text, marginBottom: 12 }}>
            <Lightbulb size={16} color={C.accentText} /> How to do well
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
            {TIPS.map(t => (
              <div key={t.title}>
                <div style={{ fontSize: ".84rem", fontWeight: 700, color: C.text }}>{t.title}</div>
                <div style={{ fontSize: ".8rem", color: C.textSub, marginTop: 3, lineHeight: 1.5 }}>{t.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Side: get ready + start ── */}
      <aside>
        <ReadyCheck interview={interview} onStart={onStart} onPaid={onPaid} busy={busy} />
      </aside>
    </div>
  );
}

// One purchasable plan. Selectable when onSelect is given; otherwise it is shown as the only plan.
function PlanCard({ selected, onSelect, tag, title, price, features, note }) {
  const selectable = !!onSelect;
  return (
    <div
      onClick={onSelect}
      role={selectable ? "radio" : undefined}
      aria-checked={selectable ? selected : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={selectable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } } : undefined}
      className={selectable ? "mi-row" : undefined}
      style={{
        position: "relative", padding: "14px 14px 12px", borderRadius: 10, textAlign: "left",
        cursor: selectable ? "pointer" : "default", fontFamily: "inherit",
        background: selected ? C.accentSoft : C.card,
        border: `${selected ? 2 : 1}px solid ${selected ? C.accent : C.cardBorder}`,
        transition: "border-color .15s, background .15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          {selectable && (
            <span style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${selected ? C.accent : C.cardBorder}`, background: selected ? C.accent : "transparent",
            }}>{selected && <Check size={11} color="#fff" strokeWidth={3} />}</span>
          )}
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: ".88rem", fontWeight: 700, color: C.text }}>{title}</span>
            {tag && <span style={{ display: "inline-block", marginTop: 3, fontSize: ".64rem", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: C.accent, borderRadius: 4, padding: "2px 6px" }}>{tag}</span>}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 1, color: C.text, flexShrink: 0 }}>
          <span style={{ fontSize: ".9rem", fontWeight: 600 }}>₹</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{price}</span>
        </div>
      </div>
      <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {features.map(f => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: ".78rem", color: C.textSub, lineHeight: 1.4 }}>
            <Check size={13} color={C.green} strokeWidth={3} style={{ flexShrink: 0, marginTop: 2 }} />
            {f}
          </li>
        ))}
      </ul>
      {note && <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${C.cardBorder}`, fontSize: ".74rem", color: C.textMuted }}>{note}</div>}
    </div>
  );
}

// Treat it like the real room: the student confirms each item before starting.
const READY_ITEMS = [
  { text: "My camera and mic are on and working", Icon: Video },
  { text: "I'm in a quiet room with decent lighting", Icon: Lightbulb },
  { text: "I'm dressed the way I would be for the real interview", Icon: Users },
  { text: "I have about 30 minutes without interruptions", Icon: Clock },
];

function ReadyCheck({ interview, onStart, onPaid, busy }) {
  const { user } = useAuth();
  const pricing = interview.pricing || {};
  const rejoin = interview.status === "live";
  const alreadyPaid = rejoin || !!pricing.entryPaid;
  const [checked, setChecked] = useState(() => READY_ITEMS.map(() => alreadyPaid));
  // First interview only: "interview" (₹99, score preview) or "bundle" (₹149, includes the full report).
  const [plan, setPlan] = useState("interview");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const ready = checked.every(Boolean);
  const readyCount = checked.filter(Boolean).length;
  const amount = plan === "bundle" && pricing.bundle ? pricing.bundle : pricing.interview;
  const freeStart = !!pricing.free && !alreadyPaid;

  const payAndStart = async () => {
    setPaying(true);
    setPayError("");
    try {
      const order = await mockInterviewAPI.checkout(interview.id, plan === "bundle" && !!pricing.bundle);
      if (order.paid) { onPaid(true); onStart(); return; }
      if (!(await loadRazorpay())) throw new Error("Could not load the payment gateway. Check your connection.");
      const rzp = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, name: "Atyant",
        description: order.description, order_id: order.orderId,
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme: { color: C.accent },
        handler: async (payment) => {
          try {
            await mockInterviewAPI.verifyCheckout(interview.id, payment);
            onPaid(order.reportIncluded);
            onStart();
          } catch (err) {
            setPayError(err.message || "Payment received but could not be confirmed. Refresh in a minute.");
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on("payment.failed", (resp) => { setPayError(resp?.error?.description || "Payment failed"); setPaying(false); });
      rzp.open();
    } catch (err) {
      setPayError(err.message || "Could not start checkout");
      setPaying(false);
    }
  };

  const startLabel = rejoin ? "Rejoin interview" : alreadyPaid ? "Start interview" : freeStart ? "Start interview (free)" : `Pay ₹${amount ?? ""} and start`;

  return (
    <div className="mi-card" style={{ ...card, padding: "18px 18px 16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 700, color: C.text }}>
          {rejoin ? "Your interview is still running" : "Before you start"}
        </h2>
        {!rejoin && (
          <span style={{ fontSize: ".76rem", fontWeight: 700, color: ready ? C.green : C.textMuted, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {readyCount} of {READY_ITEMS.length} ready
          </span>
        )}
      </div>
      <div style={{ fontSize: ".82rem", color: C.textSub, margin: "6px 0 14px", lineHeight: 1.5 }}>
        {rejoin
          ? "Rejoin to continue where you left off. The interviewer waits a few minutes for you."
          : "It's a live video round: camera on, answers out loud, no pausing. Thin answers get follow-ups, so be specific."}
      </div>

      {!rejoin && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
          {READY_ITEMS.map((item, i) => (
            <label key={item.text} className={`mi-ready${checked[i] ? " on" : ""}`} style={{ position: "relative" }}>
              <input type="checkbox" checked={checked[i]} onChange={() => setChecked(c => c.map((v, j) => (j === i ? !v : v)))} />
              <span style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${checked[i] ? C.green : C.cardBorder}`, background: checked[i] ? C.green : "transparent" }}>
                {checked[i] && <Check size={12} color="#fff" strokeWidth={3} />}
              </span>
              <item.Icon size={15} color={checked[i] ? C.green : C.textMuted} style={{ flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>{item.text}</span>
            </label>
          ))}
        </div>
      )}

      {freeStart && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, marginBottom: 14, background: `${C.green}14`, border: `1px solid ${C.green}55` }}>
          <Gift size={20} color={C.green} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: ".86rem", fontWeight: 700, color: C.text }}>This interview is free for your account</div>
            <div style={{ fontSize: ".76rem", color: C.textMuted, marginTop: 2 }}>No payment needed. The full report is included.</div>
          </div>
        </div>
      )}

      {!alreadyPaid && !freeStart && pricing.interview && (
        <div style={{ marginBottom: 14 }}>
          {pricing.includesReport ? (
            // First interview: one plan, the full report is included.
            <PlanCard
              selected
              tag="Your first interview"
              title="Interview + full report"
              price={pricing.interview}
              note={<><b style={{ color: C.green }}>Full report free</b> on your first interview (worth ₹{pricing.report})</>}
              features={[
                "Live video interview with real follow-ups",
                "Score and dimension breakdown",
                "Feedback on every answer, with your own words quoted",
                "Stronger sample answers and a personal prep plan",
              ]}
            />
          ) : (
            <div role="radiogroup" aria-label="Choose what to buy" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <PlanCard
                selected={plan === "interview"}
                onSelect={() => setPlan("interview")}
                title="Interview"
                price={pricing.interview}
                features={[
                  "Live video interview with real follow-ups",
                  "Score and dimension breakdown",
                ]}
                note={`Add the full report later for ₹${pricing.report}`}
              />
              <PlanCard
                selected={plan === "bundle"}
                onSelect={() => setPlan("bundle")}
                tag="Everything included"
                title="Interview + full report"
                price={pricing.bundle}
                features={[
                  "Live video interview with real follow-ups",
                  "Score and dimension breakdown",
                  "Feedback on every answer, with your own words quoted",
                  "Stronger sample answers and a personal prep plan",
                ]}
              />
            </div>
          )}
        </div>
      )}

      <ErrorBox message={payError} />
      <button onClick={alreadyPaid ? onStart : payAndStart} disabled={busy || paying || !ready} className="mi-btn"
        style={{ width: "100%", marginTop: payError ? 12 : 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 16px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: ".95rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        {busy || paying ? <Spin size={16} /> : <Play size={16} />} {startLabel}
      </button>
      {!ready && !rejoin && (
        <div style={{ fontSize: ".74rem", color: C.textMuted, textAlign: "center", marginTop: 8 }}>
          Tick all {READY_ITEMS.length} to start. It's how the real room works.
        </div>
      )}
    </div>
  );
}

// ─── Report ──────────────────────────────────────────────────────────────────
// Per-point coverage in "what a strong answer covers".
const HIT_STYLE = {
  full:    { label: "Covered", color: C.green, Icon: CheckCircle2 },
  partial: { label: "Partly", color: C.orange, Icon: CircleDot },
  none:    { label: "Missed", color: C.red, Icon: XCircle },
};

function verdict(score) {
  if (score >= 70) return "Strong interview";
  if (score >= 45) return "Getting there";
  return "Needs more practice";
}

// Big overall score ring (0–100).
function ScoreRing({ value, size = 148 }) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = scoreColor(value, 100);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }} role="img" aria-label={`Score ${Math.round(value)} out of 100`}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.active} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.max(0, Math.min(100, value)) / 100)} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: size * 0.3, lineHeight: 1, color: C.text }}>{Math.round(value)}</span>
        <span style={{ fontSize: ".72rem", color: C.textMuted, marginTop: 4 }}>out of 100</span>
      </div>
    </div>
  );
}

function Delta({ value }) {
  if (value == null) return null;
  const color = value > 0 ? C.green : value < 0 ? C.red : C.textMuted;
  return <span style={{ fontSize: ".72rem", fontWeight: 700, color, marginLeft: 6, fontVariantNumeric: "tabular-nums" }}>{value > 0 ? "+" : ""}{value}</span>;
}

function SideCard({ title, Icon, children }) {
  return (
    <div className="mi-card" style={{ ...card, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".92rem", fontWeight: 700, color: C.text, marginBottom: 12 }}>
        {Icon && <Icon size={16} color={C.accentText} />} {title}
      </div>
      {children}
    </div>
  );
}

function AnswerReview({ q, index, locked }) {
  const [open, setOpen] = useState(false);
  const scored = q.score != null;
  const expandable = !locked && q.reached;
  const fromCompany = q.sourceLabel?.startsWith("Asked at") || q.sourceLabel?.startsWith("Commonly");
  const color = scored ? scoreColor(q.score) : C.textMuted;
  return (
    <div className="mi-card" style={{ ...card, padding: 0, overflow: "hidden" }}>
      <button type="button" onClick={() => expandable && setOpen(o => !o)} disabled={!expandable} aria-expanded={expandable ? open : undefined}
        style={{ display: "flex", gap: 14, alignItems: "flex-start", width: "100%", textAlign: "left", padding: "14px 16px", background: "none", border: "none", cursor: expandable ? "pointer" : "default", fontFamily: "inherit", color: C.text }}>
        <span style={{ fontSize: ".78rem", fontWeight: 700, color: C.textMuted, minWidth: 24, paddingTop: 1, fontVariantNumeric: "tabular-nums" }}>Q{index}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: ".9rem", fontWeight: 600, lineHeight: 1.45 }}>{q.question}</span>
          <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {q.phase && PHASE_LABEL[q.phase] && (
              <span style={{ fontSize: ".7rem", fontWeight: 600, color: C.textSub, background: C.active, borderRadius: 4, padding: "2px 7px" }}>{PHASE_LABEL[q.phase]}</span>
            )}
            {q.sourceLabel && (
              <span style={{ fontSize: ".7rem", fontWeight: 600, color: fromCompany ? C.accentText : C.textMuted, background: fromCompany ? C.accentSoft : "transparent", borderRadius: 4, padding: fromCompany ? "2px 7px" : "2px 0" }}>{q.sourceLabel}</span>
            )}
            {!q.reached && <span style={{ fontSize: ".7rem", color: C.textMuted, padding: "2px 0" }}>Not reached</span>}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: ".86rem", fontWeight: 700, color, background: scored ? `${color}18` : "transparent", borderRadius: 6, padding: "3px 8px", fontVariantNumeric: "tabular-nums" }}>
            {scored ? <>{q.score.toFixed(1)}<span style={{ fontSize: ".68rem", fontWeight: 500, opacity: .8 }}>/5</span></> : "–"}
          </span>
          {expandable && <ChevronDown size={17} color={C.textMuted} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />}
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px 54px", display: "flex", flexDirection: "column", gap: 14, fontSize: ".84rem", color: C.textSub, lineHeight: 1.55 }}>
          {q.whatWentWell && (
            <div style={{ background: `${C.green}10`, border: `1px solid ${C.green}33`, borderRadius: 8, padding: "10px 12px" }}>
              <b style={{ color: C.green }}>What went well. </b>{q.whatWentWell}
            </div>
          )}
          {q.feedback && <div style={{ color: C.text }}>{q.feedback}</div>}

          {q.points?.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>What a strong answer covers</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.points.map((p, i) => {
                  const st = HIT_STYLE[p.hit] || HIT_STYLE.none;
                  return (
                    <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                      <st.Icon size={16} color={st.color} style={{ flexShrink: 0, marginTop: 2 }} aria-label={st.label} />
                      <div>
                        <div style={{ color: C.text }}>{p.point}</div>
                        {p.evidence && <div style={{ color: C.textMuted, fontStyle: "italic", marginTop: 2 }}>You said: "{p.evidence}"</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {q.sampleAnswer && (
            <div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>A stronger answer</div>
              <div style={{ whiteSpace: "pre-wrap", background: C.active, borderLeft: `3px solid ${C.accent}`, borderRadius: "0 8px 8px 0", padding: "10px 14px", color: C.text }}>{q.sampleAnswer}</div>
            </div>
          )}

          {q.exchange?.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>What was said</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.exchange.map((e, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ alignSelf: "flex-start", maxWidth: "88%", background: C.active, borderRadius: "10px 10px 10px 2px", padding: "8px 12px" }}>
                      <div style={{ fontSize: ".68rem", fontWeight: 700, color: C.textMuted, marginBottom: 2 }}>{e.followUp ? "Follow-up" : "Interviewer"}</div>
                      <div style={{ color: C.text }}>{e.interviewer}</div>
                    </div>
                    <div style={{ alignSelf: "flex-end", maxWidth: "88%", background: C.accentSoft, borderRadius: "10px 10px 2px 10px", padding: "8px 12px" }}>
                      <div style={{ fontSize: ".68rem", fontWeight: 700, color: C.accentText, marginBottom: 2 }}>You</div>
                      <div style={{ color: C.text }}>{e.candidate || <i style={{ color: C.textMuted }}>No answer</i>}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Report({ interview, onRetake, busy }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [note, setNote] = useState("");
  const [answerFilter, setAnswerFilter] = useState("all"); // "all" | "work"
  // Rating for this interview: undefined = still checking, null = not rated yet.
  const [myReview, setMyReview] = useState(undefined);
  const [feedback, setFeedback] = useState(null);   // null, or { rating } while the dialog is open

  useEffect(() => {
    let cancelled = false;
    reviewAPI.mine("mock_interview", interview.id)
      .then(r => { if (!cancelled) setMyReview(r.review || null); })
      .catch(() => { if (!cancelled) setMyReview(null); });
    return () => { cancelled = true; };
  }, [interview.id]);

  // Ask once per interview, a few seconds after the report is on screen.
  const reportReady = !!data && !data.evaluating;
  useEffect(() => {
    if (!reportReady || myReview !== null || wasAsked("mock_interview", interview.id)) return;
    const t = setTimeout(() => { markAsked("mock_interview", interview.id); setFeedback({ rating: 0 }); }, 4000);
    return () => clearTimeout(t);
  }, [reportReady, myReview, interview.id]);

  const submitFeedback = async ({ rating, tags, comment }) => {
    const res = await reviewAPI.submit({ kind: "mock_interview", target: interview.id, rating, tags, comment, page: "mock-interview-report" });
    setMyReview(res.review);
  };
  const { user } = useAuth();

  const load = useCallback(() => {
    mockInterviewAPI.report(interview.id).then(setData).catch(err => setError(err.message));
  }, [interview.id]);
  useEffect(() => { load(); }, [load]);

  const unlock = async () => {
    setPaying(true);
    setError("");
    setNote("");
    try {
      const order = await mockInterviewAPI.unlock(interview.id);
      if (order.unlocked) { load(); return; }
      if (order.freeTrialPending) { setNote("Your first report is free. It unlocks automatically once scoring finishes."); return; }
      if (!(await loadRazorpay())) throw new Error("Could not load the payment gateway. Check your connection.");
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Atyant",
        description: order.description,
        order_id: order.orderId,
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme: { color: C.accent },
        handler: async (payment) => {
          try {
            await mockInterviewAPI.verifyUnlock(interview.id, payment);
            load();
          } catch (err) {
            setError(err.message || "Payment received but could not be confirmed. Refresh in a minute.");
          }
        },
      });
      rzp.on("payment.failed", (resp) => setError(resp?.error?.description || "Payment failed"));
      rzp.open();
    } catch (err) {
      setError(err.message || "Could not start checkout");
    } finally {
      setPaying(false);
    }
  };

  if (error && !data) return <ErrorBox message={error} />;
  if (!data) return <div style={{ display: "flex", justifyContent: "center", padding: 30, color: C.textMuted }}><Spin size={22} /></div>;
  if (data.evaluating) return <Waiting interview={{ ...interview, status: "evaluating" }} />;

  const r = data.report;
  const locked = data.locked;
  const overall = r.overall ?? 0;
  const progress = r.progress;
  const answers = r.questions.filter(q => q.phase !== "closing");
  const needsWork = answers.filter(q => q.score != null && q.score < 3);
  const shownAnswers = answerFilter === "work" ? needsWork : answers;

  const rateCard = myReview !== undefined && (
    <SideCard title={myReview ? "Your rating" : "Rate this interview"} Icon={Star}>
      {myReview ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map(n => <Star key={n} size={18} fill={n <= myReview.rating ? "#F59E0B" : "none"} color={n <= myReview.rating ? "#F59E0B" : C.textMuted} />)}
          </span>
          <span style={{ fontSize: ".84rem", color: C.textSub }}>{RATING_WORDS[myReview.rating]}. Thanks!</span>
        </div>
      ) : (
        <>
          <div style={{ fontSize: ".82rem", color: C.textSub, lineHeight: 1.5, marginBottom: 10 }}>Did it feel like the real thing? Tap a star.</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setFeedback({ rating: n })} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                style={{ padding: 2, border: "none", background: "none", cursor: "pointer", lineHeight: 0 }}>
                <Star size={26} strokeWidth={1.6} color={C.textMuted} />
              </button>
            ))}
          </div>
        </>
      )}
    </SideCard>
  );

  const retakeCard = (
    <SideCard title="Try it again" Icon={RotateCcw}>
      <div style={{ fontSize: ".82rem", color: C.textSub, lineHeight: 1.5, marginBottom: 12 }}>
        A retake asks new questions that go after your weakest areas, so you can see if the prep worked.
      </div>
      <Button onClick={onRetake} disabled={busy} style={{ width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: ".88rem" }}>
        {busy ? <Spin size={15} /> : <RotateCcw size={15} />} Retake interview
      </Button>
    </SideCard>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {feedback && (
        <FeedbackModal
          kind="mock_interview"
          initialRating={feedback.rating}
          subtitle={`${[(interview.company || "").replace(/\b\w/g, ch => ch.toUpperCase()), interview.role].filter(Boolean).join(" · ") || "This interview"}. Your rating helps us make the questions and the report better.`}
          onSubmit={submitFeedback}
          onClose={() => setFeedback(null)}
        />
      )}
      {/* ── Score ── */}
      <div className="mi-card" style={{ ...card, padding: "22px 24px" }}>
        <div className="mi-score">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <ScoreRing value={overall} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: ".95rem", fontWeight: 700, color: C.text }}>{verdict(overall)}</div>
              {progress?.overallDelta != null && (
                <div style={{ fontSize: ".76rem", color: C.textSub, marginTop: 2 }}>
                  <Delta value={progress.overallDelta} /> since attempt {progress.previousAttempt}
                </div>
              )}
              {r.coverage && r.coverage.reached < r.coverage.planned && (
                <div style={{ fontSize: ".74rem", color: C.orange, marginTop: 4 }}>{r.coverage.reached} of {r.coverage.planned} questions reached</div>
              )}
            </div>
          </div>
          <div className="mi-dims" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: ".78rem", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em" }}>How you did on each skill</div>
            {Object.entries(DIMENSION_LABEL).map(([key, label]) => {
              const v = r.dimensions?.[key];
              if (v == null) return null;
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".84rem", color: C.text, marginBottom: 5 }}>
                    <span>{label}</span>
                    <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{v}<Delta value={progress?.dimensionDeltas?.[key]} /></span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: C.active, overflow: "hidden" }}>
                    <div style={{ width: `${v}%`, height: "100%", borderRadius: 4, background: scoreColor(v, 100) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Locked: what unlocking gets you ── */}
      {locked && (
        <div className="mi-card" style={{ ...card, padding: "20px 22px", border: `1px solid ${C.accent}66` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.accentSoft, color: C.accentText }}><Lock size={19} /></div>
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <div style={{ fontSize: "1.02rem", fontWeight: 700, color: C.text }}>See exactly what to fix</div>
              <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                {["Summary of how it went", "Feedback on every answer", "What you missed, in your own words", "Stronger sample answers", "Your prep plan"].map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".84rem", color: C.textSub }}><Check size={14} color={C.green} strokeWidth={3} /> {f}</li>
                ))}
              </ul>
            </div>
            <Button onClick={unlock} disabled={paying} style={{ padding: "11px 18px", fontSize: ".9rem", alignSelf: "center" }}>
              {paying ? <Spin size={15} /> : <Lock size={15} />} Unlock report · ₹{data.price}
            </Button>
          </div>
          {note && <div style={{ fontSize: ".82rem", color: C.accentText, marginTop: 12 }}>{note}</div>}
          <ErrorBox message={error} />
        </div>
      )}

      <div className="mi-report">
        {/* ── Main: summary + answers ── */}
        <div>
          {!locked && r.summary && (
            <div className="mi-card" style={{ ...card, padding: "18px 20px" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: C.text, marginBottom: 8 }}>Summary</div>
              <div style={{ fontSize: ".88rem", color: C.textSub, lineHeight: 1.65 }}>{r.summary}</div>
              {(r.strengths?.length > 0 || r.improvements?.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
                  {r.strengths?.length > 0 && (
                    <div style={{ background: `${C.green}0e`, border: `1px solid ${C.green}33`, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".82rem", fontWeight: 700, color: C.green, marginBottom: 8 }}><CheckCircle2 size={15} /> Strengths</div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: ".84rem", color: C.text, lineHeight: 1.55, display: "flex", flexDirection: "column", gap: 4 }}>{r.strengths.map(x => <li key={x}>{x}</li>)}</ul>
                    </div>
                  )}
                  {r.improvements?.length > 0 && (
                    <div style={{ background: `${C.orange}0e`, border: `1px solid ${C.orange}33`, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".82rem", fontWeight: 700, color: C.orange, marginBottom: 8 }}><Target size={15} /> Improve next</div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: ".84rem", color: C.text, lineHeight: 1.55, display: "flex", flexDirection: "column", gap: 4 }}>{r.improvements.map(x => <li key={x}>{x}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: C.text }}>Answer by answer</h2>
            {!locked && needsWork.length > 0 && (
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className={`mi-tab${answerFilter === "all" ? " on" : ""}`} onClick={() => setAnswerFilter("all")}>All {answers.length}</button>
                <button type="button" className={`mi-tab${answerFilter === "work" ? " on" : ""}`} onClick={() => setAnswerFilter("work")}>Needs work {needsWork.length}</button>
              </div>
            )}
          </div>
          {locked && <div style={{ fontSize: ".8rem", color: C.textMuted, marginTop: -8 }}>Scores are shown for every question. Unlock the report to open the feedback.</div>}
          {shownAnswers.map(q => <AnswerReview key={q.qid} q={q} index={answers.indexOf(q) + 1} locked={locked} />)}
        </div>

        {/* ── Side: what next ── */}
        <aside>
          {!locked && r.prepPath?.length > 0 && (
            <SideCard title="What to prepare next" Icon={ListChecks}>
              <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {r.prepPath.map((p, i) => (
                  <li key={p.topic} style={{ display: "flex", gap: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: C.accentSoft, color: C.accentText, fontSize: ".72rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: ".86rem", fontWeight: 600, color: C.text }}>{p.topic}</div>
                      <div style={{ fontSize: ".8rem", color: C.textSub, lineHeight: 1.5, marginTop: 2 }}>{p.action}</div>
                      {p.why && <div style={{ fontSize: ".74rem", color: C.textMuted, marginTop: 3, lineHeight: 1.45 }}>{p.why}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            </SideCard>
          )}

          {!locked && progress?.retested?.length > 0 && (
            <SideCard title={`Since attempt ${progress.previousAttempt}`} Icon={TrendingUp}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {progress.retested.map((a, i) => {
                  const up = Number(a.after) > Number(a.before);
                  const down = Number(a.after) < Number(a.before);
                  return (
                    <div key={a.area} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0", borderTop: i ? `1px solid ${C.cardBorder}` : "none", fontSize: ".84rem" }}>
                      <span style={{ color: C.textSub, minWidth: 0 }}>{a.area}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, color: up ? C.green : down ? C.red : C.text, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                        <span style={{ color: C.textMuted, fontWeight: 500 }}>{a.before}</span> <ArrowRight size={13} /> {a.after}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SideCard>
          )}

          {rateCard}
          {retakeCard}
        </aside>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function MockInterviewPage({ onAuthRequired, onNavigate }) {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  // True while the full-screen interview room is open.
  const [inRoom, setInRoom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadList = useCallback(() => {
    if (!user) return;
    mockInterviewAPI.list()
      .then(res => setInterviews(res.interviews || []))
      .catch(err => setError(err.message || "Could not load your interviews"))
      .finally(() => setListLoading(false));
  }, [user]);

  useEffect(() => { loadList(); }, [loadList]);

  // Poll while the backend is preparing or scoring.
  const status = interview?.status;
  const id = interview?.id;
  useEffect(() => {
    if (!id || !(PREP_STATUSES.includes(status) || status === "evaluating")) return;
    const t = setInterval(async () => {
      try {
        const res = await mockInterviewAPI.get(id);
        setInterview(res.interview);
      } catch { /* transient — next tick retries */ }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [id, status]);

  const open = async (interviewId) => {
    setError("");
    try {
      const res = await mockInterviewAPI.get(interviewId);
      const iv = res.interview;
      setInterview(iv);
    } catch (err) {
      setError(err.message || "Could not open interview");
    }
  };

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try { await fn(); } catch (err) { setError(err.message || "Something went wrong"); } finally { setBusy(false); }
  };

  const start = () => setInRoom(true);
  // Payment confirmed: the interview may start (and, with the bundle, the report is already unlocked).
  const onPaid = (bundle = false) => setInterview(iv => ({
    ...iv,
    pricing: { ...iv.pricing, entryPaid: true, ...(bundle ? { reportUnlocked: true } : {}) },
  }));
  const retry = () => run(async () => {
    await mockInterviewAPI.prepare(interview.id);
    await open(interview.id);
  });
  const retake = () => run(async () => open((await mockInterviewAPI.retake(interview.id)).id));
  // Left early → back to the rejoin screen; ended → evaluation, then the report.
  const exitRoom = () => { setInRoom(false); open(interview.id); };

  const back = () => { setInterview(null); setInRoom(false); setError(""); loadList(); };

  // Side column on the start screen: example report, your past interviews, a way into Jobs.
  const jobsLink = onNavigate && (
    <button type="button" onClick={() => onNavigate("jobs")} className="mi-btn"
      style={{ ...card, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", color: C.text }}>
      <span style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.accentSoft, color: C.accentText }}><Search size={17} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: ".86rem", fontWeight: 700 }}>Practicing for a real opening?</span>
        <span style={{ display: "block", fontSize: ".76rem", color: C.textSub, marginTop: 2 }}>Find it on Jobs and tap Practice. We fill this in for you.</span>
      </span>
      <ArrowRight size={16} color={C.textMuted} />
    </button>
  );

  let body;
  if (!user) {
    body = (
      <div className="mi-start">
        <div className="mi-main">
        <div className="mi-narrow-only"><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><SampleReport />{jobsLink}</div></div>
        <div className="mi-card" style={{ ...card, textAlign: "center", padding: "36px 22px" }}>
          <Mic size={30} color={C.accent} style={{ display: "block", margin: "0 auto" }} />
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: "12px 0 6px" }}>Sign in to practice</div>
          <div style={{ fontSize: ".86rem", color: C.textSub, marginBottom: 18, maxWidth: 380, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
            Every interview is built from your resume, so you need an account. It takes a minute.
          </div>
          <Button onClick={onAuthRequired} style={{ padding: "11px 22px", fontSize: ".9rem" }}><LogIn size={16} /> Sign in</Button>
        </div>
        </div>
        <aside>
          <div className="mi-wide-only"><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><SampleReport />{jobsLink}</div></div>
        </aside>
      </div>
    );
  } else if (!interview) {
    body = (
      <div className="mi-start">
        <div className="mi-main">
          {/* The example report sells the interview: above the form on phones, top of the side column on desktop. */}
          <div className="mi-narrow-only"><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><SampleReport />{jobsLink}</div></div>
          <NewInterviewForm onCreated={open} />
        </div>
        <aside>
          <div className="mi-wide-only"><div style={{ display: "flex", flexDirection: "column", gap: 16 }}><SampleReport />{jobsLink}</div></div>
          {listLoading
            ? <div style={{ ...card, display: "flex", justifyContent: "center", color: C.textMuted }}><Spin size={20} /></div>
            : <InterviewList interviews={interviews} onOpen={open} />}
        </aside>
      </div>
    );
  } else if (PREP_STATUSES.includes(status) || status === "evaluating") {
    body = <Waiting interview={interview} />;
  } else if (status === "failed") {
    body = <Failed interview={interview} onRetry={retry} onBack={back} busy={busy} />;
  } else if (inRoom) {
    body = <MockInterviewRoom interviewId={interview.id} onExit={exitRoom} />;
  } else if (status === "planned" || status === "ready" || status === "live") {
    body = <Blueprint interview={interview} onStart={start} onPaid={onPaid} busy={busy} />;
  } else if (status === "completed") {
    body = <Report interview={interview} onRetake={retake} busy={busy} />;
  }

  const startScreen = !interview;

  return (
    <div style={{ background: C.bg, minHeight: "100%", padding: "20px 16px 60px" }}>
      <PageStyles />
      <div style={{ maxWidth: startScreen || (!inRoom && ["completed", "planned", "ready", "live"].includes(status)) ? 1120 : 820, margin: "0 auto" }}>
        {startScreen ? (
          <>
            <Hero />
            <HowItWorks />
          </>
        ) : (
          // Inside one interview: the company is the headline.
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={back} aria-label="Back to your interviews" className="mi-btn"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, flexShrink: 0, borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: C.card, color: C.text, cursor: "pointer", padding: 0 }}>
              <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} />
            </button>
            <CompanyTile name={interview.company || "?"} size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: ".78rem", color: C.textMuted }}>Mock interview</div>
              <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.3rem, 2.6vw, 1.7rem)", lineHeight: 1.2, color: C.text, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {interview.company || "Interview"}{interview.role ? <span style={{ color: C.textSub }}> · {interview.role}</span> : null}
              </h1>
            </div>
          </div>
        )}
        {!interview && <ErrorBox message={error} />}
        {interview && error && <div style={{ marginBottom: 12 }}><ErrorBox message={error} /></div>}
        {body}
      </div>
    </div>
  );
}
