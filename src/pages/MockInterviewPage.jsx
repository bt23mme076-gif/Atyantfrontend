import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, Upload, Loader2, FileText, Building2, Briefcase, ArrowLeft, Play,
  AlertTriangle, RotateCcw, CheckCircle2, Check, Gift, Target, ShieldAlert, Sparkles, Clock, ChevronDown, LogIn, Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { mockInterviewAPI } from "../api";
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
    .mi-row { transition: border-color .18s ease, transform .18s ease; cursor:pointer; }
    .mi-row:hover { border-color:#7567C955; transform:translateY(-1px); }
    .mi-input { width:100%; box-sizing:border-box; background:var(--c-active); border:1px solid var(--c-cardBorder); border-radius:10px; padding:9px 12px; color:var(--c-text); font-size:.82rem; outline:none; font-family:inherit; transition:border-color .15s, box-shadow .15s; }
    .mi-input:focus { border-color:#7567C9; box-shadow:0 0 0 3px #7567C926; }
    .mi-input::placeholder { color:var(--c-textMuted); }
    .mi-btn { transition: all .15s ease; }
    .mi-btn:hover:not(:disabled) { filter:brightness(0.96); transform:translateY(-1px); }
    .mi-btn:disabled { opacity:.55; cursor:not-allowed; }
  `}</style>
);

const card = { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 18 };

function Button({ children, onClick, disabled, variant = "primary", style }) {
  const primary = variant === "primary";
  return (
    <button className="mi-btn" onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10,
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

// ─── New interview form ──────────────────────────────────────────────────────
function NewInterviewForm({ onCreated }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jdText, setJdText] = useState("");
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
      });
      onCreated(res.id);
    } catch (err) {
      setError(err.message || "Could not create interview");
    } finally {
      setSubmitting(false);
    }
  };

  const label = { fontSize: ".74rem", fontWeight: 700, color: C.textSub, marginBottom: 6, display: "block" };

  return (
    <div className="mi-card" style={card}>
      <div style={{ fontSize: "1rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>Start a new mock interview</div>
      <div style={{ fontSize: ".8rem", color: C.textMuted, marginBottom: 16 }}>
        Paste the job description and add your resume. We build questions from the JD, your own projects, and questions seniors were actually asked at this company.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={label}>Company *</label>
          <input className="mi-input" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Razorpay" />
        </div>
        <div>
          <label style={label}>Role</label>
          <input className="mi-input" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. SDE Intern" />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={label}>Job description *</label>
        <textarea className="mi-input" rows={7} value={jdText} onChange={e => setJdText(e.target.value)}
          placeholder="Paste the full job description — responsibilities, required skills, about the company…" style={{ resize: "vertical" }} />
        {jdText.trim() && jdShort && (
          <div style={{ fontSize: ".72rem", color: C.textMuted, marginTop: 4 }}>
            Paste the full JD — at least {MIN_JD_CHARS} characters ({jdText.trim().length} so far).
          </div>
        )}
      </div>

      <div style={{ marginBottom: 6 }}>
        <label style={label}>Resume *</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {[
            ...(hasProfileResume ? [{ id: "profile", text: "Use my profile resume" }] : []),
            { id: "upload", text: hasProfileResume ? "Upload a different PDF" : "Upload PDF" },
            { id: "paste", text: "Paste text" },
          ].map(opt => (
            <button key={opt.id} onClick={() => { setResumeMode(opt.id); setError(""); }} className="mi-btn" style={{
              padding: "6px 12px", borderRadius: 999, fontSize: ".76rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${resumeMode === opt.id ? C.accent : C.cardBorder}`,
              background: resumeMode === opt.id ? C.accentSoft : C.active,
              color: resumeMode === opt.id ? C.accentText : C.textSub,
            }}>{opt.text}</button>
          ))}
        </div>

        {resumeMode === "profile" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: C.active, border: `1px solid ${C.cardBorder}` }}>
            <FileText size={18} color={C.accent} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: ".82rem", fontWeight: 600, color: C.text }}>Resume from your profile</div>
              <div style={{ fontSize: ".72rem", color: C.textMuted }}>We'll use the latest version you uploaded on your profile.</div>
            </div>
            <a href={user.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: ".74rem", fontWeight: 600, color: C.accentText }}>View</a>
          </div>
        )}

        {resumeMode === "paste" && (
          <>
            <textarea className="mi-input" rows={6} value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your resume text…" style={{ resize: "vertical" }} />
            {resumeText.trim() && resumeShort && (
              <div style={{ fontSize: ".72rem", color: C.textMuted, marginTop: 4 }}>
                Paste your full resume — at least {MIN_RESUME_CHARS} characters ({resumeText.trim().length} so far).
              </div>
            )}
          </>
        )}

        {resumeMode === "upload" && (
          <>
            <input ref={fileRef} type="file" accept="application/pdf" onChange={onPickFile} style={{ display: "none" }} />
            <button onClick={() => fileRef.current?.click()} className="mi-btn" style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "18px 12px",
              border: `1.5px dashed ${resumeFile ? C.accent : C.cardBorder}`, borderRadius: 12, background: C.active,
              color: resumeFile ? C.accentText : C.textSub, fontSize: ".84rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              {resumeFile ? <><FileText size={17} /> {resumeFile.name}</> : <><Upload size={17} /> Upload resume PDF</>}
            </button>
          </>
        )}
      </div>

      <ErrorBox message={error} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <Button onClick={submit} disabled={!canSubmit}>
          {submitting ? <><Spin size={15} /> Creating…</> : <><Sparkles size={15} /> Build my interview</>}
        </Button>
      </div>
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
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: ".78rem", fontWeight: 700, color: C.textSub, marginBottom: 10 }}>Your interviews</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {interviews.map(iv => {
          const chip = STATUS_CHIP[iv.status] || { label: "Preparing", color: C.textMuted };
          const overall = iv.overall;
          return (
            <div key={iv.id} className="mi-row mi-card" onClick={() => onOpen(iv.id)} style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: C.accentSoft, color: C.accentText, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Building2 size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: ".85rem", fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {iv.company || "Untitled"}{iv.role ? ` · ${iv.role}` : ""}
                </div>
                <div style={{ fontSize: ".72rem", color: C.textMuted }}>
                  Attempt {iv.attempt || 1} · {new Date(iv.createdAt).toLocaleDateString()}
                </div>
              </div>
              {overall != null && (
                <div style={{ fontSize: ".9rem", fontWeight: 800, color: scoreColor(overall, 100) }}>{Math.round(overall)}</div>
              )}
              <span style={{ fontSize: ".68rem", fontWeight: 700, padding: "3px 9px", borderRadius: 999, color: chip.color, background: `${chip.color}1f` }}>{chip.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Waiting states (prep / evaluation) ──────────────────────────────────────
const PREP_STEPS = [
  { status: ["draft", "parsing"], label: "Reading your JD and resume" },
  { status: ["parsed", "planning"], label: "Planning questions and checking them" },
];

function Waiting({ interview }) {
  const evaluating = interview.status === "evaluating";
  const activeIdx = PREP_STEPS.findIndex(s => s.status.includes(interview.status));
  return (
    <div className="mi-card" style={{ ...card, textAlign: "center", padding: "36px 20px" }}>
      <div style={{ color: C.accent, display: "flex", justifyContent: "center", marginBottom: 14 }}><Spin size={30} /></div>
      <div style={{ fontSize: "1rem", fontWeight: 700, color: C.text, marginBottom: 6 }}>
        {evaluating ? "Scoring your answers" : `Building your ${interview.company || ""} interview`}
      </div>
      <div style={{ fontSize: ".8rem", color: C.textMuted, maxWidth: 420, margin: "0 auto" }}>
        {evaluating ? "Checking each answer against what a strong answer covers." : "This usually takes under a minute, sometimes up to three when our AI provider is busy. You can leave this page — it keeps going."}
      </div>
      {!evaluating && (
        <div style={{ display: "inline-flex", flexDirection: "column", gap: 8, marginTop: 20, textAlign: "left" }}>
          {PREP_STEPS.map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".8rem", color: i <= activeIdx ? C.text : C.textMuted }}>
              {i < activeIdx ? <CheckCircle2 size={15} color={C.green} /> : i === activeIdx ? <Spin size={15} /> : <Clock size={15} />}
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Failed({ interview, onRetry, busy }) {
  return (
    <div className="mi-card" style={{ ...card, textAlign: "center", padding: "32px 20px" }}>
      <AlertTriangle size={30} color={C.red} />
      <div style={{ fontSize: "1rem", fontWeight: 700, color: C.text, margin: "10px 0 6px" }}>We couldn't build this interview</div>
      <div style={{ fontSize: ".8rem", color: C.textMuted, maxWidth: 440, margin: "0 auto 18px" }}>
        {interview.error || "Something went wrong while preparing."}
      </div>
      {interview.canRetryPrep
        ? <Button onClick={onRetry} disabled={busy}>{busy ? <Spin size={15} /> : <RotateCcw size={15} />} Try again</Button>
        : <div style={{ fontSize: ".78rem", color: C.textMuted }}>Start a new interview from the list instead.</div>}
    </div>
  );
}

// ─── Blueprint (before starting) ─────────────────────────────────────────────
function Blueprint({ interview, onStart, onPaid, busy }) {
  const { blueprint } = interview;
  const phases = Object.entries(interview.phases || {});
  const bankCount = blueprint?.bankHits || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="mi-card" style={card}>
        <div style={{ fontSize: "1.05rem", fontWeight: 800, color: C.text }}>{interview.company}{interview.role ? ` · ${interview.role}` : ""}</div>
        <div style={{ fontSize: ".8rem", color: C.textMuted, marginTop: 4 }}>{blueprint?.coverageNote}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          <span style={{ fontSize: ".74rem", fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: C.accentSoft, color: C.accentText }}>
            {interview.questionCount || 0} questions
          </span>
          {phases.map(([phase, n]) => (
            <span key={phase} style={{ fontSize: ".74rem", fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: C.active, color: C.textSub }}>
              {PHASE_LABEL[phase] || phase} · {n}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <div className="mi-card" style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".82rem", fontWeight: 700, color: C.green, marginBottom: 10 }}>
            <Target size={15} /> Your strengths for this JD
          </div>
          {blueprint?.strengths?.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {blueprint.strengths.map(s => (
                <span key={s} style={{ fontSize: ".74rem", padding: "3px 9px", borderRadius: 999, background: `${C.green}1f`, color: C.green, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          ) : <div style={{ fontSize: ".78rem", color: C.textMuted }}>No direct skill matches found.</div>}
        </div>

        <div className="mi-card" style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".82rem", fontWeight: 700, color: C.orange, marginBottom: 10 }}>
            <ShieldAlert size={15} /> Expect to be pushed on
          </div>
          {blueprint?.weakSpots?.length ? (
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
              {blueprint.weakSpots.map(w => <li key={w} style={{ fontSize: ".78rem", color: C.textSub }}>{w}</li>)}
            </ul>
          ) : <div style={{ fontSize: ".78rem", color: C.textMuted }}>Nothing stood out.</div>}
        </div>
      </div>

      {bankCount > 0 && (
        <div className="mi-card" style={{ ...card, display: "flex", gap: 10, alignItems: "center" }}>
          <Users size={17} color={C.accent} />
          <div style={{ fontSize: ".8rem", color: C.textSub }}>
            Includes <b style={{ color: C.text }}>{bankCount}</b> question{bankCount > 1 ? "s" : ""} seniors reported from real {interview.company} interviews.
            You'll see which ones in your report.
          </div>
        </div>
      )}

      <ReadyCheck interview={interview} onStart={onStart} onPaid={onPaid} busy={busy} />
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
      className={selectable ? "mi-row" : undefined}
      style={{
        position: "relative", padding: "18px 18px 16px", borderRadius: 16, textAlign: "left",
        cursor: selectable ? "pointer" : "default", fontFamily: "inherit",
        background: selected ? `linear-gradient(160deg, ${C.accentSoft}, ${C.card} 70%)` : C.card,
        border: `${selected ? 2 : 1}px solid ${selected ? C.accent : C.cardBorder}`,
        boxShadow: selected ? "0 8px 28px rgba(117,103,201,0.22)" : "none",
        transition: "border-color .15s, box-shadow .15s, background .15s",
      }}
    >
      {tag && (
        <span style={{
          position: "absolute", top: -11, right: 16, fontSize: ".66rem", fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase",
          padding: "3px 11px", borderRadius: 999, color: "#fff", background: `linear-gradient(135deg, ${C.accent}, #5a52a8)`,
        }}>{tag}</span>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {selectable && (
            <span style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${selected ? C.accent : C.cardBorder}`, background: selected ? C.accent : "transparent",
            }}>{selected && <Check size={11} color="#fff" strokeWidth={3} />}</span>
          )}
          <span style={{ fontSize: ".9rem", fontWeight: 700, color: C.text }}>{title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, color: C.text }}>
          <span style={{ fontSize: ".95rem", fontWeight: 700 }}>₹</span>
          <span style={{ fontSize: "1.9rem", fontWeight: 800, lineHeight: 1 }}>{price}</span>
        </div>
      </div>
      <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {features.map(f => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: ".78rem", color: C.textSub, lineHeight: 1.4 }}>
            <Check size={14} color={C.green} strokeWidth={3} style={{ flexShrink: 0, marginTop: 2 }} />
            {f}
          </li>
        ))}
      </ul>
      {note && <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${C.cardBorder}`, fontSize: ".74rem", color: C.textMuted }}>{note}</div>}
    </div>
  );
}

// Treat it like the real room: the student confirms each item before starting.
const READY_ITEMS = [
  "My camera and mic are on and working",
  "I'm in a quiet room with decent lighting",
  "I'm dressed the way I would be for the real interview",
  "I have about 30 minutes without interruptions",
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
  return (
    <div className="mi-card" style={card}>
      <div style={{ fontSize: ".85rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>
        {rejoin ? "Your interview is still running" : "Before you start"}
      </div>
      <div style={{ fontSize: ".78rem", color: C.textMuted, marginBottom: 12 }}>
        {rejoin
          ? "Rejoin to continue where you left off. The interviewer waits a few minutes for you."
          : "It's a live video interview: camera on, answers out loud, no pausing. The interviewer asks follow-ups when an answer is thin or off, so be specific."}
      </div>
      {!rejoin && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {READY_ITEMS.map((item, i) => (
            <label key={item} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: ".8rem", color: C.textSub, cursor: "pointer" }}>
              <input type="checkbox" checked={checked[i]} onChange={() => setChecked(c => c.map((v, j) => (j === i ? !v : v)))}
                style={{ accentColor: C.accent, width: 15, height: 15 }} />
              {item}
            </label>
          ))}
        </div>
      )}
      {freeStart && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, marginBottom: 14, background: `${C.green}14`, border: `1px solid ${C.green}55` }}>
          <Gift size={20} color={C.green} />
          <div>
            <div style={{ fontSize: ".88rem", fontWeight: 700, color: C.text }}>This interview is free for your account</div>
            <div style={{ fontSize: ".76rem", color: C.textMuted, marginTop: 2 }}>No payment needed. The full report is included.</div>
          </div>
        </div>
      )}

      {!alreadyPaid && !freeStart && pricing.interview && (
        <div style={{ marginBottom: 16 }}>
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
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
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
            </>
          )}
        </div>
      )}
      <ErrorBox message={payError} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: payError ? 10 : 0 }}>
        <Button onClick={alreadyPaid ? onStart : payAndStart} disabled={busy || paying || !ready}>
          {busy || paying ? <Spin size={15} /> : <Play size={15} />}
          {" "}{rejoin ? "Rejoin interview" : alreadyPaid ? "Start interview" : freeStart ? "Start interview (free)" : `Pay ₹${amount ?? ""} & start interview`}
        </Button>
      </div>
    </div>
  );
}

// ─── Report ──────────────────────────────────────────────────────────────────
const HIT_STYLE = {
  full:    { label: "Covered", color: C.green },
  partial: { label: "Partly", color: C.orange },
  none:    { label: "Missed", color: C.red },
};

function AnswerReview({ q, locked }) {
  const [open, setOpen] = useState(false);
  const scored = q.score != null;
  const expandable = !locked && q.reached;
  return (
    <div style={{ ...card, padding: "12px 14px" }}>
      <div onClick={() => expandable && setOpen(o => !o)} style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: expandable ? "pointer" : "default" }}>
        <div style={{ minWidth: 38, textAlign: "center", fontSize: ".9rem", fontWeight: 800, color: scored ? scoreColor(q.score) : C.textMuted }}>
          {scored ? q.score.toFixed(1) : "–"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: ".82rem", fontWeight: 600, color: C.text }}>{q.question}</div>
          <div style={{ fontSize: ".7rem", color: q.sourceLabel?.startsWith("Asked at") || q.sourceLabel?.startsWith("Commonly") ? C.accentText : C.textMuted, marginTop: 3 }}>
            {q.sourceLabel}{!q.reached ? " · not reached" : ""}
          </div>
        </div>
        {expandable && <ChevronDown size={16} color={C.textMuted} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />}
      </div>
      {open && (
        <div style={{ marginTop: 12, paddingLeft: 50, display: "flex", flexDirection: "column", gap: 12, fontSize: ".78rem", color: C.textSub }}>
          {q.whatWentWell && <div><b style={{ color: C.green }}>What went well: </b>{q.whatWentWell}</div>}
          {q.feedback && <div>{q.feedback}</div>}
          {q.points?.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>What a strong answer covers</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {q.points.map((p, i) => {
                  const s = HIT_STYLE[p.hit] || HIT_STYLE.none;
                  return (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: ".66rem", fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: `${s.color}1f`, color: s.color, flexShrink: 0 }}>{s.label}</span>
                      <div>
                        <div>{p.point}</div>
                        {p.evidence && <div style={{ color: C.textMuted, fontStyle: "italic", marginTop: 2 }}>"{p.evidence}"</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {q.sampleAnswer && (
            <div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>A stronger answer</div>
              <div style={{ whiteSpace: "pre-wrap", background: C.active, borderRadius: 10, padding: "10px 12px" }}>{q.sampleAnswer}</div>
            </div>
          )}
          {q.exchange?.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>What was said</div>
              {q.exchange.map((e, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ color: C.text }}>{e.followUp ? "Follow-up: " : "Interviewer: "}{e.interviewer}</div>
                  <div>You: {e.candidate || <i>no answer</i>}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Delta({ value }) {
  if (value == null) return null;
  const color = value > 0 ? C.green : value < 0 ? C.red : C.textMuted;
  return <span style={{ fontSize: ".72rem", fontWeight: 700, color, marginLeft: 6 }}>{value > 0 ? "+" : ""}{value}</span>;
}

function Report({ interview, onRetake, busy }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [note, setNote] = useState("");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="mi-card" style={{ ...card, display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: scoreColor(overall, 100), lineHeight: 1 }}>{Math.round(overall)}</div>
          <div style={{ fontSize: ".7rem", color: C.textMuted, marginTop: 4 }}>out of 100{progress && <Delta value={progress.overallDelta} />}</div>
          {r.coverage && r.coverage.reached < r.coverage.planned && (
            <div style={{ fontSize: ".68rem", color: C.orange, marginTop: 4 }}>{r.coverage.reached} of {r.coverage.planned} questions reached</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(DIMENSION_LABEL).map(([key, label]) => {
            const v = r.dimensions?.[key];
            if (v == null) return null;
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".74rem", color: C.textSub, marginBottom: 3 }}>
                  <span>{label}</span>
                  <span style={{ fontWeight: 700 }}>{v}<Delta value={progress?.dimensionDeltas?.[key]} /></span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: C.active, overflow: "hidden" }}>
                  <div style={{ width: `${v}%`, height: "100%", background: scoreColor(v, 100) }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {locked && (
        <div className="mi-card" style={{ ...card, borderColor: `${C.accent}66`, display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ maxWidth: 460 }}>
            <div style={{ fontSize: ".9rem", fontWeight: 700, color: C.text }}>See exactly what to fix</div>
            <div style={{ fontSize: ".78rem", color: C.textMuted, marginTop: 4 }}>
              Unlock the summary, feedback on every answer, what you missed with your own words quoted, stronger sample answers, and your prep plan.
            </div>
          </div>
          <Button onClick={unlock} disabled={paying}>{paying ? <Spin size={15} /> : <Sparkles size={15} />} Unlock report · ₹{data.price}</Button>
          {note && <div style={{ width: "100%", fontSize: ".78rem", color: C.accentText }}>{note}</div>}
          <ErrorBox message={error} />
        </div>
      )}

      {!locked && r.summary && (
        <div className="mi-card" style={card}>
          <div style={{ fontSize: ".85rem", fontWeight: 700, color: C.text, marginBottom: 8 }}>Summary</div>
          <div style={{ fontSize: ".8rem", color: C.textSub, lineHeight: 1.55 }}>{r.summary}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 14 }}>
            {r.strengths?.length > 0 && (
              <div>
                <div style={{ fontSize: ".76rem", fontWeight: 700, color: C.green, marginBottom: 6 }}>Strengths</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: ".78rem", color: C.textSub }}>{r.strengths.map(s => <li key={s}>{s}</li>)}</ul>
              </div>
            )}
            {r.improvements?.length > 0 && (
              <div>
                <div style={{ fontSize: ".76rem", fontWeight: 700, color: C.orange, marginBottom: 6 }}>Improve next</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: ".78rem", color: C.textSub }}>{r.improvements.map(s => <li key={s}>{s}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}

      {progress?.retested?.length > 0 && !locked && (
        <div className="mi-card" style={card}>
          <div style={{ fontSize: ".85rem", fontWeight: 700, color: C.text, marginBottom: 8 }}>Since attempt {progress.previousAttempt}</div>
          {progress.retested.map(a => (
            <div key={a.area} style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", color: C.textSub, padding: "4px 0" }}>
              <span>{a.area}</span><span style={{ fontWeight: 700, color: C.text }}>{a.before} → {a.after}</span>
            </div>
          ))}
        </div>
      )}

      {!locked && r.prepPath?.length > 0 && (
        <div className="mi-card" style={card}>
          <div style={{ fontSize: ".85rem", fontWeight: 700, color: C.text, marginBottom: 10 }}>What to prepare next</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {r.prepPath.map((p, i) => (
              <div key={p.topic} style={{ display: "flex", gap: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: 999, background: C.accentSoft, color: C.accentText, fontSize: ".7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                <div>
                  <div style={{ fontSize: ".8rem", fontWeight: 600, color: C.text }}>{p.topic}</div>
                  <div style={{ fontSize: ".76rem", color: C.textSub }}>{p.action}</div>
                  {p.why && <div style={{ fontSize: ".72rem", color: C.textMuted, marginTop: 2 }}>{p.why}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: ".78rem", fontWeight: 700, color: C.textSub, marginTop: 4 }}>Answer by answer</div>
      {r.questions.filter(q => q.phase !== "closing").map(q => <AnswerReview key={q.qid} q={q} locked={locked} />)}

      <div className="mi-card" style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: ".8rem", color: C.textMuted, maxWidth: 480 }}>Retake to get new questions that re-test your weakest areas.</div>
        <Button onClick={onRetake} disabled={busy}>{busy ? <Spin size={15} /> : <RotateCcw size={15} />} Retake interview</Button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function MockInterviewPage({ onAuthRequired }) {
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

  let body;
  if (!user) {
    body = (
      <div style={{ ...card, textAlign: "center", padding: "36px 20px" }}>
        <Mic size={28} color={C.accent} />
        <div style={{ fontSize: "1rem", fontWeight: 700, color: C.text, margin: "10px 0 6px" }}>Sign in to practice</div>
        <div style={{ fontSize: ".8rem", color: C.textMuted, marginBottom: 16 }}>Mock interviews are built from your resume, so you need an account.</div>
        <Button onClick={onAuthRequired}><LogIn size={15} /> Sign in</Button>
      </div>
    );
  } else if (!interview) {
    body = (
      <>
        <NewInterviewForm onCreated={open} />
        {listLoading
          ? <div style={{ display: "flex", justifyContent: "center", marginTop: 22, color: C.textMuted }}><Spin size={20} /></div>
          : <InterviewList interviews={interviews} onOpen={open} />}
      </>
    );
  } else if (PREP_STATUSES.includes(status) || status === "evaluating") {
    body = <Waiting interview={interview} />;
  } else if (status === "failed") {
    body = <Failed interview={interview} onRetry={retry} busy={busy} />;
  } else if (inRoom) {
    body = <MockInterviewRoom interviewId={interview.id} onExit={exitRoom} />;
  } else if (status === "planned" || status === "ready" || status === "live") {
    body = <Blueprint interview={interview} onStart={start} onPaid={onPaid} busy={busy} />;
  } else if (status === "completed") {
    body = <Report interview={interview} onRetake={retake} busy={busy} />;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100%", padding: "24px 16px 60px" }}>
      <PageStyles />
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          {interview && (
            <button onClick={back} className="mi-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 9, border: `1px solid ${C.cardBorder}`, background: C.card, color: C.text, cursor: "pointer" }}>
              <ArrowLeft size={16} />
            </button>
          )}
          <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accentSoft, color: C.accentText, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase size={17} />
          </div>
          <div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: C.text }}>Mock Interview</div>
            <div style={{ fontSize: ".76rem", color: C.textMuted }}>Practice the interview this company would actually run</div>
          </div>
        </div>
        {!interview && <ErrorBox message={error} />}
        {interview && error && <div style={{ marginBottom: 12 }}><ErrorBox message={error} /></div>}
        {body}
      </div>
    </div>
  );
}
