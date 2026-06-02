import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ArrowRight } from "lucide-react";
import { FiCopy, FiThumbsUp, FiThumbsDown, FiShare, FiRefreshCw, FiCheck } from 'react-icons/fi';
import { clarityAPI, aiAPI } from "../../api";

// Stable per-browser session id for the Atyant chat engine
function getChatSessionId() {
  let sid = localStorage.getItem("atyant_chat_sid");
  if (!sid || sid.length < 8) {
    sid = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("atyant_chat_sid", sid);
  }
  return sid;
}

// Map the engine's context shape → the flat context this page uses
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

// "VNIT Nagpur" → "VNIT" ; "iit bombay" → "IIT" ; "Manipal" → "Manipal"
function collegeShort(college) {
  const first = String(college || "").trim().split(/\s+/)[0] || "";
  if (!first) return "";
  return first.length <= 5 ? first.toUpperCase() : first;
}

const C = {
  bg: "#13121A",
  sidebar: "#0D0C12",
  sidebarBorder: "#211F2B",
  card: "#1A1823",
  cardHover: "#211E2C",
  cardBorder: "#322E40",
  active: "#221E33",
  activeBorder: "#443A6B",
  accent: "#7567C9",
  accentSoft: "#7567C922",
  accentText: "#8E80DB",
  text: "#ECEAF3",
  textSub: "#978FAB",
  textMuted: "#5F576F",
  green: "#3DBE82",
};

// Message action buttons — add after every AI response bubble
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
      <button onClick={handleCopy} title="Copy" className="hover:text-white text-gray-400">
        {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
      </button>

      {/* Thumbs up */}
      <button
        onClick={() => setLiked(liked === 'up' ? null : 'up')}
        title="Good response"
        className={liked === 'up' ? 'text-green-400' : 'hover:text-white text-gray-400'}
      >
        <FiThumbsUp size={15} />
      </button>

      {/* Thumbs down */}
      <button
        onClick={() => setLiked(liked === 'down' ? null : 'down')}
        title="Bad response"
        className={liked === 'down' ? 'text-red-400' : 'hover:text-white text-gray-400'}
      >
        <FiThumbsDown size={15} />
      </button>

      {/* Share */}
      <button
        onClick={() => navigator.share?.({ text: message })}
        title="Share"
        className="hover:text-white text-gray-400"
      >
        <FiShare size={15} />
      </button>

      {/* Regenerate */}
      <button onClick={onRegenerate} title="Regenerate" className="hover:text-white text-gray-400">
        <FiRefreshCw size={15} />
      </button>
    </div>
  );
};

export default function AskAtyantPage({ user, onGoToClarity }) {
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
  const sessionIdRef = useRef(getChatSessionId());

  // Live community count for the badge — refetched when the college changes.
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

  const quickActions = [
    { label: "Switch Field" },
    { label: "Build Skills" },
    { label: "Get Roadmap" },
    { label: "Talk to Senior" },
    { label: "Find My Match" },
  ];

  // Pre-fill profile context if user is logged in
  useEffect(() => {
    if (user) {
      const edu = user.education?.[0] || {};
      setContext({
        college: edu.institutionName || edu.institution || "VNIT Nagpur",
        branch: edu.field || "Metallurgy",
        year: edu.year || "3rd",
        cgpa: edu.cgpa ? String(edu.cgpa) : "6.0",
        goal: user.interests?.[0] || "AI/ML Internship",
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const wordCount = query.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 3) {
      setShowContext(false);
    }
  }, [query]);

  // Real chat — calls the 2-phase Atyant engine (context intake → execution).
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
      text: res.reply || "Hmm, I didn't catch that — could you rephrase?",
      showMatch: ready,
    };
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || query).trim();
    if (text.length < 2) return;

    setMessages(prev => [...prev, { sender: "user", text }]);
    setQuery("");
    setIsTyping(true);

    try {
      const reply = await sendToEngine(text);
      setMessages(prev => [...prev, { sender: "atyant", text: reply.text, showMatch: reply.showMatch }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        sender: "atyant",
        text: e?.status === 429
          ? "I'm getting a lot of questions right now — give me a few seconds and try again."
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
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 57px)", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
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
        .msg-row:hover { background: rgba(255,255,255,0.025); }
      `}</style>

      {messages.length === 0 ? (
        /* Landing View */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <h1 style={{ textAlign: "center", fontSize: "clamp(1.9rem,4.5vw,2.8rem)", fontWeight: 400, lineHeight: 1.2, marginBottom: "2rem", color: C.text, fontFamily: "Georgia,'Times New Roman',serif" }}>
            Find someone exactly like you…
          </h1>

          <div
            style={{ width: "100%", maxWidth: 680, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: "1.1rem 1.4rem 1rem", marginBottom: "0.6rem" }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}22`; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = "none"; }}
          >
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="How do I get an AI/ML internship from VNIT Metallurgy with no prior experience?"
              rows={1}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: C.text, fontSize: "1rem", lineHeight: 1.5, resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: wordCount >= 3 ? "space-between" : "flex-end", marginTop: "0.5rem" }}>
              {wordCount >= 3 && (
                <button
                  type="button"
                  onClick={() => setShowContext(!showContext)}
                  style={{
                    background: showContext ? C.accentSoft : "transparent",
                    border: `1.5px solid ${showContext ? C.accent : "transparent"}`,
                    borderRadius: 8,
                    color: showContext ? C.accentText : C.textMuted,
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    padding: "4px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.2s"
                  }}
                >
                  + {showContext ? "Hide Context" : "Add Context"}
                </button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.74rem", color: C.textMuted, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 999, padding: "3px 11px", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block", flexShrink: 0 }} />
                  {badgeText}
                </span>
                <button onClick={() => handleSend()}
                  style={{ background: query.trim().length > 1 ? C.accent : C.active, border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
                  <Send size={15} color="#fff" />
                </button>
              </div>
            </div>
          </div>

          {/* Context Panel */}
          {showContext && (
            <div style={{
              animation: "fadeIn 0.3s ease-out",
              background: "rgba(26, 24, 35, 0.65)",
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

          <p style={{ fontSize: "0.78rem", color: C.textMuted, marginBottom: "1.5rem", textAlign: "center" }}>
            Matched to 800+ verified journeys from Tier-2 colleges across India
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => handleSend(a.label)}
                style={{ background: "#221E33", border: `1px solid #322E40`, borderRadius: 999, padding: "7px 18px", color: C.textSub, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.accent + "88"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#221E33"; e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = "#322E40"; }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Chat Mode */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 0" }}>
            <div style={{ maxWidth: 680, margin: "0 auto", paddingX: "1rem" }}>
              {messages.map((m, i) => {
                const isUser = m.sender === "user";
                return (
                  <div key={i} className="msg-row" style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    marginBottom: "1.25rem",
                    paddingX: "1rem",
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
                      {m.showMatch && (
                        <button
                          onClick={() => onGoToClarity(problemStatement || messages[0]?.text || "metallurgy to AI/ML", context)}
                          style={{
                            marginTop: 12,
                            background: "linear-gradient(135deg, #7567C9, #8E80DB)",
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
                          <Sparkles size={12} /> Find Verified Seniors & Roadmaps <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div style={{ marginBottom: "1.25rem", paddingX: "1rem", display: "flex", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.textSub, animation: "pulse 1.2s infinite 0s" }} />
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.textSub, animation: "pulse 1.2s infinite 0.2s" }} />
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.textSub, animation: "pulse 1.2s infinite 0.4s" }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>


          {/* Chat Input Footer */}
          <div style={{ padding: "1rem", paddingBottom: "1.5rem" }}>
            <div style={{ maxWidth: 780, margin: "0 auto", background: "transparent", border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "14px 16px", display: "flex", gap: 14, alignItems: "center" }}>
              {/* Plus Icon */}
              <button style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "1.4rem", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, transition: "color 0.2s", flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = C.text}
                onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                title="Add attachment">
                +
              </button>

              {/* Input Field */}
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Write a message..."
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: "0.95rem", fontFamily: "inherit" }}
              />

              {/* Right Side Controls */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                {/* Model Selector */}
                <button style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "0.78rem", padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = C.text}
                  onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                  <span style={{ fontWeight: 500 }}>Atyant</span>
                </button>

                {/* Microphone Icon */}
                <button style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = C.text}
                  onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                  title="Voice input">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>

                {/* Audio Waves Icon */}
                <button style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = C.text}
                  onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                  title="Audio waves">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8c0-1 0-2 0-3M12 2c0 3 0 6 0 10s0 7 0 10M6 5c0 2 0 4 0 6s0 4 0 8" />
                  </svg>
                </button>

                {/* Send Button */}
                <button onClick={() => handleSend()}
                  style={{ background: query.trim().length > 0 ? C.accent : "transparent", border: "none", color: query.trim().length > 0 ? "#fff" : C.textMuted, borderRadius: 6, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
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
