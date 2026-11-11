import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Copy, Check, Download, Pause, Play, Lock, Settings, X, ThumbsUp, ThumbsDown, AlertTriangle,
  MonitorX, Clock, MessageSquareQuote, ChevronDown, RefreshCw, ExternalLink, Users, CheckCircle2, Trophy, Gauge, Rocket, ScanSearch, StickyNote,
} from "lucide-react";
import { FaLinkedin, FaWhatsapp } from "react-icons/fa6";
import { useAuth } from "../../context/AuthContext";
import { hireAPI } from "../../api";
import { TopBar, Loading, Pill, Score, ScoreBar, HirePage, Modal, ModalHead } from "./HireShared";
import { VERDICT, APP_STATUS, JOB_STATUS, timeAgo } from "./hireUtils";
import { Aurora, Avatar, Burst, CountUp, GlowCard, Radar, ScoreRing } from "./HireFx";
import { rise, stagger } from "./hireMotion";

const POLL_MS = 15000;
const EASE = [0.22, 1, 0.36, 1];

// ── Share link ──────────────────────────────────────────────────────────────

function ShareCard({ job }) {
  const [copied, setCopied] = useState(0);
  const link = `${window.location.origin}/hire/i/${job.slug}`;
  const msg = `We're hiring: ${job.title}. Take a 15-minute AI interview here, anytime: ${link}`;
  const isLive = job.status === "live";
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(n => n + 1); setTimeout(() => setCopied(0), 1800); } catch { /* clipboard blocked */ }
  };
  return (
    <motion.div className={`hr-card hr-col ${isLive ? "hr-gborder" : ""}`} style={{ gap: 14, overflow: "hidden" }}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
      {isLive && <Aurora grid={false} className="soft" />}
      <div className="hr-row wrap" style={{ position: "relative", gap: 10 }}>
        <span className="hr-icon-badge solid"><Rocket size={18} /></span>
        <div className="hr-col" style={{ gap: 2, flex: 1, minWidth: 200 }}>
          <b style={{ fontSize: "1rem" }}>{isLive ? "Your interview link is live" : job.status === "paused" ? "Your link is paused" : "This role is closed"}</b>
          <span className="hr-muted">{isLive ? "Share it anywhere. Every applicant gets their own AI interview." : "Candidates can't apply right now."}</span>
        </div>
        <Pill tone={isLive ? "green" : "amber"} pulse={isLive} dot={!isLive}>{isLive ? "Accepting candidates" : JOB_STATUS[job.status]?.label}</Pill>
      </div>
      <div className="hr-linkbox" style={{ position: "relative" }}>
        <code>{link}</code>
        <span style={{ position: "relative" }}>
          <button className="hr-btn sm primary" onClick={copy}>{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}</button>
          {copied > 0 && <Burst key={copied} />}
        </span>
      </div>
      <div className="hr-row wrap" style={{ gap: 8, position: "relative" }}>
        <a className="hr-btn sm" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"><FaWhatsapp style={{ color: "#25D366" }} /> WhatsApp</a>
        <a className="hr-btn sm" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer"><FaLinkedin style={{ color: "#0A66C2" }} /> LinkedIn</a>
        <a className="hr-btn sm" href={link} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Preview candidate page</a>
      </div>
    </motion.div>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────

function SettingsModal({ job, onClose, onSaved }) {
  const [mustAsk, setMustAsk] = useState(job.settings.mustAsk.length ? job.settings.mustAsk : [""]);
  const [form, setForm] = useState({
    title: job.title,
    maxCandidates: job.settings.maxCandidates,
    deadline: job.settings.deadline ? job.settings.deadline.slice(0, 10) : "",
    requireCamera: job.settings.requireCamera,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { job: updated } = await hireAPI.updateJob(job.id, {
        ...form, maxCandidates: Number(form.maxCandidates), deadline: form.deadline || null,
        mustAsk: mustAsk.map(s => s.trim()).filter(Boolean),
      });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal as="form" onClose={onClose} onSubmit={save}>
      <ModalHead Icon={Settings} title="Role settings" onClose={onClose} />
      <div><label className="hr-label">Role title</label><input className="hr-input" value={form.title} onChange={set("title")} required /></div>
      <div>
        <label className="hr-label">Must-ask questions (up to 3)</label>
        <div className="hr-col" style={{ gap: 8 }}>
          {mustAsk.map((q, i) => (
            <div key={i} className="hr-row">
              <input className="hr-input" value={q} maxLength={400} onChange={e => setMustAsk(m => m.map((x, j) => (j === i ? e.target.value : x)))} />
              {mustAsk.length > 1 && <button type="button" className="hr-btn sm" onClick={() => setMustAsk(m => m.filter((_, j) => j !== i))} aria-label="Remove question"><X size={13} /></button>}
            </div>
          ))}
          {mustAsk.length < 3 && <button type="button" className="hr-link" style={{ alignSelf: "flex-start" }} onClick={() => setMustAsk(m => [...m, ""])}>+ Add question</button>}
        </div>
        <div className="hr-hint">Changes apply to candidates who apply after you save.</div>
      </div>
      <div className="hr-grid c2">
        <div><label className="hr-label">Max candidates</label><input className="hr-input" type="number" min={1} max={5000} value={form.maxCandidates} onChange={set("maxCandidates")} /></div>
        <div><label className="hr-label">Close link on</label><input className="hr-input" type="date" value={form.deadline} onChange={set("deadline")} /></div>
      </div>
      <label className="hr-check"><input type="checkbox" checked={form.requireCamera} onChange={set("requireCamera")} />Ask candidates to keep their camera on</label>
      {error && <div className="hr-error">{error}</div>}
      <div className="hr-row"><div className="hr-sp" /><button className="hr-btn primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button></div>
    </Modal>
  );
}

// ── Candidate report ────────────────────────────────────────────────────────

const SKILL_TONE = { strong: "green", adequate: "purple", weak: "red", not_assessed: "gray" };
const SKILL_LABEL = { strong: "Strong", adequate: "Adequate", weak: "Weak", not_assessed: "Not tested" };
const SKILL_FILL = { strong: 100, adequate: 66, weak: 33, not_assessed: 0 };
const CLAIM_TONE = { held: "green", shaky: "amber", collapsed: "red" };
const DIMENSIONS = [
  ["technicalDepth", "Technical depth", "Technical"], ["resumeCredibility", "Resume credibility", "Resume"], ["behavioral", "Behavioral", "Behavioral"],
  ["problemSolving", "Problem solving", "Problem solving"], ["communication", "Communication", "Communication"], ["confidence", "Confidence", "Confidence"],
];

function Section({ Icon, title, children, delay = 0 }) {
  return (
    <motion.div className="hr-card hr-col" style={{ gap: 12 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease: EASE }}>
      <div className="hr-row" style={{ gap: 8 }}>{Icon && <Icon size={16} style={{ color: "var(--c-accentText)" }} />}<b style={{ fontSize: ".95rem" }}>{title}</b></div>
      {children}
    </motion.div>
  );
}

function EvidenceList({ title, items, tone, delay }) {
  if (!items?.length) return null;
  return (
    <motion.div className="hr-col" style={{ gap: 8 }} variants={stagger(0.06, delay)} initial="hidden" animate="show">
      <motion.div variants={rise} className="hr-row" style={{ gap: 6 }}><Pill tone={tone} dot>{title}</Pill><span className="hr-muted">{items.length}</span></motion.div>
      {items.map((x, i) => (
        <motion.div key={i} variants={rise} className={`hr-ev ${tone}`}>
          <b>{x.point}</b>
          {x.evidence && <div className="hr-quote">“{x.evidence}”</div>}
        </motion.div>
      ))}
    </motion.div>
  );
}

function CandidateReport({ id, onClose, onDecision }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hireAPI.application(id)
      .then(d => { setData(d.application); setNotes(d.application.notes || ""); })
      .catch(err => setError(err.message));
  }, [id]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const decide = async (decision) => {
    setSaving(true);
    try {
      const next = data.decision === decision ? null : decision;
      await hireAPI.decide(id, { decision: next });
      setData(d => ({ ...d, decision: next }));
      onDecision(id, next);
    } finally {
      setSaving(false);
    }
  };
  const saveNotes = () => { if (notes !== (data.notes || "")) hireAPI.decide(id, { notes }).then(() => setData(d => ({ ...d, notes }))); };

  const a = data;
  const r = a?.result;
  const v = VERDICT[r?.verdict];
  const status = APP_STATUS[a?.status];
  const dims = a?.dimensions ? DIMENSIONS.filter(([k]) => a.dimensions[k] != null) : [];

  return (
    <>
      <motion.div className="hr-drawer-bg" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside className="hr-drawer" role="dialog" aria-modal="true" aria-label={a?.name || "Candidate report"}
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 36 }}>
        <div className="hr-drawer-head">
          <button className="hr-btn sm ghost" onClick={onClose} aria-label="Close"><X size={14} /></button>
          {a && <Avatar name={a.name} size={28} />}
          <b style={{ fontSize: ".95rem", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a?.name || "Candidate"}</b>
          {a?.status === "completed" && (
            <>
              <motion.button whileTap={{ scale: 0.92 }} className="hr-btn sm" disabled={saving} onClick={() => decide("rejected")}
                style={a.decision === "rejected" ? { background: "#DC262614", borderColor: "#DC262655", color: "#DC2626" } : undefined}>
                <ThumbsDown size={13} /> <span className="hide-sm">{a.decision === "rejected" ? "Rejected" : "Reject"}</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.92 }} className="hr-btn sm" disabled={saving} onClick={() => decide("shortlisted")}
                style={a.decision === "shortlisted" ? { background: "linear-gradient(135deg,#16A34A,#15803D)", borderColor: "transparent", color: "#fff", boxShadow: "0 8px 20px -10px #16A34A" } : undefined}>
                <ThumbsUp size={13} /> {a.decision === "shortlisted" ? "Shortlisted" : "Shortlist"}
              </motion.button>
            </>
          )}
        </div>

        <div className="hr-drawer-body">
          {error && <div className="hr-error">{error}</div>}
          {!a && !error && <Loading text="Opening report…" />}
          {a && (
            <>
              <motion.div className="hr-card hr-row wrap" style={{ gap: 20, overflow: "hidden" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Aurora grid={false} className="soft" />
                <div style={{ position: "relative" }}><ScoreRing value={r?.overall} size={124} stroke={11} /></div>
                <div className="hr-col" style={{ gap: 8, flex: 1, minWidth: 220, position: "relative" }}>
                  <div className="hr-row wrap" style={{ gap: 6 }}>
                    {v && <Pill tone={v.tone} dot>{v.label}</Pill>}
                    {status && <Pill tone={status.tone}>{status.label}</Pill>}
                    {a.percentile != null && <Pill tone="purple"><Trophy size={11} /> Top {101 - a.percentile}%</Pill>}
                  </div>
                  <div className="hr-muted" style={{ fontSize: ".85rem", wordBreak: "break-word" }}>{a.email} · {a.phone}</div>
                  <div className="hr-row wrap hr-muted" style={{ gap: 12 }}>
                    {r?.coveragePct != null && <span>Reached {r.coveragePct}% of questions</span>}
                    {a.durationSec != null && <span><Clock size={12} style={{ verticalAlign: -1 }} /> {Math.round(a.durationSec / 60)} min</span>}
                    {a.integrity?.tabSwitches > 0 && <span style={{ color: "#D97706" }}><MonitorX size={12} style={{ verticalAlign: -1 }} /> {a.integrity.tabSwitches} tab switch{a.integrity.tabSwitches === 1 ? "" : "es"}</span>}
                  </div>
                </div>
              </motion.div>

              {a.status !== "completed" && (
                <div className="hr-card hr-row" style={{ gap: 12 }}>
                  <span className="hr-icon-badge"><Clock size={17} /></span>
                  <span className="hr-muted" style={{ fontSize: ".86rem", lineHeight: 1.5 }}>
                    {a.status === "failed" ? "This interview couldn't be completed or scored. The candidate can retry from the same link." : "This candidate hasn't finished yet. The report appears here a few minutes after they finish."}
                  </span>
                </div>
              )}

              {r?.summary && (
                <motion.div className="hr-card" style={{ borderLeft: "3px solid #7567C9" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <p className="hr-sub" style={{ fontSize: ".96rem" }}>{r.summary}</p>
                </motion.div>
              )}

              {r?.redFlags?.length > 0 && <EvidenceList title="Red flags" items={r.redFlags} tone="red" delay={0.15} />}
              <EvidenceList title="Strengths" items={r?.strengths} tone="green" delay={0.2} />
              <EvidenceList title="Concerns" items={r?.concerns} tone="amber" delay={0.25} />

              {dims.length > 0 && (
                <Section Icon={Gauge} title="Breakdown" delay={0.2}>
                  <div className="hr-grid c2" style={{ alignItems: "center", gap: 20 }}>
                    {dims.length >= 3 && <Radar data={dims.map(([k, , short]) => ({ label: short, value: Math.round(a.dimensions[k]) }))} size={220} />}
                    <div className="hr-col" style={{ gap: 10 }}>
                      {dims.map(([k, label], i) => (
                        <div key={k} className="hr-col" style={{ gap: 4 }}>
                          <div className="hr-row" style={{ fontSize: ".84rem" }}><span style={{ flex: 1 }}>{label}</span><b>{a.dimensions[k]}</b></div>
                          <div className="hr-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${a.dimensions[k]}%` }} transition={{ delay: 0.3 + i * 0.08, duration: 0.9, ease: EASE }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>
              )}

              {r?.skillFit?.length > 0 && (
                <Section Icon={CheckCircle2} title="Fit on your JD's skills" delay={0.25}>
                  {r.skillFit.map((s, i) => (
                    <div key={s.skill} className="hr-col" style={{ gap: 4 }}>
                      <div className="hr-row"><span style={{ flex: 1, fontSize: ".88rem", fontWeight: 600 }}>{s.skill}</span><Pill tone={SKILL_TONE[s.level]}>{SKILL_LABEL[s.level] || s.level}</Pill></div>
                      <div className="hr-bar" style={{ height: 5 }}><motion.i initial={{ width: 0 }} animate={{ width: `${SKILL_FILL[s.level] ?? 50}%` }} transition={{ delay: 0.35 + i * 0.06, duration: 0.8 }} /></div>
                      {s.evidence && <div className="hr-quote">“{s.evidence}”</div>}
                    </div>
                  ))}
                </Section>
              )}

              {r?.claims?.length > 0 && (
                <Section Icon={ScanSearch} title="Resume claims, tested live" delay={0.3}>
                  {r.claims.map((c, i) => (
                    <div key={i} className="hr-row" style={{ alignItems: "flex-start" }}>
                      <span style={{ flex: 1, fontSize: ".86rem", color: "var(--c-textSub)" }}>{c.claim}</span>
                      <Pill tone={CLAIM_TONE[c.outcome]}>{c.outcome === "held" ? "Held up" : c.outcome === "shaky" ? "Shaky" : "Couldn't defend"}</Pill>
                    </div>
                  ))}
                </Section>
              )}

              {r?.nextRoundQuestions?.length > 0 && (
                <Section Icon={MessageSquareQuote} title="Ask in your next round" delay={0.35}>
                  <ol style={{ margin: 0, paddingLeft: 20, color: "var(--c-textSub)", fontSize: ".88rem", lineHeight: 1.65 }}>
                    {r.nextRoundQuestions.map((q, i) => <li key={i}>{q}</li>)}
                  </ol>
                </Section>
              )}

              {a.questions?.length > 0 && (
                <div className="hr-col" style={{ gap: 8 }}>
                  <b style={{ fontSize: ".95rem" }}>Full interview</b>
                  {a.questions.map(q => (
                    <details key={q.qid} className="hr-qa">
                      <summary>
                        <Score value={q.score != null ? q.score * 20 : null} />
                        <span style={{ flex: 1 }}>{q.question}</span>
                        {q.fromEmployer && <Pill tone="purple">Your question</Pill>}
                        <ChevronDown size={14} className="hr-chev" />
                      </summary>
                      <div className="hr-qa-body">
                        {!q.reached && <span className="hr-muted">Not reached. The interview ended before this question.</span>}
                        {q.exchange.map((t, i) => (
                          <div key={i} className="hr-col" style={{ gap: 4 }}>
                            <div className="hr-turn-i"><b>Interviewer{t.followUp ? " (follow-up)" : ""}:</b> {t.interviewer}</div>
                            <div className="hr-turn-c">{t.candidate || <i className="hr-muted">No answer</i>}</div>
                          </div>
                        ))}
                        {q.missing?.length > 0 && <div className="hr-muted">Missed: {q.missing.join("; ")}</div>}
                      </div>
                    </details>
                  ))}
                </div>
              )}

              <Section Icon={StickyNote} title="Your notes">
                <textarea className="hr-textarea" style={{ minHeight: 80 }} value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} placeholder="Only you can see these." />
              </Section>
            </>
          )}
        </div>
      </motion.aside>
    </>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

const FILTERS = [
  ["all", "All"], ["completed", "Completed"], ["shortlisted", "Shortlisted"], ["pending", "In progress"], ["rejected", "Rejected"],
];

function ParsingCard() {
  return (
    <motion.div className="hr-card hr-row wrap" style={{ gap: 22, overflow: "hidden" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Aurora grid={false} className="soft" />
      <div className="hr-doc" style={{ width: 150, height: 110, position: "relative", flexShrink: 0, padding: 12, background: "var(--c-card)" }}>
        {[90, 70, 85, 60, 75].map((w, i) => <div key={i} style={{ height: 6, width: `${w}%`, borderRadius: 3, background: "var(--c-active)", marginBottom: 9 }} />)}
        <span className="hr-scan" />
      </div>
      <div className="hr-col" style={{ gap: 6, flex: 1, minWidth: 220, position: "relative" }}>
        <b style={{ fontSize: "1.05rem" }}>Reading your job description…</b>
        <span className="hr-muted" style={{ fontSize: ".86rem", lineHeight: 1.5 }}>Pulling out the skills to test and preparing your must-ask questions. Usually under a minute.</span>
        <div className="hr-shimmerbar" style={{ marginTop: 6 }} />
      </div>
    </motion.div>
  );
}

export default function HireJobPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [job, setJob] = useState(null);
  const [apps, setApps] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState(false);
  const selected = params.get("candidate");

  const loadJob = useCallback(() => hireAPI.job(jobId).then(d => setJob(d.job)).catch(err => {
    if (err.data?.code === "NOT_STARTUP") navigate("/hire", { replace: true });
    else setError(err.message);
  }), [jobId, navigate]);
  const loadApps = useCallback(() => hireAPI.applications(jobId).then(d => setApps(d.applications)).catch(() => {}), [jobId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/hire", { replace: true }); return; }
    loadJob(); loadApps();
  }, [authLoading, user, loadJob, loadApps, navigate]);

  // While the JD is being read, poll quickly; afterwards refresh candidates periodically.
  useEffect(() => {
    if (!job) return;
    const t = setInterval(() => (job.status === "parsing" ? loadJob() : loadApps()), job.status === "parsing" ? 3000 : POLL_MS);
    return () => clearInterval(t);
  }, [job, loadJob, loadApps]);

  useEffect(() => { if (job) document.title = `${job.title} · Atyant Hire`; }, [job]);

  const shown = useMemo(() => (apps || []).filter(a => {
    if (filter === "completed") return a.status === "completed";
    if (filter === "shortlisted") return a.decision === "shortlisted";
    if (filter === "rejected") return a.decision === "rejected";
    if (filter === "pending") return !["completed", "failed"].includes(a.status);
    return true;
  }), [apps, filter]);

  const counts = useMemo(() => {
    const c = { all: apps?.length || 0, completed: 0, shortlisted: 0, rejected: 0, pending: 0 };
    for (const a of apps || []) {
      if (a.status === "completed") c.completed++;
      else if (a.status !== "failed") c.pending++;
      if (a.decision === "shortlisted") c.shortlisted++;
      if (a.decision === "rejected") c.rejected++;
    }
    return c;
  }, [apps]);

  const scores = useMemo(() => (apps || []).map(a => a.overall).filter(v => v != null), [apps]);
  const avg = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
  const best = scores.length ? Math.round(Math.max(...scores)) : null;

  const setStatus = async (status) => {
    setBusy(true);
    try {
      const { job: updated } = status === "live" && job.status === "ready" ? await hireAPI.publishJob(job.id) : await hireAPI.updateJob(job.id, { status });
      setJob(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    const blob = await hireAPI.exportCsv(job.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${job.slug}-candidates.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const openCandidate = useCallback((id) => setParams(id ? { candidate: id } : {}), [setParams]);
  const closeCandidate = useCallback(() => openCandidate(null), [openCandidate]);

  if (authLoading || (!job && !error)) return <HirePage><TopBar /><Loading /></HirePage>;
  if (!job) return <HirePage><TopBar /><div className="hr-narrow"><div className="hr-error">{error}</div><Link className="hr-btn" style={{ marginTop: 12 }} to="/hire">Back</Link></div></HirePage>;

  const s = JOB_STATUS[job.status] || JOB_STATUS.ready;
  const stats = [
    [Users, counts.all, "Applied", ""],
    [CheckCircle2, counts.completed, "Completed", ""],
    [ThumbsUp, counts.shortlisted, "Shortlisted", "warm"],
    [Gauge, avg ?? "—", "Average score", ""],
    [Trophy, best ?? "—", "Top score", "solid"],
  ];

  return (
    <HirePage>
      <TopBar><Link className="hr-btn sm ghost" to="/hire"><ArrowLeft size={14} /> <span className="hide-sm">All roles</span></Link></TopBar>
      <div className="hr-wrap hr-col" style={{ gap: 20 }}>
        <motion.div className="hr-dash-head" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Aurora />
          <div className="hr-row wrap" style={{ gap: 12, position: "relative", zIndex: 1, alignItems: "flex-start" }}>
            <div className="hr-col" style={{ gap: 10, flex: 1, minWidth: 240 }}>
              <div className="hr-row wrap" style={{ gap: 10 }}>
                <h1 className="hr-h2">{job.title}</h1>
                <Pill tone={s.tone} pulse={job.status === "live"} dot={job.status !== "live"}>{s.label}</Pill>
              </div>
              {job.skills?.required?.length > 0 && (
                <motion.div className="hr-row wrap" style={{ gap: 6 }} variants={stagger(0.05, 0.2)} initial="hidden" animate="show">
                  {job.skills.required.slice(0, 8).map(k => <motion.span key={k} variants={rise} className="hr-skill">{k}</motion.span>)}
                </motion.div>
              )}
            </div>
            <div className="hr-row wrap" style={{ gap: 8 }}>
              {job.status !== "parsing" && job.status !== "failed" && (
                <button className="hr-btn ghost" onClick={() => setShowSettings(true)}><Settings size={15} /> Settings</button>
              )}
              {job.status === "live" && <button className="hr-btn ghost" disabled={busy} onClick={() => setStatus("paused")}><Pause size={15} /> Pause</button>}
              {job.status === "paused" && <button className="hr-btn ghost" disabled={busy} onClick={() => setStatus("live")}><Play size={15} /> Resume</button>}
              {["live", "paused"].includes(job.status) && (
                <button className="hr-btn ghost danger" disabled={busy} onClick={() => { if (confirm("Close this role? The link will stop accepting candidates. This can't be undone.")) setStatus("closed"); }}>
                  <Lock size={15} /> Close
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {error && <div className="hr-error">{error}</div>}

        {job.status === "parsing" && <ParsingCard />}

        {job.status === "failed" && (
          <div className="hr-error">{job.failureReason || "We couldn't read this job description."} <Link to="/hire" className="hr-link">Create the role again</Link></div>
        )}

        {job.status === "ready" && (
          <motion.div className="hr-card hr-col hr-gborder" style={{ gap: 16 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <div className="hr-row" style={{ gap: 12 }}>
              <span className="hr-icon-badge solid"><ScanSearch size={18} /></span>
              <div className="hr-col" style={{ gap: 2 }}>
                <b style={{ fontSize: "1.05rem" }}>Review and publish</b>
                <span className="hr-muted">Candidates will be interviewed on these skills and on their own resume.</span>
              </div>
            </div>
            <div className="hr-grid c2">
              <div className="hr-col" style={{ gap: 8 }}>
                <span className="hr-label" style={{ margin: 0 }}>Skills we'll test</span>
                <motion.div className="hr-row wrap" style={{ gap: 6 }} variants={stagger(0.05, 0.1)} initial="hidden" animate="show">
                  {(job.skills?.required || []).map(k => <motion.span key={k} variants={rise} className="hr-skill">{k}</motion.span>)}
                  {(job.skills?.niceToHave || []).map(k => <motion.span key={k} variants={rise} className="hr-skill soft">{k}</motion.span>)}
                  {!job.skills?.required?.length && <span className="hr-muted">No specific skills found. The interview will focus on the candidate's resume and projects.</span>}
                </motion.div>
              </div>
              <div className="hr-col" style={{ gap: 8 }}>
                <span className="hr-label" style={{ margin: 0 }}>Your must-ask questions</span>
                {job.settings.mustAsk.length
                  ? job.settings.mustAsk.map((q, i) => <div key={i} className="hr-turn-c" style={{ fontSize: ".86rem" }}>{i + 1}. {q}</div>)
                  : <span className="hr-muted">None. <button className="hr-link" onClick={() => setShowSettings(true)}>Add some</button></span>}
              </div>
            </div>
            <div className="hr-row"><div className="hr-sp" /><button className="hr-btn primary lg glow" disabled={busy} onClick={() => setStatus("live")}><Rocket size={16} /> Publish and get link</button></div>
          </motion.div>
        )}

        {["live", "paused", "closed"].includes(job.status) && <ShareCard job={job} />}

        {job.status !== "parsing" && job.status !== "failed" && apps?.length > 0 && (
          <motion.div className="hr-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }} variants={stagger(0.06, 0.1)} initial="hidden" animate="show">
            {stats.map(([Icon, value, label, tone]) => (
              <motion.div key={label} variants={rise}>
                <GlowCard className="hr-card hr-stattile" style={{ padding: 16, height: "100%", boxSizing: "border-box", gap: 12 }}>
                  <span className={`hr-icon-badge ${tone}`} style={{ width: 34, height: 34, borderRadius: 10 }}><Icon size={16} /></span>
                  <div className="hr-stat"><b style={{ fontSize: "1.7rem" }}>{typeof value === "number" ? <CountUp value={value} /> : value}</b><span>{label}</span></div>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        {job.status !== "parsing" && job.status !== "failed" && (
          <div className="hr-col" style={{ gap: 12 }}>
            <div className="hr-row wrap" style={{ gap: 8 }}>
              <div className="hr-seg" role="tablist">
                {FILTERS.map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={filter === k} className={`hr-seg-btn ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>
                    {filter === k && <motion.span layoutId="hr-seg-bg" className="hr-seg-bg" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    <span>{l}</span>{counts[k] ? <em>{counts[k]}</em> : null}
                  </button>
                ))}
              </div>
              <div className="hr-sp" />
              <motion.button whileTap={{ rotate: 180 }} className="hr-btn sm" onClick={loadApps} aria-label="Refresh"><RefreshCw size={13} /></motion.button>
              {apps?.length > 0 && <button className="hr-btn sm" onClick={exportCsv}><Download size={13} /> CSV</button>}
            </div>

            <div className="hr-card" style={{ padding: 0, overflowX: "auto" }}>
              {!apps ? <Loading /> : shown.length === 0 ? (
                <div className="hr-empty hr-col" style={{ alignItems: "center", gap: 10 }}>
                  <span className="hr-icon-badge"><Users size={18} /></span>
                  <span style={{ maxWidth: 420, lineHeight: 1.5 }}>
                    {apps.length === 0
                      ? (job.status === "ready" ? "Publish the role to start receiving candidates." : "No candidates yet. Share your link. Candidates show up here, ranked, as they finish their interviews.")
                      : "No candidates match this filter."}
                  </span>
                </div>
              ) : (
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th><th>Candidate</th><th>Score</th><th>Verdict</th>
                      <th className="hide-sm">Flags</th><th className="hide-sm">Status</th><th className="hide-sm">Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((a, i) => {
                      const v = VERDICT[a.verdict];
                      const st = APP_STATUS[a.status] || APP_STATUS.applied;
                      return (
                        <motion.tr key={a.id} className={`click ${selected === a.id ? "sel" : ""} ${a.rank === 1 ? "top" : ""}`} onClick={() => openCandidate(a.id)}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.035, 0.5), duration: 0.4 }}>
                          <td>{a.rank != null ? <span className={`hr-rank ${a.rank <= 3 ? `r${a.rank}` : ""}`}>{a.rank}</span> : ""}</td>
                          <td>
                            <div className="hr-row" style={{ gap: 10 }}>
                              <span className="hide-sm" style={{ display: "inline-flex" }}><Avatar name={a.name} size={32} /></span>
                              <div className="hr-col" style={{ gap: 1, minWidth: 0 }}>
                                <div className="hr-row" style={{ gap: 6 }}>
                                  <b style={{ whiteSpace: "nowrap" }}>{a.name}</b>
                                  {a.decision === "shortlisted" && <ThumbsUp size={13} style={{ color: "#16A34A" }} />}
                                  {a.decision === "rejected" && <ThumbsDown size={13} style={{ color: "#DC2626" }} />}
                                </div>
                                <div className="hr-muted hide-sm">{a.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><ScoreBar value={a.overall} /></td>
                          <td>{v ? <Pill tone={v.tone}>{v.label}</Pill> : <span className="hr-muted">—</span>}</td>
                          <td className="hide-sm">
                            <div className="hr-row" style={{ gap: 8 }}>
                              {a.redFlags > 0 && <span title="Red flags" style={{ color: "#DC2626", display: "inline-flex", gap: 4, alignItems: "center" }}><AlertTriangle size={14} /> {a.redFlags}</span>}
                              {a.integrity?.tabSwitches > 0 && <span title="Tab switches" style={{ color: "#D97706", display: "inline-flex", gap: 4, alignItems: "center" }}><MonitorX size={14} /> {a.integrity.tabSwitches}</span>}
                              {!a.redFlags && !a.integrity?.tabSwitches && <span className="hr-muted">—</span>}
                            </div>
                          </td>
                          <td className="hide-sm"><Pill tone={st.tone} pulse={a.status === "in_progress"}>{st.label}</Pill></td>
                          <td className="hide-sm hr-muted">{timeAgo(a.appliedAt)}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSettings && <SettingsModal key="settings" job={job} onClose={() => setShowSettings(false)} onSaved={j => { setJob(j); setShowSettings(false); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {selected && (
          <CandidateReport
            key={selected}
            id={selected}
            onClose={closeCandidate}
            onDecision={(id, decision) => setApps(list => list.map(x => (x.id === id ? { ...x, decision } : x)))}
          />
        )}
      </AnimatePresence>
    </HirePage>
  );
}
