import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles, ArrowRight, Lightbulb, ChevronDown, FileText, Image, Camera, Paperclip, X, Briefcase } from "lucide-react";
import { FiCopy, FiThumbsUp, FiThumbsDown, FiShare, FiRefreshCw, FiCheck } from 'react-icons/fi';
import { clarityAPI, aiAPI } from "../../api";
import useIsMobile from "../../hooks/useIsMobile";
import { VoiceOverlay } from "./VoiceOverlay";

const CHAT_SID_KEY = "atyant_chat_sid";

function freshSid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return "sess_" + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
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
    cgpa: id.cgpa && parseFloat(String(id.cgpa)) > 0 ? String(id.cgpa) : "",
    goal: ec.target || "",
  };
}

// Problem-first opener + quick-reply chips. Kept here so they can be re-shown
// after a refresh (restored messages don't carry the chips from the server).
const GREETING_OPENER = "What's confusing you right now?";
const GREETING_CHIPS = [
  { label: "🎯  I want an internship but don't know where to start", value: "I want an internship but I don't know where to start" },
  { label: "🏢  Placement season is coming and I'm not prepared", value: "Placement season is coming and I'm not prepared" },
  { label: "🤔  Career confused — don't know what path to take", value: "I'm career confused and don't know what path to take" },
  { label: "📚  Thinking about higher studies (MS / MBA / GATE)", value: "I'm thinking about higher studies — MS, MBA or GATE" },
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

// Turns a real `progress` SSE event (see AtyantEngineService.processAtyantMessage
// and aiRoutes.js POST /atyant-chat) into one human-readable line. These are the
// ACTUAL stages completing on the server, not a guessed/paced sequence.
function describeProgress(event) {
  switch (event.stage) {
    case "reading":
      return "Reading your message…";
    case "reading_resume":
      return "Reading your résumé…";
    case "context": {
      const id = event.context?.identity || {};
      const parts = [];
      if (id.college) parts.push(id.college);
      if (id.branch) parts.push(id.branch);
      if (event.context?.target) parts.push(`aiming for ${event.context.target}`);
      return parts.length
        ? `Got it — ${parts.join(", ")}`
        : "Still building your profile from what you've shared…";
    }
    case "drafting":
      return "Putting together a reply…";
    case "searching_mentors":
      return "Searching verified seniors who match your profile…";
    case "mentors_found":
      return event.count > 0
        ? `Found ${event.count} verified senior${event.count === 1 ? "" : "s"} matching your background…`
        : "No exact match yet — widening the search…";
    default:
      return null;
  }
}

// Kimi/Claude-style "Thinking" block — lightbulb + label + chevron, expands to
// show real backend checkpoints (`lines`) as they actually complete.
//
// The elapsed timer and the shimmer on the active line are what make this read
// as genuinely live rather than a canned spinner: every line is a real server
// stage landing over SSE (see describeProgress), settled stages get a check and
// dim out, and only the one still running shimmers. Collapsed, the header
// carries the current stage so the status is never hidden behind a chevron.
const ThinkingIndicator = ({ lines }) => {
  const [expanded, setExpanded] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());

  // 200ms tick, whole seconds shown — fast enough that the number never looks
  // stuck, slow enough that it doesn't read as a frantic stopwatch.
  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)),
      200,
    );
    return () => clearInterval(id);
  }, []);

  const shown = lines.length ? lines : ["Thinking…"];
  const active = shown[shown.length - 1];

  return (
    <div style={{ marginBottom: "1.25rem", maxWidth: 520, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, overflow: "hidden" }}>
      <button
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-label="Atyant is thinking — toggle details"
        style={{ display: "flex", width: "100%", alignItems: "center", gap: 8, padding: "9px 14px", cursor: "pointer", userSelect: "none", background: "transparent", border: "none", font: "inherit", textAlign: "left" }}
      >
        <Lightbulb size={14} color={C.accent} style={{ flexShrink: 0, animation: "thinkPulse 1.8s ease-in-out infinite" }} />
        <span
          className="think-shimmer"
          style={{ flex: 1, minWidth: 0, fontSize: "0.84rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {expanded ? "Thinking" : active}
        </span>
        {elapsed > 0 && (
          <span style={{ flexShrink: 0, fontSize: "0.72rem", color: C.textMuted, fontVariantNumeric: "tabular-nums" }}>
            {elapsed}s
          </span>
        )}
        <ChevronDown size={14} color={C.textMuted} style={{ flexShrink: 0, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {expanded && (
        <div role="status" aria-live="polite" style={{ padding: "0 14px 12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
          <AnimatePresence initial={false}>
            {shown.map((line, i) => {
              const isActive = i === shown.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
                >
                  <span style={{ flexShrink: 0, width: 12, paddingTop: 5, display: "flex", justifyContent: "center" }}>
                    {isActive ? (
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent, animation: "thinkDot 1.2s ease-in-out infinite" }} />
                    ) : (
                      <FiCheck size={11} color={C.textMuted} style={{ marginTop: -2 }} />
                    )}
                  </span>
                  <span
                    className={isActive ? "think-shimmer" : undefined}
                    style={{ fontSize: "0.8rem", lineHeight: 1.5, color: isActive ? undefined : C.textMuted }}
                  >
                    {line}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// The settled counterpart to ThinkingIndicator: once a turn lands, its trace is
// frozen onto the message and shown here as a collapsed one-liner the user can
// reopen. Label reflects what the turn actually did — on a routing turn "Found
// 3 verified seniors" is far more useful than a bare "Thought for 4s".
const ThoughtStub = ({ trace, ms }) => {
  const [open, setOpen] = useState(false);
  if (!trace?.length) return null;

  const secs = Math.max(1, Math.round((ms || 0) / 1000));
  const found = trace
    .map(l => /Found (\d+) verified senior/.exec(l))
    .filter(Boolean)
    .pop();
  const label = found
    ? `Found ${found[1]} verified senior${found[1] === "1" ? "" : "s"} · ${secs}s`
    : `Thought for ${secs}s`;

  return (
    <div style={{ marginBottom: 8, maxWidth: 520 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: 0, background: "none", border: "none", font: "inherit", cursor: "pointer", color: C.textMuted, fontSize: "0.75rem" }}
      >
        <Lightbulb size={12} />
        <span>{label}</span>
        <ChevronDown size={12} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div style={{ marginTop: 7, display: "flex", flexDirection: "column", gap: 6 }}>
          {trace.map((line, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ flexShrink: 0, width: 12, paddingTop: 4, display: "flex", justifyContent: "center" }}>
                <FiCheck size={11} color={C.textMuted} />
              </span>
              <span style={{ fontSize: "0.78rem", lineHeight: 1.5, color: C.textMuted }}>{line}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MENTOR_HUES = ["#7567C9", "#3DBE82", "#FB923C", "#3B82F6", "#EC4899", "#14B8A6"];
function mentorHue(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return MENTOR_HUES[Math.abs(hash) % MENTOR_HUES.length];
}

// The real mentors the engine matched, shown inline instead of being computed
// and thrown away. Reasons come straight from `matchedOn` — the fields that
// actually matched — so a card can only claim overlap it genuinely has. A
// fallback pick (isRelevanceMatch false) matched on nothing and says nothing;
// it's labelled for what it is rather than dressed up with invented reasons.
const MentorMatches = ({ mentors }) => {
  if (!mentors?.length) return null;

  return (
    <div style={{ marginTop: 14, maxWidth: 520, width: "100%" }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, marginBottom: 9 }}>
        Seniors who've walked this path
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {mentors.map((m, i) => {
          const reasons = m.matchedOn
            ? [
                ...(m.matchedOn.expertise || []),
                ...(m.matchedOn.domainExperience || []),
                ...(m.matchedOn.interests || []),
                ...(m.matchedOn.topCompanies || []),
              ].slice(0, 3)
            : [];
          const subtitle = [m.college, m.topCompanies?.[0] || m.companyDomain]
            .filter(Boolean)
            .join(" · ");

          return (
            <motion.div
              key={m.id || i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
              style={{ display: "flex", gap: 11, padding: "11px 13px", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 11 }}
            >
              {m.profilePicture ? (
                <img
                  src={m.profilePicture}
                  alt=""
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${mentorHue(m.name)}22`, color: mentorHue(m.name), fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase" }}>
                  {m.name?.[0] || "?"}
                </div>
              )}

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: C.text }}>{m.name}</div>
                {subtitle && (
                  <div style={{ fontSize: "0.74rem", color: C.textMuted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {subtitle}
                  </div>
                )}

                {reasons.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                    {reasons.map(r => (
                      <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: C.green, background: `${C.green}14`, borderRadius: 999, padding: "2px 8px" }}>
                        <FiCheck size={9} /> {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.7rem", color: C.textMuted, marginTop: 6, fontStyle: "italic" }}>
                    Suggested — no direct overlap with your goal yet
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default function AskAtyantPage({ user, onGoToClarity, onGoToMentorOnboard, onGoToJobs }) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingLines, setThinkingLines] = useState([]);
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
  const abortRef = useRef(null);  // cancels the in-flight chat stream on unmount
  const sendingRef = useRef(false);  // synchronous re-entrancy guard — see handleSend
  // The live trace lives in state (for rendering) AND a ref, because the reply
  // handler needs the FINAL list to freeze onto the message — reading the state
  // variable there would close over its value from the start of the turn.
  const traceRef = useRef([]);
  const turnStartedAt = useRef(0);

  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-IN");

  // "+" attach menu — Upload document / Upload photo / Take photo — and the
  // hidden file inputs it triggers. Shared by both the landing and footer
  // input rows (only one of the two is ever mounted at a time).
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  // Staged file — picked but not yet sent. Shown as a preview chip in the
  // input (ChatGPT-style) so the student can back out before anything uploads.
  const [pendingFile, setPendingFile] = useState(null);
  const docInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
    { label: "Get Roadmap" },

    // Job search is open to everyone — signed-out visitors can browse the board,
    // so this stays visible without an account. Highlighted because it's the
    // strongest top-of-funnel hook on the page.
    ...(user?.role !== "mentor"
      ? [{ label: "Find Jobs", isNav: true, isHighlight: true }]
      : []),

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
        cgpa: edu.cgpa && parseFloat(String(edu.cgpa)) > 0 ? String(edu.cgpa) : "",
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
          branch: mapped.branch || prev.branch,
          year: mapped.year || prev.year,
          cgpa: mapped.cgpa || prev.cgpa,
          goal: mapped.goal || prev.goal,
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

  // Cancel any in-flight chat stream when this page unmounts (navigating away,
  // or "New Chat" remounting via the `key` prop) so a late response can't call
  // setState on a torn-down instance.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Shared by both the text-chat flow and the résumé-upload flow: apply the
  // engine's result to page state (context badge, problem statement) and
  // shape it into what the message bubble needs.
  const applyEngineResult = (res, fallbackText) => {
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
      text: res.reply || fallbackText,
      showMatch: ready,
      chips: Array.isArray(res.quickReplies) ? res.quickReplies : null,
      mentors: Array.isArray(res.matchedMentors) ? res.matchedMentors : null,
    };
  };

  // Real chat � calls the 2-phase Atyant engine (context intake ? execution).
  // Streams real progress checkpoints (context extraction, mentor search) into
  // thinkingLines as the backend actually completes them.
  const sendToEngine = async (text) => {
    // Seed with the "reading" line immediately — it's always the first real
    // stage, so there's no reason to wait on the network round trip to show it
    // instead of a generic "Thinking…" placeholder.
    const seed = describeProgress({ stage: "reading" });
    setThinkingLines([seed]);
    traceRef.current = [seed];
    const controller = new AbortController();
    abortRef.current = controller;
    const res = await aiAPI.atyantChatStream(text, sessionIdRef.current, (event) => {
      const line = describeProgress(event);
      if (!line) return;
      // The server also emits its own "reading" event right after — dedupe so
      // the seed line above doesn't show up twice in a row.
      const prevTrace = traceRef.current;
      if (prevTrace[prevTrace.length - 1] === line) return;
      traceRef.current = [...prevTrace, line];
      setThinkingLines(traceRef.current);
    }, controller.signal);
    return applyEngineResult(res, "Hmm, I didn't catch that — could you rephrase?");
  };

  const handleSend = async (textToSend) => {
    // `isTyping` state isn't visible until React commits it, so two calls fired
    // in the same tick (e.g. a fast double Enter) would both read it as false —
    // sendingRef flips synchronously and closes that gap.
    if (sendingRef.current) return;

    // A staged file takes priority — it sits in the composer until send is hit,
    // same as ChatGPT. Whatever's typed alongside it goes up together with the
    // file, same as a normal message would.
    if (pendingFile) {
      const file = pendingFile;
      const text = query.trim();
      setPendingFile(null);
      setQuery("");
      await uploadResumeFile(file, text);
      return;
    }

    const text = (textToSend || query).trim();
    if (text.length < 1) return;  // allow short but valid answers like "3"

    sendingRef.current = true;
    setMessages(prev => [...prev, { sender: "user", text }]);
    setQuery("");
    setIsTyping(true);
    turnStartedAt.current = Date.now();

    try {
      const reply = await sendToEngine(text);
      setMessages(prev => [...prev, {
        sender: "atyant",
        text: reply.text,
        showMatch: reply.showMatch,
        chips: reply.chips,
        mentors: reply.mentors,
        // Freeze the trace onto the message so it survives the live indicator
        // unmounting — that's what the collapsed "Thought for Xs" stub reopens.
        trace: traceRef.current,
        thoughtMs: Date.now() - turnStartedAt.current,
      }]);
    } catch (e) {
      if (e.name === "AbortError") return;  // page unmounted — nothing to show
      setMessages(prev => [...prev, {
        sender: "atyant",
        text: e?.status === 429
          ? "I'm getting a lot of questions right now � give me a few seconds and try again."
          : e?.status === 504
            ? "That took longer than it should have. Try sending it again?"
            : "Something glitched on my end. Try sending that again?",
        showMatch: false,
      }]);
    } finally {
      sendingRef.current = false;
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setQuery("");
  };

  const handleRegenerate = async (msg, index) => {
    if (sendingRef.current) return;
    const userPrompt = messages[index - 1]?.text || "";
    if (!userPrompt) return;
    sendingRef.current = true;
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
      sendingRef.current = false;
      setIsTyping(false);
    }
  };

  const RESUME_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  const RESUME_MAX_BYTES = 8 * 1024 * 1024;

  // "+" → Upload document / Upload photo / Take photo. Just STAGES the file as
  // a preview chip (ChatGPT-style) — nothing uploads until the student hits
  // send, so they can back out or add a message alongside it first.
  const stageResumeFile = (file) => {
    setAttachMenuOpen(false);
    if (!file) return;

    if (!RESUME_MIME_TYPES.includes(file.type)) {
      setMessages(prev => [...prev, { sender: "atyant", text: "I can only read PDF, JPG, PNG or WEBP files right now — try one of those?", showMatch: false }]);
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      setMessages(prev => [...prev, { sender: "atyant", text: "That file's a bit large — try one under 8MB.", showMatch: false }]);
      return;
    }
    setPendingFile(file);
  };

  // Actually uploads a staged file — called from handleSend once the student
  // hits send. `text`, if the student typed anything alongside the file, goes
  // up together with it — see AtyantEngineService.processResumeUpload: a bare
  // upload only asks a follow-up, but upload+text is a real turn that can
  // route straight to mentor matching, same as typing that text alone would.
  const uploadResumeFile = async (file, text = "") => {
    sendingRef.current = true;
    setMessages(prev => [...prev, { sender: "user", text: text || undefined, attachment: { name: file.name, type: file.type } }]);
    setIsTyping(true);
    setThinkingLines([describeProgress({ stage: "reading_resume" })]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await aiAPI.atyantResumeStream(file, sessionIdRef.current, (event) => {
        const line = describeProgress(event);
        if (!line) return;
        setThinkingLines(prev => (prev[prev.length - 1] === line ? prev : [...prev, line]));
      }, controller.signal, text);

      const reply = applyEngineResult(res, "Got your résumé — tell me a bit more so I can point you the right way.");
      setMessages(prev => [...prev, { sender: "atyant", text: reply.text, showMatch: reply.showMatch, chips: reply.chips, mentors: reply.mentors }]);
    } catch (e) {
      if (e.name === "AbortError") return;  // page unmounted — nothing to show
      setMessages(prev => [...prev, {
        sender: "atyant",
        text: e?.status === 429
          ? "I'm getting a lot of questions right now — give me a few seconds and try again."
          : e?.status === 504
            ? "That took longer than it should have. Try uploading again?"
            : (e.message || "Couldn't read that file. Try again?"),
        showMatch: false,
      }]);
    } finally {
      sendingRef.current = false;
      setIsTyping(false);
    }
  };

  // Sits above the input row once a file is staged — a preview card (icon +
  // name + type + remove button), same idea as ChatGPT's composer attachment.
  const PendingFilePreview = () => {
    if (!pendingFile) return null;
    const isPdf = pendingFile.type === "application/pdf";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: isPdf ? "#E5484D" : C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {isPdf ? <FileText size={17} color="#fff" /> : <Image size={17} color="#fff" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pendingFile.name}</div>
          <div style={{ fontSize: "0.72rem", color: C.textMuted }}>{isPdf ? "PDF" : "Image"}</div>
        </div>
        <button onClick={() => setPendingFile(null)} title="Remove"
          style={{ background: C.active, border: "none", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.textSub, flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.textSub; }}>
          <X size={13} />
        </button>
      </div>
    );
  };

  const attachMenuItemStyle = {
    display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 10px",
    background: "transparent", border: "none", borderRadius: 8, color: C.text,
    fontSize: "0.85rem", fontFamily: "inherit", cursor: "pointer", textAlign: "left",
  };

  // "+" → a small popup with Upload document / Upload photo / Take photo. All
  // three feed the same stageResumeFile — only the source file input differs.
  const AttachButton = () => (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setAttachMenuOpen(o => !o)}
        title="Add attachment"
        style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: 0, width: 24, height: 54, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
        onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; }}
      >
        <Paperclip size={18} style={{ transform: attachMenuOpen ? "rotate(45deg)" : "none", transition: "transform 0.15s ease" }} />
      </button>
      {attachMenuOpen && (
        <>
          <div onClick={() => setAttachMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
          <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 61, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, boxShadow: "0 16px 36px -10px rgba(0,0,0,0.45)", padding: 6, minWidth: 200, display: "flex", flexDirection: "column", gap: 2 }}>
            <button
              onClick={() => docInputRef.current?.click()}
              style={attachMenuItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <FileText size={15} color={C.accent} /> Upload document
            </button>
            <button
              onClick={() => photoInputRef.current?.click()}
              style={attachMenuItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Image size={15} color={C.accent} /> Upload photo
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              style={attachMenuItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Camera size={15} color={C.accent} /> Take photo
            </button>
          </div>
        </>
      )}
    </div>
  );

  // Hidden inputs the menu above triggers. Reset value after read so picking
  // the same file twice in a row still fires onChange.
  const HiddenFileInputs = () => (
    <>
      <input ref={docInputRef} type="file" accept="application/pdf" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; stageResumeFile(f); }} />
      <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; stageResumeFile(f); }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; stageResumeFile(f); }} />
    </>
  );

  const wordCount = query.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: messages.length === 0 ? "auto" : "calc(100dvh - 57px)", minHeight: messages.length === 0 ? "calc(100dvh - 57px)" : 0, background: "transparent", fontFamily: "' Inter', sans-serif" }}>
      <HiddenFileInputs />
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
        @keyframes thinkPulse {
          0%, 100% { opacity: 0.5; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes thinkDot {
          0%, 100% { opacity: 0.35; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes thinkShimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        /* Light sweep across the text of whichever stage is still running.
           Falls back to a plain readable color where background-clip:text
           isn't supported, so the label can never render invisible. */
        .think-shimmer {
          color: var(--c-text);
          background: linear-gradient(90deg, var(--c-textSub) 25%, var(--c-text) 45%, var(--c-text) 55%, var(--c-textSub) 75%);
          background-size: 200% auto;
          animation: thinkShimmer 2.2s linear infinite;
        }
        @supports (-webkit-background-clip: text) or (background-clip: text) {
          .think-shimmer {
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
        }
        /* Respect reduced-motion: keep the trace legible, drop the movement. */
        @media (prefers-reduced-motion: reduce) {
          .think-shimmer { animation: none; background: none; color: var(--c-text); }
        }
        .msg-row { animation: fadeIn 0.2s ease-out; }
        .msg-row:hover { background: var(--c-rowHover); }
      `}</style>

      {messages.length === 0 ? (
        /* Landing View */
        <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <h1 style={{ position: "relative", zIndex: 1, textAlign: "center", fontSize: "clamp(1.9rem,4.5vw,2.8rem)", fontWeight: 400, lineHeight: 1.2, marginBottom: "2rem", color: C.text, fontFamily: "Georgia,'Times New Roman',serif" }}>
            Find someone exactly like you<span></span>...
          </h1>

          <div
            style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 680, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, marginBottom: "0.6rem", display: "flex", flexDirection: "column", boxShadow: "0 18px 50px -24px var(--accent)", transition: "border-color 0.2s, box-shadow 0.2s" }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}22, 0 18px 50px -24px var(--accent)`; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = "0 18px 50px -24px var(--accent)"; }}
          >
            {pendingFile && <PendingFilePreview />}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "0 0.75rem 0 1.25rem", minHeight: 54, borderTop: pendingFile ? `1px solid ${C.cardBorder}` : "none" }}>
              <AttachButton />

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
                <button
                  onClick={() => setShowVoiceOverlay(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: C.textMuted,
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    transition: "all 0.2s"
                  }}
                  title="Voice input"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
                <button onClick={() => handleSend()}
                  style={{ background: (query.trim().length > 0 || pendingFile) ? C.accent : C.active, border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", flexShrink: 0 }}>
                  <Send size={15} color={(query.trim().length > 0 || pendingFile) ? "#fff" : C.textSub} />
                </button>
              </div>
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
              Matched to 800+ verified journeys from engineering colleges across India
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
                      if (a.isNav) {
                        onGoToJobs?.();
                      } else if (a.isSpecial) {
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
                      display: "flex",
                      alignItems: "center",
                      gap: a.isHighlight ? 7 : 0,
                      background: a.isHighlight
                        ? "linear-gradient(135deg, #F97316 0%, #EC4899 100%)"
                        : a.isSpecial ? C.accent : "var(--c-active)",
                      border: a.isHighlight
                        ? "1px solid transparent"
                        : a.isSpecial ? `1px solid ${C.accent}` : `1px solid var(--c-cardBorder)`,
                      borderRadius: 999,
                      padding: a.isHighlight ? "7px 20px" : "7px 18px",
                      color: (a.isSpecial || a.isHighlight) ? "#fff" : C.textSub,
                      fontSize: "0.82rem",
                      fontWeight: (a.isSpecial || a.isHighlight) ? 600 : 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: a.isHighlight
                        ? "0 4px 14px rgba(249,115,22,0.35)"
                        : a.isSpecial ? "0 4px 12px rgba(117,103,201,0.25)" : "none",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => {
                      if (a.isSpecial || a.isHighlight) {
                        e.currentTarget.style.filter = "brightness(1.08)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      } else {
                        e.currentTarget.style.background = C.cardHover;
                        e.currentTarget.style.color = C.text;
                        e.currentTarget.style.borderColor = C.accent + "88";
                      }
                    }}
                    onMouseLeave={e => {
                      if (a.isSpecial || a.isHighlight) {
                        e.currentTarget.style.filter = "none";
                        e.currentTarget.style.transform = "none";
                      } else {
                        e.currentTarget.style.background = "var(--c-active)";
                        e.currentTarget.style.color = C.textSub;
                        e.currentTarget.style.borderColor = "var(--c-cardBorder)";
                      }
                    }}
                  >
                    {a.isHighlight && <Briefcase size={14} />}
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
                      {!isUser && m.trace?.length > 0 && (
                        <ThoughtStub trace={m.trace} ms={m.thoughtMs} />
                      )}
                      <div style={{
                        padding: isUser ? "0.75rem 1rem" : "0",
                        background: isUser ? "rgba(117, 103, 201, 0.12)" : "transparent",
                        borderRadius: isUser ? 10 : 0,
                        fontSize: "0.92rem",
                        lineHeight: 1.6,
                        color: C.text,
                        whiteSpace: "pre-line",
                      }}>
                        {m.attachment && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: m.text ? 6 : 0 }}>
                            {m.attachment.type === "application/pdf"
                              ? <FileText size={15} color={C.accentText} />
                              : <Image size={15} color={C.accentText} />}
                            {m.attachment.name}
                          </span>
                        )}
                        {m.attachment && m.text && <br />}
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
                      {!isUser && m.mentors?.length > 0 && <MentorMatches mentors={m.mentors} />}
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

              {isTyping && <ThinkingIndicator lines={thinkingLines} />}
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
            <div style={{ maxWidth: 780, margin: "0 auto", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, display: "flex", flexDirection: "column", transition: "border-color 0.2s, box-shadow 0.2s" }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}22`; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = "none"; }}>
              {pendingFile && <PendingFilePreview />}
              <div style={{ padding: "0 0.75rem 0 1.25rem", display: "flex", gap: 10, alignItems: "flex-end", minHeight: 54, borderTop: pendingFile ? `1px solid ${C.cardBorder}` : "none" }}>
                <AttachButton />

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
                  <button
                    onClick={() => setShowVoiceOverlay(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: C.textMuted,
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      transition: "all 0.2s"
                    }}
                    title="Voice input"
                  >
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
                    style={{ background: (query.trim().length > 0 || pendingFile) ? C.accent : "transparent", border: "none", color: (query.trim().length > 0 || pendingFile) ? "#fff" : C.textMuted, borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <VoiceOverlay
        isOpen={showVoiceOverlay}
        selectedLang={selectedLang}
        setSelectedLang={setSelectedLang}
        onClose={() => setShowVoiceOverlay(false)}
        onTranscript={(text) => {
          setQuery(text);
          // Focus input and resize it after speech recognition finishes
          setTimeout(() => {
            if (messages.length === 0) {
              if (heroInputRef.current) {
                heroInputRef.current.focus();
                autoGrow(heroInputRef.current);
              }
            } else {
              if (chatInputRef.current) {
                chatInputRef.current.focus();
                autoGrow(chatInputRef.current);
              }
            }
          }, 100);
        }}
      />
    </div>
  );
}

