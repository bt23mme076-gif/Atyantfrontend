import { useState, useEffect, useMemo, useRef } from "react";
import {
  Upload, Loader2, Check, ExternalLink, FileText, Zap, Copy, Mic, Crown, SlidersHorizontal, ChevronRight,
  GraduationCap, Settings, MapPin, Building2, Search, X, AlertTriangle, LogIn, Clock, Globe, Briefcase,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { jobsAPI, profileAPI } from "../api";
import { canAutoApply as planAllowsAutoApply } from "../lib/plan";

// Theme palette — maps to CSS vars defined in index.css (light + dark).
const C = {
  bg:           "var(--c-bg)",
  card:         "var(--c-card)",
  cardHover:    "var(--c-cardHover)",
  cardBorder:   "var(--c-cardBorder)",
  active:       "var(--c-active)",
  activeBorder: "var(--c-activeBorder)",
  accent:       "#7567C9",
  accentSoft:   "var(--c-accentSoft)",
  accentText:   "var(--c-accentText)",
  text:         "var(--c-text)",
  textSub:      "var(--c-textSub)",
  textMuted:    "var(--c-textMuted)",
  green:        "#3DBE82",
  greenText:    "#1F9D63",
  red:          "#F87171",
  orange:       "#FB923C",
  // Premium (Auto-apply) — warm amber, the one colour on this page that isn't the brand purple.
  gold:         "#B45309",
  goldText:     "#C2620A",
  goldSoft:     "rgba(217,119,6,0.10)",
  goldBorder:   "rgba(217,119,6,0.35)",
};

// Deterministic avatar color per company name — no logo assets needed.
const AVATAR_HUES = ["#7567C9", "#3DBE82", "#FB923C", "#3B82F6", "#EC4899", "#F59E0B", "#14B8A6"];
function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length];
}

const SOURCE_LABEL = { greenhouse: "Greenhouse", lever: "Lever", firecrawl: "Company site" };
const CITIES = ["Bangalore", "Mumbai", "Pune", "Hyderabad", "Gurugram", "Delhi", "Chennai", "Noida", "India"];
const SUGGESTED = [
  { label: "Remote internships", q: "intern", location: "", remote: true },
  { label: "Software engineer in Bangalore", q: "software engineer", location: "Bangalore", remote: false },
  { label: "Data analyst roles", q: "data analyst", location: "", remote: false },
  { label: "Product roles in India", q: "product", location: "India", remote: false },
];
const DATE_OPTIONS = [
  { id: "", label: "Any time" },
  { id: "24h", label: "Past 24 hours" },
  { id: "3d", label: "Past 3 days" },
  { id: "7d", label: "Past week" },
];
const MI_PREFILL_KEY = "atyant_mi_prefill";   // read by MockInterviewPage's new-interview form

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

function Spin({ size = 16 }) {
  return <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />;
}

const PageStyles = () => (
  <style>{`
    .jb-card { transition: border-color .15s ease, box-shadow .15s ease; }
    .jb-card:hover { border-color: var(--c-activeBorder); box-shadow: 0 6px 20px -12px rgba(20,16,40,.25); }
    .jb-btn { transition: filter .15s ease, background-color .15s ease, border-color .15s ease; }
    .jb-btn:hover:not(:disabled) { filter: brightness(0.95); }
    .jb-btn:disabled { opacity: .6; cursor: default; }
    .jb-btn:focus-visible, .jb-chip:focus-visible, .jb-link:focus-visible { outline: 2px solid #7567C9; outline-offset: 2px; }
    .jb-link { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; text-align: left; color: inherit; }
    .jb-link:hover { text-decoration: underline; text-underline-offset: 3px; }
    .jb-field { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: var(--c-text); font-size: .95rem; font-family: inherit; padding: 14px 0; }
    .jb-field::placeholder { color: var(--c-textMuted); }
    .jb-input { width: 100%; box-sizing: border-box; background: var(--c-card); border: 1px solid var(--c-cardBorder); border-radius: 8px; padding: 9px 12px; color: var(--c-text); font-size: .84rem; outline: none; font-family: inherit; }
    .jb-input:focus { border-color: #7567C9; box-shadow: 0 0 0 3px #7567C926; }
    .jb-chip { font-family: inherit; font-size: .8rem; font-weight: 500; border-radius: 999px; padding: 6px 12px; cursor: pointer; white-space: nowrap; border: 1px solid var(--c-cardBorder); background: var(--c-active); color: var(--c-textSub); transition: background-color .12s ease, border-color .12s ease, color .12s ease; }
    .jb-chip:hover { border-color: var(--c-activeBorder); color: var(--c-text); }
    .jb-chip.on { background: var(--c-accentSoft); border-color: #7567C9; color: var(--c-accentText); font-weight: 600; }
    .jb-suggest { font-family: inherit; font-size: .84rem; border-radius: 999px; padding: 8px 16px; cursor: pointer; border: 1px solid #7567C9; background: transparent; color: var(--c-accentText); transition: background-color .12s ease; }
    .jb-suggest:hover { background: var(--c-accentSoft); }
    .jb-select { appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 30px !important; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 11px center; }
    .jb-clamp2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .jb-check { display: flex; align-items: center; gap: 9px; font-size: .84rem; color: var(--c-textSub); cursor: pointer; padding: 3px 0; }
    .jb-check input { accent-color: #7567C9; width: 15px; height: 15px; margin: 0; }
    @keyframes jbPulse { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
    .jb-skel { background: var(--c-active); border-radius: 6px; animation: jbPulse 1.4s ease-in-out infinite; }
    @keyframes jbSlide { from { transform: translateX(24px); opacity: 0 } to { transform: none; opacity: 1 } }
    .jb-drawer { animation: jbSlide .2s ease-out; }
    @media (prefers-reduced-motion: reduce) { .jb-skel, .jb-drawer { animation: none; } }
  `}</style>
);

// Most Atyant users are freshers — these are the question shapes that assume
// prior employment (Greenhouse/Lever "work history" fields) and don't apply
// to them. Matched by label text since third-party forms have no stable IDs.
// Deliberately excludes "expected compensation" / "current location" — those
// have real answers a fresher still needs to give.
const FRESHER_DEFAULTS = [
  { pattern: /notice period/i, value: "Immediate" },
  { pattern: /current\s+(annual\s+)?(compensation|salary|ctc)/i, value: "N/A — Fresher, no prior compensation" },
  { pattern: /company|employer/i, value: "N/A — Fresher, no prior employer" },
  { pattern: /title|role|designation/i, value: "N/A — Fresher, no prior job title" },
  { pattern: /start date/i, value: "N/A" },
  { pattern: /end date/i, value: "N/A" },
];

function matchTier(score) {
  if (score >= 70) return { label: "Strong match", color: C.green };
  if (score >= 40) return { label: "Good match", color: C.orange };
  return { label: "Stretch match", color: C.textMuted };
}

// Relative time from an ISO date string — "3h ago", "5d ago", etc.
function timeAgo(dateStr) {
  if (!dateStr) return null;
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Scraped descriptions arrive with HTML entities still encoded ("&nbsp;", "&amp;").
// A detached <textarea> decodes them as plain text — nothing is parsed or run as HTML.
function decodeEntities(text = "") {
  if (!/&[#a-z0-9]+;/i.test(text)) return text;
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value.replace(/\u00a0/g, " ");
}

function CompanyMark({ name, size = 44 }) {
  const color = avatarColor(name);
  return (
    <div aria-hidden="true" style={{
      width: size, height: size, borderRadius: size > 44 ? 10 : 9, flexShrink: 0, display: "flex", alignItems: "center",
      justifyContent: "center", background: `${color}1f`, color, fontWeight: 700, fontSize: size * 0.42, textTransform: "uppercase",
    }}>
      {name?.[0] || "?"}
    </div>
  );
}

function Tag({ children, color, bg, border }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: ".74rem", fontWeight: 500, color: color || C.textSub, background: bg || "transparent", border: `1px solid ${border || C.cardBorder}`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function PremiumTag() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: ".64rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#fff", background: C.gold, borderRadius: 4, padding: "2px 6px" }}>
      <Crown size={10} /> Premium
    </span>
  );
}

// Store the job for the mock interview form, then go there.
function practiceJob(job, onNavigate) {
  try {
    sessionStorage.setItem(MI_PREFILL_KEY, JSON.stringify({
      company: (job.company || "").replace(/\b\w/g, ch => ch.toUpperCase()),   // scraped names come lowercase ("gitlab")
      role: job.title || "",
      jdText: decodeEntities(job.descriptionText || "").slice(0, 8000),
    }));
  } catch { /* storage blocked — the form just opens empty */ }
  onNavigate?.("mock-interview");
}

// ─── Skill extraction — gate for the "Recommended" tab ───────────────────────
function SkillExtractGate({ onSaved }) {
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setError("Only PDF files are accepted."); return; }
    setExtracting(true);
    setError("");
    try {
      const res = await profileAPI.extractSkills(file);
      setExtracted(res.data);
    } catch (err) {
      setError(err.message || "Failed to read resume");
    } finally {
      setExtracting(false);
      e.target.value = "";
    }
  };

  const saveExtracted = async () => {
    setSaving(true);
    setError("");
    try {
      await profileAPI.update({
        skills: extracted.skills || [],
        projects: extracted.projects || [],
        education: extracted.education || [],
        workExperience: extracted.workExperience || [],
        preferredRoles: extracted.preferredRoles || [],
      });
      onSaved();
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "28px 22px", textAlign: "center" }}>
      <FileText size={24} color={C.accentText} style={{ display: "block", margin: "0 auto 10px" }} />
      <div style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, marginBottom: 6 }}>
        Add your resume to get recommendations
      </div>
      <div style={{ fontSize: ".84rem", color: C.textSub, marginBottom: 20, maxWidth: 440, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
        Upload it once. We read your skills, projects and education and rank every job by how well it fits you.
      </div>

      {!extracted ? (
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1.5px dashed ${C.cardBorder}`, borderRadius: 10, padding: "14px 24px", cursor: extracting ? "default" : "pointer", background: C.active }}>
          <input type="file" accept="application/pdf" hidden disabled={extracting} onChange={onPickFile} />
          {extracting
            ? <><Spin size={18} /><span style={{ fontSize: ".85rem", color: C.accentText, fontWeight: 600 }}>Reading resume…</span></>
            : <><Upload size={18} color={C.textMuted} /><span style={{ fontSize: ".85rem", color: C.textSub, fontWeight: 600 }}>Upload resume PDF</span></>
          }
        </label>
      ) : (
        <div style={{ textAlign: "left", background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "14px 16px", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: ".72rem", fontWeight: 700, color: C.textSub, marginBottom: 8 }}>We found</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {(extracted.skills || []).map(s => (
              <span key={s} style={{ fontSize: ".72rem", color: C.accentText, background: C.accentSoft, borderRadius: 4, padding: "3px 8px" }}>{s}</span>
            ))}
          </div>
          <div style={{ fontSize: ".76rem", color: C.textSub, marginBottom: 12 }}>
            {(extracted.projects || []).length} project(s) · {(extracted.preferredRoles || []).join(", ") || "no preferred roles inferred"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveExtracted} disabled={saving} className="jb-btn"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".8rem", fontWeight: 700, color: "#fff", background: C.accent, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}>
              {saving ? <Spin size={13} /> : <Check size={13} />} Save and show matches
            </button>
            <button onClick={() => setExtracted(null)} className="jb-btn"
              style={{ fontSize: ".8rem", fontWeight: 600, color: C.textSub, background: "none", border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}>
              Redo
            </button>
          </div>
        </div>
      )}

      {error && <div style={{ fontSize: ".78rem", color: C.red, marginTop: 10 }}>{error}</div>}
    </div>
  );
}

// ─── One job in the results list ─────────────────────────────────────────────
function JobCard({ job, score, matchedSkills, applied, paid, onOpen, onAutoApply, onPractice }) {
  const isRemote = /remote/i.test(job.location || "");
  const tier = score !== undefined ? matchTier(score) : null;
  const snippet = useMemo(() => decodeEntities(job.descriptionText || "").replace(/\s+/g, " ").trim(), [job.descriptionText]);
  const canAutoApply = !applied && job.autoApplySupported;

  const btn = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".84rem", fontWeight: 600, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", border: "none" };

  return (
    <article className="jb-card" style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "20px 22px" }}>
      {/* Title row */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <CompanyMark name={job.company} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: "1.12rem", fontWeight: 700, lineHeight: 1.3, color: C.text }}>
            <button className="jb-link" onClick={onOpen}>{job.title}</button>
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: ".88rem", color: C.textSub, textTransform: "capitalize" }}>
            <Building2 size={14} color={C.textMuted} /> {job.company}
          </div>
        </div>
        {tier && (
          <span style={{ flexShrink: 0, fontSize: ".78rem", fontWeight: 700, color: tier.color, background: `${tier.color}18`, borderRadius: 999, padding: "4px 10px", fontVariantNumeric: "tabular-nums" }}>
            {score}% match
          </span>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        {applied && <Tag color={C.greenText} bg={`${C.green}14`} border={`${C.green}55`}><Check size={12} /> Applied</Tag>}
        {canAutoApply && <Tag color={C.goldText} bg={C.goldSoft} border={C.goldBorder}><Zap size={12} /> Auto-apply available</Tag>}
        {isRemote && <Tag>Remote</Tag>}
        {job.department && <Tag>{job.department}</Tag>}
      </div>

      {/* Info strip */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 18px", marginTop: 12, padding: "10px 14px", background: C.active, borderRadius: 8, fontSize: ".84rem", color: C.text }}>
        {job.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}><MapPin size={15} color={C.textMuted} style={{ flexShrink: 0 }} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>{job.location}</span></span>}
        {job.postedAt && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Clock size={15} color={C.textMuted} /> {timeAgo(job.postedAt)}</span>}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Globe size={15} color={C.textMuted} /> {SOURCE_LABEL[job.source] || "Company site"}</span>
      </div>

      {snippet && (
        <p className="jb-clamp2" style={{ margin: "12px 0 0", fontSize: ".86rem", lineHeight: 1.6, color: C.textSub }}>{snippet}</p>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.cardBorder}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0 }}>
          {(matchedSkills || []).slice(0, 4).map(s => (
            <span key={s} style={{ fontSize: ".74rem", color: C.accentText, background: C.accentSoft, borderRadius: 4, padding: "3px 8px" }}>{s}</span>
          ))}
          {matchedSkills?.length > 4 && <span style={{ fontSize: ".74rem", color: C.textMuted, padding: "3px 2px" }}>+{matchedSkills.length - 4}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
          <button onClick={onPractice} className="jb-btn" title="Practice a mock interview for this job" style={{ ...btn, color: C.accentText, background: C.accentSoft }}>
            <Mic size={15} /> Practice
          </button>
          {canAutoApply && (
            <button onClick={onAutoApply} className="jb-btn"
              title={paid ? "We fill in and submit this application for you" : "Auto-apply comes with the Clarity and Pro plans"}
              style={{ ...btn, color: "#fff", background: C.gold }}>
              {paid ? <Zap size={15} /> : <Crown size={15} />} Auto-apply
            </button>
          )}
          <button onClick={onOpen} className="jb-btn" style={{ ...btn, color: C.accentText, background: "none", padding: "8px 4px" }}>
            View details <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} style={{ padding: "20px 22px", border: `1px solid ${C.cardBorder}`, borderRadius: 14, background: C.card }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div className="jb-skel" style={{ width: 44, height: 44, borderRadius: 9 }} />
        <div style={{ flex: 1 }}>
          <div className="jb-skel" style={{ width: "55%", height: 16, marginBottom: 8 }} />
          <div className="jb-skel" style={{ width: "30%", height: 12 }} />
        </div>
      </div>
      <div className="jb-skel" style={{ width: "100%", height: 38, marginTop: 16, borderRadius: 8 }} />
      <div className="jb-skel" style={{ width: "90%", height: 12, marginTop: 14 }} />
    </div>
  ));
}

// ─── Details panel: everything about one job, and every action on it ────────
function JobDetail({ job, score, matchedSkills, appliedStatus, autoStart, onApplied, onNavigate, onAuthRequired }) {
  const { user } = useAuth();
  const [showLetter, setShowLetter] = useState(false);
  const [letter, setLetter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");

  const [autoApplying, setAutoApplying] = useState(false);
  const [autoApplyResult, setAutoApplyResult] = useState(null); // { status, reason, unansweredQuestions }
  const [answerDrafts, setAnswerDrafts] = useState({}); // { questionText: typedAnswer }
  const [savingAnswers, setSavingAnswers] = useState(false);

  const isRemote = /remote/i.test(job.location || "");
  const tier = score !== undefined ? matchTier(score) : null;
  const description = useMemo(() => decodeEntities(job.descriptionText || ""), [job.descriptionText]);
  const canAutoApply = !appliedStatus && job.autoApplySupported;

  const generateLetter = async () => {
    if (!user) { onAuthRequired?.(); return; }
    setShowLetter(true);
    if (letter) return;
    setGenerating(true);
    setError("");
    try {
      const res = await jobsAPI.coverLetter(job._id);
      setLetter(res.coverLetter);
    } catch (err) {
      setError(err.message || "Failed to generate cover letter");
    } finally {
      setGenerating(false);
    }
  };

  const copyLetter = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard permission denied — non-critical */ }
  };

  const markApplied = async () => {
    // Signed-out visitors still get the outbound link — we just can't track it.
    if (!user) return;
    setMarking(true);
    try {
      await jobsAPI.markApplied(job._id);
      onApplied(job._id);
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setMarking(false);
    }
  };

  const autoApplyNow = async () => {
    if (!user) { onAuthRequired?.(); return; }
    if (!planAllowsAutoApply(user)) { onNavigate?.("upgrade"); return; }
    if (!user.autoApply?.enabled) {
      onNavigate?.("profile");
      return;
    }
    setAutoApplying(true);
    setAutoApplyResult(null);
    try {
      const res = await jobsAPI.autoApplyNow(job._id);
      setAutoApplyResult({
        status: res.application?.status,
        reason: res.application?.reason,
        unansweredQuestions: res.application?.unansweredQuestions || [],
      });
      if (res.application?.status === "submitted") onApplied(job._id);
    } catch (err) {
      // Plan lapsed since the page loaded — the server said no; send them to pricing.
      if (err.data?.code === "PLAN_REQUIRED") { onNavigate?.("upgrade"); return; }
      setAutoApplyResult({ status: "failed", reason: err.message || "Auto-apply failed", unansweredQuestions: [] });
    } finally {
      setAutoApplying(false);
    }
  };

  // "Auto-apply" on a card opens this panel and starts right away.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStart && canAutoApply && !autoStarted.current) {
      autoStarted.current = true;
      autoApplyNow();
    }
  }, [autoStart, canAutoApply]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fills only the questions that match a known work-history shape and
  // aren't already typed — leaves everything else (location, expected pay) for
  // the student to answer themselves.
  const applyFresherDefaults = () => {
    setAnswerDrafts((prev) => {
      const next = { ...prev };
      autoApplyResult.unansweredQuestions.forEach((q) => {
        if (next[q.label]) return;
        const match = FRESHER_DEFAULTS.find((d) => d.pattern.test(q.label));
        if (match) next[q.label] = match.value;
      });
      return next;
    });
  };

  const saveAnswersAndRetry = async () => {
    const answers = autoApplyResult.unansweredQuestions
      .map((q) => ({ questionText: q.label, answerText: (answerDrafts[q.label] || "").trim() }))
      .filter((a) => a.questionText && a.answerText);

    if (answers.length === 0) return;

    setSavingAnswers(true);
    try {
      await jobsAPI.saveApplicationAnswers(answers);
      setAnswerDrafts({});
      await autoApplyNow();
    } catch (err) {
      setAutoApplyResult((prev) => ({ ...prev, reason: err.message || "Failed to save answers" }));
    } finally {
      setSavingAnswers(false);
    }
  };

  const btnBase = { display: "inline-flex", alignItems: "center", gap: 7, fontSize: ".86rem", fontWeight: 700, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontFamily: "inherit", textDecoration: "none" };
  const statusColor = autoApplyResult?.status === "submitted" ? C.green : autoApplyResult?.status === "needs_manual_action" ? C.orange : C.red;
  const paid = planAllowsAutoApply(user);
  const autoApplyLabel = !user ? "Sign in to auto-apply"
    : !paid ? "Upgrade to auto-apply"
    : user.autoApply?.enabled ? "Auto-apply to this job" : "Turn on auto-apply";

  return (
    <div style={{ padding: "22px 24px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <CompanyMark name={job.company} size={52} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: ".88rem", fontWeight: 600, color: C.textSub, textTransform: "capitalize" }}>{job.company}</div>
          <h2 style={{ margin: "3px 0 0", fontSize: "1.35rem", fontWeight: 700, lineHeight: 1.25, color: C.text, textWrap: "balance" }}>{job.title}</h2>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 14, fontSize: ".82rem", color: C.textSub }}>
        {job.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><MapPin size={14} color={C.textMuted} /> {job.location}</span>}
        {job.postedAt && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Clock size={14} color={C.textMuted} /> Posted {timeAgo(job.postedAt)}</span>}
        {job.department && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Briefcase size={14} color={C.textMuted} /> {job.department}</span>}
        {isRemote && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Globe size={14} color={C.textMuted} /> Remote</span>}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Building2 size={14} color={C.textMuted} /> via {SOURCE_LABEL[job.source] || "company site"}</span>
      </div>

      {/* Premium: auto-apply — shown first because it's the fastest way to apply */}
      {canAutoApply && (
        <div style={{ marginTop: 18, padding: "14px 16px", borderRadius: 12, background: C.goldSoft, border: `1px solid ${C.goldBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PremiumTag />
            <span style={{ fontSize: ".78rem", fontWeight: 700, color: C.goldText }}>Best way to apply</span>
          </div>
          <div style={{ fontSize: ".86rem", color: C.text, margin: "8px 0 12px", lineHeight: 1.5 }}>
            We fill in the form with your resume and saved answers and submit it for you. No copy-pasting.
            {user && !paid && " Included with the Clarity and Pro plans."}
          </div>
          <button onClick={autoApplyNow} disabled={autoApplying} className="jb-btn" style={{ ...btnBase, color: "#fff", background: C.gold, border: "none" }}>
            {autoApplying ? <Spin size={14} /> : paid ? <Zap size={15} /> : <Crown size={15} />} {autoApplying ? "Applying…" : autoApplyLabel}
          </button>
        </div>
      )}

      {/* Other actions */}
      <div style={{ display: "flex", gap: 8, marginTop: canAutoApply ? 12 : 18, flexWrap: "wrap" }}>
        {appliedStatus ? (
          <span style={{ ...btnBase, cursor: "default", color: C.greenText, background: `${C.green}1c` }}>
            <Check size={15} /> Applied
          </span>
        ) : (
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" onClick={markApplied} className="jb-btn"
            style={canAutoApply
              ? { ...btnBase, color: C.text, background: C.card, border: `1px solid ${C.cardBorder}` }
              : { ...btnBase, color: "#fff", background: C.accent }}>
            {marking ? <Spin size={14} /> : <ExternalLink size={15} />} Apply on company site
          </a>
        )}
        <button onClick={() => practiceJob(job, onNavigate)} className="jb-btn"
          style={{ ...btnBase, color: C.accentText, background: C.accentSoft, border: "none" }}>
          <Mic size={15} /> Practice interview
        </button>
        <button onClick={generateLetter} className="jb-btn"
          style={{ ...btnBase, color: C.text, background: C.card, border: `1px solid ${C.cardBorder}` }}>
          <FileText size={15} /> Cover letter
        </button>
      </div>
      {error && !showLetter && <div style={{ fontSize: ".8rem", color: C.red, marginTop: 10 }}>{error}</div>}

      {/* Auto-apply follow-ups */}
      {autoApplyResult && autoApplyResult.unansweredQuestions?.length > 0 && (
        <div style={{ marginTop: 14, background: `${C.orange}0d`, border: `1px solid ${C.orange}44`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: ".8rem", fontWeight: 700, color: C.orange, marginBottom: 10 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> This form has a few new questions. Answer them once and we'll reuse your answers on every future application.
          </div>
          {autoApplyResult.unansweredQuestions.some((q) => FRESHER_DEFAULTS.some((d) => d.pattern.test(q.label))) && (
            <button type="button" onClick={applyFresherDefaults} className="jb-btn"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".76rem", fontWeight: 700, color: C.accentText, background: C.accentSoft, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", marginBottom: 10, fontFamily: "inherit" }}>
              <GraduationCap size={13} /> I'm a fresher, fill the work-history questions
            </button>
          )}
          {autoApplyResult.unansweredQuestions.map((q) => (
            <div key={q.id || q.label} style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: ".78rem", color: C.textSub, marginBottom: 4 }}>{q.label}</label>
              <input
                className="jb-input"
                value={answerDrafts[q.label] || ""}
                onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [q.label]: e.target.value }))}
                placeholder="Your answer"
              />
            </div>
          ))}
          <button onClick={saveAnswersAndRetry} disabled={savingAnswers || autoApplying} className="jb-btn"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".8rem", fontWeight: 700, color: "#fff", background: C.accent, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", marginTop: 4, fontFamily: "inherit" }}>
            {(savingAnswers || autoApplying) ? <Spin size={13} /> : <Check size={13} />} Save and try again
          </button>
        </div>
      )}

      {autoApplyResult && !(autoApplyResult.unansweredQuestions?.length > 0) && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "flex-start", gap: 8, fontSize: ".82rem", borderRadius: 8, padding: "10px 12px", color: statusColor, background: `${statusColor}14`, border: `1px solid ${statusColor}44` }}>
          {autoApplyResult.status === "submitted" ? <Check size={15} style={{ flexShrink: 0 }} /> : <AlertTriangle size={15} style={{ flexShrink: 0 }} />}
          {autoApplyResult.status === "submitted" ? "Application submitted."
            : autoApplyResult.status === "needs_manual_action" ? `Needs your action: ${autoApplyResult.reason}`
            : `Couldn't submit: ${autoApplyResult.reason}`}
        </div>
      )}

      {/* Cover letter */}
      {showLetter && (
        <div style={{ marginTop: 14, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: ".84rem", fontWeight: 700, color: C.text }}>Cover letter for this role</div>
            <button onClick={() => setShowLetter(false)} aria-label="Close cover letter"
              style={{ display: "flex", background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 2 }}>
              <X size={16} />
            </button>
          </div>
          {generating ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".82rem", color: C.textMuted }}><Spin size={14} /> Writing it from your profile and this job…</div>
          ) : error ? (
            <div style={{ fontSize: ".82rem", color: C.red }}>{error}</div>
          ) : (
            <>
              <div style={{ fontSize: ".84rem", color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.65, marginBottom: 12 }}>{letter}</div>
              <button onClick={copyLetter} className="jb-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".78rem", fontWeight: 700, color: copied ? C.greenText : C.text, background: C.card, border: `1px solid ${copied ? C.green : C.cardBorder}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Match */}
      {tier && (
        <div style={{ marginTop: 22, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: tier.color, fontVariantNumeric: "tabular-nums" }}>{score}%</span>
            <span style={{ fontSize: ".84rem", fontWeight: 600, color: C.text }}>{tier.label} for your resume</span>
          </div>
          {matchedSkills?.length > 0 ? (
            <>
              <div style={{ fontSize: ".76rem", color: C.textSub, margin: "10px 0 6px" }}>Skills from your resume this job asks for</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {matchedSkills.map(s => (
                  <Tag key={s} color={C.greenText} bg={`${C.green}14`} border={`${C.green}44`}><Check size={11} /> {s}</Tag>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontSize: ".8rem", color: C.textSub, marginTop: 8 }}>No direct skill overlap. This match is based on how close the role and title are to what you're aiming for.</div>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: "1rem", fontWeight: 700, color: C.text }}>About the job</h3>
          <div style={{ fontSize: ".88rem", color: C.textSub, lineHeight: 1.7, whiteSpace: "pre-line", maxWidth: "70ch", overflowWrap: "anywhere" }}>
            {description}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Filters (sidebar on desktop, sheet on phones) ───────────────────────────
function FilterSection({ title, children }) {
  return (
    <div style={{ padding: "16px 0", borderTop: `1px solid ${C.cardBorder}` }}>
      <div style={{ fontSize: ".86rem", fontWeight: 700, color: C.text, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

// ─── Jobs page ────────────────────────────────────────────────────────────────
export default function JobsPage({ onNavigate, onAuthRequired }) {
  const { user } = useAuth();
  const wide = useMediaQuery("(min-width: 1100px)");
  const narrow = useMediaQuery("(max-width: 640px)");
  const [mode, setMode] = useState("all"); // "all" | "matched"

  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [source, setSource] = useState("");
  const [company, setCompany] = useState("");
  const [remote, setRemote] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [department, setDepartment] = useState("");
  const [postedWithin, setPostedWithin] = useState(""); // "" | "24h" | "3d" | "7d"
  const [sortBy, setSortBy] = useState("relevance");   // "relevance" | "newest"
  const [showAllDepts, setShowAllDepts] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false); // phone/tablet sheet

  const [jobs, setJobs] = useState(null); // null = loading
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [needsExtraction, setNeedsExtraction] = useState(false);
  const [error, setError] = useState("");
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [open, setOpen] = useState(null); // { id, autoStart } — the job in the details panel

  const PAGE_SIZE = 50; // backend caps at 50/request (see GET /api/jobs)

  // Browsing works signed-out; only the personalised layers need an account.
  const loadApplied = async () => {
    if (!user) return;
    try {
      const res = await jobsAPI.applications();
      setAppliedJobIds(new Set((res.applications || [])
        .filter(a => a.status === "submitted")
        .map(a => a.job?._id || a.job)));
    } catch { /* non-critical — applied badges just won't show */ }
  };

  // Guards against a stale response landing after the user has switched tabs
  // again — without this, an in-flight "all" fetch resolving after the user
  // has already switched to "matched" would overwrite jobs with the wrong shape.
  const requestModeRef = useRef(mode);

  const loadAll = async () => {
    const forMode = "all";
    requestModeRef.current = forMode;
    setError("");
    setJobs(null);
    setPage(1);
    try {
      const res = await jobsAPI.list({ q, location, source, company, remote, page: 1, limit: PAGE_SIZE });
      if (requestModeRef.current !== forMode) return;
      setJobs(res.jobs || []);
      setTotal(res.total || 0);
    } catch (err) {
      if (requestModeRef.current !== forMode) return;
      setError(err.message || "Failed to load jobs");
      setJobs([]);
    }
  };

  const loadMatched = async () => {
    const forMode = "matched";
    requestModeRef.current = forMode;
    setError("");
    setNeedsExtraction(false);
    setJobs(null);
    setPage(1);
    try {
      const res = await jobsAPI.matches({ minScore: 0, page: 1, limit: PAGE_SIZE });
      if (requestModeRef.current !== forMode) return;
      setJobs(res.matches || []);
      setTotal(res.total || 0);
    } catch (err) {
      if (requestModeRef.current !== forMode) return;
      if (err.status === 400) setNeedsExtraction(true);
      else setError(err.message || "Failed to load job matches");
      setJobs([]);
    }
  };

  // Appends the next page to the existing list rather than replacing it —
  // "Show more" keeps everything already rendered (and the open job) in place.
  const loadMore = async () => {
    const forMode = mode;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      if (forMode === "all") {
        const res = await jobsAPI.list({ q, location, source, company, remote, page: nextPage, limit: PAGE_SIZE });
        if (requestModeRef.current !== forMode) return;
        setJobs((prev) => [...(prev || []), ...(res.jobs || [])]);
        setTotal(res.total || 0);
      } else {
        const res = await jobsAPI.matches({ minScore: 0, page: nextPage, limit: PAGE_SIZE });
        if (requestModeRef.current !== forMode) return;
        setJobs((prev) => [...(prev || []), ...(res.matches || [])]);
        setTotal(res.total || 0);
      }
      setPage(nextPage);
    } catch (err) {
      if (requestModeRef.current !== forMode) return;
      setError(err.message || "Failed to load more jobs");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadApplied();
    // Resume matching needs an account — don't fire a request that can only 401.
    if (mode === "matched" && !user) { setJobs([]); return; }
    if (mode === "all") loadAll(); else loadMatched();
  }, [mode, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    jobsAPI.companies().then((res) => setCompanies(res.companies || [])).catch(() => {});
  }, []);

  const switchMode = (next) => {
    if (next === mode) return;
    setJobs(null);
    setOpen(null);
    setMode(next);
  };

  const onSearch = (e) => {
    e.preventDefault();
    if (mode === "all") loadAll(); else switchMode("all");   // searching always means all jobs
  };

  // Shared by every filter that should apply immediately (chips, checkboxes,
  // dropdowns, suggested searches) rather than waiting on the Search button —
  // takes whichever fields changed as overrides, syncs their state, and refetches page 1.
  const applyServerFilters = (overrides = {}) => {
    const setters = { q: setQ, location: setLocation, company: setCompany, source: setSource, remote: setRemote };
    Object.entries(overrides).forEach(([key, val]) => setters[key]?.(val));
    // From "Recommended", switch tabs; the mode effect then loads with the new values.
    if (mode !== "all") { switchMode("all"); return; }
    setJobs(null);
    setError("");
    setPage(1);
    jobsAPI.list({ q, location, company, source, remote, ...overrides, page: 1, limit: PAGE_SIZE })
      .then((res) => { if (requestModeRef.current !== "all") return; setJobs(res.jobs || []); setTotal(res.total || 0); })
      .catch((err) => { setError(err.message || "Failed to load jobs"); setJobs([]); });
  };

  const setCity = (city) => {
    const next = location.trim().toLowerCase() === city.toLowerCase() ? "" : city;
    applyServerFilters({ location: next, remote: false });
  };

  const activeFilterCount = [location, remote, postedWithin, department, company, source].filter(Boolean).length;
  const hasActiveFilters = !!(q || activeFilterCount);

  const clearFilters = () => {
    setDepartment(""); setPostedWithin(""); setCityDraft("");
    applyServerFilters({ q: "", location: "", company: "", source: "", remote: false });
  };

  // Department has no server-side filter yet — derived from whatever's currently
  // loaded and filtered client-side. A subset of the true global list, not exhaustive.
  const departments = useMemo(() => {
    if (mode !== "all" || !jobs) return [];
    return Array.from(new Set(jobs.map(j => j.department).filter(Boolean))).sort();
  }, [jobs, mode]);

  const markLocalApplied = (jobId) => {
    setAppliedJobIds(prev => new Set(prev).add(jobId));
  };

  const items = useMemo(() => {
    if (!jobs) return [];
    return mode === "matched"
      ? jobs.map(m => ({ job: m.job, score: m.score, matchedSkills: m.matchedSkills }))
      : jobs.map(job => ({ job }));
  }, [jobs, mode]);

  // Department + posted-within apply client-side on top of whatever's loaded —
  // neither has server-side support yet (see `departments` above). Sorting is
  // client-side too, over the loaded set.
  const filteredItems = useMemo(() => {
    let out = items;
    if (mode === "all" && (department || postedWithin)) {
      const cutoff = postedWithin
        ? Date.now() - { "24h": 1, "3d": 3, "7d": 7 }[postedWithin] * 86400000
        : null;
      out = out.filter(({ job }) => {
        if (department && job.department !== department) return false;
        if (cutoff && (!job.postedAt || new Date(job.postedAt).getTime() < cutoff)) return false;
        return true;
      });
    }
    if (sortBy === "newest") {
      out = [...out].sort((a, b) => new Date(b.job.postedAt || 0) - new Date(a.job.postedAt || 0));
    }
    return out;
  }, [items, department, postedWithin, mode, sortBy]);

  const clientFiltered = mode === "all" && (department || postedWithin);
  const resultCount = clientFiltered ? filteredItems.length : total;

  const openItem = open && items.find(it => it.job._id === open.id);

  // Escape closes the details panel or the filter sheet.
  useEffect(() => {
    if (!open && !filtersOpen) return;
    const onKey = (e) => { if (e.key === "Escape") { setOpen(null); setFiltersOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtersOpen]);

  const showResults = !(mode === "matched" && !user) && !needsExtraction;
  const paidPlan = planAllowsAutoApply(user);
  const autoApplyOn = paidPlan && !!user?.autoApply?.enabled;

  // Card "Auto-apply": sign in → upgrade → otherwise open the job and start applying.
  const startAutoApply = (jobId) => {
    if (!user) { onAuthRequired?.(); return; }
    if (!paidPlan) { onNavigate?.("upgrade"); return; }
    setOpen({ id: jobId, autoStart: true });
  };

  // ── Filter panel (same content in the sidebar and the phone sheet) ──
  const visibleDepts = showAllDepts ? departments : departments.slice(0, 8);
  const filterPanel = (
    <>
      <FilterSection title="Location">
        <form onSubmit={(e) => { e.preventDefault(); if (cityDraft.trim()) applyServerFilters({ location: cityDraft.trim(), remote: false }); }}>
          <input className="jb-input" value={cityDraft} onChange={e => setCityDraft(e.target.value)} placeholder="Search for a city" aria-label="Search for a city" />
        </form>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {CITIES.map(city => {
            const on = location.trim().toLowerCase() === city.toLowerCase();
            return <button key={city} type="button" onClick={() => setCity(city)} className={`jb-chip${on ? " on" : ""}`} aria-pressed={on}>{city}</button>;
          })}
        </div>
        {location && !CITIES.some(c => c.toLowerCase() === location.trim().toLowerCase()) && (
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={() => applyServerFilters({ location: "" })} className="jb-chip on" aria-pressed="true" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              {location} <X size={12} />
            </button>
          </div>
        )}
      </FilterSection>

      <FilterSection title="Work mode">
        <label className="jb-check">
          <input type="checkbox" checked={remote} onChange={() => applyServerFilters({ remote: !remote, location: !remote ? "" : location })} />
          Remote only
        </label>
      </FilterSection>

      <FilterSection title="Date posted">
        {DATE_OPTIONS.map(o => (
          <label key={o.id || "any"} className="jb-check">
            <input type="radio" name="jb-posted" checked={postedWithin === o.id} onChange={() => setPostedWithin(o.id)} />
            {o.label}
          </label>
        ))}
      </FilterSection>

      {departments.length > 0 && (
        <FilterSection title="Function">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {visibleDepts.map(d => {
              const on = department === d;
              return <button key={d} type="button" onClick={() => setDepartment(on ? "" : d)} className={`jb-chip${on ? " on" : ""}`} aria-pressed={on}>{d}</button>;
            })}
          </div>
          {departments.length > 8 && (
            <button type="button" onClick={() => setShowAllDepts(v => !v)} className="jb-link" style={{ marginTop: 8, fontSize: ".8rem", fontWeight: 600, color: C.accentText }}>
              {showAllDepts ? "Show fewer" : `Show all ${departments.length}`}
            </button>
          )}
        </FilterSection>
      )}

      <FilterSection title="Company">
        <select value={company} onChange={e => applyServerFilters({ company: e.target.value })} className="jb-input jb-select" aria-label="Company">
          <option value="">All companies</option>
          {companies.map(c => <option key={c.company} value={c.company}>{c.company} ({c.count})</option>)}
        </select>
      </FilterSection>

      <FilterSection title="Job board">
        <select value={source} onChange={e => applyServerFilters({ source: e.target.value })} className="jb-input jb-select" aria-label="Job board">
          <option value="">All job boards</option>
          <option value="greenhouse">Greenhouse</option>
          <option value="lever">Lever</option>
          <option value="firecrawl">Company site</option>
        </select>
      </FilterSection>
    </>
  );

  const filterHeader = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1.02rem", fontWeight: 700, color: C.text }}>
        <SlidersHorizontal size={17} /> Filters
      </div>
      {hasActiveFilters && (
        <button type="button" onClick={clearFilters} className="jb-link" style={{ fontSize: ".84rem", fontWeight: 600, color: C.accentText }}>Clear all</button>
      )}
    </div>
  );

  return (
    <div style={{ padding: "8px 16px 60px" }}>
      <PageStyles />

      {/* ── Hero search ── */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: narrow ? "12px 0 20px" : "28px 0 28px", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: narrow ? "1.8rem" : "clamp(2rem, 3.6vw, 2.6rem)", lineHeight: 1.15, color: C.text, textWrap: "balance" }}>
          Find your next role
        </h1>
        <p style={{ margin: "10px auto 0", maxWidth: 560, fontSize: ".95rem", lineHeight: 1.5, color: C.textSub }}>
          Live openings from company career pages, refreshed every few hours. Practice the interview before you apply.
        </p>

        <form onSubmit={onSearch} style={{
          display: "flex", flexDirection: narrow ? "column" : "row", alignItems: narrow ? "stretch" : "center", gap: narrow ? 0 : 0,
          margin: "22px auto 0", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: narrow ? 14 : 999,
          padding: narrow ? 6 : "4px 5px 4px 18px", boxShadow: "0 8px 24px -16px rgba(20,16,40,.35)", textAlign: "left",
        }}>
          <label style={{ flex: 2, display: "flex", alignItems: "center", gap: 10, minWidth: 0, padding: narrow ? "0 10px" : 0 }}>
            <Search size={18} color={C.textMuted} style={{ flexShrink: 0 }} />
            <input className="jb-field" value={q} onChange={e => setQ(e.target.value)} placeholder="Job title, skill or company" aria-label="Job title, skill or company" />
          </label>
          <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0, padding: narrow ? "0 10px" : "0 14px", borderLeft: narrow ? "none" : `1px solid ${C.cardBorder}`, borderTop: narrow ? `1px solid ${C.cardBorder}` : "none" }}>
            <MapPin size={18} color={C.textMuted} style={{ flexShrink: 0 }} />
            <input className="jb-field" value={location} onChange={e => setLocation(e.target.value)} placeholder="City or country" aria-label="Location" />
          </label>
          <button type="submit" className="jb-btn"
            style={{ fontSize: ".95rem", fontWeight: 700, color: "#fff", background: C.accent, border: "none", borderRadius: 999, padding: "0 28px", minHeight: 46, cursor: "pointer", fontFamily: "inherit" }}>
            Search
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 }}>
          {SUGGESTED.map(s => (
            <button key={s.label} type="button" className="jb-suggest"
              onClick={() => { setDepartment(""); setPostedWithin(""); applyServerFilters({ q: s.q, location: s.location, remote: s.remote, company: "", source: "" }); }}>
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Filters + results ── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: wide && mode === "all" ? "270px minmax(0, 1fr)" : "minmax(0, 1fr)", gap: 22, alignItems: "start" }}>
        {wide && mode === "all" && (
          <aside style={{ position: "sticky", top: 12, maxHeight: "calc(100dvh - 81px)", overflowY: "auto", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "18px 18px 6px" }}>
            {filterHeader}
            {filterPanel}
          </aside>
        )}

        <main style={{ minWidth: 0 }}>
          {/* Tabs */}
          <div role="tablist" style={{ display: "flex", gap: 22, borderBottom: `1px solid ${C.cardBorder}`, marginBottom: 14 }}>
            {[
              { id: "all", label: "All jobs" },
              { id: "matched", label: "Recommended for you" },
            ].map(t => (
              <button key={t.id} role="tab" aria-selected={mode === t.id} onClick={() => switchMode(t.id)}
                style={{ background: "none", border: "none", padding: "10px 0", marginBottom: -1, cursor: "pointer", fontFamily: "inherit", fontSize: ".92rem", fontWeight: mode === t.id ? 700 : 500, color: mode === t.id ? C.text : C.textSub, borderBottom: `2px solid ${mode === t.id ? C.accent : "transparent"}` }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Premium banner — until auto-apply is switched on */}
          {showResults && !autoApplyOn && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "14px 16px", marginBottom: 14, borderRadius: 12, background: C.goldSoft, border: `1px solid ${C.goldBorder}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: C.gold, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap size={19} />
              </div>
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: ".95rem", fontWeight: 700, color: C.text }}>Let Atyant apply for you</span>
                  <PremiumTag />
                </div>
                <div style={{ fontSize: ".84rem", color: C.textSub, marginTop: 3, lineHeight: 1.45 }}>
                  {paidPlan
                    ? "Turn on Auto-apply once. We fill in and submit applications for jobs that match your resume."
                    : "We fill in and submit applications for jobs that match your resume. Included with the Clarity and Pro plans."}
                </div>
              </div>
              <button onClick={() => (!user ? onAuthRequired?.() : !paidPlan ? onNavigate?.("upgrade") : onNavigate?.("profile"))} className="jb-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".86rem", fontWeight: 700, color: "#fff", background: C.gold, border: "none", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontFamily: "inherit" }}>
                {!user ? <><LogIn size={15} /> Sign in to start</>
                  : !paidPlan ? <><Crown size={15} /> See plans</>
                  : <><Settings size={15} /> Turn on Auto-apply</>}
              </button>
            </div>
          )}

          {mode === "matched" && user && !needsExtraction && (
            <p style={{ margin: "0 0 12px", fontSize: ".84rem", color: C.textSub }}>Ranked by how well each job fits the skills and projects on your resume.</p>
          )}

          {mode === "matched" && !user && (
            <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "28px 22px", textAlign: "center" }}>
              <LogIn size={24} color={C.accentText} style={{ display: "block", margin: "0 auto 10px" }} />
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, marginBottom: 6 }}>Sign in to see jobs picked for you</div>
              <div style={{ fontSize: ".84rem", color: C.textSub, marginBottom: 18, maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
                Anyone can browse. Recommendations, cover letters and Auto-apply need an account.
              </div>
              <button onClick={() => onAuthRequired?.()} className="jb-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: ".86rem", fontWeight: 700, color: "#fff", background: C.accent, border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit" }}>
                <LogIn size={15} /> Sign in
              </button>
            </div>
          )}

          {needsExtraction && mode === "matched" && user && <SkillExtractGate onSaved={loadMatched} />}

          {error && (
            <div style={{ background: `${C.red}14`, border: `1px solid ${C.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: ".84rem", color: C.red, marginBottom: 14 }}>
              {error}
            </div>
          )}

          {showResults && (
            <>
              {/* Count + sort */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {!wide && mode === "all" && (
                    <button type="button" onClick={() => setFiltersOpen(true)} className="jb-btn"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".84rem", fontWeight: 600, color: C.text, background: C.card, border: `1px solid ${activeFilterCount ? C.accent : C.cardBorder}`, borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                      <SlidersHorizontal size={15} /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
                    </button>
                  )}
                  <span style={{ fontSize: ".9rem", color: C.textSub }}>
                    {jobs === null ? "Loading jobs…" : <><b style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>{resultCount.toLocaleString("en-IN")}</b>{clientFiltered ? ` of ${jobs.length} loaded jobs match` : ` job${resultCount === 1 ? "" : "s"} found`}</>}
                  </span>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".86rem", color: C.textSub }}>
                  Sort by
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="jb-input jb-select" style={{ width: "auto", padding: "7px 12px" }}>
                    <option value="relevance">{mode === "matched" ? "Best match" : "Relevance"}</option>
                    <option value="newest">Newest</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {jobs === null && <CardSkeleton />}

                {filteredItems.map(({ job, score, matchedSkills }) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    score={score}
                    matchedSkills={matchedSkills}
                    applied={appliedJobIds.has(job._id)}
                    paid={paidPlan}
                    onOpen={() => setOpen({ id: job._id, autoStart: false })}
                    onAutoApply={() => startAutoApply(job._id)}
                    onPractice={() => practiceJob(job, onNavigate)}
                  />
                ))}
              </div>

              {jobs?.length === 0 && !error && (
                <div style={{ textAlign: "center", color: C.textSub, fontSize: ".9rem", padding: "40px 12px", lineHeight: 1.5 }}>
                  No jobs match this search. Try fewer filters, or check back later. New jobs come in every few hours.
                </div>
              )}

              {jobs?.length > 0 && clientFiltered && filteredItems.length === 0 && (
                <div style={{ textAlign: "center", color: C.textSub, fontSize: ".9rem", padding: "40px 12px", lineHeight: 1.5 }}>
                  None of the loaded jobs match the date or function you picked. Widen them, or load more jobs first.
                </div>
              )}

              {jobs?.length > 0 && jobs.length < total && (
                <button onClick={loadMore} disabled={loadingMore} className="jb-btn"
                  style={{ width: "100%", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: ".88rem", fontWeight: 700, color: C.text, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "12px 20px", cursor: "pointer", fontFamily: "inherit" }}>
                  {loadingMore ? <><Spin size={14} /> Loading…</> : `Show more jobs (${jobs.length} of ${total.toLocaleString("en-IN")})`}
                </button>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Filters sheet (phones / tablets) ── */}
      {filtersOpen && !wide && (
        <div role="dialog" aria-modal="true" aria-label="Filters" style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={() => setFiltersOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(10,8,20,.5)" }} />
          <div className="jb-drawer" style={{ position: "relative", width: "min(380px, 100%)", height: "100%", background: C.card, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 6px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" style={{ display: "flex", background: "none", border: "none", color: C.textSub, cursor: "pointer", padding: 4 }}><X size={20} /></button>
              </div>
              {filterHeader}
              {filterPanel}
            </div>
            <div style={{ padding: 14, borderTop: `1px solid ${C.cardBorder}` }}>
              <button onClick={() => setFiltersOpen(false)} className="jb-btn"
                style={{ width: "100%", fontSize: ".92rem", fontWeight: 700, color: "#fff", background: C.accent, border: "none", borderRadius: 8, padding: "12px", cursor: "pointer", fontFamily: "inherit" }}>
                {jobs === null ? "Loading…" : `Show ${resultCount.toLocaleString("en-IN")} jobs`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Job details panel ── */}
      {openItem && (
        <div role="dialog" aria-modal="true" aria-label={openItem.job.title} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={() => setOpen(null)} style={{ position: "absolute", inset: 0, background: "rgba(10,8,20,.5)" }} />
          <div className="jb-drawer" style={{ position: "relative", width: "min(680px, 100%)", height: "100%", overflowY: "auto", background: C.card, boxShadow: "-12px 0 40px -20px rgba(0,0,0,.5)" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.card, borderBottom: `1px solid ${C.cardBorder}` }}>
              <span style={{ fontSize: ".86rem", fontWeight: 600, color: C.textSub }}>Job details</span>
              <button onClick={() => setOpen(null)} aria-label="Close job details" className="jb-btn"
                style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: C.text, cursor: "pointer", padding: 6, fontSize: ".86rem", fontFamily: "inherit" }}>
                <X size={18} /> Close
              </button>
            </div>
            <JobDetail
              key={openItem.job._id}
              job={openItem.job}
              score={openItem.score}
              matchedSkills={openItem.matchedSkills}
              appliedStatus={appliedJobIds.has(openItem.job._id)}
              autoStart={open.autoStart}
              onApplied={markLocalApplied}
              onNavigate={onNavigate}
              onAuthRequired={onAuthRequired}
            />
          </div>
        </div>
      )}
    </div>
  );
}
