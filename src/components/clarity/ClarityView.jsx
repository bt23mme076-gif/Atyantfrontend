import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle, Loader2, Sparkles, Video, ChevronLeft, ChevronRight, MapPin, AlertTriangle, ListChecks, Users, Trophy, BookOpen, Target, Wrench } from "lucide-react";
import SeniorsPanel from "./SeniorsPanel";
import SeniorDetail from "./SeniorDetail";
import useIsMobile from "../../hooks/useIsMobile";
import { clarityAPI, profileAPI } from "../../api";

// Fire-and-forget — never throws, never blocks UI
const trackView = (mentor) => {
  const id = mentor?._id || mentor?.id;
  if (id) profileAPI.trackView(id).catch(() => { });
};

// Cheapest tier price, shown on the answer-card CTA. Real per-mentor prices load
// from the service catalog on the full Book a Session page.
const STARTING_PRICE = 49;

export default function ClarityView({ initialQuery = "", initialContext = null, user, onTalkToMentor, onOpenChat }) {
  const isMobile = useIsMobile();
  const [mentors, setMentors] = useState([]);
  const [answerCards, setAnswerCards] = useState([]);   // scrollable feed
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  // Fetch on mount / when query changes
  useEffect(() => {
    const q =
      initialQuery && initialQuery.trim().length > 2
        ? initialQuery.trim()
        : "How do I land a strong internship with no prior experience?";
    setActiveQuery(q);
    setSelectedMentor(null);
    fetchMentors(q);
  }, [initialQuery]);

  const fetchMentors = async (query) => {
    setFetchLoading(true);
    setFetchError("");
    try {
      const edu = user?.education?.[0] || {};
      // Send only what we actually know. No fake defaults — an unknown college must
      // stay empty so the engine matches on the query, not on a wrong college.
      const data = await clarityAPI.match({
        query,
        college: initialContext?.college || edu.institutionName || edu.institution || "",
        branch: initialContext?.branch || edu.field || "",
        year: initialContext?.year || edu.year || "",
        goal: initialContext?.goal || user?.interests?.[0] || "",
        cgpa: initialContext?.cgpa || edu.cgpa || "",
      });
      setMentors(data.mentors || []);
      // Answer-card feed (fallback to the single best card for older responses)
      const cards = (data.answerCards && data.answerCards.length)
        ? data.answerCards
        : (data.answerCard ? [data.answerCard] : []);
      setAnswerCards(cards);
    } catch (e) {
      setFetchError(e.message || "Failed to fetch mentors");
    } finally {
      setFetchLoading(false);
    }
  };

  // Resolve a card's mentor into the display shape SeniorDetail expects.
  const resolveMentor = (cm) => {
    if (!cm) return null;
    const id = String(cm._id || cm.id || "");
    const found = mentors.find((m) => String(m.id) === id);
    if (found) return found;
    const edu = cm.education || {};
    const nm = cm.name || cm.username || "Mentor";
    return {
      id,
      name: nm,
      initials: nm.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2),
      profilePicture: cm.profilePicture || null,
      college: edu.institutionName || edu.institution || "",
      branch: edu.field || "",
      story: cm.bio || "",
      outcome: cm.topCompanies?.[0] ? `${cm.expertise?.[0] || "Role"} @ ${cm.topCompanies[0]}` : "Active mentor on Atyant",
      tags: cm.specialTags || [],
      matchPct: 0,
      rating: cm.rating ? `${Number(cm.rating).toFixed(1)}★` : "4.8★",
      studentsHelped: String(cm.successfulMatches || 0),
      timeline: "Active",
      primaryDomain: cm.primaryDomain || null,
      companyDomain: cm.companyDomain || null,
      linkedinProfile: cm.linkedinProfile || null,
    };
  };

  const handleSend = () => {
    const q = inputValue.trim();
    if (q.length < 3) return;
    setActiveQuery(q);
    setInputValue("");
    setSelectedMentor(null);
    fetchMentors(q);
  };

  const edu = user?.education?.[0] || {};
  // Show only what we actually know — no fabricated college/branch/CGPA.
  const goalText = initialContext?.goal || user?.interests?.[0] || null;
  const contextLine = [
    initialContext?.college || edu.institutionName || edu.institution || null,
    initialContext?.branch || edu.field || null,
    initialContext?.year || edu.year || null,
    (() => { const v = initialContext?.cgpa || edu.cgpa; return v && parseFloat(v) > 0 ? `CGPA ${v}` : null; })(),
    goalText ? `Goal: ${goalText}` : null,
  ]
    .filter(Boolean)
    .join(" · ") || "Based on your question";

  // Shared question header (compact on mobile)
  const header = (
    <div
      className="px-4 sm:px-6 pt-5 pb-4 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--c-sidebarBorder)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg,#7567C9,#5a52a8)" }}
        >
          <span className="text-xs font-bold" style={{ color: "var(--c-text)", fontFamily: "Fraunces, serif" }}>A</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug" style={{ color: "var(--c-text)", fontFamily: "Fraunces, serif" }}>
            {activeQuery}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--c-textMuted)", fontFamily: "Inter, sans-serif" }}>
            Context: {contextLine}
          </p>
        </div>
      </div>
    </div>
  );

  // Scrollable feed of Answer Cards — how seniors solved a similar problem.
  // Each card has a "Talk to <senior>" CTA as the secondary step.
  const answerFeed = answerCards.length > 0 ? (
    <div>
      {answerCards.map((card, i) => (
        <div key={card.id || i} style={{ borderTop: i > 0 ? "8px solid var(--c-sidebar)" : "none" }}>
          <MentorJourneyFlow card={card} />
          <InstantAnswerCard
            card={card}
            onProfile={() => { const m = resolveMentor(card.mentor); trackView(m); setSelectedMentor(m); }}
            onBook={() => onTalkToMentor?.(resolveMentor(card.mentor))}
          />
        </div>
      ))}
    </div>
  ) : null;

  // ── MOBILE: single column, one view at a time ──
  if (isMobile) {
    return (
      <div className="flex flex-col w-full" style={{ background: "var(--c-bg)", fontFamily: "Inter, sans-serif", height: "100%", minHeight: 0 }}>
        {header}
        <div className="flex-1" style={{ minHeight: 0 }}>
          {fetchLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: "var(--c-textMuted)" }}>
              <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
              <p className="text-xs">Finding seniors from your exact background…</p>
            </div>
          ) : fetchError ? (
            <p className="text-xs text-center py-16" style={{ color: "#f87171" }}>{fetchError}</p>
          ) : selectedMentor ? (
            // Detail: fill bounded height so SeniorDetail's own header/scroll/footer work
            <div className="flex flex-col h-full">
              <button
                onClick={() => setSelectedMentor(null)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold flex-shrink-0"
                style={{ color: "var(--c-accentText)", borderBottom: "1px solid var(--c-sidebarBorder)", background: "rgba(117,103,201,0.06)" }}
              >
                ← Back to matched seniors
              </button>
              <div className="flex-1" style={{ minHeight: 0 }}>
                <SeniorDetail
                  mentor={selectedMentor}
                  user={user}
                  onClose={() => setSelectedMentor(null)}
                  onTalkToMentor={onTalkToMentor}
                  onOpenChat={onOpenChat}
                />
              </div>
            </div>
          ) : (
            // Mobile: interleaved — mentor profile then their answer card, one pair at a time
            <div className="h-full overflow-y-auto hide-scrollbar">
              {answerCards.length > 0 ? (
                [...answerCards]
                  .sort((a, b) => (resolveMentor(b.mentor)?.matchPct || 0) - (resolveMentor(a.mentor)?.matchPct || 0))
                  .map((card, i) => {
                    const mentor = resolveMentor(card.mentor);
                    const isTop = i === 0;
                    const rankLabel = i === 0 ? "★ Best Match" : i === 1 ? "2nd Best" : i === 2 ? "3rd Best" : null;
                    return (
                      <div
                        key={card.id || i}
                        style={{
                          margin: "0 4px 16px",
                          border: `1px solid ${isTop ? "rgba(117,103,201,0.45)" : "var(--c-cardBorder)"}`,
                          borderRadius: 16,
                          overflow: "hidden",
                          background: "var(--c-card)",
                          boxShadow: isTop ? "0 6px 24px rgba(117,103,201,0.18)" : "0 1px 5px rgba(0,0,0,0.04)",
                        }}
                      >
                        {/* Mentor profile pill — tappable to open detail */}
                        {mentor && (
                          <button
                            onClick={() => { trackView(mentor); setSelectedMentor(mentor); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left"
                            style={{ background: isTop ? "rgba(117,103,201,0.06)" : "var(--c-sidebar)", borderBottom: "1px solid var(--c-sidebarBorder)" }}
                          >
                            {mentor.profilePicture ? (
                              <img src={mentor.profilePicture} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(117,103,201,0.18)", border: "1.5px solid rgba(117,103,201,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--c-accentText)", flexShrink: 0 }}>
                                {mentor.initials}
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", fontFamily: "Fraunces, serif" }}>{mentor.name}</span>
                                {rankLabel && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: isTop ? "#fff" : "var(--c-accentText)", background: isTop ? "#7567C9" : "var(--c-accentSoft)", borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>{rankLabel}</span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--c-textSub)", fontFamily: "Inter, sans-serif", marginTop: 2, fontWeight: 600 }}>
                                {[mentor.college, mentor.branch].filter(Boolean).join(" · ")}
                              </div>
                              {(mentor.primaryDomain || mentor.companyDomain) && (
                                <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                                  {mentor.primaryDomain && (
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: "rgba(117,103,201,0.14)", color: "var(--c-accentText)", border: "1px solid rgba(117,103,201,0.3)" }}>
                                      {{ internship: "Internship", placement: "Placement", both: "Intern+Placement" }[mentor.primaryDomain]}
                                    </span>
                                  )}
                                  {mentor.companyDomain && (
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: "rgba(61,190,130,0.12)", color: "#3DBE82", border: "1px solid rgba(61,190,130,0.3)" }}>
                                      {mentor.companyDomain}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: 12, color: "var(--c-accentText)", marginLeft: 6, fontWeight: 600 }}>→</span>
                          </button>
                        )}
                        {/* Journey flow + answer card */}
                        <MentorJourneyFlow card={card} />
                        <InstantAnswerCard
                          card={card}
                          onProfile={() => { trackView(mentor); setSelectedMentor(mentor); }}
                          onBook={() => onTalkToMentor?.(mentor)}
                        />
                      </div>
                    );
                  })
              ) : mentors.length > 0 ? (
                <SeniorsPanel
                  mentors={mentors}
                  selectedId={selectedMentor?.id}
                  onSelect={(m) => setSelectedMentor(m)}
                />
              ) : (
                <p className="text-xs text-center px-6 py-16" style={{ color: "var(--c-textMuted)" }}>
                  No verified answers yet. Try a different question.
                </p>
              )}
            </div>
          )}
        </div>
        <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ background: "var(--c-bg)", fontFamily: "Inter, sans-serif", minHeight: 0, flexDirection: "row" }}
    >
      {/* ── Left: Main content ── */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ borderRight: "1px solid var(--c-sidebarBorder)", minHeight: 0 }}
      >
        {header}

        {/* Main area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {fetchLoading ? (
              <motion.div
                key="loading"
                className="flex flex-col items-center justify-center h-full gap-3"
                style={{ color: "var(--c-textMuted)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
                <p className="text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                  Finding seniors from your exact background…
                </p>
              </motion.div>
            ) : fetchError ? (
              <motion.div
                key="error"
                className="flex items-center justify-center h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-xs" style={{ color: "#f87171", fontFamily: "Inter, sans-serif" }}>
                  {fetchError}
                </p>
              </motion.div>
            ) : selectedMentor ? (
              <motion.div
                key={selectedMentor.id || selectedMentor.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Back to answers + connect banner */}
                <button
                  onClick={() => setSelectedMentor(null)}
                  className="flex items-center gap-2 px-6 py-2.5 flex-shrink-0 text-left"
                  style={{ borderBottom: "1px solid var(--c-sidebarBorder)", background: "rgba(117,103,201,0.06)" }}
                >
                  <span className="text-xs font-bold tracking-wide" style={{ color: "var(--c-accentText)", fontFamily: "Inter, sans-serif" }}>
                    ← Back to answers · Connect with {selectedMentor.name}
                  </span>
                </button>

                {/* Senior detail fills the rest — it manages its own header/scroll/footer.
                    Use min-h-0 (not an extra overflow wrapper) so its top isn't clipped. */}
                <div className="flex-1 min-h-0">
                  <SeniorDetail
                    mentor={selectedMentor}
                    user={user}
                    onClose={() => setSelectedMentor(null)}
                    onTalkToMentor={onTalkToMentor}
                    onOpenChat={onOpenChat}
                  />
                </div>
              </motion.div>
            ) : answerFeed ? (
              <motion.div
                key="answer-feed"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full overflow-y-auto hide-scrollbar"
              >
                {answerFeed}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-xs" style={{ color: "var(--c-textMuted)", fontFamily: "Inter, sans-serif" }}>
                  No matching seniors found. Try a different question below.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ── Right: Matched Seniors panel (always visible) ── */}
      <div
        className="flex flex-col overflow-hidden flex-shrink-0"
        style={{
          width: isMobile ? "100%" : "300px",
          maxHeight: isMobile ? "42vh" : undefined,
          borderTop: isMobile ? "1px solid var(--c-sidebarBorder)" : "none",
          background: "var(--c-sidebar)",
        }}
      >
        {fetchLoading ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3"
            style={{ color: "var(--c-textMuted)" }}
          >
            <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
            <p className="text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
              Finding your seniors…
            </p>
          </div>
        ) : mentors.length > 0 ? (
          <SeniorsPanel
            mentors={mentors}
            selectedId={selectedMentor?.id}
            onSelect={(mentor) => { trackView(mentor); setSelectedMentor(mentor); }}
          />
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center"
            style={{ color: "var(--c-textMuted)" }}
          >
            <p className="text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
              {activeQuery
                ? "No matching seniors found. Try a different question."
                : "Ask a question to find matched seniors."}
            </p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}

// ── Labelled section block (hoisted to module scope) ──
function AnswerSection({ label, children }) {
  if (!children) return null;
  return (
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-widest mb-1.5"
        style={{ color: "var(--c-accentText)", fontFamily: "Inter, sans-serif" }}>
        {label}
      </p>
      <div className="text-sm leading-relaxed" style={{ color: "var(--c-textSub)", fontFamily: "Inter, sans-serif" }}>
        {children}
      </div>
    </div>
  );
}

// Short flowchart-node text — the caption under each node. Full text is always
// recoverable in the detail card, so this truncation never hides content.
const truncateNodeText = (text, max = 42) => {
  if (!text) return "";
  const clean = String(text).trim();
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
};

/**
 * @typedef {Object} JourneyStep
 * @property {"start"|"mistake"|"step"|"turning"|"outcome"} type
 * @property {string} label  — short milestone title shown under the node
 * @property {string} text   — full milestone story, shown in the detail card
 */

// Meaningful icon per milestone — keyword matching for generic action steps.
const nodeIconFor = (type, label = "") => {
  if (type === "start") return MapPin;
  if (type === "mistake") return AlertTriangle;
  if (type === "turning") return Sparkles;
  if (type === "outcome") return Trophy;
  const l = label.toLowerCase();
  if (/senior|alumni|mentor|people|talk|network|connect/.test(l)) return Users;
  if (/plan|schedule|prep|routine|timeline/.test(l)) return ListChecks;
  if (/subject|study|learn|read|course|book|fundament/.test(l)) return BookOpen;
  if (/goal|target|focus/.test(l)) return Target;
  return Wrench;
};

// ── Mentor's journey as an interactive milestone timeline ──
// Nodes have three states: COMPLETED (filled accent), ACTIVE (glowing ring),
// UPCOMING (muted outline). The connecting line fills up to the active node.
// Clicking a node (or the ‹ › arrows) opens its full story in a detail card —
// nothing is permanently truncated.
function MentorJourneyFlow({ card }) {
  const c = card?.content || {};
  const mentor = card?.mentor || {};
  const steps = Array.isArray(c.actionableSteps) ? c.actionableSteps : [];
  const mistakes = Array.isArray(c.keyMistakes) ? c.keyMistakes : [];

  // The final node should read as "what this mentor became", not the raw
  // timeline paragraph — prefer their actual placement, then the result half
  // of mainAnswer ("X → Y"), and only fall back to timeline if nothing else exists.
  const outcomeText =
    (mentor.topCompanies?.[0] && `${mentor.expertise?.[0] || "Placed"} @ ${mentor.topCompanies[0]}`) ||
    (c.mainAnswer?.includes("→") ? c.mainAnswer.split("→").pop().trim() : null) ||
    c.timeline;

  /** @type {JourneyStep[]} */
  const nodes = [];
  if (c.situation) nodes.push({ type: "start", label: "Starting point", text: c.situation });
  if (mistakes.length) {
    nodes.push({
      type: "mistake",
      label: "Mistakes made",
      text: mistakes.map((m) => (typeof m === "string" ? m : m?.description || m?.mistake)).join(" · "),
    });
  }
  steps.forEach((s, i) => {
    nodes.push({ type: "step", label: s.step || `Step ${i + 1}`, text: s.description || "" });
  });
  if (c.whatWorked) nodes.push({ type: "turning", label: "Turning point", text: c.whatWorked });
  if (outcomeText) nodes.push({ type: "outcome", label: "Outcome", text: outcomeText });

  const [active, setActive] = useState(0);
  const scrollRef = useRef(null);
  const nodeRefs = useRef([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateHints = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateHints();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateHints, { passive: true });
    window.addEventListener("resize", updateHints);
    return () => {
      el.removeEventListener("scroll", updateHints);
      window.removeEventListener("resize", updateHints);
    };
  }, [nodes.length]);

  // Keep the active node centered — matters most on mobile snap-scroll.
  useEffect(() => {
    nodeRefs.current[active]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  if (nodes.length < 2) return null;

  const journeyPct = Math.round((active / (nodes.length - 1)) * 100);

  return (
    <div className="px-4 sm:px-6 pt-5 pb-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--c-sidebarBorder)", background: "var(--c-sidebar)" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-accentText)", fontFamily: "Inter, sans-serif" }}>
            The journey
          </p>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: journeyPct === 100 ? "#3DBE82" : "var(--c-accentText)", background: journeyPct === 100 ? "rgba(61,190,130,0.12)" : "rgba(117,103,201,0.12)" }}>
            {journeyPct === 100 ? "🏆 100%" : `${journeyPct}%`}
          </span>
        </div>
        {canScrollRight && (
          <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--c-textMuted)", fontFamily: "Inter, sans-serif" }}>
            Swipe <ChevronRight size={11} />
          </span>
        )}
      </div>

      {/* Timeline row — pt-3 gives the active node's glow/lift room, so it isn't clipped */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex items-start overflow-x-auto hide-scrollbar pt-3 pb-2"
          style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x proximity" }}
        >
          {nodes.map((n, i) => {
            const Icon = nodeIconFor(n.type, n.label);
            const isCompleted = i < active;
            const isActive = i === active;
            // Connector halves: left half belongs to segment (i-1→i), right to (i→i+1).
            const leftFilled = i > 0 && i <= active;
            const rightFilled = i < nodes.length - 1 && i < active;
            return (
              <motion.button
                key={i}
                ref={(el) => { nodeRefs.current[i] = el; }}
                onClick={() => setActive(i)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                style={{ width: 152, background: "transparent", border: "none", padding: 0, scrollSnapAlign: "center" }}
              >
                <div className="flex items-center w-full">
                  <div style={{ flex: i === 0 ? "0 0 0" : 1, height: 2, background: "var(--c-sidebarBorder)", position: "relative", overflow: "hidden" }}>
                    <div
                      style={{ position: "absolute", inset: 0, transformOrigin: "left", transform: `scaleX(${leftFilled ? 1 : 0})`, transition: "transform 0.3s ease-out", background: "linear-gradient(90deg,#7567C9,#5a52a8)" }}
                    />
                  </div>
                  <motion.div
                    animate={{
                      scale: isActive ? 1.08 : 1,
                      boxShadow: isActive ? "0 0 0 5px rgba(117,103,201,0.18), 0 4px 14px rgba(117,103,201,0.35)" : "0 0 0 0px rgba(117,103,201,0)",
                    }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: isCompleted ? "linear-gradient(135deg,#7567C9,#5a52a8)" : "var(--c-card)",
                      border: isCompleted ? "2px solid transparent" : `2px solid ${isActive ? "#7567C9" : "var(--c-sidebarBorder)"}`,
                    }}
                  >
                    <Icon size={16} style={{ color: isCompleted ? "#fff" : isActive ? "var(--c-accentText)" : "var(--c-textMuted)" }} />
                  </motion.div>
                  <div style={{ flex: i === nodes.length - 1 ? "0 0 0" : 1, height: 2, background: "var(--c-sidebarBorder)", position: "relative", overflow: "hidden" }}>
                    <div
                      style={{ position: "absolute", inset: 0, transformOrigin: "left", transform: `scaleX(${rightFilled ? 1 : 0})`, transition: "transform 0.3s ease-out", background: "linear-gradient(90deg,#7567C9,#5a52a8)" }}
                    />
                  </div>
                </div>
                <p
                  className="text-[11px] font-bold text-center mt-2 px-1"
                  style={{ color: isActive || isCompleted ? "var(--c-text)" : "var(--c-textMuted)", fontFamily: "Inter, sans-serif" }}
                >
                  {n.label}
                </p>
                <p
                  className="text-[11px] text-center mt-1 px-1.5 leading-snug"
                  style={{
                    color: "var(--c-textMuted)",
                    fontFamily: "Inter, sans-serif",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {truncateNodeText(n.text)}
                </p>
              </motion.button>
            );
          })}
        </div>
        {canScrollLeft && (
          <div
            className="pointer-events-none absolute left-0 top-0 flex items-center justify-start"
            style={{ bottom: 8, width: 32, background: "linear-gradient(90deg, var(--c-sidebar), rgba(0,0,0,0))" }}
          >
            <ChevronLeft size={16} style={{ color: "var(--c-accentText)" }} />
          </div>
        )}
        {canScrollRight && (
          <div
            className="pointer-events-none absolute right-0 top-0 flex items-center justify-end"
            style={{ bottom: 8, width: 32, background: "linear-gradient(270deg, var(--c-sidebar), rgba(0,0,0,0))" }}
          >
            <ChevronRight size={16} style={{ color: "var(--c-accentText)" }} />
          </div>
        )}
      </div>

    </div>
  );
}

// ── Instant verified answer, built from a real mentor's experience ──
function InstantAnswerCard({ card, onBook, onProfile }) {
  const c = card?.content || {};
  const mentor = card?.mentor || {};
  const mentorName = mentor.username || mentor.name || "Atyant Mentor";
  const edu = mentor.education || {};
  const steps = Array.isArray(c.actionableSteps) ? c.actionableSteps : [];
  const mistakes = Array.isArray(c.keyMistakes) ? c.keyMistakes : [];

  return (
    <div className="flex flex-col h-full">
      {/* Instant Answer banner */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--c-sidebarBorder)", background: "rgba(117,103,201,0.06)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={13} style={{ color: "var(--c-accentText)", flexShrink: 0 }} />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate"
            style={{ color: "var(--c-accentText)", fontFamily: "Inter, sans-serif" }}>
            Instant Clarity · from {mentorName}'s journey
          </span>
        </div>
        {card?.matchScore ? (
          <span className="text-xs font-bold" style={{ color: "#7567C9", fontFamily: "Fraunces, serif" }}>
            {card.matchScore}% match
          </span>
        ) : null}
      </div>

      {/* Answer body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        {/* Mentor identity line */}
        <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: "var(--c-textMuted)", fontFamily: "Inter, sans-serif" }}>
          <CheckCircle size={12} style={{ color: "#3DBE82" }} />
          <span>
            {mentorName}
            {edu.institutionName ? ` · ${edu.institutionName}` : ""}
            {edu.field ? ` · ${edu.field}` : ""}
          </span>
        </div>

        {c.mainAnswer && (
          <p className="text-base font-semibold leading-snug mb-5"
            style={{ color: "var(--c-text)", fontFamily: "Fraunces, serif" }}>
            {c.mainAnswer}
          </p>
        )}

        <AnswerSection label="The situation">{c.situation}</AnswerSection>
        <AnswerSection label="What worked">{c.whatWorked}</AnswerSection>

        {steps.length > 0 && (
          <AnswerSection label="Action plan">
            <ol className="flex flex-col gap-2 mt-1">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(117,103,201,0.22)", color: "var(--c-accentText)" }}>
                    {i + 1}
                  </span>
                  <span>
                    {s.step && <strong style={{ color: "var(--c-text)" }}>{s.step}: </strong>}
                    {s.description}
                  </span>
                </li>
              ))}
            </ol>
          </AnswerSection>
        )}

        {mistakes.length > 0 && (
          <AnswerSection label="Mistakes to avoid">
            <ul className="flex flex-col gap-1.5 mt-1">
              {mistakes.map((m, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: "#f87171" }}>✕</span>
                  <span>{typeof m === "string" ? m : m?.description || m?.mistake}</span>
                </li>
              ))}
            </ul>
          </AnswerSection>
        )}

        <AnswerSection label="Timeline">{c.timeline}</AnswerSection>
        <AnswerSection label="If I did it today">{c.differentApproach}</AnswerSection>

        {/* Primary step: go straight to the full Book a Session page for this senior */}
        {onBook && (
          <button
            onClick={onBook}
            className="mt-2 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-base font-semibold"
            style={{ background: "linear-gradient(135deg,#7567C9,#5a52a8)", color: "#fff", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 20px rgba(117,103,201,0.4)" }}
          >
            <Video size={16} /> Book 1:1 session — starting ₹{STARTING_PRICE}
          </button>
        )}
        {/* Secondary: read this senior's full profile first */}
        {onProfile && (
          <button
            onClick={onProfile}
            className="mt-2 ml-0 sm:ml-3 text-sm font-semibold"
            style={{ background: "transparent", border: "none", color: "var(--c-accentText)", fontFamily: "Inter, sans-serif", cursor: "pointer", padding: "6px 0" }}
          >
            View {mentorName}'s profile
          </button>
        )}
      </div>
    </div>
  );
}
