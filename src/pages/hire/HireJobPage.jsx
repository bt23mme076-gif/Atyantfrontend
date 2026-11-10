import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Copy, Check, Download, Share2, Pause, Play, Lock, Settings, X, ThumbsUp, ThumbsDown, AlertTriangle,
  MonitorX, Clock, MessageSquareQuote, ChevronDown, RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { hireAPI } from "../../api";
import { TopBar, Loading, Pill, Score, Spinner } from "./HireShared";
import { VERDICT, APP_STATUS, JOB_STATUS, timeAgo } from "./hireUtils";

const POLL_MS = 15000;

// ── Share link ──────────────────────────────────────────────────────────────

function ShareCard({ job }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/hire/i/${job.slug}`;
  const msg = `We're hiring: ${job.title}. Take a 15-minute AI interview here, anytime: ${link}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };
  return (
    <div className="hr-card hr-col" style={{ gap: 10 }}>
      <div className="hr-row"><Share2 size={16} style={{ color: "var(--c-accentText)" }} /><b style={{ fontSize: ".92rem" }}>Interview link</b></div>
      <div className="hr-linkbox">
        <code>{link}</code>
        <button className="hr-btn sm primary" onClick={copy}>{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}</button>
      </div>
      <div className="hr-row wrap" style={{ gap: 6 }}>
        <a className="hr-btn sm" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">WhatsApp</a>
        <a className="hr-btn sm" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer">LinkedIn</a>
        <a className="hr-btn sm" href={link} target="_blank" rel="noreferrer">Preview candidate page</a>
      </div>
    </div>
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
    <>
      <div className="hr-drawer-bg" onClick={onClose} />
      <form className="hr-modal hr-col" style={{ gap: 14 }} onSubmit={save}>
        <div className="hr-row">
          <span className="hr-h3" style={{ fontSize: "1.15rem" }}>Role settings</span>
          <div className="hr-sp" />
          <button type="button" className="hr-btn sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div><label className="hr-label">Role title</label><input className="hr-input" value={form.title} onChange={set("title")} required /></div>
        <div>
          <label className="hr-label">Must-ask questions (up to 3)</label>
          <div className="hr-col" style={{ gap: 8 }}>
            {mustAsk.map((q, i) => (
              <div key={i} className="hr-row">
                <input className="hr-input" value={q} maxLength={400} onChange={e => setMustAsk(m => m.map((x, j) => (j === i ? e.target.value : x)))} />
                {mustAsk.length > 1 && <button type="button" className="hr-btn sm" onClick={() => setMustAsk(m => m.filter((_, j) => j !== i))}><X size={13} /></button>}
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
      </form>
    </>
  );
}

// ── Candidate report ────────────────────────────────────────────────────────

const SKILL_TONE = { strong: "green", adequate: "purple", weak: "red", not_assessed: "gray" };
const SKILL_LABEL = { strong: "Strong", adequate: "Adequate", weak: "Weak", not_assessed: "Not tested" };
const CLAIM_TONE = { held: "green", shaky: "amber", collapsed: "red" };
const DIMENSIONS = [
  ["technicalDepth", "Technical depth"], ["resumeCredibility", "Resume credibility"], ["behavioral", "Behavioral"],
  ["problemSolving", "Problem solving"], ["communication", "Communication"], ["confidence", "Confidence"],
];

function EvidenceList({ title, items, tone }) {
  if (!items?.length) return null;
  return (
    <div className="hr-col" style={{ gap: 8 }}>
      <div className="hr-row" style={{ gap: 6 }}><Pill tone={tone}>{title}</Pill></div>
      {items.map((x, i) => (
        <div key={i} className="hr-ev">
          <b>{x.point}</b>
          {x.evidence && <div className="hr-quote">“{x.evidence}”</div>}
        </div>
      ))}
    </div>
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

  return (
    <>
      <div className="hr-drawer-bg" onClick={onClose} />
      <aside className="hr-drawer">
        <div className="hr-drawer-head">
          <button className="hr-btn sm" onClick={onClose}><X size={14} /></button>
          <b style={{ fontSize: ".95rem", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a?.name || "Candidate"}</b>
          {a?.status === "completed" && (
            <>
              <button className="hr-btn sm" disabled={saving} onClick={() => decide("rejected")}
                style={a.decision === "rejected" ? { background: "#DC262614", borderColor: "#DC262655", color: "#DC2626" } : undefined}>
                <ThumbsDown size={13} /> {a.decision === "rejected" ? "Rejected" : "Reject"}
              </button>
              <button className="hr-btn sm" disabled={saving} onClick={() => decide("shortlisted")}
                style={a.decision === "shortlisted" ? { background: "#16A34A", borderColor: "#16A34A", color: "#fff" } : undefined}>
                <ThumbsUp size={13} /> {a.decision === "shortlisted" ? "Shortlisted" : "Shortlist"}
              </button>
            </>
          )}
        </div>

        <div className="hr-drawer-body">
          {error && <div className="hr-error">{error}</div>}
          {!a && !error && <Loading />}
          {a && (
            <>
              <div className="hr-card hr-row wrap" style={{ gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", lineHeight: 1 }}>{r?.overall != null ? Math.round(r.overall) : "—"}</div>
                  <div className="hr-muted">out of 100</div>
                </div>
                <div className="hr-col" style={{ gap: 6, flex: 1, minWidth: 220 }}>
                  <div className="hr-row wrap" style={{ gap: 6 }}>
                    {v && <Pill tone={v.tone}>{v.label}</Pill>}
                    {status && <Pill tone={status.tone}>{status.label}</Pill>}
                    {a.percentile != null && <Pill tone="purple">Top {101 - a.percentile}%</Pill>}
                  </div>
                  <div className="hr-muted">{a.email} · {a.phone}</div>
                  <div className="hr-row wrap hr-muted" style={{ gap: 12 }}>
                    {r?.coveragePct != null && <span>Reached {r.coveragePct}% of questions</span>}
                    {a.durationSec != null && <span><Clock size={12} style={{ verticalAlign: -1 }} /> {Math.round(a.durationSec / 60)} min</span>}
                    {a.integrity?.tabSwitches > 0 && <span style={{ color: "#D97706" }}><MonitorX size={12} style={{ verticalAlign: -1 }} /> {a.integrity.tabSwitches} tab switch{a.integrity.tabSwitches === 1 ? "" : "es"}</span>}
                  </div>
                </div>
              </div>

              {a.status !== "completed" && (
                <div className="hr-card hr-muted">
                  {a.status === "failed" ? "This interview couldn't be completed or scored. The candidate wasn't charged to your credits." : "This candidate hasn't finished yet. The report appears here a few minutes after they finish."}
                </div>
              )}

              {r?.summary && <div className="hr-card"><p className="hr-sub" style={{ fontSize: ".95rem" }}>{r.summary}</p></div>}

              {r?.redFlags?.length > 0 && <EvidenceList title="Red flags" items={r.redFlags} tone="red" />}
              <EvidenceList title="Strengths" items={r?.strengths} tone="green" />
              <EvidenceList title="Concerns" items={r?.concerns} tone="amber" />

              {r?.skillFit?.length > 0 && (
                <div className="hr-card hr-col" style={{ gap: 10 }}>
                  <b style={{ fontSize: ".92rem" }}>Fit on your JD's skills</b>
                  {r.skillFit.map(s => (
                    <div key={s.skill} className="hr-col" style={{ gap: 2 }}>
                      <div className="hr-row"><span style={{ flex: 1, fontSize: ".88rem" }}>{s.skill}</span><Pill tone={SKILL_TONE[s.level]}>{SKILL_LABEL[s.level] || s.level}</Pill></div>
                      {s.evidence && <div className="hr-quote">“{s.evidence}”</div>}
                    </div>
                  ))}
                </div>
              )}

              {r?.claims?.length > 0 && (
                <div className="hr-card hr-col" style={{ gap: 10 }}>
                  <b style={{ fontSize: ".92rem" }}>Resume claims, tested live</b>
                  {r.claims.map((c, i) => (
                    <div key={i} className="hr-row" style={{ alignItems: "flex-start" }}>
                      <span style={{ flex: 1, fontSize: ".86rem", color: "var(--c-textSub)" }}>{c.claim}</span>
                      <Pill tone={CLAIM_TONE[c.outcome]}>{c.outcome === "held" ? "Held up" : c.outcome === "shaky" ? "Shaky" : "Couldn't defend"}</Pill>
                    </div>
                  ))}
                </div>
              )}

              {a.dimensions && (
                <div className="hr-card hr-col" style={{ gap: 10 }}>
                  <b style={{ fontSize: ".92rem" }}>Breakdown</b>
                  {DIMENSIONS.filter(([k]) => a.dimensions[k] != null).map(([k, label]) => (
                    <div key={k} className="hr-col" style={{ gap: 4 }}>
                      <div className="hr-row" style={{ fontSize: ".84rem" }}><span style={{ flex: 1 }}>{label}</span><b>{a.dimensions[k]}</b></div>
                      <div className="hr-bar"><i style={{ width: `${a.dimensions[k]}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}

              {r?.nextRoundQuestions?.length > 0 && (
                <div className="hr-card hr-col" style={{ gap: 8 }}>
                  <div className="hr-row"><MessageSquareQuote size={16} style={{ color: "var(--c-accentText)" }} /><b style={{ fontSize: ".92rem" }}>Ask in your next round</b></div>
                  <ol style={{ margin: 0, paddingLeft: 20, color: "var(--c-textSub)", fontSize: ".88rem", lineHeight: 1.6 }}>
                    {r.nextRoundQuestions.map((q, i) => <li key={i}>{q}</li>)}
                  </ol>
                </div>
              )}

              {a.questions?.length > 0 && (
                <div className="hr-col" style={{ gap: 8 }}>
                  <b style={{ fontSize: ".92rem" }}>Full interview</b>
                  {a.questions.map(q => (
                    <details key={q.qid} className="hr-qa">
                      <summary>
                        <Score value={q.score != null ? q.score * 20 : null} />
                        <span style={{ flex: 1 }}>{q.question}</span>
                        {q.fromEmployer && <Pill tone="purple">Your question</Pill>}
                        <ChevronDown size={14} />
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

              <div className="hr-card hr-col" style={{ gap: 8 }}>
                <b style={{ fontSize: ".92rem" }}>Your notes</b>
                <textarea className="hr-textarea" style={{ minHeight: 80 }} value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} placeholder="Only you can see these." />
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

const FILTERS = [
  ["all", "All"], ["completed", "Completed"], ["shortlisted", "Shortlisted"], ["pending", "In progress"], ["rejected", "Rejected"],
];

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

  const loadJob = useCallback(() => hireAPI.job(jobId).then(d => setJob(d.job)).catch(err => setError(err.message)), [jobId]);
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

  const openCandidate = (id) => setParams(id ? { candidate: id } : {});

  if (authLoading || (!job && !error)) return <div className="hr-page"><TopBar /><Loading /></div>;
  if (!job) return <div className="hr-page"><TopBar /><div className="hr-narrow"><div className="hr-error">{error}</div><Link className="hr-btn" style={{ marginTop: 12 }} to="/hire">Back</Link></div></div>;

  const s = JOB_STATUS[job.status] || JOB_STATUS.ready;

  return (
    <div className="hr-page">
      <TopBar><Link className="hr-btn sm" to="/hire"><ArrowLeft size={14} /> All roles</Link></TopBar>
      <div className="hr-wrap hr-col" style={{ gap: 18 }}>
        <div className="hr-row wrap" style={{ gap: 10 }}>
          <div className="hr-col" style={{ gap: 6 }}>
            <div className="hr-row wrap" style={{ gap: 8 }}><h1 className="hr-h2">{job.title}</h1><Pill tone={s.tone}>{s.label}</Pill></div>
            {job.skills?.required?.length > 0 && (
              <div className="hr-row wrap" style={{ gap: 6 }}>
                {job.skills.required.slice(0, 8).map(k => <span key={k} className="hr-chip">{k}</span>)}
              </div>
            )}
          </div>
          <div className="hr-sp" />
          {job.status !== "parsing" && job.status !== "failed" && (
            <button className="hr-btn" onClick={() => setShowSettings(true)}><Settings size={15} /> Settings</button>
          )}
          {job.status === "live" && <button className="hr-btn" disabled={busy} onClick={() => setStatus("paused")}><Pause size={15} /> Pause</button>}
          {job.status === "paused" && <button className="hr-btn" disabled={busy} onClick={() => setStatus("live")}><Play size={15} /> Resume</button>}
          {["live", "paused"].includes(job.status) && (
            <button className="hr-btn danger" disabled={busy} onClick={() => { if (confirm("Close this role? The link will stop accepting candidates. This can't be undone.")) setStatus("closed"); }}>
              <Lock size={15} /> Close
            </button>
          )}
        </div>

        {error && <div className="hr-error">{error}</div>}

        {job.status === "parsing" && (
          <div className="hr-card hr-row" style={{ gap: 14 }}>
            <Spinner />
            <div className="hr-col" style={{ gap: 2 }}>
              <b>Reading your job description…</b>
              <span className="hr-muted">Pulling out the skills to test and preparing your must-ask questions. Usually under a minute.</span>
            </div>
          </div>
        )}

        {job.status === "failed" && (
          <div className="hr-error">{job.failureReason || "We couldn't read this job description."} <Link to="/hire" className="hr-link">Create the role again</Link></div>
        )}

        {job.status === "ready" && (
          <div className="hr-card hr-col" style={{ gap: 14, borderColor: "#7567C966" }}>
            <div className="hr-col" style={{ gap: 4 }}>
              <b style={{ fontSize: "1rem" }}>Review and publish</b>
              <span className="hr-muted">Candidates will be interviewed on these skills and on their own resume.</span>
            </div>
            <div className="hr-grid c2">
              <div className="hr-col" style={{ gap: 6 }}>
                <span className="hr-label" style={{ margin: 0 }}>Skills we'll test</span>
                <div className="hr-row wrap" style={{ gap: 6 }}>
                  {(job.skills?.required || []).map(k => <span key={k} className="hr-chip">{k}</span>)}
                  {(job.skills?.niceToHave || []).map(k => <span key={k} className="hr-chip" style={{ opacity: .7 }}>{k}</span>)}
                  {!job.skills?.required?.length && <span className="hr-muted">No specific skills found. The interview will focus on the candidate's resume and projects.</span>}
                </div>
              </div>
              <div className="hr-col" style={{ gap: 6 }}>
                <span className="hr-label" style={{ margin: 0 }}>Your must-ask questions</span>
                {job.settings.mustAsk.length
                  ? job.settings.mustAsk.map((q, i) => <div key={i} style={{ fontSize: ".86rem" }}>{i + 1}. {q}</div>)
                  : <span className="hr-muted">None. <button className="hr-link" onClick={() => setShowSettings(true)}>Add some</button></span>}
              </div>
            </div>
            <div className="hr-row"><div className="hr-sp" /><button className="hr-btn primary lg" disabled={busy} onClick={() => setStatus("live")}>Publish and get link</button></div>
          </div>
        )}

        {["live", "paused", "closed"].includes(job.status) && <ShareCard job={job} />}

        {job.status !== "parsing" && job.status !== "failed" && (
          <div className="hr-col" style={{ gap: 10 }}>
            <div className="hr-row wrap" style={{ gap: 8 }}>
              <div className="hr-tabs">
                {FILTERS.map(([k, l]) => (
                  <button key={k} className={`hr-tab ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>{l} {counts[k] ? `· ${counts[k]}` : ""}</button>
                ))}
              </div>
              <div className="hr-sp" />
              <button className="hr-btn sm" onClick={loadApps}><RefreshCw size={13} /></button>
              {apps?.length > 0 && <button className="hr-btn sm" onClick={exportCsv}><Download size={13} /> CSV</button>}
            </div>

            <div className="hr-card" style={{ padding: 0, overflowX: "auto" }}>
              {!apps ? <Loading /> : shown.length === 0 ? (
                <div className="hr-empty">
                  {apps.length === 0
                    ? (job.status === "ready" ? "Publish the role to start receiving candidates." : "No candidates yet. Share your link. Candidates show up here, ranked, as they finish their interviews.")
                    : "No candidates match this filter."}
                </div>
              ) : (
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th><th>Candidate</th><th>Score</th><th>Verdict</th>
                      <th className="hide-sm">Flags</th><th className="hide-sm">Status</th><th className="hide-sm">Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map(a => {
                      const v = VERDICT[a.verdict];
                      const st = APP_STATUS[a.status] || APP_STATUS.applied;
                      return (
                        <tr key={a.id} className={`click ${selected === a.id ? "sel" : ""}`} onClick={() => openCandidate(a.id)}>
                          <td className="hr-muted">{a.rank ?? ""}</td>
                          <td>
                            <div className="hr-row" style={{ gap: 6 }}>
                              <b>{a.name}</b>
                              {a.decision === "shortlisted" && <ThumbsUp size={13} style={{ color: "#16A34A" }} />}
                              {a.decision === "rejected" && <ThumbsDown size={13} style={{ color: "#DC2626" }} />}
                            </div>
                            <div className="hr-muted">{a.email}</div>
                          </td>
                          <td><Score value={a.overall} /></td>
                          <td>{v ? <Pill tone={v.tone}>{v.label}</Pill> : <span className="hr-muted">—</span>}</td>
                          <td className="hide-sm">
                            <div className="hr-row" style={{ gap: 8 }}>
                              {a.redFlags > 0 && <span title="Red flags" style={{ color: "#DC2626" }}><AlertTriangle size={14} /> {a.redFlags}</span>}
                              {a.integrity?.tabSwitches > 0 && <span title="Tab switches" style={{ color: "#D97706" }}><MonitorX size={14} /> {a.integrity.tabSwitches}</span>}
                              {!a.redFlags && !a.integrity?.tabSwitches && <span className="hr-muted">—</span>}
                            </div>
                          </td>
                          <td className="hide-sm"><Pill tone={st.tone}>{st.label}</Pill></td>
                          <td className="hide-sm hr-muted">{timeAgo(a.appliedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {showSettings && <SettingsModal job={job} onClose={() => setShowSettings(false)} onSaved={j => { setJob(j); setShowSettings(false); }} />}
      {selected && (
        <CandidateReport
          key={selected}
          id={selected}
          onClose={() => openCandidate(null)}
          onDecision={(id, decision) => setApps(list => list.map(x => (x.id === id ? { ...x, decision } : x)))}
        />
      )}
    </div>
  );
}
