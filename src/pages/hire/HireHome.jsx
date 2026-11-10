import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, FileText, Link2, Mic, ListOrdered, Check, ShieldCheck, Quote, Building2, Coins, Users, Briefcase, LogOut, Upload, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { hireAPI } from "../../api";
import { loadRazorpay } from "../../lib/checkout";
import { TopBar, HireAuth, Loading, Pill } from "./HireShared";
import { JOB_STATUS, timeAgo } from "./hireUtils";

const CATEGORIES = [
  ["", "Auto-detect from JD"], ["tech", "Engineering"], ["analytics", "Data / Analytics"], ["product", "Product"],
  ["business", "Business / Consulting"], ["core", "Core engineering"], ["hr", "HR / Operations"],
];

// ── Landing (signed out) ────────────────────────────────────────────────────

function Landing() {
  const steps = [
    { Icon: FileText, t: "Paste your JD", d: "We pull out the skills to test. Add up to 3 questions you want every candidate asked." },
    { Icon: Link2, t: "Share one link", d: "Post it on LinkedIn, WhatsApp groups, Internshala, your careers page." },
    { Icon: Mic, t: "AI interviews everyone", d: "A 15-minute voice interview on their resume and your JD. Anytime, from their phone or laptop." },
    { Icon: ListOrdered, t: "Get a ranked shortlist", d: "Scores, a hire verdict and quotes from each answer. Call only the best." },
  ];
  const report = [
    "Score out of 100 and a hire verdict",
    "Fit on each skill from your JD",
    "Which resume claims held up under questioning",
    "Strengths and concerns, each with a quote",
    "Red flags and tab-switch count",
    "Questions to ask in your next round",
  ];
  return (
    <div className="hr-wrap">
      <section className="hr-hero">
        <div className="hr-col" style={{ gap: 18 }}>
          <span className="hr-eyebrow">Atyant Hire · for startups</span>
          <h1 className="hr-h1">300 applicants. One link. A ranked shortlist by tomorrow.</h1>
          <p className="hr-sub">
            Share one interview link. Every applicant takes a 15-minute AI voice interview built from your JD and their resume.
            You get a ranked list, with evidence for every score, and you only spend your time on the top few.
          </p>
          <div className="hr-row wrap" style={{ gap: 8 }}>
            <span className="hr-chip"><Check size={13} /> First 10 interviews free</span>
            <span className="hr-chip"><Coins size={13} /> ₹49 per completed interview after that</span>
            <span className="hr-chip"><ShieldCheck size={13} /> Pay only when a candidate finishes</span>
          </div>
        </div>
        <HireAuth />
      </section>

      <section className="hr-col" style={{ gap: 14, marginTop: 24 }}>
        <h2 className="hr-h2">How it works</h2>
        <div className="hr-steps">
          {steps.map(({ Icon, t, d }, i) => (
            <div key={t} className="hr-step">
              <div className="hr-row" style={{ marginBottom: 10 }}>
                <div className="hr-step-n" style={{ marginBottom: 0 }}>{i + 1}</div>
                <Icon size={18} style={{ color: "var(--c-accentText)" }} />
              </div>
              <div className="hr-h3">{t}</div>
              <p className="hr-muted" style={{ margin: "6px 0 0", lineHeight: 1.5, fontSize: ".84rem" }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hr-grid c2" style={{ marginTop: 28 }}>
        <div className="hr-card pad-lg hr-col" style={{ gap: 12 }}>
          <h2 className="hr-h2">Every candidate gets a report you can trust</h2>
          <p className="hr-sub" style={{ fontSize: ".92rem" }}>
            Every score comes from what the candidate actually said. Each strength and concern links to a quote from their answer, so you can check it yourself.
          </p>
          <div className="hr-col" style={{ gap: 8 }}>
            {report.map(r => <div key={r} className="hr-row" style={{ fontSize: ".9rem" }}><Check size={15} style={{ color: "#16A34A" }} />{r}</div>)}
          </div>
        </div>
        <div className="hr-card pad-lg hr-col" style={{ gap: 14 }}>
          <span className="hr-eyebrow">Pricing</span>
          <div className="hr-row" style={{ alignItems: "baseline", gap: 8 }}>
            <span className="hr-price">₹49</span><span className="hr-muted">per completed interview</span>
          </div>
          <p className="hr-sub" style={{ fontSize: ".92rem" }}>
            Your first 10 interviews are free. After that, buy packs from 10 interviews. If a candidate drops out before answering half the questions, you don't pay.
          </p>
          <div className="hr-ev">
            <div className="hr-row"><Quote size={15} style={{ color: "var(--c-accentText)" }} /><b>A recruiter screen costs ₹500+ per call.</b></div>
            <div className="hr-muted" style={{ marginTop: 6 }}>Atyant screens 100 applicants for ₹4,900, overnight, with no calendar back-and-forth.</div>
          </div>
        </div>
      </section>
    </div>
  );
}

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
    <form className="hr-card pad-lg hr-col" style={{ gap: 14 }} onSubmit={save}>
      <div>
        <div className="hr-row"><Building2 size={18} style={{ color: "var(--c-accentText)" }} /><span className="hr-h3" style={{ fontSize: "1.1rem" }}>{initial ? "Company details" : "Tell candidates who you are"}</span></div>
        <div className="hr-muted" style={{ marginTop: 4 }}>Shown on your interview link, so candidates know who they're interviewing with.</div>
      </div>
      <div><label className="hr-label">Company name</label><input className="hr-input" value={form.name} onChange={set("name")} required maxLength={120} /></div>
      <div className="hr-grid c2">
        <div><label className="hr-label">Website</label><input className="hr-input" value={form.website} onChange={set("website")} placeholder="https://" /></div>
        <div><label className="hr-label">Logo URL (optional)</label><input className="hr-input" value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://…/logo.png" /></div>
      </div>
      <div><label className="hr-label">One line about you (optional)</label><textarea className="hr-textarea" style={{ minHeight: 70 }} value={form.about} onChange={set("about")} maxLength={1000} placeholder="We're building…" /></div>
      {error && <div className="hr-error">{error}</div>}
      <div className="hr-row">
        {onCancel && <button type="button" className="hr-btn" onClick={onCancel}>Cancel</button>}
        <div className="hr-sp" />
        <button className="hr-btn primary" disabled={busy}>{busy ? "Saving…" : initial ? "Save" : "Continue"}</button>
      </div>
    </form>
  );
}

// ── New job ─────────────────────────────────────────────────────────────────

function NewJobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", jdText: "", interviewCategory: "", maxCandidates: 200, deadline: "", requireCamera: true });
  const [jdFile, setJdFile] = useState(null);
  const [mustAsk, setMustAsk] = useState([""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { job } = await hireAPI.createJob({ ...form, jdFile, mustAsk: mustAsk.map(s => s.trim()).filter(Boolean) });
      onCreated(job);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <div className="hr-drawer-bg" onClick={onClose} />
      <form className="hr-modal hr-col" style={{ gap: 14 }} onSubmit={submit}>
        <div className="hr-row">
          <span className="hr-h3" style={{ fontSize: "1.15rem" }}>New role</span>
          <div className="hr-sp" />
          <button type="button" className="hr-btn sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>
        <div><label className="hr-label">Role title</label><input className="hr-input" value={form.title} onChange={set("title")} required maxLength={120} placeholder="e.g. Backend Engineering Intern" /></div>
        <div>
          <label className="hr-label">Job description</label>
          {jdFile ? (
            <div className="hr-file" style={{ cursor: "default" }}>
              <FileText size={16} /><span style={{ flex: 1 }}>{jdFile.name}</span>
              <button type="button" className="hr-link" onClick={() => setJdFile(null)}>Remove</button>
            </div>
          ) : (
            <>
              <textarea className="hr-textarea" value={form.jdText} onChange={set("jdText")} placeholder="Paste the full JD: responsibilities, requirements, nice-to-haves." />
              <label className="hr-file" style={{ marginTop: 8, padding: 10 }}>
                <Upload size={15} /> Or upload the JD as a PDF
                <input type="file" accept="application/pdf" onChange={e => setJdFile(e.target.files?.[0] || null)} />
              </label>
            </>
          )}
        </div>
        <div>
          <label className="hr-label">Questions every candidate must answer (optional, up to 3)</label>
          <div className="hr-col" style={{ gap: 8 }}>
            {mustAsk.map((q, i) => (
              <div key={i} className="hr-row">
                <input className="hr-input" value={q} maxLength={400}
                  onChange={e => setMustAsk(m => m.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={i === 0 ? "e.g. Why do you want to work at an early-stage startup?" : "Another question"} />
                {mustAsk.length > 1 && <button type="button" className="hr-btn sm" onClick={() => setMustAsk(m => m.filter((_, j) => j !== i))}><X size={13} /></button>}
              </div>
            ))}
            {mustAsk.length < 3 && <button type="button" className="hr-link" style={{ alignSelf: "flex-start" }} onClick={() => setMustAsk(m => [...m, ""])}>+ Add question</button>}
          </div>
        </div>
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
        <div className="hr-row">
          <span className="hr-muted">Each interview runs for 15 minutes.</span>
          <div className="hr-sp" />
          <button className="hr-btn primary" disabled={busy}>{busy ? "Creating…" : "Create role"}</button>
        </div>
      </form>
    </>
  );
}

// ── Buy credits ─────────────────────────────────────────────────────────────

export function BuyCreditsModal({ company, user, onClose, onDone }) {
  const price = company.pricing?.perInterview || 49;
  const packs = [10, 25, 50, 100];
  const [qty, setQty] = useState(25);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const buy = async () => {
    setBusy(true); setError("");
    try {
      const order = await hireAPI.creditOrder(qty);
      if (!(await loadRazorpay())) throw new Error("Could not load the payment gateway. Check your connection.");
      const rzp = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, name: "Atyant Hire",
        description: order.description, order_id: order.orderId,
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme: { color: "#7567C9" },
        handler: async (payment) => {
          try {
            const { company: updated } = await hireAPI.verifyCredits(payment);
            onDone(updated);
          } catch (err) {
            setError(err.message || "Payment received but could not be confirmed. Refresh in a minute.");
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (resp) => { setError(resp?.error?.description || "Payment failed"); setBusy(false); });
      rzp.open();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <div className="hr-drawer-bg" onClick={onClose} />
      <div className="hr-modal hr-col" style={{ gap: 16 }}>
        <div className="hr-row">
          <span className="hr-h3" style={{ fontSize: "1.15rem" }}>Add interviews</span>
          <div className="hr-sp" />
          <button className="hr-btn sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>
        <div className="hr-muted">₹{price} per completed interview. A candidate who drops out before answering half the questions doesn't use a credit.</div>
        <div className="hr-grid c4" style={{ gap: 8 }}>
          {packs.map(p => (
            <button key={p} className={`hr-tab ${qty === p ? "on" : ""}`} style={{ borderRadius: 12, padding: "12px 6px" }} onClick={() => setQty(p)}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>{p}</div>
              <div style={{ fontSize: ".72rem", opacity: .8 }}>₹{(p * price).toLocaleString("en-IN")}</div>
            </button>
          ))}
        </div>
        {error && <div className="hr-error">{error}</div>}
        <button className="hr-btn primary lg block" onClick={buy} disabled={busy}>
          {busy ? "Opening checkout…" : `Pay ₹${(qty * price).toLocaleString("en-IN")}`}
        </button>
      </div>
    </>
  );
}

// ── Dashboard (signed in) ───────────────────────────────────────────────────

function Dashboard({ company, setCompany, user }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [editCompany, setEditCompany] = useState(false);

  const load = useCallback(() => {
    hireAPI.jobs().then(d => setJobs(d.jobs)).catch(err => setError(err.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const totals = (jobs || []).reduce((a, j) => ({ applied: a.applied + (j.stats?.applied || 0), completed: a.completed + (j.stats?.completed || 0) }), { applied: 0, completed: 0 });
  const credits = company.credits;

  if (editCompany) {
    return <div className="hr-narrow"><CompanyForm initial={company} onSaved={c => { setCompany(c); setEditCompany(false); }} onCancel={() => setEditCompany(false)} /></div>;
  }

  return (
    <div className="hr-wrap hr-col" style={{ gap: 22 }}>
      <div className="hr-row wrap" style={{ gap: 12 }}>
        <div className="hr-col" style={{ gap: 4 }}>
          <h1 className="hr-h2">Hiring at {company.name}</h1>
          <span className="hr-muted">Create a role, share its link, and candidates appear here ranked as they finish.</span>
        </div>
        <div className="hr-sp" />
        <button className="hr-btn" onClick={() => setEditCompany(true)}><Building2 size={15} /> Company</button>
        <button className="hr-btn primary" onClick={() => setShowNew(true)}><Plus size={16} /> New role</button>
      </div>

      <div className="hr-grid c4">
        <div className="hr-card hr-stat"><b>{credits.left}</b><span>Interviews left</span></div>
        <div className="hr-card hr-stat"><b>{jobs?.filter(j => j.status === "live").length ?? "—"}</b><span>Live roles</span></div>
        <div className="hr-card hr-stat"><b>{totals.applied}</b><span>Candidates applied</span></div>
        <div className="hr-card hr-stat"><b>{totals.completed}</b><span>Interviews completed</span></div>
      </div>

      {credits.left <= 3 && (
        <div className="hr-card hr-row wrap" style={{ borderColor: "#D9770655", background: "#D977060d" }}>
          <Coins size={18} style={{ color: "#D97706" }} />
          <div className="hr-col" style={{ gap: 2, flex: 1, minWidth: 220 }}>
            <b style={{ fontSize: ".9rem" }}>{credits.left <= 0 ? "You're out of interviews" : `Only ${credits.left} interview${credits.left === 1 ? "" : "s"} left`}</b>
            <span className="hr-muted">Your links stop accepting new candidates when you run out.</span>
          </div>
          <button className="hr-btn primary" onClick={() => setShowBuy(true)}>Add interviews</button>
        </div>
      )}

      <div className="hr-col" style={{ gap: 10 }}>
        <div className="hr-row">
          <h2 className="hr-h3" style={{ fontSize: "1.05rem" }}>Roles</h2>
          <div className="hr-sp" />
          {credits.left > 3 && <button className="hr-link" onClick={() => setShowBuy(true)}>Add interviews</button>}
        </div>
        {error && <div className="hr-error">{error}</div>}
        {!jobs ? <Loading /> : jobs.length === 0 ? (
          <div className="hr-card hr-empty hr-col" style={{ alignItems: "center", gap: 12 }}>
            <Briefcase size={28} style={{ color: "var(--c-accentText)" }} />
            <div className="hr-h3">No roles yet</div>
            <div className="hr-muted" style={{ maxWidth: 360 }}>Paste a job description and you'll get a link to share with applicants in about a minute.</div>
            <button className="hr-btn primary" onClick={() => setShowNew(true)}><Plus size={16} /> Create your first role</button>
          </div>
        ) : (
          <div className="hr-joblist">
            {jobs.map(j => {
              const s = JOB_STATUS[j.status] || JOB_STATUS.ready;
              return (
                <Link key={j.id} to={`/hire/jobs/${j.id}`} className="hr-jobrow">
                  <div className="hr-col" style={{ gap: 4, flex: 1, minWidth: 200 }}>
                    <div className="hr-row" style={{ gap: 8 }}><b style={{ fontSize: ".98rem" }}>{j.title}</b><Pill tone={s.tone}>{s.label}</Pill></div>
                    <span className="hr-muted">Created {timeAgo(j.createdAt)}{j.skills?.required?.length ? ` · ${j.skills.required.slice(0, 4).join(", ")}` : ""}</span>
                  </div>
                  <div className="hr-row" style={{ gap: 18 }}>
                    <div className="hr-stat" style={{ alignItems: "flex-end" }}><b style={{ fontSize: "1.3rem" }}>{j.stats?.applied || 0}</b><span>applied</span></div>
                    <div className="hr-stat" style={{ alignItems: "flex-end" }}><b style={{ fontSize: "1.3rem" }}>{j.stats?.completed || 0}</b><span>completed</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showNew && <NewJobModal onClose={() => setShowNew(false)} onCreated={job => navigate(`/hire/jobs/${job.id}`)} />}
      {showBuy && <BuyCreditsModal company={company} user={user} onClose={() => setShowBuy(false)} onDone={c => { setCompany(c); setShowBuy(false); }} />}
    </div>
  );
}

export default function HireHome() {
  const { user, loading, logout } = useAuth();
  const [company, setCompany] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Atyant Hire: AI screening interviews for startups";
    sessionStorage.removeItem("hire_intent");
  }, []);

  useEffect(() => {
    if (!user) return;
    hireAPI.me().then(d => setCompany(d.company)).catch(err => { setError(err.message); setCompany(null); });
  }, [user]);

  let body;
  if (loading || (user && company === undefined)) body = <Loading />;
  else if (!user) body = <Landing />;
  else if (!company) body = (
    <div className="hr-narrow hr-col" style={{ gap: 14 }}>
      {error && <div className="hr-error">{error}</div>}
      <CompanyForm onSaved={setCompany} />
    </div>
  );
  else body = <Dashboard company={company} setCompany={setCompany} user={user} />;

  return (
    <div className="hr-page">
      <TopBar>
        {user && (
          <>
            {company && <span className="hr-chip"><Users size={13} /> {company.credits.left} interviews left</span>}
            <button className="hr-btn sm" onClick={logout} title="Sign out"><LogOut size={14} /></button>
          </>
        )}
      </TopBar>
      {body}
    </div>
  );
}
