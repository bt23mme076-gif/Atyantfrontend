import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus, FileText, Building2, Users, Briefcase, LogOut, Upload, X, ArrowRight, Radio, CheckCircle2, Sparkles, Link2, Mic, ListOrdered, UserX,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { hireAPI } from "../../api";
import { TopBar, Loading, Pill, HirePage, Modal, ModalHead, InterviewLength } from "./HireShared";
import { JOB_STATUS, timeAgo, clampQuestions } from "./hireUtils";
import { Aurora, CountUp, GlowCard, VoiceOrb } from "./HireFx";
import { rise, stagger } from "./hireMotion";
import HireLanding from "./HireLanding";

const CATEGORIES = [
  ["", "Auto-detect from JD"], ["tech", "Engineering"], ["analytics", "Data / Analytics"], ["product", "Product"],
  ["business", "Business / Consulting"], ["core", "Core engineering"], ["hr", "HR / Operations"],
];

// ── Company setup ───────────────────────────────────────────────────────────

function CompanyForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({ name: initial?.name || "", website: initial?.website || "", logoUrl: initial?.logoUrl || "", about: initial?.about || "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { company } = await hireAPI.saveCompany(form);
      onSaved(company);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.form className="hr-card pad-lg hr-col hr-gborder" style={{ gap: 16 }} onSubmit={save}
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <div className="hr-row" style={{ gap: 14 }}>
        <span className="hr-icon-badge solid"><Building2 size={18} /></span>
        <div className="hr-col" style={{ gap: 2 }}>
          <span className="hr-h3" style={{ fontSize: "1.15rem" }}>{initial ? "Company details" : "Tell candidates who you are"}</span>
          <span className="hr-muted">Shown on your interview link, so candidates know who they're interviewing with.</span>
        </div>
      </div>
      <div><label className="hr-label">Company name</label><input className="hr-input" value={form.name} onChange={set("name")} required maxLength={120} /></div>
      <div className="hr-grid c2">
        <div><label className="hr-label">Website</label><input className="hr-input" value={form.website} onChange={set("website")} placeholder="https://" /></div>
        <div><label className="hr-label">Logo URL (optional)</label><input className="hr-input" value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://…/logo.png" /></div>
      </div>
      <div><label className="hr-label">One line about you (optional)</label><textarea className="hr-textarea" style={{ minHeight: 80 }} value={form.about} onChange={set("about")} maxLength={1000} placeholder="We're building…" /></div>
      {error && <div className="hr-error">{error}</div>}
      <div className="hr-row">
        {onCancel && <button type="button" className="hr-btn" onClick={onCancel}>Cancel</button>}
        <div className="hr-sp" />
        <button className="hr-btn primary" disabled={busy}>{busy ? "Saving…" : initial ? "Save" : "Continue"} {!busy && <ArrowRight size={15} className="hr-arrow" />}</button>
      </div>
    </motion.form>
  );
}

// ── New job ─────────────────────────────────────────────────────────────────

function NewJobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", jdText: "", interviewCategory: "", maxCandidates: 200, deadline: "", requireCamera: true });
  const [jdFile, setJdFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [mustAsk, setMustAsk] = useState([""]);
  const [length, setLength] = useState({ durationMin: 15, questionCount: 10 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const asked = mustAsk.map(s => s.trim()).filter(Boolean);
  const questionCount = clampQuestions(length.durationMin, length.questionCount, asked.length);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { job } = await hireAPI.createJob({ ...form, jdFile, mustAsk: asked, durationMin: length.durationMin, questionCount });
      onCreated(job);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") setJdFile(f);
  };

  return (
    <Modal as="form" onClose={onClose} onSubmit={submit}>
      <ModalHead Icon={Sparkles} title="New role" sub="Paste the JD. Your interview link is ready in about a minute." onClose={onClose} />
      <div><label className="hr-label">Role title</label><input className="hr-input" value={form.title} onChange={set("title")} required maxLength={120} placeholder="e.g. Backend Engineering Intern" autoFocus /></div>
      <div>
        <label className="hr-label">Job description</label>
        {jdFile ? (
          <div className="hr-file has" style={{ cursor: "default" }}>
            <span className="hr-file-ic"><FileText size={17} /></span><span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{jdFile.name}</span>
            <button type="button" className="hr-link" onClick={() => setJdFile(null)}>Remove</button>
          </div>
        ) : (
          <>
            <textarea className="hr-textarea" value={form.jdText} onChange={set("jdText")} placeholder="Paste the full JD: responsibilities, requirements, nice-to-haves." />
            <label className={`hr-file ${drag ? "drag" : ""}`} style={{ marginTop: 8, padding: 12 }}
              onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}>
              <span className="hr-file-ic" style={{ width: 32, height: 32, borderRadius: 9 }}><Upload size={15} /></span>
              <span>Or drop / upload the JD as a PDF</span>
              <input type="file" accept="application/pdf" onChange={e => setJdFile(e.target.files?.[0] || null)} />
            </label>
          </>
        )}
      </div>
      <div>
        <label className="hr-label">Questions every candidate must answer (optional, up to 3)</label>
        <div className="hr-col" style={{ gap: 8 }}>
          <AnimatePresence initial={false}>
            {mustAsk.map((q, i) => (
              <motion.div key={i} className="hr-row" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <input className="hr-input" value={q} maxLength={400}
                  onChange={e => setMustAsk(m => m.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={i === 0 ? "e.g. Why do you want to work at an early-stage startup?" : "Another question"} />
                {mustAsk.length > 1 && <button type="button" className="hr-btn sm" onClick={() => setMustAsk(m => m.filter((_, j) => j !== i))} aria-label="Remove question"><X size={13} /></button>}
              </motion.div>
            ))}
          </AnimatePresence>
          {mustAsk.length < 3 && <button type="button" className="hr-link" style={{ alignSelf: "flex-start" }} onClick={() => setMustAsk(m => [...m, ""])}>+ Add question</button>}
        </div>
      </div>
      <InterviewLength durationMin={length.durationMin} questionCount={length.questionCount} mustAskCount={asked.length} onChange={setLength} />
      <div className="hr-grid c2">
        <div>
          <label className="hr-label">Interview focus</label>
          <select className="hr-select" value={form.interviewCategory} onChange={set("interviewCategory")}>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div><label className="hr-label">Max candidates</label><input className="hr-input" type="number" min={1} max={5000} value={form.maxCandidates} onChange={set("maxCandidates")} /></div>
        <div><label className="hr-label">Close link on (optional)</label><input className="hr-input" type="date" value={form.deadline} onChange={set("deadline")} /></div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <label className="hr-check"><input type="checkbox" checked={form.requireCamera} onChange={set("requireCamera")} />Ask candidates to keep their camera on</label>
        </div>
      </div>
      {error && <div className="hr-error">{error}</div>}
      <div className="hr-row wrap">
        <span className="hr-muted">Each interview: {length.durationMin} minutes, {questionCount} questions.</span>
        <div className="hr-sp" />
        <button className="hr-btn primary" disabled={busy}>{busy ? "Creating…" : "Create role"} {!busy && <ArrowRight size={15} className="hr-arrow" />}</button>
      </div>
    </Modal>
  );
}

// ── Dashboard (signed in) ───────────────────────────────────────────────────

function StatTile({ Icon, value, label, tone, delay, children }) {
  return (
    <motion.div variants={rise}>
      <GlowCard className="hr-card hr-stattile" style={{ height: "100%", boxSizing: "border-box" }}>
        <span className={`hr-icon-badge ${tone || ""}`}><Icon size={18} /></span>
        <div className="hr-stat">
          <b>{typeof value === "number" ? <CountUp value={value} delay={delay} /> : value}</b>
          <span>{label}</span>
          {children}
        </div>
        <span className="hr-spark" />
      </GlowCard>
    </motion.div>
  );
}

function EmptyRoles({ onNew }) {
  const steps = [[FileText, "Paste your JD"], [Link2, "Share the link"], [Mic, "AI interviews them"], [ListOrdered, "Get a ranked list"]];
  return (
    <motion.div className="hr-card hr-empty hr-col" style={{ alignItems: "center", gap: 16, overflow: "hidden" }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Aurora grid={false} className="soft" />
      <div style={{ position: "relative" }}><VoiceOrb size={110} /></div>
      <div className="hr-h2 sm" style={{ position: "relative" }}>Create your first role</div>
      <div className="hr-muted" style={{ maxWidth: 380, position: "relative", fontSize: ".9rem", lineHeight: 1.5 }}>Paste a job description and you'll get a link to share with applicants in about a minute.</div>
      <div className="hr-row wrap" style={{ justifyContent: "center", gap: 8, position: "relative" }}>
        {steps.map(([Icon, t], i) => (
          <motion.span key={t} className="hr-chip glass" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
            <Icon size={13} /> {t}
          </motion.span>
        ))}
      </div>
      <button className="hr-btn primary lg glow" style={{ position: "relative" }} onClick={onNew}><Plus size={17} /> Create a role</button>
    </motion.div>
  );
}

function Dashboard({ company, setCompany, user }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editCompany, setEditCompany] = useState(false);

  const load = useCallback(() => {
    hireAPI.jobs().then(d => setJobs(d.jobs)).catch(err => setError(err.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const totals = (jobs || []).reduce((a, j) => ({ applied: a.applied + (j.stats?.applied || 0), completed: a.completed + (j.stats?.completed || 0) }), { applied: 0, completed: 0 });
  const live = jobs?.filter(j => j.status === "live").length;
  const first = (user?.name || user?.username || "").split(" ")[0];

  if (editCompany) {
    return <div className="hr-narrow"><CompanyForm initial={company} onSaved={c => { setCompany(c); setEditCompany(false); }} onCancel={() => setEditCompany(false)} /></div>;
  }

  return (
    <div className="hr-wrap hr-col" style={{ gap: 22 }}>
      <motion.div className="hr-dash-head" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Aurora />
        <div className="hr-row wrap" style={{ gap: 14, position: "relative", zIndex: 1 }}>
          <div className="hr-col" style={{ gap: 8, flex: 1, minWidth: 240 }}>
            <span className="hr-eyebrow"><Sparkles size={13} /> {first ? `Welcome back, ${first}` : "Your hiring dashboard"}</span>
            <h1 className="hr-h2">Hiring at <em className="hr-grad-text">{company.name}</em></h1>
            <span className="hr-sub" style={{ fontSize: ".95rem" }}>Create a role, share its link, and candidates appear here ranked as they finish.</span>
          </div>
          <div className="hr-row wrap" style={{ gap: 8 }}>
            <button className="hr-btn ghost" onClick={() => setEditCompany(true)}><Building2 size={15} /> Company</button>
            <button className="hr-btn primary glow" onClick={() => setShowNew(true)}><Plus size={16} /> New role</button>
          </div>
        </div>
      </motion.div>

      <motion.div className="hr-grid c4" variants={stagger(0.08, 0.15)} initial="hidden" animate="show">
        <StatTile Icon={Sparkles} value="Free" label="Unlimited interviews" tone="solid" />
        <StatTile Icon={Radio} value={live ?? "—"} label="Live roles" delay={0.1} />
        <StatTile Icon={Users} value={totals.applied} label="Candidates applied" delay={0.2} />
        <StatTile Icon={CheckCircle2} value={totals.completed} label="Interviews completed" tone="warm" delay={0.3} />
      </motion.div>

      <div className="hr-col" style={{ gap: 12 }}>
        <div className="hr-row">
          <h2 className="hr-h3" style={{ fontSize: "1.1rem" }}>Roles</h2>
          {jobs?.length > 0 && <span className="hr-pill gray">{jobs.length}</span>}
          <div className="hr-sp" />
        </div>
        {error && <div className="hr-error">{error}</div>}
        {!jobs ? <Loading /> : jobs.length === 0 ? <EmptyRoles onNew={() => setShowNew(true)} /> : (
          <motion.div className="hr-joblist" variants={stagger(0.06, 0.1)} initial="hidden" animate="show">
            {jobs.map(j => {
              const s = JOB_STATUS[j.status] || JOB_STATUS.ready;
              const applied = j.stats?.applied || 0;
              const completed = j.stats?.completed || 0;
              return (
                <motion.div key={j.id} variants={rise}>
                  <GlowCard as={Link} to={`/hire/jobs/${j.id}`} className="hr-jobrow">
                    <span className="hr-icon-badge hide-sm"><Briefcase size={18} /></span>
                    <div className="hr-col" style={{ gap: 6, flex: 1, minWidth: 200 }}>
                      <div className="hr-row wrap" style={{ gap: 8 }}><b style={{ fontSize: "1rem" }}>{j.title}</b><Pill tone={s.tone} pulse={j.status === "live"} dot={j.status !== "live"}>{s.label}</Pill></div>
                      <span className="hr-muted">Created {timeAgo(j.createdAt)}{j.skills?.required?.length ? ` · ${j.skills.required.slice(0, 4).join(", ")}` : ""}</span>
                      {applied > 0 && (
                        <div className="hr-progress" style={{ maxWidth: 320 }} title={`${completed} of ${applied} completed`}>
                          <motion.i initial={{ width: 0 }} animate={{ width: `${Math.round((completed / applied) * 100)}%` }} transition={{ duration: 1, delay: 0.3 }} />
                        </div>
                      )}
                    </div>
                    <div className="hr-row" style={{ gap: 22 }}>
                      <div className="hr-stat" style={{ alignItems: "flex-end" }}><b style={{ fontSize: "1.5rem" }}><CountUp value={applied} /></b><span>applied</span></div>
                      <div className="hr-stat" style={{ alignItems: "flex-end" }}><b style={{ fontSize: "1.5rem" }}><CountUp value={completed} /></b><span>completed</span></div>
                      <span className="hr-go"><ArrowRight size={16} /></span>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showNew && <NewJobModal key="new" onClose={() => setShowNew(false)} onCreated={job => navigate(`/hire/jobs/${job.id}`)} />}
      </AnimatePresence>
    </div>
  );
}

// Student and mentor accounts can't use Atyant Hire (backend answers NOT_STARTUP).
function WrongAccount({ user, onSignOut }) {
  return (
    <div className="hr-narrow">
      <motion.div className="hr-card pad-lg hr-col hr-gborder" style={{ alignItems: "center", textAlign: "center", gap: 14 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <span className="hr-icon-badge warm" style={{ width: 54, height: 54, borderRadius: 16 }}><UserX size={24} /></span>
        <div className="hr-h2 sm">This is a student or mentor account</div>
        <p className="hr-sub" style={{ fontSize: ".95rem", maxWidth: 460 }}>
          You're signed in as <b>{user.email || user.username}</b>. Atyant Hire uses separate startup accounts.
          Sign out, then create a startup account with your work email.
        </p>
        <div className="hr-row wrap" style={{ justifyContent: "center", gap: 10, marginTop: 4 }}>
          <button className="hr-btn primary" onClick={onSignOut}><LogOut size={15} /> Sign out and create a startup account</button>
          <a className="hr-btn" href="/">Back to Atyant</a>
        </div>
      </motion.div>
    </div>
  );
}

const ACCOUNT_TYPE_ERROR = "That Google account is a student or mentor account on Atyant. Use your work email to create a startup account.";

export default function HireHome() {
  const { user, loading, logout, refreshUser } = useAuth();
  const [company, setCompany] = useState(undefined);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  // The backend sends ?error=account_type when Google sign-in from here used a student/mentor account.
  const [auth, setAuth] = useState(() => (new URLSearchParams(window.location.search).get("error") === "account_type"
    ? { mode: "signup", n: 1, error: ACCOUNT_TYPE_ERROR }
    : { mode: "signup", n: 0, error: "" }));

  useEffect(() => {
    document.title = "Atyant Hire: AI screening interviews for startups";
    sessionStorage.removeItem("hire_intent");
    if (new URLSearchParams(window.location.search).has("error")) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => document.getElementById("hire-start")?.scrollIntoView({ block: "start" }), 300);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    hireAPI.me()
      .then(d => {
        setBlocked(false);
        setCompany(d.company);
        // A 'user' account that already owned a company was just moved to 'startup'.
        if (user.role === "user") refreshUser?.();
      })
      .catch(err => {
        if (err.data?.code === "NOT_STARTUP") setBlocked(true);
        else { setError(err.message); setCompany(null); }
      });
  }, [user, refreshUser]);

  const openAuth = (mode) => {
    setAuth(a => ({ mode, n: a.n + 1, error: "" }));
    document.getElementById("hire-start")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const signOutToSignup = () => {
    logout();
    setBlocked(false);
    setCompany(undefined);
    setTimeout(() => openAuth("signup"), 80);
  };

  let body;
  if (user && blocked) body = <WrongAccount user={user} onSignOut={signOutToSignup} />;
  else if (loading || (user && company === undefined)) body = <Loading />;
  else if (!user) body = <HireLanding auth={auth} onStart={openAuth} />;
  else if (!company) body = (
    <div className="hr-narrow hr-col" style={{ gap: 14 }}>
      <Aurora className="soft" />
      {error && <div className="hr-error">{error}</div>}
      <CompanyForm onSaved={setCompany} />
    </div>
  );
  else body = <Dashboard company={company} setCompany={setCompany} user={user} />;

  const landing = !loading && !user;

  return (
    <HirePage>
      <TopBar nav={landing && (
        <>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="/mock-interview">For candidates</a>
        </>
      )}>
        {landing && (
          <>
            <button className="hr-btn sm ghost hide-sm" onClick={() => openAuth("login")}>Sign in</button>
            <button className="hr-btn sm primary" onClick={() => openAuth("signup")}>Start free</button>
          </>
        )}
        {user && (
          <>
            {company && !blocked && <span className="hr-chip hide-sm"><Sparkles size={13} /> Free · unlimited interviews</span>}
            <button className="hr-btn sm ghost" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={14} /></button>
          </>
        )}
      </TopBar>
      {body}
    </HirePage>
  );
}
