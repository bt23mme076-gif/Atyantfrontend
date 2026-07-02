import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  MessageSquare, Target, CalendarDays, Video,
  TrendingUp, Bookmark, BarChart3,
  Plus, Clock, Lock, ChevronRight, Search,
  LogIn, LogOut, X, Loader2, Menu, Sparkles,
  Copy, ExternalLink, Hash, Check, Star,
  Activity, IndianRupee, CalendarClock, UserRound,
  GraduationCap, Briefcase, Zap, Trophy, Compass, Link2, Home,
} from "lucide-react";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useIsMobile from "./hooks/useIsMobile";
import ClarityView from "./components/clarity/ClarityView";
import Footer from "./components/Footer";
import MentorTrackPage from "./pages/MentorTrackPage";

import AskAtyantPage, { startNewChatSession } from "./components/clarity/AskAtyantPage";
// Heavy, rarely-first pages are code-split so the initial bundle stays lean.
const BookingPage   = lazy(() => import("./pages/user"));
const UpgradePage   = lazy(() => import("./pages/UpgradePage"));
const ChatPage      = lazy(() => import("./components/clarity/ChatPage"));
const MentorOnboard = lazy(() => import("./pages/MentorOnboard"));
const ProfilePage   = lazy(() => import("./pages/ProfilePage"));
import Avatar         from "./components/Avatar";
import SEOHead, { VIEW_SEO } from "./components/SEOHead";
import HomeSEOContent from "./components/HomeSEOContent";
import { useAuth } from "./context/AuthContext";

import { ThemeToggle } from "./context/ThemeContext";
import {
  sessionAPI,
  savedAnswerAPI,
  roadmapAPI,
  servicesAPI,
  authAPI
} from "./api";
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
  const [copied,       setCopied]       = useState(false);
  const [hoverRating,  setHoverRating]  = useState(0);
  const [chosenRating, setChosenRating] = useState(s.review?.rating || 0);
  const [comment,      setComment]      = useState(s.review?.comment || "");
  const [reviewing,    setReviewing]    = useState(false);
  const [reviewed,     setReviewed]     = useState(!!s.review?.submittedAt);
  const date    = new Date(s.scheduledAt);
  const dateStr = date.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
  const svc     = SERVICE_META[s.serviceId] || { label: s.topic || "Session", icon: "✨" };
  // Mentors see the student; students see the mentor. Backend sends counterpart*.
  const isMentorView    = s.viewerRole === "mentor";
  const counterpartName = s.counterpartName || s.mentorName || "Your Mentor";
  const counterpartPic  = s.counterpartPicture || s.mentorProfilePicture;
  const bookingId = (s._id || "").slice(-8).toUpperCase();
  // The meet opens at /atyantEngine/?meet=<id> on the current origin — atyant.in
  // proxies "/atyantEngine" to this product app (bare "/" is now the marketing
  // site's own homepage), and serving it same-origin keeps the localStorage auth
  // token available. The backend ensures the LiveKit room idempotently on join,
  // so we build the link from the id directly rather than relying on a saved
  // meetingLink.
  const meetUrl   = s._id ? `/atyantEngine/?meet=${s._id}` : "";
  const hasMeet   = !!meetUrl;

  const copyId = () => {
    navigator.clipboard?.writeText(bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ background:C.card, border:`1px solid ${isUpcoming ? C.accent+"44" : C.cardBorder}`, borderRadius:18, overflow:"hidden" }}>
      {isUpcoming && <div style={{ height:4, background:"linear-gradient(90deg,#7567C9,#9F7AEA,#3DBE82)" }} />}
      <div style={{ padding:"1.3rem 1.4rem" }}>
        {/* header — show the other party (student sees mentor, mentor sees student) */}
        <div style={{ display:"flex", alignItems:"center", gap:13 }}>
          <Avatar src={counterpartPic} name={counterpartName} size={46} bg="7567c9" style={{ border:`1.5px solid ${isUpcoming ? C.accent+"60" : C.activeBorder}` }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, color:C.text, fontSize:"0.95rem" }}>{counterpartName}</div>
            <div style={{ fontSize:"0.78rem", color:C.textSub, marginTop:2 }}>
              {isMentorView && <span style={{ color:C.accentText, fontWeight:600 }}>Student · </span>}{svc.icon} {svc.label}
            </div>
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
          <a href={meetUrl} target="_blank" rel="noreferrer"
             style={{ marginTop:"1.1rem", display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"0.85rem", borderRadius:12, background:"linear-gradient(90deg,#7567C9,#5a52a8)", color:"#fff", fontWeight:700, fontSize:"0.88rem", textDecoration:"none", boxShadow:"0 8px 20px -8px #7567C9" }}>
            <Video size={17} /> Join Session <ExternalLink size={13} style={{ opacity:0.85 }} />
          </a>
        ) : (
          <div style={{ marginTop:"1.1rem", padding:"0.75rem 0.9rem", borderRadius:10, background:C.active, border:`1px dashed ${C.cardBorder}`, color:C.textSub, fontSize:"0.78rem", textAlign:"center" }}>
            🔗 Your meeting link will be emailed to you before the session.
          </div>
        ))}

        {/* raw link (selectable) */}
        {hasMeet && (
          <div style={{ marginTop:9, fontSize:"0.68rem", color:C.textMuted, wordBreak:"break-all", textAlign:"center" }}>{meetUrl}</div>
        )}

        {/* Review section — only for past student sessions */}
        {!isUpcoming && !isMentorView && (
          <div style={{ marginTop:"1.1rem", padding:"1rem 1.1rem", background:C.bg, borderRadius:12, border:`1px solid ${C.cardBorder}` }}>
            {reviewed ? (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ display:"flex", gap:3 }}>
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={14} fill={n <= chosenRating ? "#F59E0B" : "none"} stroke={n <= chosenRating ? "#F59E0B" : C.textMuted} />
                  ))}
                </div>
                <span style={{ fontSize:"0.75rem", color:C.textSub }}>
                  {comment ? `"${comment}"` : "Thanks for your review!"}
                </span>
              </div>
            ) : (
              <>
                <p style={{ fontSize:"0.72rem", fontWeight:600, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"0.6rem" }}>Rate this session</p>
                <div style={{ display:"flex", gap:6, marginBottom:"0.7rem" }}>
                  {[1,2,3,4,5].map(n => (
                    <Star
                      key={n}
                      size={22}
                      fill={n <= (hoverRating || chosenRating) ? "#F59E0B" : "none"}
                      stroke={n <= (hoverRating || chosenRating) ? "#F59E0B" : C.textMuted}
                      style={{ cursor:"pointer", transition:"transform 0.1s", transform: n <= (hoverRating || chosenRating) ? "scale(1.15)" : "scale(1)" }}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setChosenRating(n)}
                    />
                  ))}
                </div>
                {chosenRating > 0 && (
                  <>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="What did you take away? (optional)"
                      maxLength={300}
                      rows={2}
                      style={{ width:"100%", padding:"0.55rem 0.75rem", borderRadius:8, border:`1px solid ${C.cardBorder}`, background:C.card, color:C.text, fontSize:"0.8rem", resize:"none", fontFamily:"Inter, sans-serif", marginBottom:"0.6rem", outline:"none", boxSizing:"border-box" }}
                    />
                    <button
                      disabled={reviewing}
                      onClick={async () => {
                        setReviewing(true);
                        try {
                          await sessionAPI.review(s._id, chosenRating, comment);
                          setReviewed(true);
                        } catch { /* silent */ }
                        setReviewing(false);
                      }}
                      style={{ padding:"0.5rem 1.2rem", borderRadius:8, background:"linear-gradient(135deg,#7567C9,#5a52a8)", color:"#fff", fontWeight:600, fontSize:"0.8rem", border:"none", cursor:"pointer", opacity: reviewing ? 0.7 : 1 }}
                    >
                      {reviewing ? "Saving…" : "Submit Review"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Student's review — read-only, shown on the mentor's side of My Sessions */}
        {!isUpcoming && isMentorView && s.review?.submittedAt && (
          <div style={{ marginTop:"1.1rem", padding:"1rem 1.1rem", background:C.bg, borderRadius:12, border:`1px solid ${C.cardBorder}` }}>
            <p style={{ fontSize:"0.72rem", fontWeight:600, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"0.6rem" }}>
              {counterpartName}'s review
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ display:"flex", gap:3 }}>
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={14} fill={n <= s.review.rating ? "#F59E0B" : "none"} stroke={n <= s.review.rating ? "#F59E0B" : C.textMuted} />
                ))}
              </div>
              {s.review.comment && <span style={{ fontSize:"0.75rem", color:C.textSub }}>"{s.review.comment}"</span>}
            </div>
          </div>
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
                    <div style={{ margin:"12px 0 2px", display:"grid", gap:8 }}>
                      {(s.tasks||[]).map((t, j) => (
                        <div key={j} style={{ display:"flex", gap:9, alignItems:"flex-start" }}>
                          <span style={{ width:16, height:16, borderRadius:5, background:isActive ? C.accentSoft : C.active, border:`1px solid ${isActive ? C.accent+"55" : C.cardBorder}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                            <Check size={10} color={isActive ? C.accentText : C.textMuted} strokeWidth={2.6} />
                          </span>
                          <span style={{ fontSize:"0.82rem", color:C.textSub, lineHeight:1.5 }}>{t}</span>
                        </div>
                      ))}
                    </div>
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
// Classify a saved answer into a visual "type" so the card gets a matching icon,
// accent colour and label (Session Summary vs Action Item vs AI vs bookmark).
function savedAnswerMeta(a) {
  const tags = a.tags || [];
  if (tags.includes("Session Summary"))
    return { label:"Session Summary", Icon:Sparkles, color:C.accent, tint:C.accentSoft, text:C.accentText };
  if (tags.includes("Action Item"))
    return { label:"Action Item", Icon:Target, color:C.green, tint:"rgba(61,190,130,0.14)", text:C.green };
  if (a.sourceType === "ai")
    return { label:"Atyant AI", Icon:Zap, color:C.accent, tint:C.accentSoft, text:C.accentText };
  return { label:"Saved", Icon:Bookmark, color:C.textMuted, tint:C.active, text:C.textSub };
}

function SavedAnswerCard({ a, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const { label, Icon, color, tint, text } = savedAnswerMeta(a);
  const body = a.question || "";
  const isLong = body.length > 260;
  // Hide the type tag itself from the pill row (it's already shown in the header).
  const pills = (a.tags || []).filter(t => t !== label);

  return (
    <div
      style={{
        background:C.card, border:`1px solid ${C.cardBorder}`, borderLeft:`3px solid ${color}`,
        borderRadius:16, padding:"1.15rem 1.35rem", boxShadow:"0 1px 2px rgba(0,0,0,0.04)",
        transition:"transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 10px 26px -12px rgba(0,0,0,0.28)"; e.currentTarget.style.borderColor=C.accent+"44"; e.currentTarget.style.borderLeftColor=color; }}
      onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 1px 2px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor=C.cardBorder; e.currentTarget.style.borderLeftColor=color; }}
    >
      {/* header row: type chip + date + delete */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <span style={{ width:26, height:26, borderRadius:8, background:tint, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon size={14} color={text} strokeWidth={2.1} />
          </span>
          <span style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:text }}>{label}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:"0.72rem", color:C.textMuted }}>
            {a.savedAt ? new Date(a.savedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : ""}
          </span>
          <button onClick={() => onRemove(a._id)} aria-label="Remove"
            style={{ width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"none", borderRadius:6, color:C.textMuted, cursor:"pointer", padding:0, transition:"background 0.15s, color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background=C.active; e.currentTarget.style.color=C.text; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=C.textMuted; }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* body — preserve line breaks (rich summaries carry a "Key points" list) */}
      <div style={{
        color:C.text, fontSize:"0.9rem", lineHeight:1.62, whiteSpace:"pre-wrap",
        ...(isLong && !expanded ? { display:"-webkit-box", WebkitLineClamp:4, WebkitBoxOrient:"vertical", overflow:"hidden" } : {}),
      }}>
        {body}
      </div>
      {isLong && (
        <button onClick={() => setExpanded(v => !v)}
          style={{ marginTop:8, background:"transparent", border:"none", color:C.accentText, fontSize:"0.78rem", fontWeight:600, cursor:"pointer", padding:0, fontFamily:"inherit", display:"flex", alignItems:"center", gap:4 }}>
          {expanded ? "Show less" : "Read more"}
          <ChevronRight size={13} style={{ transform:expanded ? "rotate(-90deg)" : "rotate(90deg)", transition:"transform 0.2s" }} />
        </button>
      )}

      {/* tag pills */}
      {pills.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:12 }}>
          {pills.map((t, j) => (
            <span key={j} style={{ fontSize:"0.68rem", fontWeight:500, padding:"3px 10px", borderRadius:999, background:C.active, color:C.textSub, border:`1px solid ${C.cardBorder}` }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function SavedAnswersPage() {
  const [search,  setSearch]  = useState("");
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);

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
    <div style={{ padding:"2rem", maxWidth:760, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
        <h2 style={{ fontSize:"1.35rem", fontWeight:600, color:C.text, margin:0 }}>Saved Answers</h2>
        {answers.length > 0 && (
          <span style={{ fontSize:"0.72rem", fontWeight:600, color:C.accentText, background:C.accentSoft, border:`1px solid ${C.accent}44`, borderRadius:999, padding:"2px 10px" }}>{answers.length}</span>
        )}
      </div>
      <p style={{ color:C.textSub, fontSize:"0.88rem", marginBottom:"1.5rem" }}>Session summaries, action items and insights you've saved.</p>

      <div style={{ position:"relative", marginBottom:"1.5rem" }}>
        <Search size={15} color={focused ? C.accentText : C.textMuted} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", transition:"color 0.15s" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="Search saved answers…"
          style={{ width:"100%", background:C.card, border:`1px solid ${focused ? C.accent+"88" : C.cardBorder}`, boxShadow:focused ? `0 0 0 3px ${C.accentSoft}` : "none", borderRadius:12, padding:"11px 14px 11px 38px", color:C.text, fontSize:"0.9rem", outline:"none", fontFamily:"inherit", boxSizing:"border-box", transition:"border-color 0.15s, box-shadow 0.15s" }} />
      </div>

      <div style={{ display:"grid", gap:12 }}>
        {answers.map((a, i) => (
          <SavedAnswerCard key={a._id||i} a={a} onRemove={handleRemove} />
        ))}
        {answers.length===0 && (
          <div style={{ textAlign:"center", padding:"3.5rem 2rem", background:C.card, border:`1px dashed ${C.cardBorder}`, borderRadius:16 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:C.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
              <Bookmark size={20} color={C.accentText} />
            </div>
            <div style={{ color:C.text, fontSize:"0.92rem", fontWeight:600, marginBottom:4 }}>
              {search ? "No matches found" : "Nothing saved yet"}
            </div>
            <div style={{ color:C.textMuted, fontSize:"0.84rem", lineHeight:1.5 }}>
              {search ? `Nothing matches "${search}"` : "Finish a mentor session or bookmark answers from Clarity — they'll show up here."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuthed }) {
  const { login, signupInitiate, signupVerify, signupResendOtp } = useAuth();

  // modes: login | signup | signup-otp | forgot | verify | reset
  const [mode,        setMode]        = useState("login");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [otp,         setOtp]         = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [username,    setUsername]    = useState("");
  const [phone,       setPhone]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  // Count-down for OTP resend cooldown (seconds)
  const [resendCooldown, setResendCooldown] = useState(0);

  // Decrement resend cooldown every second
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handle = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        onClose();
        onAuthed?.();

      } else if (mode === "signup") {
        const cleanPhone = phone.replace(/\D/g, "").slice(-10);
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
          setError("Enter a valid 10-digit Indian mobile number");
          setLoading(false);
          return;
        }
        const referredBy = sessionStorage.getItem("referredBy") || undefined;

        // Step 1 — send OTP
        await signupInitiate(username, email, password, cleanPhone, undefined);
        if (referredBy) sessionStorage.setItem("referredBy", referredBy); // keep until verified

        setSuccess("OTP sent to " + email + ". Check your inbox (and spam folder).");
        setResendCooldown(60);
        setMode("signup-otp");

      } else if (mode === "signup-otp") {
        // Step 2 — verify OTP
        await signupVerify(email, otp);
        sessionStorage.removeItem("referredBy");
        onClose();
        onAuthed?.();

      } else if (mode === "forgot") {
        const response = await authAPI.forgotPassword(email);
        setSuccess(response.message || "If an account exists with this email, an OTP has been sent.");
        setMode("verify");

      } else if (mode === "verify") {
        await authAPI.verifyResetCode(email, otp);
        setMode("reset");

      } else if (mode === "reset") {
        await authAPI.resetPassword(email, otp, newPassword);
        setSuccess("Password reset successful. Please sign in with your new password.");
        setPassword("");
        setOtp("");
        setNewPassword("");
        setTimeout(() => { setMode("login"); setSuccess(""); }, 2000);
      }

    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResendSignupOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setSuccess("");
    try {
      await signupResendOtp(email);
      setSuccess("A new OTP has been sent to " + email);
      setResendCooldown(60);
    } catch (e) {
      setError(e.message || "Failed to resend OTP");
    }
  };

  const inp = { width:"100%", background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:9, padding:"10px 14px", color:C.text, fontSize:"0.88rem", outline:"none", fontFamily:"inherit", boxSizing:"border-box" };
  const lbl = { fontSize:"0.75rem", color:C.textSub, display:"block", marginBottom:6, letterSpacing:"0.05em" };

  const modeTitle = {
    login:       "Sign in to Atyant",
    signup:      "Create your account",
    "signup-otp":"Verify your email",
    forgot:      "Forgot Password",
    verify:      "Verify OTP",
    reset:       "Reset Password",
  }[mode] || "Atyant";

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
          <span style={{ fontWeight:600, fontSize:"1rem", color:C.text }}>{modeTitle}</span>
        </div>

        {/* Google Sign-in — only on login / signup screens */}
        {(mode === "login" || mode === "signup") && (
          <>
            <button
              onClick={() => {
                const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
                window.location.href = `${apiBase}/api/auth/google`;
              }}
              style={{ width:"100%", background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:"0.88rem", fontWeight:500, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:"1rem", transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.borderColor = C.accent+"66"; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.active; e.currentTarget.style.borderColor = C.cardBorder; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1rem" }}>
              <div style={{ flex:1, height:1, background:C.cardBorder }} />
              <span style={{ fontSize:"0.72rem", color:C.textMuted, fontWeight:500 }}>or</span>
              <div style={{ flex:1, height:1, background:C.cardBorder }} />
            </div>
          </>
        )}

        {/* ── Signup fields ── */}
        {mode === "signup" && <>
          <div style={{ marginBottom:"1rem" }}>
            <label style={lbl}>USERNAME</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="rahulmehta" style={inp} />
          </div>
          <div style={{ marginBottom:"1rem" }}>
            <label style={lbl}>PHONE (10-digit Indian number)</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" style={inp} />
          </div>
        </>}

        {/* ── Email field (login / signup / forgot) ── */}
        {(mode === "login" || mode === "signup" || mode === "forgot") && (
          <div style={{ marginBottom:"1rem" }}>
            <label style={lbl}>{mode === "login" ? "EMAIL OR MOBILE NUMBER" : "EMAIL"}</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={mode === "login" ? "you@college.ac.in or 9876543210" : "you@college.ac.in"}
              style={inp}
            />
          </div>
        )}

        {/* ── Password field (login / signup) ── */}
        {(mode === "login" || mode === "signup") && (
          <div style={{ marginBottom:"1.5rem" }}>
            <label style={lbl}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inp}
              onKeyDown={e => e.key === "Enter" && handle()}
            />
          </div>
        )}

        {/* ── OTP field for signup email verification ── */}
        {mode === "signup-otp" && (
          <div style={{ marginBottom:"1rem" }}>
            <p style={{ color:C.textSub, fontSize:"0.83rem", marginBottom:"1rem", lineHeight:1.5 }}>
              We sent a 6-digit code to <strong style={{ color:C.text }}>{email}</strong>. Enter it below.
            </p>
            <label style={lbl}>VERIFICATION CODE</label>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="123456"
              style={{ ...inp, fontSize:"1.3rem", letterSpacing:"0.3em", textAlign:"center" }}
              maxLength={6}
              onKeyDown={e => e.key === "Enter" && handle()}
              autoFocus
            />
            <div style={{ textAlign:"center", marginTop:"0.75rem" }}>
              {resendCooldown > 0
                ? <span style={{ color:C.textMuted, fontSize:"0.78rem" }}>Resend in {resendCooldown}s</span>
                : <span
                    style={{ color:C.accentText, fontSize:"0.78rem", cursor:"pointer" }}
                    onClick={handleResendSignupOtp}
                  >
                    Didn't receive it? Resend OTP
                  </span>
              }
            </div>
          </div>
        )}

        {/* ── OTP field for password reset verify ── */}
        {mode === "verify" && (
          <div style={{ marginBottom:"1.5rem" }}>
            <label style={lbl}>OTP CODE</label>
            <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" style={inp} />
          </div>
        )}

        {/* ── New password for reset ── */}
        {mode === "reset" && (
          <div style={{ marginBottom:"1.5rem" }}>
            <label style={lbl}>NEW PASSWORD</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" style={inp} />
          </div>
        )}

        {mode === "login" && (
          <div style={{ textAlign:"right", marginBottom:"1rem" }}>
            <span style={{ color:C.accentText, cursor:"pointer", fontSize:"0.8rem" }} onClick={() => { setMode("forgot"); setError(""); }}>
              Forgot Password?
            </span>
          </div>
        )}

        {error   && <p style={{ color:"#f87171", fontSize:"0.82rem", marginBottom:"1rem" }}>{error}</p>}
        {success && (
          <p style={{ color:"#22c55e", fontSize:"0.82rem", marginBottom:"1rem", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", padding:"10px", borderRadius:"8px" }}>
            ✓ {success}
          </p>
        )}

        <button
          onClick={handle}
          disabled={loading}
          style={{ width:"100%", background:C.accent, border:"none", borderRadius:10, padding:11, color:"#fff", fontSize:"0.92rem", fontWeight:600, cursor:loading ? "not-allowed" : "pointer", fontFamily:"inherit", opacity:loading ? 0.7 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
        >
          {loading ? (
            <>
              <Spin size={16} />{" "}
              {mode === "login"        ? "Signing in…"
              : mode === "signup"      ? "Sending OTP…"
              : mode === "signup-otp"  ? "Verifying…"
              : mode === "forgot"      ? "Sending OTP…"
              : mode === "verify"      ? "Verifying OTP…"
              : "Resetting password…"}
            </>
          ) : (
              mode === "login"       ? "Sign in →"
            : mode === "signup"      ? "Send Verification Code →"
            : mode === "signup-otp"  ? "Verify & Create Account →"
            : mode === "forgot"      ? "Send OTP →"
            : mode === "verify"      ? "Verify OTP →"
            : "Reset Password →"
          )}
        </button>

        <p style={{ textAlign:"center", fontSize:"0.78rem", color:C.textMuted, marginTop:"1.25rem", marginBottom:0 }}>
          {(mode === "login" || mode === "signup") ? (
            <>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <span style={{ color:C.accentText, cursor:"pointer" }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
                {mode === "login" ? "Sign up" : "Sign in"}
              </span>
            </>
          ) : mode === "signup-otp" ? (
            <span style={{ color:C.accentText, cursor:"pointer" }} onClick={() => { setMode("signup"); setError(""); setOtp(""); }}>
              ← Change email or details
            </span>
          ) : (
            <span style={{ color:C.accentText, cursor:"pointer" }} onClick={() => { setMode("login"); setError(""); }}>
              ← Back to Sign in
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
// ─── Mandatory mobile-number gate ──────────────────────────────────────────────
// Google sign-up gives us no phone number, so any logged-in user who still has
// none is blocked behind this until they add a valid 10-digit Indian mobile.
// Email/password signups already provide a phone, so they never see this.
function RequirePhoneGate() {
  const { user, setUser } = useAuth();
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  if (!user || user.phone) return null;

  const gInp = { width:"100%", background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:9, padding:"12px 14px", color:C.text, fontSize:"1rem", outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

  const submit = async () => {
    setError("");
    const clean = phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(clean)) { setError("Enter a valid 10-digit Indian mobile number"); return; }
    setLoading(true);
    try {
      const res = await authAPI.setPhone(clean);
      if (res?.user) setUser(res.user);
    } catch (e) {
      setError(e?.data?.message || e?.message || "Couldn't save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100000, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.25rem" }}>
      <div style={{ width:"100%", maxWidth:380, background:C.bg, border:`1px solid ${C.cardBorder}`, borderRadius:16, padding:"1.75rem" }}>
        <h2 style={{ margin:"0 0 6px", color:C.text, fontSize:"1.2rem", fontWeight:700 }}>One last step</h2>
        <p style={{ margin:"0 0 6px", color:C.textSub, fontSize:"0.9rem", lineHeight:1.5 }}>
          Add your number so we can reach you when you have a session.
        </p>
        <p style={{ margin:"0 0 18px", color:C.textMuted, fontSize:"0.78rem", lineHeight:1.5, display:"flex", alignItems:"center", gap:5 }}>
          🔒 We will never spam you. Only session-related messages, promise.
        </p>
        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="10-digit mobile number"
          autoFocus
          style={gInp}
        />
        {error && <div style={{ color:"#ef4444", fontSize:"0.82rem", marginTop:8 }}>{error}</div>}
        <button
          onClick={submit}
          disabled={loading}
          style={{ marginTop:16, width:"100%", background:C.accent, color:"#fff", border:"none", borderRadius:9, padding:"12px", fontSize:"0.95rem", fontWeight:600, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Saving…" : "Save & continue"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading, logout } = useAuth();
  // After Google OAuth the backend redirects back with ?token=… — land such
  // users on their profile (matches the email/password login behaviour).
  const [activePage,   setActivePage]   = useState(() => {
    const hasToken = new URLSearchParams(window.location.search).get("token");
    if (hasToken) {
      // If mentor intent was set before Google OAuth redirect, resume onboarding
      const mentorIntent = sessionStorage.getItem("mentor_intent");
      if (mentorIntent) { sessionStorage.removeItem("mentor_intent"); return "mentor-onboard"; }
      return "profile";
    }
    return "ask";
  });
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
  const [profileSection, setProfileSection] = useState('overview');

  const MENTOR_PROFILE_NAV = [
    { key: 'overview',     Icon: Activity,      label: 'Overview' },
    { key: 'services',     Icon: IndianRupee,   label: 'Services' },
    { key: 'availability', Icon: CalendarClock, label: 'Availability' },
    { key: 'basic',        Icon: UserRound,     label: 'Basic Information' },
    { key: 'education',    Icon: GraduationCap, label: 'Education' },
    { key: 'experience',   Icon: Briefcase,     label: 'Experience' },
    { key: 'expertise',    Icon: Zap,           label: 'Skills & Expertise' },
    { key: 'achievements', Icon: Trophy,        label: 'Achievements' },
    { key: 'preferences',  Icon: Compass,       label: 'Mentoring Prefs' },
    { key: 'social',       Icon: Link2,         label: 'Social Links' },
  ];
  const STUDENT_PROFILE_NAV = [
    { key: 'overview',  Icon: Activity,      label: 'Overview' },
    { key: 'basic',     Icon: UserRound,     label: 'Basic Information' },
    { key: 'education', Icon: GraduationCap, label: 'Education' },
    { key: 'goals',     Icon: Target,        label: 'Goals & Skills' },
  ];
  const profileNavItems = user?.role === 'mentor' ? MENTOR_PROFILE_NAV : STUDENT_PROFILE_NAV;

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap";
    document.head.appendChild(link);
    // Devanagari + Latin face for the अत्यanT wordmark.
    const devFont = document.createElement("link");
    devFont.rel  = "stylesheet";
    devFont.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@600;700&display=swap";
    document.head.appendChild(devFont);
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
const isMentor = user?.role === "mentor";

const journeyItems = [
  { id: "roadmap", Icon: TrendingUp, label: "My Roadmap" },
  { id: "saved", Icon: Bookmark, label: "Saved Answers" },

  ...(isMentor
    ? [{ id: "track", Icon: BarChart3, label: "Mentor Dashboard" }]
    : []),
];

  const pages = {
    ask:      <AskAtyantPage  key={chatSession} user={user} onGoToClarity={goToClarity} onGoToMentorOnboard={() => setActivePage("mentor-onboard")} />,
    clarity:  <ClarityView    key={clarityQuery || "empty"} initialQuery={clarityQuery} initialContext={clarityContext} user={user} onTalkToMentor={handleStartBooking} onOpenChat={handleOpenChat} />,
    chat:     <ChatPage       key={chatMentor?.id || chatMentor?._id || "chat"} mentor={chatMentor} />,
    "mentor-onboard": <MentorOnboard onDone={() => setActivePage("profile")} />,
    book:     <BookingPage    mentor={bookingMentor} user={user} onAuthRequired={() => setShowAuth(true)} onFindMentor={() => setActivePage("clarity")} onOpenChat={() => { setChatMentor(bookingMentor); setActivePage("chat"); }} onViewSessions={() => setActivePage("sessions")} />,
    sessions: <MySessionsPage />,
    roadmap:  <MyRoadmapPage  user={user} />,
    saved:    <SavedAnswersPage />,
    profile:  <ProfilePage activeSection={profileSection} setActiveSection={setProfileSection} />,
    upgrade:  <UpgradePage onBack={goToFree} />,

roadmap: <MyRoadmapPage user={user} />,
saved: <SavedAnswersPage />,
track: <MentorTrackPage />,
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
        style={{ position:"relative", width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, border:"none", background:isActive ? C.accentSoft : "transparent", color:isActive ? C.text : C.textSub, cursor:"pointer", fontFamily:"inherit", fontSize:"0.9rem", lineHeight:1.2, textAlign:"left", transition:"background-color 0.2s ease, color 0.2s ease", fontWeight:500 }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text; } }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; } }}>
        {/* Left accent bar — active only */}
        <span style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:3, height:18, borderRadius:"0 3px 3px 0", background:C.accent, opacity:isActive ? 1 : 0, transition:"opacity 0.2s ease" }} />
        <item.Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} style={{ color:isActive ? C.accentText : "currentColor", flexShrink:0, transition:"color 0.2s ease" }} />
        <span>{item.label}</span>
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
        <div style={{ height:76, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0 }}>
          <div
            onClick={() => { window.location.href = "https://atyant.in/"; }}
            title="Back to atyant.in"
            style={{ display:"flex", alignItems:"center", gap:11, cursor:"pointer" }}
          >
            <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#7567C9,#9F7AEA)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 16px -6px #7567C9", flexShrink:0 }}>
              <Sparkles size={17} color="#fff" strokeWidth={2.2} />
            </div>
            <span style={{ fontWeight:700, fontSize:"1.4rem", letterSpacing:"-0.01em", color:C.text, lineHeight:1, fontFamily:"'Noto Serif Devanagari','Georgia',serif" }}>अत्यanT</span>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} aria-label="Close menu"
              style={{ width:34, height:34, borderRadius:9, border:`1px solid ${C.cardBorder}`, background:C.active, color:C.textSub, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:0, flexShrink:0 }}
              onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textSub; }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"4px 12px 1rem" }}>
          {/* ── New Chat / Home — primary CTA ── */}
          {activePage === "profile" ? (
            <button
              onClick={() => {
                setActivePage("ask");
                if (isMobile) setSidebarOpen(false);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 46,
                padding: "0 14px",
                borderRadius: 13,
                border: "none",
                background: "linear-gradient(135deg,#7567C9,#8B7BE0)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.92rem",
                fontWeight: 600,
                boxShadow: "0 8px 20px -8px #7567C9",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease",
                marginBottom: "1.5rem",
                boxSizing: "border-box",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.filter = "brightness(1.08)";
                e.currentTarget.style.boxShadow = "0 12px 26px -8px #7567C9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.filter = "none";
                e.currentTarget.style.boxShadow = "0 8px 20px -8px #7567C9";
                e.currentTarget.style.transform = "none";
              }}
            >
              <Home size={17} strokeWidth={2.5} />
              <span>Home</span>
            </button>
          ) : (
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
                justifyContent: "center",
                gap: 8,
                height: 46,
                padding: "0 14px",
                borderRadius: 13,
                border: "none",
                background: "linear-gradient(135deg,#7567C9,#8B7BE0)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.92rem",
                fontWeight: 600,
                boxShadow: "0 8px 20px -8px #7567C9",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease",
                marginBottom: "1.5rem",
                boxSizing: "border-box",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.filter = "brightness(1.08)";
                e.currentTarget.style.boxShadow = "0 12px 26px -8px #7567C9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.filter = "none";
                e.currentTarget.style.boxShadow = "0 8px 20px -8px #7567C9";
                e.currentTarget.style.transform = "none";
              }}
            >
              <Plus size={17} strokeWidth={2.5} />
              <span>New chat</span>
            </button>
          )}

          {activePage === "profile" ? (
            /* ── Profile section nav ── */
            <div>
              <div style={{ fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.12em", color:C.textMuted, padding:"0 12px", marginBottom:8 }}>
                {user?.role === "mentor" ? "MENTOR PROFILE" : "MY PROFILE"}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {profileNavItems.map(({ key, Icon, label }) => {
                  const isActive = profileSection === key;
                  return (
                    <button key={key} onClick={() => { setProfileSection(key); if (isMobile) setSidebarOpen(false); }}
                      style={{ position:"relative", width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, border:"none", background:isActive ? C.accentSoft : "transparent", color:isActive ? C.text : C.textSub, cursor:"pointer", fontFamily:"inherit", fontSize:"0.9rem", lineHeight:1.2, textAlign:"left", transition:"background-color 0.2s ease, color 0.2s ease", fontWeight:isActive ? 600 : 500 }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text; } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; } }}>
                      <span style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:3, height:18, borderRadius:"0 3px 3px 0", background:C.accent, opacity:isActive ? 1 : 0, transition:"opacity 0.2s ease" }} />
                      <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} style={{ color:isActive ? C.accentText : "currentColor", flexShrink:0 }} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Regular nav ── */
            <>
          <div style={{ marginBottom:"1.5rem" }}>
            <div style={{ fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.12em", color:C.textMuted, padding:"0 12px", marginBottom:8 }}>WORKSPACE</div>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {workspaceItems.map(item => <NavItem key={item.id} item={item} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.12em", color:C.textMuted, padding:"0 12px", marginBottom:8 }}>JOURNEY</div>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {journeyItems.map(item => <NavItem key={item.id} item={item} />)}
            </div>
          </div>
            </>
          )}
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
      <div style={{ position:"relative", flex:1, overflow:"hidden", height:"100dvh", display:"flex", flexDirection:"column" }}>
        {/* Ambient AI backdrop — spans the toolbar + page so the gradient is one
            continuous surface (no seam under the header). Home view only. */}
        {activePage === "ask" && (<>
          <div className="ai-grid" aria-hidden="true" />
          <div className="ai-aurora" aria-hidden="true" />
        </>)}
        <div style={{ position:"relative", zIndex:1, height:57, display:"flex", justifyContent:"space-between", alignItems:"center", padding:isMobile ? "0 16px" : "0 24px", background:"transparent", flexShrink:0 }}>
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
        <div style={{ position:"relative", zIndex:1, flex:1, overflow: ["ask","clarity","chat"].includes(activePage) ? "hidden" : "auto" }}>
          <Suspense fallback={<div style={{ padding:"4rem", textAlign:"center", color:C.textMuted }}><Spin size={26} /></div>}>
            {pages[activePage]}
          </Suspense>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthed={() => setActivePage("profile")} />}

      {/* Mandatory mobile capture for phone-less (e.g. Google) accounts */}
      <RequirePhoneGate />

      {/* Global toast host — booking/payment/chat feedback all render here */}
      <ToastContainer position="top-center" autoClose={3500} limit={3} newestOnTop pauseOnHover transition={Slide} theme="colored" style={{ zIndex: 99999 }} />

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