import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Video, Clock, Wifi, MonitorX, FileText, Upload, Sparkles, RotateCcw, ArrowRight, Smartphone, ShieldCheck } from "lucide-react";
import { hireAPI } from "../../api";
import MockInterviewRoom from "../../components/mockInterview/MockInterviewRoom";
import { TopBar, Loading, HirePage } from "./HireShared";
import { Aurora, Confetti, VoiceOrb } from "./HireFx";
import { rise, stagger } from "./hireMotion";

const EASE = [0.22, 1, 0.36, 1];

// The candidate's access token is kept per job, so a refresh or a dropped
// connection brings them back to their own interview.
const tokenKey = (slug) => `atyant_hire_${slug}`;
const readToken = (slug) => { try { return localStorage.getItem(tokenKey(slug)); } catch { return null; } };
const saveToken = (slug, t) => { try { localStorage.setItem(tokenKey(slug), t); } catch { /* storage blocked */ } };
const clearToken = (slug) => { try { localStorage.removeItem(tokenKey(slug)); } catch { /* storage blocked */ } };

const card = { initial: { opacity: 0, y: 20, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.55, ease: EASE } };

function ApplyForm({ slug, job, onApplied }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [resume, setResume] = useState(null);
  const [drag, setDrag] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!resume) return setError("Upload your resume as a PDF.");
    if (!consent) return setError("Please accept to continue.");
    setBusy(true);
    try {
      const { token } = await hireAPI.apply(slug, { ...form, resumeFile: resume });
      saveToken(slug, token);
      onApplied(token);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") setResume(f);
  };

  return (
    <motion.form className="hr-card pad-lg hr-col hr-gborder" style={{ gap: 16 }} onSubmit={submit} {...card} transition={{ ...card.transition, delay: 0.25 }}>
      <div className="hr-row" style={{ gap: 12 }}>
        <span className="hr-icon-badge solid"><Sparkles size={18} /></span>
        <div className="hr-col" style={{ gap: 2 }}>
          <div className="hr-h3" style={{ fontSize: "1.15rem" }}>Apply and take your interview</div>
          <span className="hr-muted">Takes a minute. Your interview starts right after.</span>
        </div>
      </div>
      <div><label className="hr-label">Full name</label><input className="hr-input" value={form.name} onChange={set("name")} required autoComplete="name" /></div>
      <div className="hr-grid c2">
        <div><label className="hr-label">Email</label><input className="hr-input" type="email" value={form.email} onChange={set("email")} required autoComplete="email" /></div>
        <div><label className="hr-label">Mobile</label><input className="hr-input" inputMode="tel" value={form.phone} onChange={set("phone")} required autoComplete="tel" placeholder="10-digit number" /></div>
      </div>
      <div>
        <label className="hr-label">Resume (PDF, under 5 MB)</label>
        <label className={`hr-file ${resume ? "has" : ""} ${drag ? "drag" : ""}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}>
          <span className="hr-file-ic">{resume ? <FileText size={17} /> : <Upload size={17} />}</span>
          <span className="hr-col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
            <b style={{ color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resume ? resume.name : "Choose your resume"}</b>
            <span className="hr-muted">{resume ? `${(resume.size / 1024 / 1024).toFixed(1)} MB · PDF` : "or drag and drop it here"}</span>
          </span>
          {resume && <span className="hr-link">Change</span>}
          <input type="file" accept="application/pdf" onChange={e => setResume(e.target.files?.[0] || null)} />
        </label>
        <div className="hr-hint">The interviewer asks about your projects and experience from this resume.</div>
      </div>
      <label className="hr-check">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
        <span>
          I agree that my interview is conducted and evaluated by AI, and that my answers, transcript, resume and contact details are shared with {job.company.name} for this role.
        </span>
      </label>
      {error && <motion.div className="hr-error" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [6, -4, 2, 0] }}>{error}</motion.div>}
      <button className="hr-btn primary lg block" disabled={busy}>{busy ? "Submitting…" : "Continue"} {!busy && <ArrowRight size={16} className="hr-arrow" />}</button>
      <div className="hr-muted" style={{ textAlign: "center" }}>You get one interview for this role.</div>
    </motion.form>
  );
}

function ReadyCheck({ state, requireCamera, durationMin, onStart }) {
  const [ok, setOk] = useState(false);
  const rejoin = state === "in_progress";
  const tips = [
    { Icon: Clock, t: `${durationMin || 15} minutes, in one go`, d: "Find a quiet place. You can't pause once it starts." },
    { Icon: Mic, t: "Speak your answers", d: "It's a voice interview. Answer as you would to a person, and take a moment to think if you need it." },
    { Icon: requireCamera ? Video : Wifi, t: requireCamera ? "Camera on" : "Stable internet", d: requireCamera ? "Keep your camera on for the whole interview." : "Wi-Fi or a strong mobile signal works best." },
    { Icon: MonitorX, t: "Stay on this tab", d: "Switching tabs or apps is recorded and shared with the hiring team." },
  ];
  return (
    <motion.div className="hr-card pad-lg hr-col" style={{ gap: 18, overflow: "hidden" }} {...card}>
      <Aurora grid={false} className="soft" />
      <div className="hr-row" style={{ gap: 18, position: "relative" }}>
        <VoiceOrb size={92} idle={!ok && !rejoin} />
        <div className="hr-col" style={{ gap: 4 }}>
          <div className="hr-h2 sm">{rejoin ? "Your interview is still running" : "Your interview is ready"}</div>
          <span className="hr-muted" style={{ fontSize: ".88rem" }}>{rejoin ? "Rejoin to continue where you left off." : "We prepared questions from the job description and your resume."}</span>
        </div>
      </div>
      {!rejoin && (
        <motion.div className="hr-grid c2" style={{ gap: 10, position: "relative" }} variants={stagger(0.08, 0.2)} initial="hidden" animate="show">
          {tips.map(({ Icon, t, d }) => (
            <motion.div key={t} variants={rise} className="hr-tip">
              <span className="hr-icon-badge" style={{ width: 34, height: 34, borderRadius: 10 }}><Icon size={16} /></span>
              <div className="hr-col" style={{ gap: 2 }}><b>{t}</b><span className="hr-muted" style={{ lineHeight: 1.45 }}>{d}</span></div>
            </motion.div>
          ))}
        </motion.div>
      )}
      {!rejoin && (
        <label className="hr-check" style={{ position: "relative", fontSize: ".9rem", color: "var(--c-text)", fontWeight: 600 }}>
          <input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />I'm in a quiet place and ready to start.
        </label>
      )}
      <button className={`hr-btn primary lg block ${ok || rejoin ? "glow" : ""}`} style={{ position: "relative" }} disabled={!rejoin && !ok} onClick={onStart}>
        <Mic size={17} /> {rejoin ? "Rejoin interview" : "Start interview"}
      </button>
    </motion.div>
  );
}

const PREP_LINES = ["Reading your resume…", "Matching it to the job description…", "Planning your questions…"];

function Preparing({ canRetry, retrying, onRetry }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % PREP_LINES.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div className="hr-card pad-lg hr-col" style={{ alignItems: "center", textAlign: "center", gap: 16, overflow: "hidden" }} {...card}>
      <Aurora grid={false} className="soft" />
      <div style={{ position: "relative" }}><VoiceOrb size={140} /></div>
      <div style={{ position: "relative", height: 28 }}>
        <AnimatePresence mode="wait">
          <motion.div key={i} className="hr-h3" style={{ fontSize: "1.15rem" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {PREP_LINES[i]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="hr-shimmerbar" style={{ position: "relative" }} />
      <p className="hr-muted" style={{ maxWidth: 420, margin: 0, position: "relative", lineHeight: 1.5 }}>We're preparing your interview. This usually takes a minute or two. Keep this page open.</p>
      {canRetry && <button className="hr-btn" style={{ position: "relative" }} onClick={onRetry} disabled={retrying}><RotateCcw size={14} /> Try again</button>}
    </motion.div>
  );
}

export default function HireCandidatePage() {
  const { slug } = useParams();
  const [job, setJob] = useState(null);
  const [jobError, setJobError] = useState("");
  const [token, setToken] = useState(() => readToken(slug));
  const [cand, setCand] = useState(null);
  const [inRoom, setInRoom] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    hireAPI.publicJob(slug).then(d => {
      setJob(d.job);
      document.title = `${d.job.title} at ${d.job.company.name} · Interview`;
    }).catch(err => setJobError(err.message));
  }, [slug]);

  const loadCand = useCallback(() => {
    if (!token) return Promise.resolve();
    return hireAPI.candidate(token).then(d => setCand(d.interview)).catch(err => {
      if (err.status === 404) { clearToken(slug); setToken(null); setCand(null); }
    });
  }, [token, slug]);

  useEffect(() => { loadCand(); }, [loadCand]);

  // Poll while the interview is being prepared or scored.
  useEffect(() => {
    clearInterval(pollRef.current);
    if (inRoom || !cand || !["applied", "evaluating"].includes(cand.state)) return;
    pollRef.current = setInterval(loadCand, cand.state === "applied" ? 4000 : 15000);
    return () => clearInterval(pollRef.current);
  }, [cand, inRoom, loadCand]);

  // Integrity signals while the interview is open, shown to the hiring team.
  useEffect(() => {
    if (!inRoom || !token) return;
    const onVis = () => { if (document.visibilityState === "hidden") hireAPI.integrity(token, "tab_hidden"); };
    const onFs = () => { if (!document.fullscreenElement) hireAPI.integrity(token, "fullscreen_exit"); };
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [inRoom, token]);

  const start = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    setInRoom(true);
  };

  const exitRoom = () => {
    setInRoom(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    loadCand();
  };

  const retry = async () => {
    setRetrying(true);
    try { await hireAPI.retryPrep(token); await loadCand(); } catch { /* shown via state */ } finally { setRetrying(false); }
  };

  const company = job?.company || cand?.company;

  if (inRoom) {
    return (
      <MockInterviewRoom interviewId={token} hiring join={() => hireAPI.join(token)} onExit={exitRoom}
        brand={{ company: company?.name, title: cand?.jobTitle, logoUrl: company?.logoUrl }} />
    );
  }

  let body;
  let key;
  if (jobError && !token) {
    key = "invalid";
    body = (
      <motion.div className="hr-card hr-empty hr-col" style={{ alignItems: "center", gap: 10 }} {...card}>
        <VoiceOrb size={80} idle />
        <div className="hr-h3" style={{ fontSize: "1.1rem" }}>This interview link isn't valid</div>
        <p className="hr-muted" style={{ margin: 0 }}>Check the link with the company that shared it.</p>
      </motion.div>
    );
  } else if (!job && !cand) {
    key = "loading";
    body = <Loading />;
  } else if (!token || !cand) {
    key = token ? "loading" : "apply";
    body = token ? <Loading /> : (
      <>
        <JobIntro job={job} />
        {job.accepting
          ? <ApplyForm slug={slug} job={job} onApplied={t => setToken(t)} />
          : <div className="hr-card hr-row" style={{ gap: 12 }}><span className="hr-icon-badge warm"><Clock size={17} /></span><span className="hr-muted" style={{ fontSize: ".9rem" }}>{job.closedReason}</span></div>}
      </>
    );
  } else if (cand.state === "applied") {
    key = "prep";
    body = <Preparing canRetry={cand.canRetryPrep} retrying={retrying} onRetry={retry} />;
  } else if (cand.state === "ready" || cand.state === "in_progress") {
    key = "ready";
    body = <ReadyCheck state={cand.state} requireCamera={cand.requireCamera} durationMin={cand.durationMin} onStart={start} />;
  } else if (cand.state === "evaluating" || cand.state === "completed") {
    key = "done";
    body = (
      <>
      <Confetti />
      <motion.div className="hr-card pad-lg hr-col" style={{ alignItems: "center", textAlign: "center", gap: 14, overflow: "hidden" }} {...card}>
        <Aurora grid={false} className="soft" />
        <svg className="hr-checkdraw" viewBox="0 0 84 84" aria-hidden="true" style={{ position: "relative" }}>
          <circle cx="42" cy="42" r="38" />
          <path d="M26 43 l11 11 l21 -23" />
        </svg>
        <div className="hr-h2" style={{ position: "relative" }}>You're done, <em className="hr-grad-text">{cand.name.split(" ")[0]}!</em></div>
        <p className="hr-sub" style={{ maxWidth: 460, fontSize: ".97rem", position: "relative" }}>
          Your interview for <b>{cand.jobTitle}</b> has been submitted to {company?.name}. They'll contact you by email or phone if you move to the next round.
        </p>
        <motion.div className="hr-ev hr-col hr-gborder" style={{ gap: 10, maxWidth: 460, textAlign: "left", marginTop: 8, position: "relative" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, ease: EASE, duration: 0.6 }}>
          <div className="hr-row"><span className="hr-icon-badge solid" style={{ width: 32, height: 32, borderRadius: 10 }}><Sparkles size={15} /></span><b>Want to know how you did?</b></div>
          <span className="hr-muted" style={{ lineHeight: 1.5 }}>Practice with Atyant's AI mock interviews and get a full feedback report on every answer, with what to fix before your next real interview.</span>
          <a className="hr-btn primary" href="/mock-interview" style={{ alignSelf: "flex-start" }}>Try a mock interview <ArrowRight size={15} className="hr-arrow" /></a>
        </motion.div>
      </motion.div>
      </>
    );
  } else {
    key = "failed";
    body = (
      <motion.div className="hr-card pad-lg hr-col" style={{ alignItems: "center", textAlign: "center", gap: 12 }} {...card}>
        <VoiceOrb size={80} idle />
        <div className="hr-h3" style={{ fontSize: "1.1rem" }}>Something went wrong with your interview</div>
        <p className="hr-muted" style={{ maxWidth: 420, margin: 0 }}>
          {cand.canRetryPrep ? "We couldn't prepare your questions. Please try again." : `Please contact ${company?.name || "the company"} and let them know.`}
        </p>
        {cand.canRetryPrep && <button className="hr-btn primary" onClick={retry} disabled={retrying}><RotateCcw size={14} /> {retrying ? "Retrying…" : "Try again"}</button>}
      </motion.div>
    );
  }

  return (
    <HirePage>
      <Aurora />
      <TopBar home={`/hire/i/${slug}`} company={company}>
        <span className="hr-muted hide-sm">Powered by <b style={{ color: "var(--c-accentText)" }}>Atyant</b></span>
      </TopBar>
      <div className="hr-narrow hr-col" style={{ gap: 18 }}>
        {cand && (
          <motion.div className="hr-col" style={{ gap: 4 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <span className="hr-eyebrow">{company?.name}</span><h1 className="hr-h2">{cand.jobTitle}</h1>
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={key} className="hr-col" style={{ gap: 18 }} exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}>
            {body}
          </motion.div>
        </AnimatePresence>
      </div>
    </HirePage>
  );
}

function JobIntro({ job }) {
  return (
    <motion.div className="hr-col" style={{ gap: 16 }} variants={stagger(0.08)} initial="hidden" animate="show">
      <div className="hr-cand-hero">
        <div className="hr-col" style={{ gap: 12, flex: 1, minWidth: 0 }}>
          <motion.span variants={rise} className="hr-eyebrow"><span className="hr-pill green" style={{ padding: "2px 8px" }}><span className="hr-dot pulse" />Hiring</span>{job.company.name}</motion.span>
          <motion.h1 variants={rise} className="hr-h1" style={{ fontSize: "clamp(2rem, 6vw, 2.9rem)" }}>{job.title}</motion.h1>
          {job.company.about && <motion.p variants={rise} className="hr-sub" style={{ fontSize: ".97rem" }}>{job.company.about}</motion.p>}
        </div>
        <motion.div variants={rise} className="hr-col" style={{ alignItems: "center", gap: 6 }}>
          <VoiceOrb size={118} />
          <span className="hr-muted" style={{ fontWeight: 600, fontSize: ".74rem" }}>Your AI interviewer</span>
        </motion.div>
      </div>
      <motion.div variants={rise} className="hr-row wrap" style={{ gap: 8 }}>
        <span className="hr-chip glass"><Clock size={13} /> {job.durationMin}-minute AI voice interview</span>
        <span className="hr-chip glass"><Smartphone size={13} /> Take it now, from any device</span>
        {job.requireCamera && <span className="hr-chip glass"><Video size={13} /> Camera on</span>}
        <span className="hr-chip glass"><ShieldCheck size={13} /> One attempt</span>
      </motion.div>
      {job.skills?.length > 0 && (
        <motion.div variants={rise} className="hr-col" style={{ gap: 8 }}>
          <span className="hr-muted" style={{ fontWeight: 600 }}>You'll be asked about</span>
          <div className="hr-row wrap" style={{ gap: 6 }}>
            {job.skills.slice(0, 6).map(s => <span key={s} className="hr-skill">{s}</span>)}
            <span className="hr-skill soft">your own projects</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
