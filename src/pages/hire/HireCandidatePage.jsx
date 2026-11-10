import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Mic, Video, Clock, Wifi, MonitorX, FileText, Upload, CheckCircle2, Sparkles, RotateCcw } from "lucide-react";
import { hireAPI } from "../../api";
import MockInterviewRoom from "../../components/mockInterview/MockInterviewRoom";
import { TopBar, Loading, Spinner } from "./HireShared";

// The candidate's access token is kept per job, so a refresh or a dropped
// connection brings them back to their own interview.
const tokenKey = (slug) => `atyant_hire_${slug}`;
const readToken = (slug) => { try { return localStorage.getItem(tokenKey(slug)); } catch { return null; } };
const saveToken = (slug, t) => { try { localStorage.setItem(tokenKey(slug), t); } catch { /* storage blocked */ } };
const clearToken = (slug) => { try { localStorage.removeItem(tokenKey(slug)); } catch { /* storage blocked */ } };

function ApplyForm({ slug, job, onApplied }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [resume, setResume] = useState(null);
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

  return (
    <form className="hr-card pad-lg hr-col" style={{ gap: 14 }} onSubmit={submit}>
      <div className="hr-h3" style={{ fontSize: "1.1rem" }}>Apply and take your interview</div>
      <div><label className="hr-label">Full name</label><input className="hr-input" value={form.name} onChange={set("name")} required autoComplete="name" /></div>
      <div className="hr-grid c2">
        <div><label className="hr-label">Email</label><input className="hr-input" type="email" value={form.email} onChange={set("email")} required autoComplete="email" /></div>
        <div><label className="hr-label">Mobile</label><input className="hr-input" inputMode="tel" value={form.phone} onChange={set("phone")} required autoComplete="tel" placeholder="10-digit number" /></div>
      </div>
      <div>
        <label className="hr-label">Resume (PDF, under 5 MB)</label>
        <label className="hr-file">
          {resume ? <FileText size={16} /> : <Upload size={16} />}
          <span style={{ flex: 1 }}>{resume ? resume.name : "Choose your resume"}</span>
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
      {error && <div className="hr-error">{error}</div>}
      <button className="hr-btn primary lg block" disabled={busy}>{busy ? "Submitting…" : "Continue"}</button>
      <div className="hr-muted" style={{ textAlign: "center" }}>You get one interview for this role.</div>
    </form>
  );
}

function ReadyCheck({ state, requireCamera, onStart }) {
  const [ok, setOk] = useState(false);
  const rejoin = state === "in_progress";
  const tips = [
    { Icon: Clock, t: "15 minutes, in one go", d: "Find a quiet place. You can't pause once it starts." },
    { Icon: Mic, t: "Speak your answers", d: "It's a voice interview. Answer as you would to a person, and take a moment to think if you need it." },
    { Icon: requireCamera ? Video : Wifi, t: requireCamera ? "Camera on" : "Stable internet", d: requireCamera ? "Keep your camera on for the whole interview." : "Wi-Fi or a strong mobile signal works best." },
    { Icon: MonitorX, t: "Stay on this tab", d: "Switching tabs or apps is recorded and shared with the hiring team." },
  ];
  return (
    <div className="hr-card pad-lg hr-col" style={{ gap: 16 }}>
      <div className="hr-col" style={{ gap: 4 }}>
        <div className="hr-h3" style={{ fontSize: "1.15rem" }}>{rejoin ? "Your interview is still running" : "Your interview is ready"}</div>
        <span className="hr-muted">{rejoin ? "Rejoin to continue where you left off." : "We prepared questions from the job description and your resume."}</span>
      </div>
      {!rejoin && (
        <div className="hr-grid c2">
          {tips.map(({ Icon, t, d }) => (
            <div key={t} className="hr-row" style={{ alignItems: "flex-start", gap: 10 }}>
              <Icon size={18} style={{ color: "var(--c-accentText)", flexShrink: 0, marginTop: 2 }} />
              <div className="hr-col" style={{ gap: 2 }}><b style={{ fontSize: ".88rem" }}>{t}</b><span className="hr-muted" style={{ lineHeight: 1.45 }}>{d}</span></div>
            </div>
          ))}
        </div>
      )}
      {!rejoin && (
        <label className="hr-check"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />I'm in a quiet place and ready to start.</label>
      )}
      <button className="hr-btn primary lg block" disabled={!rejoin && !ok} onClick={onStart}>
        {rejoin ? "Rejoin interview" : "Start interview"}
      </button>
    </div>
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

  if (inRoom) {
    return <MockInterviewRoom interviewId={token} hiring join={() => hireAPI.join(token)} onExit={exitRoom} />;
  }

  const company = job?.company || cand?.company;

  let body;
  if (jobError && !token) {
    body = <div className="hr-card hr-empty"><div className="hr-h3">This interview link isn't valid</div><p className="hr-muted">Check the link with the company that shared it.</p></div>;
  } else if (!job && !cand) {
    body = <Loading />;
  } else if (!token || !cand) {
    body = token ? <Loading /> : (
      <>
        <JobIntro job={job} />
        {job.accepting
          ? <ApplyForm slug={slug} job={job} onApplied={t => setToken(t)} />
          : <div className="hr-card hr-muted">{job.closedReason}</div>}
      </>
    );
  } else if (cand.state === "applied") {
    body = (
      <div className="hr-card pad-lg hr-col" style={{ alignItems: "center", textAlign: "center", gap: 12 }}>
        <Spinner />
        <div className="hr-h3" style={{ fontSize: "1.1rem" }}>Preparing your interview…</div>
        <p className="hr-muted" style={{ maxWidth: 420, margin: 0 }}>We're reading your resume and the job description to plan your questions. This usually takes a minute or two. Keep this page open.</p>
        {cand.canRetryPrep && <button className="hr-btn" onClick={retry} disabled={retrying}><RotateCcw size={14} /> Try again</button>}
      </div>
    );
  } else if (cand.state === "ready" || cand.state === "in_progress") {
    body = <ReadyCheck state={cand.state} requireCamera={cand.requireCamera} onStart={start} />;
  } else if (cand.state === "evaluating" || cand.state === "completed") {
    body = (
      <div className="hr-card pad-lg hr-col" style={{ alignItems: "center", textAlign: "center", gap: 12 }}>
        <CheckCircle2 size={40} style={{ color: "#16A34A" }} />
        <div className="hr-h2">You're done, {cand.name.split(" ")[0]}!</div>
        <p className="hr-sub" style={{ maxWidth: 440, fontSize: ".95rem" }}>
          Your interview for <b>{cand.jobTitle}</b> has been submitted to {company?.name}. They'll contact you by email or phone if you move to the next round.
        </p>
        <div className="hr-ev hr-col" style={{ gap: 8, maxWidth: 440, textAlign: "left", marginTop: 8 }}>
          <div className="hr-row"><Sparkles size={16} style={{ color: "var(--c-accentText)" }} /><b>Want to know how you did?</b></div>
          <span className="hr-muted" style={{ lineHeight: 1.5 }}>Practice with Atyant's AI mock interviews and get a full feedback report on every answer, with what to fix before your next real interview.</span>
          <a className="hr-btn primary" href="/mock-interview" style={{ alignSelf: "flex-start" }}>Try a mock interview</a>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="hr-card pad-lg hr-col" style={{ alignItems: "center", textAlign: "center", gap: 12 }}>
        <div className="hr-h3" style={{ fontSize: "1.1rem" }}>Something went wrong with your interview</div>
        <p className="hr-muted" style={{ maxWidth: 420, margin: 0 }}>
          {cand.canRetryPrep ? "We couldn't prepare your questions. Please try again." : `Please contact ${company?.name || "the company"} and let them know.`}
        </p>
        {cand.canRetryPrep && <button className="hr-btn primary" onClick={retry} disabled={retrying}><RotateCcw size={14} /> {retrying ? "Retrying…" : "Try again"}</button>}
      </div>
    );
  }

  return (
    <div className="hr-page">
      <TopBar home={`/hire/i/${slug}`} company={company}>
        <span className="hr-muted hide-sm">Powered by <b>Atyant</b></span>
      </TopBar>
      <div className="hr-narrow hr-col" style={{ gap: 16 }}>
        {cand && <div className="hr-col" style={{ gap: 2 }}><span className="hr-eyebrow">{company?.name}</span><h1 className="hr-h2">{cand.jobTitle}</h1></div>}
        {body}
      </div>
    </div>
  );
}

function JobIntro({ job }) {
  return (
    <div className="hr-col" style={{ gap: 12 }}>
      <span className="hr-eyebrow">{job.company.name} is hiring</span>
      <h1 className="hr-h1" style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)" }}>{job.title}</h1>
      {job.company.about && <p className="hr-sub" style={{ fontSize: ".95rem" }}>{job.company.about}</p>}
      <div className="hr-row wrap" style={{ gap: 6 }}>
        <span className="hr-chip"><Clock size={13} /> {job.durationMin}-minute AI voice interview</span>
        <span className="hr-chip"><Mic size={13} /> Take it now, from any device</span>
        {job.requireCamera && <span className="hr-chip"><Video size={13} /> Camera on</span>}
      </div>
      {job.skills?.length > 0 && (
        <div className="hr-muted">You'll be asked about: {job.skills.slice(0, 6).join(", ")}{job.skills.length > 6 ? ", and your own projects" : " and your own projects"}.</div>
      )}
    </div>
  );
}
