import { useState, useEffect, useMemo, useRef } from "react";
import {
  Briefcase, Upload, Loader2, Check, ExternalLink, FileText,
  Sparkles, Settings, MapPin, Building2, Search, X, ChevronDown, Bot, AlertTriangle, LogIn, Filter, Layers, Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { jobsAPI, profileAPI } from "../api";

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
  red:          "#F87171",
  orange:       "#FB923C",
};

// Deterministic avatar color per company name — no logo assets needed.
const AVATAR_HUES = ["#7567C9", "#3DBE82", "#FB923C", "#3B82F6", "#EC4899", "#F59E0B", "#14B8A6"];
function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length];
}

function Spin({ size = 16 }) {
  return <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />;
}

const PageStyles = () => (
  <style>{`
    @keyframes jpFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .jp-card { animation: jpFadeUp .3s ease-out both; transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
    .jp-card:hover { border-color:#7567C955; box-shadow:0 6px 20px rgba(0,0,0,0.08); transform:translateY(-2px); }
    .jp-input { background:var(--c-active); border:1px solid var(--c-cardBorder); border-radius:10px; padding:9px 12px; color:var(--c-text); font-size:.82rem; outline:none; font-family:inherit; transition:border-color .15s, box-shadow .15s; }
    .jp-input:focus { border-color:#7567C9; box-shadow:0 0 0 3px #7567C926; }
    .jp-input::placeholder { color:var(--c-textMuted); }
    .jp-select { cursor:pointer; appearance:none; background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e"); background-repeat:no-repeat; background-position:right 10px center; padding-right:28px; }
    .jp-tab { transition: all .15s ease; }
    .jp-pill-btn { transition: all .15s ease; }
    .jp-pill-btn:hover { filter:brightness(0.96); transform:translateY(-1px); }
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

function Tag({ children }) {
  return (
    <span style={{ fontSize: ".68rem", fontWeight: 600, color: C.textSub, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function matchTier(score) {
  if (score >= 70) return { label: "Strong match", color: C.green };
  if (score >= 40) return { label: "Good match", color: C.orange };
  return { label: "Stretch match", color: C.textMuted };
}

function MatchPill({ score }) {
  const tier = matchTier(score);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
      fontSize: ".72rem", fontWeight: 800, color: tier.color,
      background: `${tier.color}18`, border: `1px solid ${tier.color}44`,
      borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap",
    }}>
      {score}% match
    </span>
  );
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

// ─── Skill extraction — gate for "Matched to My Resume" mode ─────────────────
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
    <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "28px 22px", textAlign: "center" }}>
      <Sparkles size={24} color={C.accentText} style={{ marginBottom: 10 }} />
      <div style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, marginBottom: 6 }}>
        Extract your skills to see resume-matched jobs
      </div>
      <div style={{ fontSize: ".84rem", color: C.textMuted, marginBottom: 20, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
        Upload your resume once — we pull out your skills, projects and education to score jobs against your actual profile.
      </div>

      {!extracted ? (
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `2px dashed ${C.cardBorder}`, borderRadius: 10, padding: "14px 24px", cursor: extracting ? "default" : "pointer", background: C.active }}>
          <input type="file" accept="application/pdf" hidden disabled={extracting} onChange={onPickFile} />
          {extracting
            ? <><Spin size={18} /><span style={{ fontSize: ".85rem", color: C.accentText, fontWeight: 600 }}>Reading resume…</span></>
            : <><Upload size={18} color={C.textMuted} /><span style={{ fontSize: ".85rem", color: C.textSub, fontWeight: 600 }}>Upload Resume PDF</span></>
          }
        </label>
      ) : (
        <div style={{ textAlign: "left", background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "14px 16px", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: ".72rem", fontWeight: 700, color: C.textSub, marginBottom: 8 }}>Found:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {(extracted.skills || []).map(s => (
              <span key={s} style={{ fontSize: ".72rem", color: C.accentText, background: C.accentSoft, borderRadius: 999, padding: "3px 10px" }}>{s}</span>
            ))}
          </div>
          <div style={{ fontSize: ".76rem", color: C.textSub, marginBottom: 12 }}>
            {(extracted.projects || []).length} project(s) · {(extracted.preferredRoles || []).join(", ") || "no preferred roles inferred"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveExtracted} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".8rem", fontWeight: 700, color: "#fff", background: C.accent, border: "none", borderRadius: 9, padding: "8px 16px", cursor: saving ? "default" : "pointer" }}>
              {saving ? <Spin size={13} /> : <Check size={13} />} Save &amp; see matches
            </button>
            <button onClick={() => setExtracted(null)}
              style={{ fontSize: ".8rem", fontWeight: 600, color: C.textSub, background: "none", border: `1px solid ${C.cardBorder}`, borderRadius: 9, padding: "8px 16px", cursor: "pointer" }}>
              Redo
            </button>
          </div>
        </div>
      )}

      {error && <div style={{ fontSize: ".78rem", color: C.red, marginTop: 10 }}>{error}</div>}
    </div>
  );
}

// ─── One job card — works for both plain listings and scored matches ────────
function JobCard({ job, score, matchedSkills, appliedStatus, onApplied, onNavigate, onAuthRequired }) {
  const { user } = useAuth();
  const [showLetter, setShowLetter] = useState(false);
  const [letter, setLetter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [marking, setMarking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [error, setError] = useState("");

  const [autoApplying, setAutoApplying] = useState(false);
  const [autoApplyResult, setAutoApplyResult] = useState(null); // { status, reason, unansweredQuestions }
  const [answerDrafts, setAnswerDrafts] = useState({}); // { questionText: typedAnswer }
  const [savingAnswers, setSavingAnswers] = useState(false);

  const isRemote = /remote/i.test(job.location || "");
  const snippet = (job.descriptionText || "").slice(0, 220);

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
      setAutoApplyResult({ status: "failed", reason: err.message || "Auto-apply failed", unansweredQuestions: [] });
    } finally {
      setAutoApplying(false);
    }
  };

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

  return (
    <div className="jp-card" style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "18px 20px", marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: `${avatarColor(job.company)}22`, color: avatarColor(job.company),
          fontWeight: 800, fontSize: "1.05rem", textTransform: "uppercase",
        }}>
          {job.company?.[0] || "?"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: ".95rem", fontWeight: 700, color: C.text }}>{job.title}</div>
            {score !== undefined && <MatchPill score={score} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".78rem", color: C.textMuted, marginTop: 4, marginBottom: 9 }}>
            <Building2 size={12} /> <span style={{ fontWeight: 600, color: C.textSub, textTransform: "capitalize" }}>{job.company}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: matchedSkills?.length ? 8 : 0 }}>
            {job.postedAt && <Tag>{timeAgo(job.postedAt)}</Tag>}
            {job.location && <Tag><MapPin size={10} style={{ verticalAlign: -1, marginRight: 3 }} />{job.location}</Tag>}
            {isRemote && <Tag>Remote</Tag>}
            {job.department && <Tag>{job.department}</Tag>}
            <Tag>{job.source === "greenhouse" ? "Greenhouse" : job.source === "lever" ? "Lever" : job.company}</Tag>
          </div>

          {matchedSkills?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 4 }}>
              {matchedSkills.slice(0, 8).map(s => (
                <span key={s} style={{ fontSize: ".68rem", color: C.accentText, background: C.accentSoft, borderRadius: 999, padding: "2px 8px" }}>{s}</span>
              ))}
            </div>
          )}

          {score !== undefined && (
            <button onClick={() => setShowReasoning(v => !v)}
              style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: ".74rem", fontWeight: 700, color: C.accentText, background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2 }}>
              Why this match? <ChevronDown size={11} style={{ transform: showReasoning ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
          )}
        </div>
      </div>

      {showReasoning && score !== undefined && (() => {
        const tier = matchTier(score);
        return (
          <div style={{ marginTop: 10, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: ".78rem", fontWeight: 700, color: tier.color, marginBottom: 8 }}>
              {score}% · {tier.label}
            </div>
            {matchedSkills?.length > 0 ? (
              <>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: C.textSub, marginBottom: 6 }}>Matched from your resume</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {matchedSkills.map(s => (
                    <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: ".72rem", color: C.green, background: `${C.green}14`, borderRadius: 999, padding: "3px 9px" }}>
                      <Check size={10} /> {s}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: ".78rem", color: C.textMuted }}>No direct skill overlap found — this match is based on role and title similarity.</div>
            )}
          </div>
        );
      })()}

      {job.descriptionText && (
        <div style={{ marginTop: 12, fontSize: ".8rem", color: C.textSub, lineHeight: 1.6 }}>
          {expanded ? job.descriptionText : snippet}
          {job.descriptionText.length > 220 && (
            <button onClick={() => setExpanded(v => !v)}
              style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: ".76rem", fontWeight: 700, color: C.accentText, background: "none", border: "none", cursor: "pointer", marginLeft: 4, padding: 0 }}>
              {expanded ? "less" : "…more"} <ChevronDown size={12} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        {appliedStatus ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".78rem", fontWeight: 700, color: C.green, background: `${C.green}18`, border: `1px solid ${C.green}44`, borderRadius: 9, padding: "8px 14px" }}>
            <Check size={13} /> Applied
          </span>
        ) : (
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" onClick={markApplied} className="jp-pill-btn"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".78rem", fontWeight: 700, color: "#fff", background: C.accent, borderRadius: 9, padding: "8px 15px", textDecoration: "none" }}>
            {marking ? <Spin size={13} /> : <ExternalLink size={13} />} Apply
          </a>
        )}
        <button onClick={generateLetter} className="jp-pill-btn"
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".78rem", fontWeight: 600, color: C.accentText, background: C.accentSoft, border: "none", borderRadius: 9, padding: "8px 15px", cursor: "pointer" }}>
          <FileText size={13} /> Cover Letter
        </button>
        {!appliedStatus && job.autoApplySupported && (
          <button onClick={autoApplyNow} disabled={autoApplying} className="jp-pill-btn"
            title={!user ? "Sign in to use Auto-Apply" : user.autoApply?.enabled ? "Submit this application automatically, right now" : "Enable Auto-Apply in settings first"}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".78rem", fontWeight: 700, color: C.text, background: "transparent", border: `1px solid ${C.cardBorder}`, borderRadius: 9, padding: "8px 15px", cursor: autoApplying ? "default" : "pointer" }}>
            {autoApplying ? <Spin size={13} /> : <Bot size={13} />} Auto-Apply
          </button>
        )}
      </div>

      {autoApplyResult && autoApplyResult.unansweredQuestions?.length > 0 && (
        <div style={{ marginTop: 10, background: `${C.orange}0d`, border: `1px solid ${C.orange}44`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".78rem", fontWeight: 700, color: C.orange, marginBottom: 10 }}>
            <AlertTriangle size={14} /> This form asks new questions — answer once, reused for every future application
          </div>
          {autoApplyResult.unansweredQuestions.some((q) => FRESHER_DEFAULTS.some((d) => d.pattern.test(q.label))) && (
            <button type="button" onClick={applyFresherDefaults}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".74rem", fontWeight: 700, color: C.accentText, background: C.accentSoft, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", marginBottom: 10 }}>
              <Sparkles size={12} /> I'm a fresher — skip work history questions
            </button>
          )}
          {autoApplyResult.unansweredQuestions.map((q) => (
            <div key={q.id || q.label} style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: ".76rem", color: C.textSub, marginBottom: 4 }}>{q.label}</label>
              <input
                className="jp-input"
                style={{ width: "100%", boxSizing: "border-box" }}
                value={answerDrafts[q.label] || ""}
                onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [q.label]: e.target.value }))}
                placeholder="Your answer"
              />
            </div>
          ))}
          <button onClick={saveAnswersAndRetry} disabled={savingAnswers || autoApplying} className="jp-pill-btn"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".76rem", fontWeight: 700, color: "#fff", background: C.accent, border: "none", borderRadius: 9, padding: "8px 14px", cursor: savingAnswers ? "default" : "pointer", marginTop: 4 }}>
            {(savingAnswers || autoApplying) ? <Spin size={13} /> : <Check size={13} />} Save &amp; Retry
          </button>
        </div>
      )}

      {autoApplyResult && !(autoApplyResult.unansweredQuestions?.length > 0) && (
        <div style={{
          marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontSize: ".78rem", borderRadius: 9, padding: "9px 12px",
          color: autoApplyResult.status === "submitted" ? C.green : autoApplyResult.status === "needs_manual_action" ? C.orange : C.red,
          background: `${autoApplyResult.status === "submitted" ? C.green : autoApplyResult.status === "needs_manual_action" ? C.orange : C.red}14`,
          border: `1px solid ${autoApplyResult.status === "submitted" ? C.green : autoApplyResult.status === "needs_manual_action" ? C.orange : C.red}44`,
        }}>
          {autoApplyResult.status === "submitted" ? <Check size={14} /> : <AlertTriangle size={14} />}
          {autoApplyResult.status === "submitted" ? "Submitted successfully"
            : autoApplyResult.status === "needs_manual_action" ? `Needs your action — ${autoApplyResult.reason}`
            : `Failed — ${autoApplyResult.reason}`}
        </div>
      )}

      {showLetter && (
        <div style={{ marginTop: 12, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "12px 14px" }}>
          {generating ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".8rem", color: C.textMuted }}><Spin size={14} /> Writing a tailored cover letter…</div>
          ) : error ? (
            <div style={{ fontSize: ".8rem", color: C.red }}>{error}</div>
          ) : (
            <>
              <div style={{ fontSize: ".8rem", color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.6, marginBottom: 10 }}>{letter}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={copyLetter}
                  style={{ fontSize: ".72rem", fontWeight: 700, color: copied ? C.green : C.accentText, background: "none", border: `1px solid ${copied ? C.green : C.cardBorder}`, borderRadius: 8, padding: "5px 11px", cursor: "pointer" }}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                <button onClick={() => setShowLetter(false)}
                  style={{ fontSize: ".72rem", fontWeight: 600, color: C.textMuted, background: "none", border: "none", cursor: "pointer" }}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Jobs page ────────────────────────────────────────────────────────────────
export default function JobsPage({ onNavigate, onAuthRequired }) {
  const { user } = useAuth();
  const [mode, setMode] = useState("all"); // "all" | "matched"

  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("");
  const [company, setCompany] = useState("");
  const [remote, setRemote] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [department, setDepartment] = useState("");
  const [postedWithin, setPostedWithin] = useState(""); // "" | "24h" | "3d" | "7d"

  const [jobs, setJobs] = useState(null); // null = loading
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [needsExtraction, setNeedsExtraction] = useState(false);
  const [error, setError] = useState("");
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

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
  // "Load More" keeps everything already rendered (and any in-progress
  // auto-apply state on those cards) in place.
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

  const onSearch = (e) => {
    e.preventDefault();
    if (mode === "all") loadAll();
  };

  // Shared by every filter that should apply immediately (pills, Company/Source
  // dropdowns) rather than waiting on the Search button — takes whichever
  // fields changed as overrides, syncs their state, and refetches page 1.
  const applyServerFilters = (overrides = {}) => {
    const setters = { q: setQ, location: setLocation, company: setCompany, source: setSource, remote: setRemote };
    Object.entries(overrides).forEach(([key, val]) => setters[key]?.(val));
    setJobs(null);
    setError("");
    setPage(1);
    jobsAPI.list({ q, location, company, source, remote, ...overrides, page: 1, limit: PAGE_SIZE })
      .then((res) => { setJobs(res.jobs || []); setTotal(res.total || 0); })
      .catch((err) => { setError(err.message || "Failed to load jobs"); setJobs([]); });
  };

  const toggleIndia = () => {
    const next = location.trim().toLowerCase() === "india" ? "" : "India";
    applyServerFilters({ location: next, remote: false });
  };

  const toggleRemote = () => {
    const next = !remote;
    applyServerFilters({ remote: next, location: next ? "" : location });
  };

  const hasActiveFilters = !!(q || location || company || source || remote || department || postedWithin);

  const clearFilters = () => {
    setDepartment(""); setPostedWithin("");
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
  // neither has server-side support yet (see `departments` above).
  const filteredItems = useMemo(() => {
    if (mode !== "all" || (!department && !postedWithin)) return items;
    const cutoff = postedWithin
      ? Date.now() - { "24h": 1, "3d": 3, "7d": 7 }[postedWithin] * 86400000
      : null;
    return items.filter(({ job }) => {
      if (department && job.department !== department) return false;
      if (cutoff && (!job.postedAt || new Date(job.postedAt).getTime() < cutoff)) return false;
      return true;
    });
  }, [items, department, postedWithin, mode]);

  const clientFiltered = mode === "all" && (department || postedWithin);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 60px" }}>
      <PageStyles />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Briefcase size={20} color={C.accentText} />
          <span style={{ fontSize: "1.15rem", fontWeight: 800, color: C.text }}>Jobs</span>
        </div>
        {user ? (
          <button onClick={() => onNavigate?.("profile")}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".78rem", fontWeight: 600, color: C.textSub, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 9, padding: "7px 13px", cursor: "pointer" }}>
            <Settings size={13} /> Auto-Apply settings
          </button>
        ) : (
          <button onClick={() => onAuthRequired?.()} className="jp-pill-btn"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".78rem", fontWeight: 700, color: "#fff", background: C.accent, border: "none", borderRadius: 9, padding: "7px 14px", cursor: "pointer" }}>
            <LogIn size={13} /> Sign in
          </button>
        )}
      </div>

      <div style={{ fontSize: ".82rem", color: C.textMuted, marginBottom: 18 }}>
        Live postings from Greenhouse &amp; Lever. Generate a tailored cover letter, then apply on the real site.
      </div>

      {/* ── Mode tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className="jp-tab" onClick={() => { setJobs(null); setMode("all"); }}
          style={{ fontSize: ".82rem", fontWeight: 700, borderRadius: 999, padding: "8px 16px", cursor: "pointer",
            background: mode === "all" ? C.accent : C.active, color: mode === "all" ? "#fff" : C.textSub,
            border: `1px solid ${mode === "all" ? C.accent : C.cardBorder}` }}>
          All Jobs
        </button>
        <button className="jp-tab" onClick={() => { setJobs(null); setMode("matched"); }}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".82rem", fontWeight: 700, borderRadius: 999, padding: "8px 16px", cursor: "pointer",
            background: mode === "matched" ? C.accent : C.active, color: mode === "matched" ? "#fff" : C.textSub,
            border: `1px solid ${mode === "matched" ? C.accent : C.cardBorder}` }}>
          <Sparkles size={13} /> Matched to My Resume
        </button>
      </div>

      {/* ── Filter panel (All Jobs mode only) ── */}
      {mode === "all" && (
        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "16px 18px", marginBottom: 18 }}>
          <form onSubmit={onSearch}>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <Search size={15} color={C.textMuted} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
              <input className="jp-input" style={{ width: "100%", boxSizing: "border-box", paddingLeft: 38, fontSize: ".86rem", padding: "11px 14px 11px 38px" }}
                placeholder="Role, skill or company — e.g. Backend Engineer, React, Razorpay" value={q} onChange={e => setQ(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <MapPin size={13} color={C.textMuted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
                <input className="jp-input" style={{ width: "100%", boxSizing: "border-box", paddingLeft: 30 }}
                  placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
              </div>

              <div style={{ position: "relative" }}>
                <Building2 size={13} color={C.textMuted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select className="jp-input jp-select" value={company} onChange={e => applyServerFilters({ company: e.target.value })} style={{ width: "100%", boxSizing: "border-box", paddingLeft: 30 }}>
                  <option value="">All companies</option>
                  {companies.map(c => (
                    <option key={c.company} value={c.company}>{c.company} ({c.count})</option>
                  ))}
                </select>
              </div>

              <div style={{ position: "relative" }}>
                <Filter size={13} color={C.textMuted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select className="jp-input jp-select" value={source} onChange={e => applyServerFilters({ source: e.target.value })} style={{ width: "100%", boxSizing: "border-box", paddingLeft: 30 }}>
                  <option value="">All sources</option>
                  <option value="greenhouse">Greenhouse</option>
                  <option value="lever">Lever</option>
                  <option value="firecrawl">Firecrawl</option>
                </select>
              </div>

              <div style={{ position: "relative" }}>
                <Layers size={13} color={C.textMuted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select className="jp-input jp-select" value={department} onChange={e => setDepartment(e.target.value)} style={{ width: "100%", boxSizing: "border-box", paddingLeft: 30 }}>
                  <option value="">All departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div style={{ position: "relative" }}>
                <Clock size={13} color={C.textMuted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select className="jp-input jp-select" value={postedWithin} onChange={e => setPostedWithin(e.target.value)} style={{ width: "100%", boxSizing: "border-box", paddingLeft: 30 }}>
                  <option value="">Any time</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="3d">Last 3 days</option>
                  <option value="7d">Last 7 days</option>
                </select>
              </div>

              <button type="submit" className="jp-pill-btn"
                style={{ fontSize: ".84rem", fontWeight: 700, color: "#fff", background: C.accent, border: "none", borderRadius: 10, padding: "0 18px", cursor: "pointer", minHeight: 38 }}>
                Search
              </button>
            </div>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.cardBorder}` }}>
            <span style={{ fontSize: ".68rem", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".04em" }}>Quick filters</span>
            <button type="button" onClick={toggleIndia} className="jp-pill-btn"
              style={{ fontSize: ".76rem", fontWeight: 700, borderRadius: 999, padding: "6px 14px", cursor: "pointer",
                background: location.trim().toLowerCase() === "india" ? C.accentSoft : C.active,
                color: location.trim().toLowerCase() === "india" ? C.accentText : C.textSub,
                border: `1px solid ${location.trim().toLowerCase() === "india" ? C.accent : C.cardBorder}` }}>
              🇮🇳 India
            </button>
            <button type="button" onClick={toggleRemote} className="jp-pill-btn"
              style={{ fontSize: ".76rem", fontWeight: 700, borderRadius: 999, padding: "6px 14px", cursor: "pointer",
                background: remote ? C.accentSoft : C.active, color: remote ? C.accentText : C.textSub,
                border: `1px solid ${remote ? C.accent : C.cardBorder}` }}>
              Remote only
            </button>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters}
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".76rem", fontWeight: 600, color: C.textMuted, background: "none", border: "none", cursor: "pointer", marginLeft: "auto", padding: "6px 4px" }}>
                <X size={12} /> Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {mode === "matched" && !user && (
        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "28px 22px", textAlign: "center" }}>
          <Sparkles size={24} color={C.accentText} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, marginBottom: 6 }}>
            Sign in to see jobs matched to your resume
          </div>
          <div style={{ fontSize: ".84rem", color: C.textMuted, marginBottom: 18, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
            Browsing is open to everyone. Match scores, tailored cover letters and Auto-Apply need an account.
          </div>
          <button onClick={() => onAuthRequired?.()} className="jp-pill-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: ".85rem", fontWeight: 700, color: "#fff", background: C.accent, border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer" }}>
            <LogIn size={15} /> Sign in
          </button>
        </div>
      )}

      {needsExtraction && mode === "matched" && user && <SkillExtractGate onSaved={loadMatched} />}

      {error && (
        <div style={{ background: `${C.red}14`, border: `1px solid ${C.red}44`, borderRadius: 10, padding: "10px 14px", fontSize: ".82rem", color: C.red, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {jobs === null && !needsExtraction && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textMuted, fontSize: ".85rem" }}>
          <Spin size={16} /> Loading…
        </div>
      )}

      {jobs?.length > 0 && (
        <div style={{ fontSize: ".76rem", color: C.textMuted, marginBottom: 10, fontWeight: 600 }}>
          {clientFiltered
            ? `${filteredItems.length} of ${jobs.length} loaded jobs match these filters`
            : `${total} job${total === 1 ? "" : "s"} found`}
        </div>
      )}

      {jobs?.length === 0 && !needsExtraction && !error && !(mode === "matched" && !user) && (
        <div style={{ textAlign: "center", color: C.textMuted, fontSize: ".85rem", padding: "36px 0" }}>
          No jobs found — try a different search, or check back later (jobs sync every few hours).
        </div>
      )}

      {jobs?.length > 0 && clientFiltered && filteredItems.length === 0 && (
        <div style={{ textAlign: "center", color: C.textMuted, fontSize: ".85rem", padding: "36px 0" }}>
          No loaded jobs match Department / Posted-within — try widening them, or Load More to pull in a bigger set first.
        </div>
      )}

      {filteredItems.map(({ job, score, matchedSkills }) => (
        <JobCard
          key={job._id}
          job={job}
          score={score}
          matchedSkills={matchedSkills}
          appliedStatus={appliedJobIds.has(job._id)}
          onApplied={markLocalApplied}
          onNavigate={onNavigate}
          onAuthRequired={onAuthRequired}
        />
      ))}

      {jobs?.length > 0 && jobs.length < total && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <button onClick={loadMore} disabled={loadingMore} className="jp-pill-btn"
            style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".82rem", fontWeight: 700, color: C.textSub, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "10px 20px", cursor: loadingMore ? "default" : "pointer" }}>
            {loadingMore ? <Spin size={14} /> : null} {loadingMore ? "Loading…" : `Load more (${jobs.length} of ${total})`}
          </button>
        </div>
      )}
    </div>
  );
}
