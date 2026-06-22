import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles, ArrowRight } from "lucide-react";
import { FiCopy, FiThumbsUp, FiThumbsDown, FiShare, FiRefreshCw, FiCheck } from 'react-icons/fi';
import { clarityAPI, aiAPI } from "../../api";
import useIsMobile from "../../hooks/useIsMobile";

const CHAT_SID_KEY = "atyant_chat_sid";

function freshSid() {
  return "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Persistent session id — the SAME conversation survives a page refresh.
// Reused on refresh so we can restore messages; rotated only by "New Chat".
function getStoredSessionId() {
  let sid = null;
  try { sid = localStorage.getItem(CHAT_SID_KEY); } catch { /* ignore */ }
  if (!sid || sid.length < 8) {
    sid = freshSid();
    try { localStorage.setItem(CHAT_SID_KEY, sid); } catch { /* ignore */ }
  }
  return sid;
}

// Called by the "New Chat" button BEFORE remounting this page, so the next mount
// picks up a brand-new id (no old phase/context carried over).
export function startNewChatSession() {
  const sid = freshSid();
  try { localStorage.setItem(CHAT_SID_KEY, sid); } catch { /* ignore */ }
  return sid;
}

// Map the engine's context shape ? the flat context this page uses
function mapEngineContext(ec) {
  if (!ec) return null;
  const id = ec.identity || {};
  return {
    college: id.college || "",
    branch: id.branch || "",
    year: id.year || "",
    cgpa: id.cgpa || "",
    goal: ec.target || "",
  };
}

// Problem-first opener + quick-reply chips. Kept here so they can be re-shown
// after a refresh (restored messages don't carry the chips from the server).
const GREETING_OPENER = "What's confusing you right now?";
const GREETING_CHIPS = [
  { label: "🎯  I want an internship but don't know where to start", value: "I want an internship but I don't know where to start" },
  { label: "🏢  Placement season is coming and I'm not prepared",    value: "Placement season is coming and I'm not prepared" },
  { label: "🤔  Career confused — don't know what path to take",     value: "I'm career confused and don't know what path to take" },
  { label: "📚  Thinking about higher studies (MS / MBA / GATE)",    value: "I'm thinking about higher studies — MS, MBA or GATE" },
];

// "VNIT Nagpur" ? "VNIT" ; "iit bombay" ? "IIT" ; "Manipal" ? "Manipal"
function collegeShort(college) {
  const first = String(college || "").trim().split(/\s+/)[0] || "";
  if (!first) return "";
  return first.length <= 5 ? first.toUpperCase() : first;
}

// Theme-aware palette — maps to CSS vars defined in index.css (light + dark).
// `accent`/`green` stay literal (used with alpha concatenation / identical in both themes).
const C = {
  bg: "var(--c-bg)",
  sidebar: "var(--c-sidebar)",
  sidebarBorder: "var(--c-sidebarBorder)",
  card: "var(--c-card)",
  cardHover: "var(--c-cardHover)",
  cardBorder: "var(--c-cardBorder)",
  active: "var(--c-active)",
  activeBorder: "var(--c-activeBorder)",
  accent: "#7567C9",
  accentSoft: "var(--c-accentSoft)",
  accentText: "var(--c-accentText)",
  text: "var(--c-text)",
  textSub: "var(--c-textSub)",
  textMuted: "var(--c-textMuted)",
  green: "#3DBE82",
};

// Message action buttons � add after every AI response bubble
const MessageActions = ({ message, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(null); // 'up' | 'down' | null

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 mt-2 ml-1 opacity-60 hover:opacity-100 transition-opacity">
      {/* Copy */}
      <button onClick={handleCopy} title="Copy" className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
        {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
      </button>

      {/* Thumbs up */}
      <button
        onClick={() => setLiked(liked === 'up' ? null : 'up')}
        title="Good response"
        className={liked === 'up' ? 'text-green-400' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}
      >
        <FiThumbsUp size={15} />
      </button>

      {/* Thumbs down */}
      <button
        onClick={() => setLiked(liked === 'down' ? null : 'down')}
        title="Bad response"
        className={liked === 'down' ? 'text-red-400' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}
      >
        <FiThumbsDown size={15} />
      </button>

      {/* Share */}
      <button
        onClick={() => navigator.share?.({ text: message })}
        title="Share"
        className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <FiShare size={15} />
      </button>

      {/* Regenerate */}
      <button onClick={onRegenerate} title="Regenerate" className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
        <FiRefreshCw size={15} />
      </button>
    </div>
  );
};

export default function AskAtyantPage({ user, onGoToClarity, onGoToMentorOnboard }) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [context, setContext] = useState({
    college: "",
    branch: "",
    year: "",
    cgpa: "",
    goal: "",
  });
  const [communityCount, setCommunityCount] = useState(0);
  const [problemStatement, setProblemStatement] = useState("");
  const chatEndRef = useRef(null);
  const scrollRef = useRef(null);   // the scrollable messages container
  const chatInputRef = useRef(null);
  const heroInputRef = useRef(null);
  const sessionIdRef = useRef(getStoredSessionId());

  // Auto-grow a textarea up to a max height, then scroll internally.
  // Cap lower on mobile so the box never swallows the screen (ChatGPT-style).
  const autoGrow = (el) => {
    if (!el) return;
    const max = isMobile ? 96 : 140;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  };
  // When the query is cleared (e.g. after sending), collapse both inputs back to one line.
  useEffect(() => {
    if (query === "") {
      [heroInputRef, chatInputRef].forEach((r) => { if (r.current) r.current.style.height = "auto"; });
    }
  }, [query]);

  // Live community count for the badge  refetched when the college changes.
  useEffect(() => {
    const college = context.college?.trim();
    if (!college) { setCommunityCount(0); return; }
    let cancelled = false;
    clarityAPI.communityCount(college)
      .then(res => { if (!cancelled) setCommunityCount(res?.count || 0); })
      .catch(() => { if (!cancelled) setCommunityCount(0); });
    return () => { cancelled = true; };
  }, [context.college]);

  const short = collegeShort(context.college);
  const badgeText = communityCount > 0 && short
    ? `${communityCount} ${short}ian${communityCount === 1 ? "" : "s"} found their path this week`
    : "100+ students found their path across India";

  // Human-readable year, e.g. "4" → "4th Year", "final" → "Final Year".
  const yearLabel = (y) => {
    if (!y) return null;
    const s = String(y).trim();
    if (/year/i.test(s)) return s.replace(/\b\w/g, c => c.toUpperCase());
    if (/^\d+$/.test(s)) {
      const n = +s, suf = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
      return `${n}${suf} Year`;
    }
    return s.replace(/\b\w/g, c => c.toUpperCase()) + " Year";
  };

  // Profile badge pill shown each turn so the student sees their profile building up.
  const profileBadge = [short || context.college, context.goal, yearLabel(context.year)]
    .filter(Boolean)
    .join("  ·  ");

  // Specific match-button label, e.g. "See verified paths for MANIT Metallurgy".
  const matchBtnLabel = short
    ? `See verified paths for ${short}${context.branch ? " " + context.branch : ""}`
    : "See verified senior paths";

  const quickActions = [
    { label: "Switch Field" },
    { label: "Build Skills" },
    { label: "Get Roadmap" },

    ...(!user
    ? [{ label: "Become Mentor", isSpecial: true }]
    : []),

    { label: "Find My Match" },
  ];

  // Pre-fill profile context if user is logged in
  useEffect(() => {
    if (user) {
      const edu = user.education?.[0] || {};
      // Use only the user's real profile — no fake "VNIT/Metallurgy/6.0" defaults,
      // which would otherwise misrepresent students from other colleges.
      setContext({
        college: edu.institutionName || edu.institution || "",
        branch: edu.field || "",
        year: edu.year || "",
        cgpa: edu.cgpa ? String(edu.cgpa) : "",
        goal: user.interests?.[0] || "",
      });
    } else {
      setContext({
        college: "",
        branch: "",
        year: "",
        cgpa: "",
        goal: "",
      });
    }
  }, [user]);

  // Restore the saved conversation on mount so chat survives a refresh.
  // A "New Chat" mount uses a fresh session id → nothing to restore → clean start.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await aiAPI.getSession(sessionIdRef.current);
        const s = res?.session;
        if (cancelled || !s || !Array.isArray(s.messages) || s.messages.length === 0) return;

        const msgs = s.messages.map(m => ({
          sender: m.role === "assistant" ? "atyant" : "user",
          text: m.content,
          showMatch: false,
          // Re-attach the greeting chips after a refresh (server doesn't store them).
          chips: m.role === "assistant" && m.content?.trim() === GREETING_OPENER ? GREETING_CHIPS : null,
        }));
        // Re-show the match button on the latest Atyant message if the engine was ready.
        const ready = s.phase === "engine" || s.outputMode === "MENTOR_ROUTING";
        if (ready) {
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].sender === "atyant") { msgs[i].showMatch = true; break; }
          }
        }
        setMessages(msgs);

        const mapped = mapEngineContext(s.context);
        if (mapped) setContext(prev => ({
          college: mapped.college || prev.college,
          branch:  mapped.branch  || prev.branch,
          year:    mapped.year    || prev.year,
          cgpa:    mapped.cgpa    || prev.cgpa,
          goal:    mapped.goal    || prev.goal,
        }));
        if (s.problemStatement) setProblemStatement(s.problemStatement);
      } catch {
        // No saved session (404) or fetch failed → start fresh, nothing to do.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Pin the conversation to the latest message. Scroll the messages container
  // directly (not scrollIntoView, which can scroll the wrong ancestor on mobile)
  // and run it after paint + a tick so it lands even as the keyboard resizes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const toBottom = () => { el.scrollTop = el.scrollHeight; };
    requestAnimationFrame(toBottom);
    const t = setTimeout(toBottom, 120);
    // Avoid force-focusing on mobile — it re-triggers the keyboard and fights the scroll.
    if (!isTyping && !isMobile) chatInputRef.current?.focus();
    return () => clearTimeout(t);
  }, [messages, isTyping, isMobile]);

  useEffect(() => {
    const wordCount = query.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 3) {
      setShowContext(false);
    }
  }, [query]);

  // Keep the latest message in view when the keyboard opens/closes (the visual
  // viewport resizes) so the conversation never gets stuck scrolled up.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  // Real chat � calls the 2-phase Atyant engine (context intake ? execution).
  const sendToEngine = async (text) => {
    const res = await aiAPI.atyantChat(text, sessionIdRef.current);
    // Engine is "ready" once it routes to a mentor or has mapped enough context.
    const ready = res.outputMode === "MENTOR_ROUTING" || res.phase === "engine";
    // Keep the page context (and badge) in sync with what the engine extracted.
    const mapped = mapEngineContext(res.context);
    if (mapped) setContext(prev => ({
      college: mapped.college || prev.college,
      branch: mapped.branch || prev.branch,
      year: mapped.year || prev.year,
      cgpa: mapped.cgpa || prev.cgpa,
      goal: mapped.goal || prev.goal,
    }));
    if (res.problemStatement) setProblemStatement(res.problemStatement);
    return {
      text: res.reply || "Hmm, I didn't catch that � could you rephrase?",
      showMatch: ready,
      chips: Array.isArray(res.quickReplies) ? res.quickReplies : null,
    };
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || query).trim();
    if (text.length < 1) return;  // allow short but valid answers like "3"

    setMessages(prev => [...prev, { sender: "user", text }]);
    setQuery("");
    setIsTyping(true);

    try {
      const reply = await sendToEngine(text);
      setMessages(prev => [...prev, { sender: "atyant", text: reply.text, showMatch: reply.showMatch, chips: reply.chips }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        sender: "atyant",
        text: e?.status === 429
          ? "I'm getting a lot of questions right now � give me a few seconds and try again."
          : "Something glitched on my end. Try sending that again?",
        showMatch: false,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setQuery("");
  };

  const handleRegenerate = async (msg, index) => {
    const userPrompt = messages[index - 1]?.text || "";
    if (!userPrompt) return;
    setIsTyping(true);
    try {
      const reply = await sendToEngine(userPrompt);
      setMessages(prev => {
        const next = [...prev];
        next[index] = { sender: "atyant", text: reply.text, showMatch: reply.showMatch };
        return next;
      });
    } catch {
      // leave the existing message in place on failure
    } finally {
      setIsTyping(false);
    }
  };

  const wordCount = query.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 57px)", minHeight: 0, background: "transparent", fontFamily: "'Inter', sans-serif" }}>
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .msg-row { animation: fadeIn 0.2s ease-out; }
        .msg-row:hover { background: var(--c-rowHover); }
      `}</style>

      {messages.length === 0 ? (
        /* Landing View */
        <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", overflow: "hidden" }}>
          <h1 style={{ position: "relative", zIndex: 1, textAlign: "center", fontSize: "clamp(1.9rem,4.5vw,2.8rem)", fontWeight: 400, lineHeight: 1.2, marginBottom: "2rem", color: C.text, fontFamily: "Georgia,'Times New Roman',serif" }}>
            Find someone exactly like you<span></span>...
          </h1>

          <div
            style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 680, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "0 0.75rem 0 1.25rem", marginBottom: "0.6rem", display: "flex", alignItems: "flex-end", gap: 10, minHeight: 54, boxShadow: "0 18px 50px -24px var(--accent)", transition: "border-color 0.2s, box-shadow 0.2s" }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}22, 0 18px 50px -24px var(--accent)`; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = "0 18px 50px -24px var(--accent)"; }}
          >
            {/* + */}
            <button style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "1.3rem", lineHeight: 1, padding: 0, flexShrink: 0, height: 54, display: "flex", alignItems: "center" }}>+</button>

            {/* Input — auto-growing textarea */}
            <textarea
              ref={heroInputRef}
              autoFocus
              rows={1}
              value={query}
              onChange={e => { setQuery(e.target.value); autoGrow(e.target); }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask Atyant.."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: "16px", fontFamily: "inherit", resize: "none", lineHeight: 1.5, padding: "15px 0", maxHeight: isMobile ? 96 : 140, overflowY: "auto" }}
            />

            {/* Right: badge + mic + send */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, height: 54 }}>
              {!isMobile && (
                <span style={{ fontSize: "0.72rem", color: C.textMuted, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 999, padding: "3px 11px", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block", flexShrink: 0 }} />
                  {badgeText}
                </span>
              )}
              <button style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Voice input">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <button onClick={() => handleSend()}
                style={{ background: query.trim().length > 0 ? C.accent : C.active, border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", flexShrink: 0 }}>
                <Send size={15} color={query.trim().length > 0 ? "#fff" : C.textSub} />
              </button>
            </div>
          </div>

          {/* Context Panel */}
          {showContext && (
            <div style={{
              position: "relative",
              zIndex: 1,
              animation: "fadeIn 0.3s ease-out",
              background: "var(--c-glass)",
              border: `1px solid ${C.cardBorder}`,
              borderRadius: 14,
              padding: "1.25rem",
              marginTop: "0.25rem",
              marginBottom: "1rem",
              width: "100%",
              maxWidth: 680,
              boxSizing: "border-box",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: C.textMuted, display: "block", marginBottom: 6 }}>COLLEGE</label>
                  <select
                    value={context.college}
                    onChange={e => setContext(c => ({ ...c, college: e.target.value }))}
                    style={{ width: "100%", background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: "0.85rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <option value="" style={{ background: C.bg }}>Select College</option>
                    <option value="VNIT Nagpur" style={{ background: C.bg }}>VNIT Nagpur</option>
                    <option value="MNIT Nagpur" style={{ background: C.bg }}>MNIT Nagpur</option>
                    <option value="IIT Bombay" style={{ background: C.bg }}>IIT Bombay</option>
                    <option value="BITS Pilani" style={{ background: C.bg }}>BITS Pilani</option>
                    <option value="NIT Trichy" style={{ background: C.bg }}>NIT Trichy</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: C.textMuted, display: "block", marginBottom: 6 }}>BRANCH</label>
                  <select
                    value={context.branch}
                    onChange={e => setContext(c => ({ ...c, branch: e.target.value }))}
                    style={{ width: "100%", background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: "0.85rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <option value="" style={{ background: C.bg }}>Select Branch</option>
                    <option value="Metallurgy" style={{ background: C.bg }}>Metallurgy</option>
                    <option value="Computer Science" style={{ background: C.bg }}>Computer Science</option>
                    <option value="Mechanical" style={{ background: C.bg }}>Mechanical</option>
                    <option value="Electrical" style={{ background: C.bg }}>Electrical</option>
                    <option value="Chemical" style={{ background: C.bg }}>Chemical</option>
                    <option value="ECE" style={{ background: C.bg }}>ECE</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: C.textMuted, display: "block", marginBottom: 6 }}>YEAR</label>
                  <select
                    value={context.year}
                    onChange={e => setContext(c => ({ ...c, year: e.target.value }))}
                    style={{ width: "100%", background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: "0.85rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <option value="" style={{ background: C.bg }}>Select Year</option>
                    <option value="1st" style={{ background: C.bg }}>1st Year</option>
                    <option value="2nd" style={{ background: C.bg }}>2nd Year</option>
                    <option value="3rd" style={{ background: C.bg }}>3rd Year</option>
                    <option value="4th" style={{ background: C.bg }}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: C.textMuted, display: "block", marginBottom: 6 }}>CGPA</label>
                  <select
                    value={context.cgpa}
                    onChange={e => setContext(c => ({ ...c, cgpa: e.target.value }))}
                    style={{ width: "100%", background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: "0.85rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <option value="" style={{ background: C.bg }}>Select CGPA</option>
                    <option value="6.0" style={{ background: C.bg }}>6.0</option>
                    <option value="7.0" style={{ background: C.bg }}>7.0</option>
                    <option value="8.0" style={{ background: C.bg }}>8.0</option>
                    <option value="9.0" style={{ background: C.bg }}>9.0</option>
                    <option value="10.0" style={{ background: C.bg }}>10.0</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: C.textMuted, display: "block", marginBottom: 6 }}>TARGET GOAL</label>
                <select
                  value={context.goal}
                  onChange={e => setContext(c => ({ ...c, goal: e.target.value }))}
                  style={{ width: "100%", background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: "0.85rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <option value="" style={{ background: C.bg }}>Select Goal</option>
                  <option value="AI/ML Internship" style={{ background: C.bg }}>AI/ML Internship</option>
                  <option value="SDE Job" style={{ background: C.bg }}>SDE Job</option>
                  <option value="Consulting Placement" style={{ background: C.bg }}>Consulting Placement</option>
                  <option value="Data Science" style={{ background: C.bg }}>Data Science</option>
                </select>
              </div>
            </div>
          )}

          {isMobile ? (
            <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.72rem", color: C.textMuted, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 999, padding: "5px 13px", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block", flexShrink: 0 }} />
                {badgeText}
              </span>
            </div>
          ) : (
            <p style={{ position: "relative", zIndex: 1, fontSize: "0.78rem", color: C.textMuted, marginBottom: "1.5rem", textAlign: "center" }}>
              Matched to 800+ verified journeys from Tier-2 colleges across India
            </p>
          )}

          <AnimatePresence mode="wait">
            {query.trim().length === 0 && (
              <motion.div
                key="quick-actions"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.06, delayChildren: 0 } },
                  exit: { transition: { staggerChildren: 0.06, staggerDirection: -1 } },
                }}
                style={{ position: "relative", zIndex: 1, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}
              >
                {quickActions.map((a, i) => (
                  <motion.button
                    key={a.label}
                    onClick={() => {
                      if (a.isSpecial) {
                        onGoToMentorOnboard?.();
                      } else {
                        handleSend(a.label);
                      }
                    }}
                    variants={{
                      hidden: { opacity: 0, y: 10, scale: 0.98 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                      exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.22, ease: "easeOut" } },
                    }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    style={{
                      background: a.isSpecial ? C.accent : "var(--c-active)",
                      border: a.isSpecial ? `1px solid ${C.accent}` : `1px solid var(--c-cardBorder)`,
                      borderRadius: 999,
                      padding: "7px 18px",
                      color: a.isSpecial ? "#fff" : C.textSub,
                      fontSize: "0.82rem",
                      fontWeight: a.isSpecial ? 600 : 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: a.isSpecial ? "0 4px 12px rgba(117,103,201,0.25)" : "none",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => {
                      if (a.isSpecial) {
                        e.currentTarget.style.filter = "brightness(1.1)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      } else {
                        e.currentTarget.style.background = C.cardHover;
                        e.currentTarget.style.color = C.text;
                        e.currentTarget.style.borderColor = C.accent + "88";
                      }
                    }}
                    onMouseLeave={e => {
                      if (a.isSpecial) {
                        e.currentTarget.style.filter = "none";
                        e.currentTarget.style.transform = "none";
                      } else {
                        e.currentTarget.style.background = "var(--c-active)";
                        e.currentTarget.style.color = C.textSub;
                        e.currentTarget.style.borderColor = "var(--c-cardBorder)";
                      }
                    }}
                  >
                    {a.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Chat Mode */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Messages Area */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "1.5rem 0" }}>
            <div style={{ maxWidth: 680, margin: "0 auto", paddingLeft: "1rem", paddingRight: "1rem", boxSizing: "border-box" }}>
              {messages.map((m, i) => {
                const isUser = m.sender === "user";
                return (
                  <div key={i} className="msg-row" style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    marginBottom: "1.25rem",
                  }}>
                    <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                      <div style={{
                        padding: isUser ? "0.75rem 1rem" : "0",
                        background: isUser ? "rgba(117, 103, 201, 0.12)" : "transparent",
                        borderRadius: isUser ? 10 : 0,
                        fontSize: "0.92rem",
                        lineHeight: 1.6,
                        color: C.text,
                        whiteSpace: "pre-line",
                      }}>
                        {m.text}
                      </div>
                      {!isUser && (
                        <MessageActions
                          message={m.text}
                          onRegenerate={() => handleRegenerate(m, i)}
                        />
                      )}
                      {/* Quick-reply chips — only on the latest message, vanish after the user replies */}
                      {!isUser && m.chips?.length > 0 && i === messages.length - 1 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, maxWidth: 520 }}>
                          {m.chips.map((chip, ci) => (
                            <button
                              key={ci}
                              onClick={() => handleSend(chip.value)}
                              style={{
                                background: C.active,
                                border: `1px solid ${C.cardBorder}`,
                                borderRadius: 999,
                                padding: "8px 14px",
                                color: C.textSub,
                                fontSize: "0.82rem",
                                fontFamily: "inherit",
                                textAlign: "left",
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.accent + "88"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = C.active; e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = C.cardBorder; }}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {m.showMatch && (
                        <button
                          onClick={() => onGoToClarity(problemStatement || messages[0]?.text || "", context)}
                          style={{
                            marginTop: 12,
                            background: "linear-gradient(135deg, #7567C9, var(--c-accentText))",
                            border: "none",
                            borderRadius: 8,
                            padding: "9px 14px",
                            color: "#fff",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            boxShadow: "0 3px 10px rgba(117,103,201,0.3)",
                          }}
                        >
                          <Sparkles size={12} /> {matchBtnLabel} <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div style={{ marginBottom: "1.25rem", display: "flex", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.textSub, animation: "pulse 1.2s infinite 0s" }} />
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.textSub, animation: "pulse 1.2s infinite 0.2s" }} />
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.textSub, animation: "pulse 1.2s infinite 0.4s" }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>


          {/* Context Badge — shows Atyant building the student's profile each turn */}
          {profileBadge && (
            <div style={{ maxWidth: 780, margin: "0 auto", width: "100%", padding: "0 1rem", boxSizing: "border-box" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: C.active, border: `1px solid ${C.activeBorder}`,
                borderRadius: 999, padding: "4px 12px",
                fontSize: "0.72rem", fontWeight: 500, color: C.accentText,
                letterSpacing: "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                <Sparkles size={11} /> {profileBadge}
              </span>
            </div>
          )}

          {/* Chat Input Footer */}
          <div style={{ padding: "0.75rem 1rem 1.5rem" }}>
            <div style={{ maxWidth: 780, margin: "0 auto", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "0 0.75rem 0 1.25rem", display: "flex", gap: 10, alignItems: "flex-end", minHeight: 54, transition: "border-color 0.2s, box-shadow 0.2s" }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}22`; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = "none"; }}>
              {/* Plus */}
              <button style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "1.4rem", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 54, transition: "color 0.2s", flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = C.text}
                onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                title="Add attachment">
                +
              </button>

              {/* Input — auto-growing textarea */}
              <textarea
                ref={chatInputRef}
                rows={1}
                value={query}
                onChange={e => { setQuery(e.target.value); autoGrow(e.target); }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask Atyant.."
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: "16px", fontFamily: "inherit", resize: "none", lineHeight: 1.5, padding: "15px 0", maxHeight: isMobile ? 96 : 140, overflowY: "auto" }}
              />

              {/* Right controls */}
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0, height: 54 }}>
                {!isMobile && (
                  <button style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "0.78rem", padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = C.text}
                    onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                    <span style={{ fontWeight: 500 }}>Atyant</span>
                  </button>
                )}
                <button style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = C.text}
                  onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                  title="Voice input">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
                <button onClick={() => handleSend()}
                  // Keep the keyboard open: don't let the button steal focus from the input on tap.
                  onMouseDown={e => e.preventDefault()}
                  style={{ background: query.trim().length > 0 ? C.accent : "transparent", border: "none", color: query.trim().length > 0 ? "#fff" : C.textMuted, borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

