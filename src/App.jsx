import { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Target, CalendarDays, Video,
  TrendingUp, Bookmark,
  Plus, Clock, Lock, ChevronRight, Search,
  LogIn, LogOut, X, Loader2, Menu, Sparkles,
  Copy, ExternalLink, Hash, Check,
} from "lucide-react";

import useIsMobile  from "./hooks/useIsMobile";
import BookingPage   from "./pages/user";
import UpgradePage   from "./pages/UpgradePage";
import ClarityView    from "./components/clarity/ClarityView";
import Footer         from "./components/Footer";
import AskAtyantPage, { startNewChatSession } from "./components/clarity/AskAtyantPage";
import ChatPage       from "./components/clarity/ChatPage";
import MentorOnboard  from "./pages/MentorOnboard";
import ProfilePage    from "./pages/ProfilePage";
import Avatar         from "./components/Avatar";
import SEOHead, { VIEW_SEO } from "./components/SEOHead";
import HomeSEOContent from "./components/HomeSEOContent";
import { useAuth }    from "./context/AuthContext";
import { ThemeToggle } from "./context/ThemeContext";
import { sessionAPI, savedAnswerAPI, roadmapAPI, servicesAPI } from "./api";
import BookingModal from "./components/BookingModal";

// Theme palette. Each value maps to a CSS variable defined in index.css for both
// light (:root) and dark (.dark) modes, so every inline style auto-switches when
// the theme class flips on <html>. `accent` stays a literal hex because it's
// string-concatenated with alpha suffixes (e.g. C.accent + "55") in places, and
// the brand purple is identical in both themes anyway.
const C = {
  bg:           "var(--c-bg)",
  sidebar:      "var(--c-sidebar)",
  sidebarBorder:"var(--c-sidebarBorder)",
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
};

function Spin({ size = 18 }) {
  return <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />;
}

// ─── My Sessions ─────────────────────────────────────────────────────────────
const SERVICE_META = {
  "text-qa":       { label: "Text Q&A",      icon: "💬" },
  "audio-call":    { label: "Audio Call",    icon: "🎧" },
  "video-call":    { label: "Video Call",    icon: "🎥" },
  "resume-review": { label: "Resume Review", icon: "📄" },
};

// One labelled field inside a session's detail grid.
function Detail({ icon, label, value, valueColor, span }) {
  return (
    <div style={{ gridColumn: span ? "1 / -1" : "auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.66rem", fontWeight:600, letterSpacing:"0.04em", color:C.textMuted, textTransform:"uppercase" }}>
        {icon} {label}
      </div>
      <div style={{ marginTop:3, fontSize:"0.85rem", fontWeight:500, color:valueColor || C.text }}>{value}</div>
    </div>
  );
}

function SessionDetailCard({ s, isUpcoming }) {
  const [copied, setCopied] = useState(false);
  const date    = new Date(s.scheduledAt);
  const dateStr = date.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
  const svc     = SERVICE_META[s.serviceId] || { label: s.topic || "Session", icon: "✨" };
  const bookingId = (s._id || "").slice(-8).toUpperCase();
  const hasMeet   = !!s.meetingLink;

  const copyId = () => {
    navigator.clipboard?.writeText(bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ background:C.card, border:`1px solid ${isUpcoming ? C.accent+"44" : C.cardBorder}`, borderRadius:18, overflow:"hidden" }}>
      {isUpcoming && <div style={{ height:4, background:"linear-gradient(90deg,#7567C9,#9F7AEA,#3DBE82)" }} />}
      <div style={{ padding:"1.3rem 1.4rem" }}>
        {/* header */}
        <div style={{ display:"flex", alignItems:"center", gap:13 }}>
          <Avatar src={s.mentorProfilePicture} name={s.mentorName || "Your Mentor"} size={46} bg="7567c9" style={{ border:`1.5px solid ${isUpcoming ? C.accent+"60" : C.activeBorder}` }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, color:C.text, fontSize:"0.95rem" }}>{s.mentorName || "Your Mentor"}</div>
            <div style={{ fontSize:"0.78rem", color:C.textSub, marginTop:2 }}>{svc.icon} {svc.label}</div>
          </div>
          <span style={{ fontSize:"0.7rem", fontWeight:600, padding:"4px 11px", borderRadius:999, background:isUpcoming ? C.accentSoft : C.active, color:isUpcoming ? C.accentText : C.textMuted, border:`1px solid ${isUpcoming ? C.accent+"40" : C.cardBorder}`, whiteSpace:"nowrap" }}>
            {isUpcoming ? "Upcoming" : (s.status === "completed" ? "Completed" : "Past")}
          </span>
        </div>

        {/* detail grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.9rem 1rem", marginTop:"1.1rem", padding:"1rem 1.1rem", background:C.bg, borderRadius:12, border:`1px solid ${C.cardBorder}` }}>
          <Detail icon={<CalendarDays size={13} />} label="Date"     value={dateStr} />
          <Detail icon={<Clock size={13} />}        label="Time"     value={timeStr} />
          <Detail icon={<Video size={13} />}        label="Duration" value={`${s.durationMin || 30} min`} />
          <Detail icon={<Hash size={13} />} label="Booking ID" value={
            <span onClick={copyId} style={{ display:"inline-flex", alignItems:"center", gap:6, cursor:"pointer", fontFamily:"monospace" }}>
              {bookingId}
              {copied ? <Check size={12} style={{ color:C.green }} /> : <Copy size={11} style={{ opacity:0.55 }} />}
            </span>
          } />
          {s.topic && <Detail span icon={<MessageSquare size={13} />} label="Topic" value={s.topic} />}
          {s.amount > 0 && <Detail icon={<span style={{ fontSize:12, fontWeight:700 }}>₹</span>} label="Amount Paid" value={`₹${s.amount}`} valueColor={C.green} />}
        </div>

        {/* meet CTA */}
        {isUpcoming && (hasMeet ? (
          <a href={s.meetingLink} target="_blank" rel="noreferrer"
             style={{ marginTop:"1.1rem", display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"0.85rem", borderRadius:12, background:"linear-gradient(90deg,#7567C9,#5a52a8)", color:"#fff", fontWeight:700, fontSize:"0.88rem", textDecoration:"none", boxShadow:"0 8px 20px -8px #7567C9" }}>
            <Video size={17} /> Join Google Meet <ExternalLink size={13} style={{ opacity:0.85 }} />
          </a>
        ) : (
          <div style={{ marginTop:"1.1rem", padding:"0.75rem 0.9rem", borderRadius:10, background:C.active, border:`1px dashed ${C.cardBorder}`, color:C.textSub, fontSize:"0.78rem", textAlign:"center" }}>
            🔗 The Google Meet link will be emailed to you before the session.
          </div>
        ))}

        {/* raw link (selectable) */}
        {hasMeet && (
          <div style={{ marginTop:9, fontSize:"0.68rem", color:C.textMuted, wordBreak:"break-all", textAlign:"center" }}>{s.meetingLink}</div>
        )}
      </div>
    </div>
  );
}

function MySessionsPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [past,     setPast]     = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    sessionAPI.my()
      .then(data => { setUpcoming(data.upcoming||[]); setPast(data.past||[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:"3rem", textAlign:"center", color:C.textMuted }}><Spin /></div>;

  return (
    <div style={{ padding:"2rem", maxWidth:680, margin:"0 auto" }}>
      <h2 style={{ fontSize:"1.5rem", fontWeight:700, color:C.text, marginBottom:"0.4rem" }}>My Sessions</h2>
      <p style={{ fontSize:"0.85rem", color:C.textMuted, marginBottom:"2rem" }}>Your booked mentorship sessions and Meet links.</p>

      <div style={{ marginBottom:"2.2rem" }}>
        <div style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", color:C.textMuted, marginBottom:"0.9rem" }}>UPCOMING</div>
        {upcoming.length===0
          ? <p style={{ fontSize:"0.85rem", color:C.textMuted }}>No upcoming sessions. Book one from the calendar!</p>
          : <div style={{ display:"grid", gap:14 }}>{upcoming.map((s,i) => <SessionDetailCard key={s._id||i} s={s} isUpcoming={true}  />)}</div>}
      </div>
      <div>
        <div style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", color:C.textMuted, marginBottom:"0.9rem" }}>PAST SESSIONS</div>
        {past.length===0
          ? <p style={{ fontSize:"0.85rem", color:C.textMuted }}>No past sessions yet.</p>
          : <div style={{ display:"grid", gap:14 }}>{past.map((s,i) => <SessionDetailCard key={s._id||i} s={s} isUpcoming={false} />)}</div>}
      </div>
    </div>
  );
}

// ─── My Roadmap ───────────────────────────────────────────────────────────────
function MyRoadmapPage({ user }) {
  const [expanded,   setExpanded]   = useState(0);
  const [steps,      setSteps]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [genLoading, setGenLoading] = useState(false);

  const generate = () => {
    setGenLoading(true);
    const edu = user?.education?.[0] || {};
    roadmapAPI.generate({
      goal:    user?.interests?.[0] || "Career Growth",
      college: edu.institutionName || edu.institution || "",
      branch:  edu.field || "",
      year:    edu.year  || "",
      cgpa:    edu.cgpa  || "",
    })
      .then(data => { if (data.roadmap?.steps) setSteps(data.roadmap.steps); })
      .catch(() => {})
      .finally(() => setGenLoading(false));
  };

  useEffect(() => {
    roadmapAPI.get()
      .then(data => {
        if (data.roadmap?.steps?.length) setSteps(data.roadmap.steps);
        else generate();
      })
      .catch(() => generate())
      .finally(() => setLoading(false));
  }, []);

  const FALLBACK = [
    { phase:"Phase 1", title:"Python & ML Foundations",  duration:"4–6 weeks", status:"active",   tasks:["NumPy, Pandas, Matplotlib basics","Andrew Ng's ML Specialization (Coursera)","Build 1 end-to-end project on Kaggle"] },
    { phase:"Phase 2", title:"Project Portfolio",        duration:"6–8 weeks", status:"upcoming", tasks:["Enter a Kaggle competition","GitHub portfolio with 3 solid repos","Domain project: materials + ML angle"] },
    { phase:"Phase 3", title:"Application Strategy",     duration:"2–3 weeks", status:"upcoming", tasks:["Resume tailored for AI/ML roles","LinkedIn with projects highlighted","Target 50+ startup + FAANG intern openings"] },
    { phase:"Phase 4", title:"Interview Prep",           duration:"Ongoing",   status:"locked",   tasks:["DSA (LeetCode easy/medium)","ML theory & scenario questions","System design basics"] },
  ];

  const displaySteps = steps.length ? steps : FALLBACK;
  if (loading) return <div style={{ padding:"3rem", textAlign:"center", color:C.textMuted }}><Spin /></div>;

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
        <h2 style={{ fontSize:"1.35rem", fontWeight:500, color:C.text }}>My Roadmap</h2>
        <button onClick={generate} disabled={genLoading}
          style={{ fontSize:"0.78rem", background:C.accentSoft, border:`1px solid ${C.accent}55`, color:C.accentText, borderRadius:8, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
          {genLoading ? <><Spin size={13} /> Generating…</> : "↻ Regenerate"}
        </button>
      </div>
      <p style={{ color:C.textSub, fontSize:"0.88rem", marginBottom:"1.25rem" }}>
        {user?.interests?.[0]
          ? `${user?.education?.[0]?.field||"Engineering"} → ${user.interests[0]} · personalised for your profile`
          : "Personalised for your profile"}
      </p>

      {/* How the roadmap is generated — hybrid (AI draft + mentor refinement) */}
      <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"1rem 1.25rem", marginBottom:"2rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <Sparkles size={15} color={C.accentText} />
          <span style={{ fontSize:"0.82rem", fontWeight:600, color:C.text }}>How your roadmap is built</span>
        </div>
        <div style={{ display:"grid", gap:12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          {[
            { n:"1", t:"AI draft", d:"Generated from your branch, goals, CGPA and the questions you've asked Atyant." },
            { n:"2", t:"Mentor refinement", d:"A verified senior who's walked your path tailors the steps after your 1:1 session." },
            { n:"3", t:"You track progress", d:"Tick off steps as you go — regenerate anytime your goals change." },
          ].map((x) => (
            <div key={x.n} style={{ display:"flex", gap:10 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:C.accentSoft, color:C.accentText, border:`1px solid ${C.accent}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{x.n}</div>
              <div>
                <div style={{ fontSize:"0.8rem", fontWeight:600, color:C.text, marginBottom:2 }}>{x.t}</div>
                <div style={{ fontSize:"0.74rem", color:C.textSub, lineHeight:1.5 }}>{x.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", left:23, top:28, bottom:28, width:1.5, background:C.cardBorder }} />
        <div style={{ display:"grid", gap:"1.25rem" }}>
          {displaySteps.map((s, i) => {
            const isActive = s.status==="active";
            const isLocked = s.status==="locked";
            return (
              <div key={i} style={{ display:"flex", gap:16, cursor:!isLocked ? "pointer" : "default" }}
                onClick={() => !isLocked && setExpanded(expanded===i ? -1 : i)}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:isActive ? C.accent : isLocked ? C.bg : C.card, border:`1.5px solid ${isActive ? C.accent : isLocked ? C.textMuted : C.cardBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:600, color:isActive ? "#fff" : isLocked ? C.textMuted : C.textSub, flexShrink:0, zIndex:1, position:"relative" }}>
                  {isLocked ? <Lock size={14} /> : i+1}
                </div>
                <div style={{ flex:1, background:C.card, border:`1px solid ${isActive ? C.accent+"55" : C.cardBorder}`, borderRadius:14, padding:"1rem 1.25rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:"0.7rem", color:C.accentText, fontWeight:700, letterSpacing:"0.1em", marginBottom:3 }}>{s.phase}</div>
                      <div style={{ fontWeight:500, color:isLocked ? C.textMuted : C.text, fontSize:"0.9rem" }}>{s.title}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:"0.7rem", color:C.textMuted, background:C.active, borderRadius:999, padding:"3px 10px", border:`1px solid ${C.cardBorder}` }}>{s.duration}</span>
                      {!isLocked && <ChevronRight size={14} color={C.textMuted} style={{ transform:expanded===i ? "rotate(90deg)" : "none", transition:"transform 0.2s" }} />}
                    </div>
                  </div>
                  {expanded===i && !isLocked && (
                    <ul style={{ margin:"10px 0 0", paddingLeft:"1.2rem" }}>
                      {(s.tasks||[]).map((t, j) => (
                        <li key={j} style={{ fontSize:"0.82rem", color:C.textSub, marginBottom:4, lineHeight:1.5 }}>{t}</li>
                      ))}
                    </ul>
                  )}
                  {isLocked && <div style={{ fontSize:"0.78rem", color:C.textMuted, marginTop:6 }}>Unlocks after Phase 3</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Saved Answers ────────────────────────────────────────────────────────────
function SavedAnswersPage() {
  const [search,  setSearch]  = useState("");
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = (q="") => {
    savedAnswerAPI.list(q)
      .then(data => setAnswers(data.answers||[]))
      .catch(()  => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleRemove = async (id) => {
    await savedAnswerAPI.remove(id).catch(()=>{});
    setAnswers(prev => prev.filter(a => a._id!==id));
  };

  if (loading) return <div style={{ padding:"3rem", textAlign:"center", color:C.textMuted }}><Spin /></div>;

  return (
    <div style={{ padding:"2rem" }}>
      <h2 style={{ fontSize:"1.35rem", fontWeight:500, color:C.text, marginBottom:4 }}>Saved Answers</h2>
      <p style={{ color:C.textSub, fontSize:"0.88rem", marginBottom:"1.5rem" }}>Insights you've bookmarked for quick reference.</p>

      <div style={{ position:"relative", marginBottom:"1.5rem" }}>
        <Search size={14} color={C.textMuted} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saved answers…"
          style={{ width:"100%", background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:10, padding:"9px 14px 9px 36px", color:C.text, fontSize:"0.88rem", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
      </div>

      <div style={{ display:"grid", gap:10 }}>
        {answers.map((a, i) => (
          <div key={a._id||i}
            style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"1.1rem 1.4rem" }}
            onMouseEnter={e => e.currentTarget.style.background=C.cardHover}
            onMouseLeave={e => e.currentTarget.style.background=C.card}>
            <div style={{ fontWeight:400, color:C.text, marginBottom:10, fontSize:"0.88rem", lineHeight:1.55 }}>{a.question}</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", gap:6 }}>
                {(a.tags||[]).map((t, j) => (
                  <span key={j} style={{ fontSize:"0.7rem", padding:"2px 9px", borderRadius:999, background:C.active, color:C.textSub, border:`1px solid ${C.cardBorder}` }}>{t}</span>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:"0.72rem", color:C.textMuted }}>
                  {a.savedAt ? new Date(a.savedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : ""}
                </span>
                <button onClick={() => handleRemove(a._id)}
                  style={{ background:"transparent", border:"none", color:C.textMuted, cursor:"pointer", fontSize:"0.75rem", padding:0 }}>✕</button>
              </div>
            </div>
          </div>
        ))}
        {answers.length===0 && (
          <div style={{ textAlign:"center", color:C.textMuted, padding:"3rem", fontSize:"0.88rem" }}>
            {search ? `No saved answers match "${search}"` : "Nothing saved yet. Bookmark answers from the Clarity view."}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuthed }) {
  const { login, signup } = useAuth();
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone,    setPhone]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if (mode==="login") await login(email, password);
      else {
        // Normalize phone → bare 10-digit Indian number (strip +91 / spaces / leading 0).
        const cleanPhone = phone.replace(/\D/g, "").slice(-10);
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
          setError("Enter a valid 10-digit Indian mobile number");
          setLoading(false);
          return;
        }
        // Carry referral credit if someone landed via a shared profile link
        const referredBy = sessionStorage.getItem("referredBy") || undefined;
        await signup(username, email, password, cleanPhone, undefined, referredBy);
        sessionStorage.removeItem("referredBy");
      }
      onClose();
      onAuthed?.();   // land on home after a successful login/signup
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inp = { width:"100%", background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:9, padding:"10px 14px", color:C.text, fontSize:"0.88rem", outline:"none", fontFamily:"inherit", boxSizing:"border-box" };
  const lbl = { fontSize:"0.75rem", color:C.textSub, display:"block", marginBottom:6, letterSpacing:"0.05em" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:C.sidebar, border:`1px solid ${C.cardBorder}`, borderRadius:20, padding:"2rem", width:360, position:"relative" }}>
        <button onClick={onClose}
          style={{ position:"absolute", top:14, right:14, background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:"50%", width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textSub }}>
          <X size={14} />
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:"1.5rem" }}>
          <div style={{ width:28, height:28, borderRadius:7, background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#fff", fontWeight:700 }}>A</div>
          <span style={{ fontWeight:600, fontSize:"1rem", color:C.text }}>{mode==="login" ? "Sign in to Atyant" : "Create your account"}</span>
        </div>

        {/* Google Sign-in Button */}
        <button onClick={() => {
          const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
          window.location.href = `${apiBase}/api/auth/google`;
        }}
          style={{
            width: "100%",
            background: C.active,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: 10,
            padding: "10px 14px",
            color: C.text,
            fontSize: "0.88rem",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: "1rem",
            transition: "all 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.borderColor = C.accent + "66"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.active; e.currentTarget.style.borderColor = C.cardBorder; }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
          <div style={{ flex: 1, height: 1, background: C.cardBorder }} />
          <span style={{ fontSize: "0.72rem", color: C.textMuted, fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: C.cardBorder }} />
        </div>

        {mode==="signup" && <>
          <div style={{ marginBottom:"1rem" }}>
            <label style={lbl}>USERNAME</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="rahulmehta" style={inp} />
          </div>
          <div style={{ marginBottom:"1rem" }}>
            <label style={lbl}>PHONE (10-digit Indian number)</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" style={inp} />
          </div>
        </>}

        <div style={{ marginBottom:"1rem" }}>
          <label style={lbl}>EMAIL</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.ac.in" style={inp} />
        </div>
        <div style={{ marginBottom:"1.5rem" }}>
          <label style={lbl}>PASSWORD</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inp}
            onKeyDown={e => e.key==="Enter" && handle()} />
        </div>

        {error && <p style={{ color:"#f87171", fontSize:"0.82rem", marginBottom:"1rem" }}>{error}</p>}

        <button onClick={handle} disabled={loading}
          style={{ width:"100%", background:C.accent, border:"none", borderRadius:10, padding:11, color:"#fff", fontSize:"0.92rem", fontWeight:600, cursor:loading ? "not-allowed" : "pointer", fontFamily:"inherit", opacity:loading ? 0.7 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {loading ? <><Spin size={16}/> {mode==="login" ? "Signing in…" : "Creating account…"}</> : mode==="login" ? "Sign in →" : "Create account →"}
        </button>

        <p style={{ textAlign:"center", fontSize:"0.78rem", color:C.textMuted, marginTop:"1.25rem", marginBottom:0 }}>
          {mode==="login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color:C.accentText, cursor:"pointer" }} onClick={() => { setMode(mode==="login" ? "signup" : "login"); setError(""); }}>
            {mode==="login" ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading, logout } = useAuth();
  const [activePage,   setActivePage]   = useState("ask");
  const [prevPage,     setPrevPage]     = useState("ask");  // page to return to from Upgrade
  const [showAuth,     setShowAuth]     = useState(false);
  const [bookingTarget, setBookingTarget] = useState(null); // { mentorId, mentorName, mentorPic, services }
  const [serviceCatalog, setServiceCatalog] = useState([]);

  // Load service catalog once for the booking modal
  useEffect(() => {
    servicesAPI.catalog().then(d => setServiceCatalog(d.services || [])).catch(() => {});
  }, []);

  // Global trigger: any component can call window.openBooking({ mentorId, mentorName, mentorPic })
  useEffect(() => {
    window.openBooking = (target) => {
      if (!user) { setShowAuth(true); return; }
      setBookingTarget({ services: serviceCatalog, ...target });
    };
    return () => { delete window.openBooking; };
  }, [user, serviceCatalog]);

  // Go to the upgrade/premium view, remembering where we came from.
  const goToUpgrade = () => { setPrevPage(activePage === "upgrade" ? prevPage : activePage); setActivePage("upgrade"); };
  // Return to the free-plan experience (the page the user was on before upgrading).
  const goToFree = () => setActivePage(prevPage && prevPage !== "upgrade" ? prevPage : "ask");

  // ── Browser / phone back-button support ──────────────────────────────────────
  // The app navigates by `activePage` state rather than routes, so without this the
  // browser back button would exit the site. We mirror each in-app navigation into
  // the history stack and restore the page on popstate.
  const fromPopRef = useRef(false);
  useEffect(() => {
    if (!window.history.state || !window.history.state.page) {
      window.history.replaceState({ page: activePage }, "");
    }
    const onPop = (e) => {
      fromPopRef.current = true;
      setActivePage((e.state && e.state.page) || "ask");
      if (isMobile) setSidebarOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (fromPopRef.current) { fromPopRef.current = false; return; }   // don't re-push on a back/forward
    if (!window.history.state || window.history.state.page !== activePage) {
      window.history.pushState({ page: activePage }, "");
    }
  }, [activePage]);
  const [clarityQuery, setClarityQuery] = useState("");
  const [bookingMentor, setBookingMentor] = useState(null);
  const [chatMentor,   setChatMentor]   = useState(null);
  const [chatSession,  setChatSession]  = useState(0);
  const [clarityContext, setClarityContext] = useState(null);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap";
    document.head.appendChild(link);
    document.body.style.margin  = "0";
    document.body.style.padding = "0";
    document.body.style.background = C.bg;
  }, []);

  const goToClarity = (query, context) => {
    setClarityQuery(query);
    setClarityContext(context);
    setActivePage("clarity");
  };
  
  const handleStartBooking = (mentor) => {
    setBookingMentor(mentor);
    setActivePage("book");
  };

  // "Talk to Senior" → open the real-time chat with that mentor
  const handleOpenChat = (mentor) => {
    setChatMentor(mentor);
    setActivePage("chat");
  };

  const workspaceItems = [
    { id:"ask",      Icon:MessageSquare, label:"Ask Atyant"     },
    { id:"clarity",  Icon:Target,        label:"Clarity Results" },
    { id:"book",     Icon:CalendarDays,  label:"Book a Session"  },
    { id:"sessions", Icon:Video,         label:"My Sessions"     },
  ];
  const journeyItems = [
    { id:"roadmap", Icon:TrendingUp, label:"My Roadmap"    },
    { id:"saved",   Icon:Bookmark,   label:"Saved Answers" },
  ];

  const pages = {
    ask:      <AskAtyantPage  key={chatSession} user={user} onGoToClarity={goToClarity} />,
    clarity:  <ClarityView    key={clarityQuery || "empty"} initialQuery={clarityQuery} initialContext={clarityContext} user={user} onTalkToMentor={handleStartBooking} />,
    chat:     <ChatPage       key={chatMentor?.id || chatMentor?._id || "chat"} mentor={chatMentor} />,
    "mentor-onboard": <MentorOnboard onDone={() => setActivePage("profile")} />,
    book:     <BookingPage    mentor={bookingMentor} user={user} onAuthRequired={() => setShowAuth(true)} onFindMentor={() => setActivePage("clarity")} onOpenChat={() => { setChatMentor(bookingMentor); setActivePage("chat"); }} onViewSessions={() => setActivePage("sessions")} />,
    sessions: <MySessionsPage />,
    roadmap:  <MyRoadmapPage  user={user} />,
    saved:    <SavedAnswersPage />,
    profile:  <ProfilePage />,
    upgrade:  <UpgradePage onBack={goToFree} />,
  };

  const initials = user ? (user.username||user.name||"?").slice(0,2).toUpperCase() : null;

  if (loading) return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:C.textMuted }}>
      <Spin size={28} />
    </div>
  );

  const NavItem = ({ item }) => {
    const isActive = activePage===item.id;
    return (
      <button onClick={() => { setActivePage(item.id); if (isMobile) setSidebarOpen(false); }}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 14px", borderRadius:9, border:"none", background:isActive ? C.active : "transparent", color:isActive ? C.text : C.textSub, cursor:"pointer", fontFamily:"inherit", fontSize:"0.86rem", textAlign:"left", transition:"all 0.15s", fontWeight:isActive ? 500 : 400 }}>
        <item.Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
        {item.label}
      </button>
    );
  };

  const seo = VIEW_SEO[activePage] || VIEW_SEO.ask;

  return (
    <>
    <div style={{ background:C.bg, minHeight:"100dvh", display:"flex", fontFamily:"'Satoshi',-apple-system,sans-serif", color:C.text }}>

      <SEOHead {...seo} />

      {/* ── Mobile overlay behind the drawer ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:45 }}
        />
      )}

      {/* ── Sidebar ── */}
      <div style={{ width:254, flexShrink:0, background:C.sidebar, borderRight:`1px solid ${C.sidebarBorder}`, display:"flex", flexDirection:"column", height:"100dvh", position:isMobile ? "fixed" : "sticky", top:0, left:0, zIndex:50, transform:isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)", transition:"transform 0.25s ease", boxShadow:isMobile && sidebarOpen ? "0 24px 60px rgba(0,0,0,0.5)" : "none" }}>
        <div style={{ height:57, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.25rem", flexShrink:0 }}>
          <span style={{ fontWeight:700, fontSize:"1.3rem", letterSpacing:"-0.02em", lineHeight:1 }}>
            <span style={{ fontWeight:700, color:C.accent }}>Aty</span><span style={{ color:C.text }}>ant</span>
          </span>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} aria-label="Close menu"
              style={{ width:34, height:34, borderRadius:9, border:`1px solid ${C.cardBorder}`, background:C.active, color:C.textSub, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:0, flexShrink:0 }}
              onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textSub; }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"1rem 0.625rem" }}>
          {/* ── New Chat Button ── */}
          <button
            onClick={() => {
              startNewChatSession();   // rotate to a fresh session id
              setClarityQuery("");
              setActivePage("ask");
              setChatSession(prev => prev + 1);  // remount AskAtyantPage clean
              if (isMobile) setSidebarOpen(false);
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              background: "transparent",
              color: C.textSub,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.88rem",
              fontWeight: 500,
              transition: "all 0.15s",
              textAlign: "left",
              marginBottom: "1.25rem",
              boxSizing: "border-box",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = C.text;
              const circle = e.currentTarget.querySelector(".new-chat-circle");
              if (circle) circle.style.background = C.cardHover;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = C.textSub;
              const circle = e.currentTarget.querySelector(".new-chat-circle");
              if (circle) circle.style.background = C.active;
            }}
          >
            <div
              className="new-chat-circle"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: C.active,
                border: `1px solid ${C.cardBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s"
              }}
            >
              <Plus size={14} color={C.accentText} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "0.92rem", fontWeight: 500 }}>New chat</span>
          </button>

          <div style={{ marginBottom:"1.75rem" }}>
            <div style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.14em", color:C.textMuted, padding:"0 10px", marginBottom:6 }}>WORKSPACE</div>
            {workspaceItems.map(item => <NavItem key={item.id} item={item} />)}
          </div>
          <div>
            <div style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.14em", color:C.textMuted, padding:"0 10px", marginBottom:6 }}>JOURNEY</div>
            {journeyItems.map(item => <NavItem key={item.id} item={item} />)}
          </div>
        </div>

        <div style={{ padding:"0.875rem", borderTop:`1px solid ${C.sidebarBorder}` }}>
          {/* Become a mentor — only for logged-out visitors */}
          {!user && (
            <button onClick={() => { setActivePage("mentor-onboard"); if (isMobile) setSidebarOpen(false); }}
              style={{ width:"100%", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:"transparent", border:`1px solid ${C.accent}55`, borderRadius:10, padding:"9px 12px", color:C.accentText, fontSize:"0.8rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = C.accentSoft; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <Sparkles size={13} /> Become a mentor
            </button>
          )}
          {user ? (
            <div onClick={() => { setActivePage("profile"); if (isMobile) setSidebarOpen(false); }}
              style={{ background:activePage==="profile" ? C.cardHover : C.active, border:`1px solid ${activePage==="profile" ? C.accent+"55" : C.activeBorder}`, borderRadius:12, padding:"11px 13px", display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}
              onMouseEnter={e => { e.currentTarget.style.background=C.cardHover; e.currentTarget.style.borderColor=C.accent+"55"; }}
              onMouseLeave={e => { e.currentTarget.style.background=activePage==="profile" ? C.cardHover : C.active; e.currentTarget.style.borderColor=activePage==="profile" ? C.accent+"55" : C.activeBorder; }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <Avatar src={user.profilePicture} name={user.username||user.name||"You"} size={34} bg="7567c9" style={{ border:`1.5px solid ${C.accent}70` }} />
                <span style={{ position:"absolute", bottom:0, right:0, width:9, height:9, borderRadius:"50%", background:C.green, border:`2px solid ${C.sidebar}` }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"0.86rem", fontWeight:500, color:C.text }}>{user.username||user.name||"You"}</div>
                <div style={{ fontSize:"0.7rem", color:C.textMuted, marginTop:1 }}>{user.education?.[0]?.institutionName||user.education?.[0]?.institution||"Atyant"}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); logout(); }}
                style={{ background:"transparent", border:"none", padding:6, borderRadius:6, color:C.textSub, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.active; e.currentTarget.style.color = "#f87171"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; }}
                title="Sign out">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:C.accent, border:"none", borderRadius:12, padding:"11px 13px", color:"#fff", fontSize:"0.86rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              <LogIn size={15} /> Sign in
            </button>
          )}
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex:1, overflow:"hidden", height:"100dvh", display:"flex", flexDirection:"column" }}>
        <div style={{ height:57, display:"flex", justifyContent:"space-between", alignItems:"center", padding:isMobile ? "0 16px" : "0 24px", background:C.bg, flexShrink:0 }}>
          {isMobile ? (
            <button onClick={() => setSidebarOpen(true)} aria-label="Open menu"
              style={{ width:36, height:36, borderRadius:9, border:`1px solid ${C.cardBorder}`, background:C.active, color:C.textSub, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:0, flexShrink:0 }}>
              <Menu size={18} />
            </button>
          ) : <div />}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <ThemeToggle size={16} style={{ padding:7, borderRadius:7 }} />
            {(() => { const onUpgrade = activePage === "upgrade"; return (<>
            <button onClick={goToFree}
              style={{ background: onUpgrade ? "transparent" : C.active, border:`1px solid ${onUpgrade ? C.accent+"55" : C.cardBorder}`, borderRadius:7, padding:"5px 12px", color: onUpgrade ? C.accentText : C.textMuted, fontSize:"0.75rem", fontWeight:500, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>Free Plan</button>
            <button onClick={goToUpgrade}
              style={{ background: C.accent, border:`1px solid ${C.accent}`, borderRadius:7, padding:"5px 12px", color: "#fff", fontSize:"0.75rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>Upgrade</button>
            </>); })()}
          </div>
        </div>
        <div style={{ flex:1, overflow: ["ask","clarity","chat"].includes(activePage) ? "hidden" : "auto" }}>{pages[activePage]}</div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthed={() => setActivePage("ask")} />}

      {bookingTarget && (
        <BookingModal
          mentorId={bookingTarget.mentorId}
          mentorName={bookingTarget.mentorName}
          mentorPic={bookingTarget.mentorPic}
          services={bookingTarget.services?.filter(s => (bookingTarget.servicesOffered || bookingTarget.services?.map(x=>x.id))?.includes(s.id)) || bookingTarget.services || []}
          onClose={() => setBookingTarget(null)}
          onBooked={() => { setBookingTarget(null); setActivePage("sessions"); }}
        />
      )}

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>

    {/* Crawlable homepage SEO content — renders below the app shell (body-flow)
        so the chat stays the hero. Homepage view only. */}
    {activePage === "ask" && (
      <>
        <HomeSEOContent />
        <Footer/>
      </>
    )}
    </>
  );
}
