import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle, Loader2, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck, ArrowBigUp, MessageCircle, Share2, Pencil } from "lucide-react";
import SeniorsPanel from "./SeniorsPanel";
import SeniorDetail from "./SeniorDetail";
import useIsMobile from "../../hooks/useIsMobile";
import { clarityAPI, profileAPI, eventsAPI } from "../../api";

// Fire-and-forget - never throws, never blocks UI
const trackView = (mentor) => {
  const id = mentor?._id || mentor?.id;
  if (id) profileAPI.trackView(id).catch(() => { });
  if (id) eventsAPI.track("mentor_profile_opened", { mentorId: String(id) });
};

// The chat hands over its internal problem statement ("Student: … / Goal: … /
// Confidence: Low (2/5 layers extracted)") as the query. It's the right search
// text but not something to show a student - turn it into a plain heading.
const displayHeading = (query) => {
  const q = String(query || "");
  if (!/^(Student|Goal|Confidence):/m.test(q)) return q;
  const pick = (label) => (q.match(new RegExp(`^${label}:\\s*(.+)$`, "m")) || [])[1]?.trim();
  const goal = pick("Goal");
  if (!goal) return "Seniors who match your profile";
  const companies = pick("Target companies");
  const heading = goal.charAt(0).toUpperCase() + goal.slice(1);
  return companies ? `${heading} · aiming for ${companies}` : heading;
};

// Cheapest tier price, shown on the answer-card CTA. Real per-mentor prices load
// from the service catalog on the full Book a Session page.
const STARTING_PRICE = 49;
const ASK_PREFILL_KEY = "atyant_ask_prefill"; // read by AskAtyantPage's composer

// Example question shown when the student hasn't asked one. It models a good
// question - year, branch, college, role, company are what the matcher uses -
// and borrows the student's own profile values where we know them.
const ORDINAL = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th" };
const buildExample = (user, ctx) => {
  const edu = user?.education?.[0] || {};
  const y = String(ctx?.year || edu.year || "").match(/^\s*([1-5])\b/);
  const parts = [
    { text: "I'm a " },
    { text: `${y ? ORDINAL[y[1]] : "2nd"}-year`, tag: "Your year" },
    { text: " " },
    { text: ctx?.branch || edu.field || "CSE", tag: "Your branch" },
    { text: " student at " },
    { text: ctx?.college || edu.institutionName || edu.institution || "VNIT Nagpur", tag: "Your college" },
    { text: " with no internships. How do I land an " },
    { text: "SDE internship", tag: "Target role" },
    { text: " at " },
    { text: "Amazon", tag: "Target company" },
    { text: "?" },
  ];
  return { parts, query: parts.map((p) => p.text).join("") };
};

export default function ClarityView({ initialQuery = "", initialContext = null, user, onTalkToMentor, onOpenChat, onAskQuestion }) {
  const isMobile = useIsMobile();
  // No question handed over → we're showing a built-in example, and must say so.
  const isExample = !(initialQuery && initialQuery.trim().length > 2);
  const { parts: exampleParts, query: exampleQuery } = buildExample(user, initialContext);
  const [mentors, setMentors] = useState([]);
  const [answerCards, setAnswerCards] = useState([]);   // scrollable feed
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeIdx, setActiveIdx] = useState(0);              // which senior's answer is on screen
  const [helpful, setHelpful] = useState({ counts: {}, voted: [] });
  const mainScrollRef = useRef(null);

  // Fetch on mount / when query changes
  useEffect(() => {
    const q =
      initialQuery && initialQuery.trim().length > 2
        ? initialQuery.trim()
        : exampleQuery;
    setActiveQuery(q);
    setSelectedMentor(null);
    eventsAPI.track("clarity_opened", {
      fromChat: !!initialContext?.mentorIds?.length,
      fromMentorCard: !!initialContext?.focusMentorId,
    });
    fetchMentors(q, true); // first load: keep the chat's seniors on top
  }, [initialQuery]);

  // Always land at the top of the answer feed / detail view - never mid-scroll
  // from whatever was scrolled before (new query, new card, back to answers).
  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  }, [answerCards, selectedMentor, fetchLoading, activeIdx]);

  // Live "Helpful" counts - fetched separately because /match is cached server-side.
  useEffect(() => {
    const ids = answerCards.map((c) => c.id).filter(Boolean).map(String);
    if (!ids.length) return;
    clarityAPI.helpfulCounts(ids)
      .then((d) => setHelpful({ counts: d.counts || {}, voted: d.voted || [] }))
      .catch(() => { });
  }, [answerCards]);

  const handleHelpful = async (cardId) => {
    const id = String(cardId || "");
    if (!id) return;
    const wasVoted = helpful.voted.includes(id);
    // Optimistic toggle, reconciled with the server's real count.
    setHelpful((h) => ({
      counts: { ...h.counts, [id]: Math.max(0, (h.counts[id] || 0) + (wasVoted ? -1 : 1)) },
      voted: wasVoted ? h.voted.filter((v) => v !== id) : [...h.voted, id],
    }));
    if (!wasVoted) eventsAPI.track("answer_marked_helpful", { cardId: id });
    try {
      const d = await clarityAPI.toggleHelpful(id);
      setHelpful((h) => ({
        counts: { ...h.counts, [id]: d.count },
        voted: d.voted ? [...new Set([...h.voted, id])] : h.voted.filter((v) => v !== id),
      }));
    } catch {
      setHelpful((h) => ({
        counts: { ...h.counts, [id]: Math.max(0, (h.counts[id] || 0) + (wasVoted ? 1 : -1)) },
        voted: wasVoted ? [...h.voted, id] : h.voted.filter((v) => v !== id),
      }));
    }
  };

  const fetchMentors = async (query, pinChatMentors = false) => {
    setFetchLoading(true);
    setFetchError("");
    try {
      const edu = user?.education?.[0] || {};
      // Send only what we actually know. No fake defaults - an unknown college must
      // stay empty so the engine matches on the query, not on a wrong college.
      const data = await clarityAPI.match({
        query,
        college: initialContext?.college || edu.institutionName || edu.institution || "",
        branch: initialContext?.branch || edu.field || "",
        year: initialContext?.year || edu.year || "",
        goal: initialContext?.goal || user?.interests?.[0] || "",
        cgpa: initialContext?.cgpa || edu.cgpa || "",
        mentorIds: pinChatMentors ? (initialContext?.mentorIds || []) : [],
      });
      setMentors(data.mentors || []);
      // Answer-card feed (fallback to the single best card for older responses)
      const cards = (data.answerCards && data.answerCards.length)
        ? data.answerCards
        : (data.answerCard ? [data.answerCard] : []);
      setAnswerCards(cards);
      setActiveIdx(0);
      // Came from tapping a senior's card in the chat → open that senior straight away.
      if (pinChatMentors && initialContext?.focusMentorId) {
        const focused = (data.mentors || []).find(m => String(m.id) === String(initialContext.focusMentorId));
        if (focused) { trackView(focused); setSelectedMentor(focused); }
      }
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
  // Show only what we actually know - no fabricated college/branch/CGPA.
  const goalText = initialContext?.goal || user?.interests?.[0] || null;
  const contextLine = [
    initialContext?.college || edu.institutionName || edu.institution || null,
    initialContext?.branch || edu.field || null,
    (() => { const y = initialContext?.year || edu.year; return y ? (/^\d+$/.test(String(y)) ? `Year ${y}` : y) : null; })(),
    (() => { const v = initialContext?.cgpa || edu.cgpa; return v && parseFloat(v) > 0 ? `CGPA ${v}` : null; })(),
    goalText ? `Goal: ${goalText}` : null,
  ]
    .filter(Boolean)
    .join(" · ") || "Based on your question";
  const userCtx = {
    college: initialContext?.college || edu.institutionName || edu.institution || "",
    branch: initialContext?.branch || edu.field || "",
  };

  // Shared question header (compact on mobile)
  const askOwn = () => {
    eventsAPI.track("clarity_ask_own_clicked", { isExample });
    // Example → hand the sentence to the Ask composer so the student only swaps
    // in their own college / company instead of starting from a blank box.
    if (isExample) { try { sessionStorage.setItem(ASK_PREFILL_KEY, exampleQuery); } catch { /* ignore */ } }
    onAskQuestion?.();
  };
  const header = isExample ? (
    // Example mode: the question is drawn as a tappable input, with the parts a
    // good question needs highlighted - it shows *where* to ask and *how*.
    <div className="px-4 sm:px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--c-sidebarBorder)", fontFamily: "var(--font-body)" }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--c-textMuted)", margin: "0 0 8px" }}>
        EXAMPLE QUESTION · SEE HOW SENIORS ANSWER
      </p>
      <button
        onClick={askOwn}
        className="ask-example w-full text-left flex items-start gap-3"
        style={{ padding: "12px 14px", borderRadius: 14, background: "var(--c-card)", border: "1.5px solid var(--c-cardBorder)", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s" }}
      >
        <Pencil size={16} style={{ color: "var(--c-accentText)", flexShrink: 0, marginTop: 3 }} />
        <span className="flex-1 min-w-0" style={{ fontSize: 15, lineHeight: 1.65, color: "var(--c-text)", fontFamily: "var(--font-display)" }}>
          {exampleParts.map((part, k) =>
            part.tag ? (
              <span
                key={k}
                title={part.tag}
                style={{ background: "rgba(117,103,201,0.12)", color: "var(--c-accentText)", borderRadius: 6, padding: "1px 5px", fontWeight: 600, whiteSpace: "nowrap" }}
              >
                {part.text}
              </span>
            ) : (
              <span key={k}>{part.text}</span>
            )
          )}
        </span>
        <span className="hidden sm:flex items-center gap-1 flex-shrink-0" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-accentText)", marginTop: 3, whiteSpace: "nowrap" }}>
          Ask yours <ChevronRight size={14} />
        </span>
      </button>
      <p style={{ fontSize: 12, color: "var(--c-textMuted)", margin: "8px 2px 0", lineHeight: 1.5 }}>
        Mention your <b style={{ color: "var(--c-textSub)" }}>year, branch, college, target role &amp; company</b>. Seniors are matched on exactly these.
        <button onClick={askOwn} className="sm:hidden" style={{ marginLeft: 6, fontWeight: 600, color: "var(--c-accentText)", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12 }}>
          Ask yours →
        </button>
      </p>
      <style>{`.ask-example:hover { border-color: #7567C9 !important; box-shadow: 0 0 0 3px rgba(117,103,201,0.12); }`}</style>
    </div>
  ) : (
    <div
      className="px-4 sm:px-6 pt-5 pb-4 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--c-sidebarBorder)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "#7567C9" }}
        >
          <span className="text-xs font-bold" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>A</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug" style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}>
            {displayHeading(activeQuery)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--c-textMuted)", fontFamily: "var(--font-body)" }}>
            Context: {contextLine}
          </p>
        </div>
        {onAskQuestion && (
          <button
            onClick={askOwn}
            className="flex items-center gap-1 flex-shrink-0"
            style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-accentText)", background: "none", border: "none", padding: "4px 0", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--font-body)" }}
          >
            <Pencil size={13} /> New question
          </button>
        )}
      </div>
    </div>
  );

  // One senior's answer at a time - swipe / arrows to the next senior.
  const answerFeed = answerCards.length > 0 ? (
    <AnswerSlider
      cards={answerCards}
      index={activeIdx}
      onIndex={setActiveIdx}
      question={displayHeading(activeQuery)}
      helpful={helpful}
      onHelpful={handleHelpful}
      resolveMentor={resolveMentor}
      userCtx={userCtx}
      onProfile={(m) => { trackView(m); setSelectedMentor(m); }}
      onBook={(m) => onTalkToMentor?.(m)}
    />
  ) : null;

  // ── MOBILE: single column, one view at a time ──
  if (isMobile) {
    return (
      <div className="flex flex-col w-full" style={{ background: "var(--c-bg)", fontFamily: "var(--font-body)", height: "100%", minHeight: 0 }}>
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
            <div ref={mainScrollRef} className="h-full overflow-y-auto hide-scrollbar">
              {answerFeed ? answerFeed : mentors.length > 0 ? (
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
      style={{ background: "var(--c-bg)", fontFamily: "var(--font-body)", minHeight: 0, flexDirection: "row" }}
    >
      {/* ── Left: Main content ── */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ borderRight: "1px solid var(--c-sidebarBorder)", minHeight: 0 }}
      >
        {header}

        {/* Main area */}
        <div ref={mainScrollRef} className="flex-1 overflow-y-auto">
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
                <p className="text-xs" style={{ fontFamily: "var(--font-body)" }}>
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
                <p className="text-xs" style={{ color: "#f87171", fontFamily: "var(--font-body)" }}>
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
                  <span className="text-xs font-bold tracking-wide" style={{ color: "var(--c-accentText)", fontFamily: "var(--font-body)" }}>
                    ← Back to answers · Connect with {selectedMentor.name}
                  </span>
                </button>

                {/* Senior detail fills the rest - it manages its own header/scroll/footer.
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
                <p className="text-xs" style={{ color: "var(--c-textMuted)", fontFamily: "var(--font-body)" }}>
                  {mentors.length > 0
                    ? "No written answers for this question yet. Pick a matched senior on the right to see their journey or talk to them."
                    : "No matching seniors found. Try a different question below."}
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
            <p className="text-xs" style={{ fontFamily: "var(--font-body)" }}>
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
            <p className="text-xs" style={{ fontFamily: "var(--font-body)" }}>
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
        style={{ color: "var(--c-accentText)", fontFamily: "var(--font-body)" }}>
        {label}
      </p>
      <div className="text-sm leading-relaxed" style={{ color: "var(--c-textSub)", fontFamily: "var(--font-body)" }}>
        {children}
      </div>
    </div>
  );
}

const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "This senior";
const norm = (s) => String(s || "").toLowerCase().trim();
const mistakeText = (m) => (typeof m === "string" ? m : m?.description || m?.mistake || "");
// Sentences of a paragraph - fallback checklist when a card has no actionableSteps.
const sentencesOf = (text) =>
  String(text || "").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 8);

const rankLabelOf = (i) => (i === 0 ? "Best match" : `#${i + 1} match`);

// ── Answer slider: one senior's answer at a time ──
// Swipe (mobile) or arrows / ← → keys (desktop) move between seniors. Each answer
// stays a normal vertical read - only *between* seniors is horizontal.
function AnswerSlider({ cards, index, onIndex, question, helpful, onHelpful, resolveMentor, userCtx, onProfile, onBook }) {
  const [dir, setDir] = useState(1);
  const count = cards.length;
  const i = Math.min(index, count - 1);
  const go = (next) => {
    if (next < 0 || next >= count || next === i) return;
    setDir(next > i ? 1 : -1);
    onIndex(next);
    eventsAPI.track("answer_slide", { to: next });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (/input|textarea/i.test(e.target?.tagName || "") || e.target?.isContentEditable) return;
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const card = cards[i];
  const mentor = resolveMentor(card.mentor);
  const nextMentor = i < count - 1 ? resolveMentor(cards[i + 1].mentor) : null;
  const id = String(card.id || "");

  const arrow = (disabled, onClick, Icon, label) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex items-center justify-center"
      style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--c-cardBorder)", background: "var(--c-card)", color: disabled ? "var(--c-textMuted)" : "var(--c-accentText)", opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer" }}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="px-3 sm:px-6 py-4" style={{ fontFamily: "var(--font-body)" }}>
      {/* Pager: which senior, how many */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)" }}>
            {count} senior{count > 1 ? "s" : ""} answered this
          </span>
          <span style={{ fontSize: 12, color: "var(--c-textMuted)" }}>· {i + 1} / {count}</span>
        </div>
        {count > 1 && (
          <div className="flex items-center gap-2">
            {arrow(i === 0, () => go(i - 1), ChevronLeft, "Previous senior")}
            {arrow(i === count - 1, () => go(i + 1), ChevronRight, "Next senior")}
          </div>
        )}
      </div>

      <div style={{ position: "relative", overflowX: "clip" }}>
          <motion.div
            key={id || i}
            initial={{ x: dir * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            dragDirectionLock
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 || info.velocity.x < -400) go(i + 1);
              else if (info.offset.x > 70 || info.velocity.x > 400) go(i - 1);
            }}
            style={{ touchAction: "pan-y" }}
          >
            <AnswerPost
              card={card}
              profile={mentor}
              rankLabel={count > 1 ? rankLabelOf(i) : null}
              question={question}
              userCtx={userCtx}
              helpfulCount={helpful.counts[id] || 0}
              voted={helpful.voted.includes(id)}
              onHelpful={() => onHelpful(id)}
              onProfile={() => onProfile(mentor)}
              onBook={() => onBook(mentor)}
            />
          </motion.div>
      </div>

      {/* Dots + a nudge toward the next senior */}
      {count > 1 && (
        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="flex items-center gap-1.5">
            {cards.map((c, d) => (
              <button
                key={c.id || d}
                onClick={() => go(d)}
                aria-label={`Answer ${d + 1}`}
                style={{ width: d === i ? 18 : 7, height: 7, borderRadius: 99, border: "none", padding: 0, cursor: "pointer", background: d === i ? "#7567C9" : "var(--c-sidebarBorder)", transition: "width 0.2s" }}
              />
            ))}
          </div>
          {nextMentor && (
            <button
              onClick={() => go(i + 1)}
              className="flex items-center gap-1.5"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--c-accentText)", background: "none", border: "none", cursor: "pointer" }}
            >
              See how {firstName(nextMentor.name)} did it <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── One senior's answer, styled like a top community reply ──
// First person, TL;DR first, then a short "what I did" list. Long-form story is
// collapsed. The action bar mirrors a forum reply: Helpful · Ask follow-up · Share.
function AnswerPost({ card, profile, rankLabel, question, userCtx = {}, helpfulCount, voted, onHelpful, onProfile, onBook }) {
  const c = card?.content || {};
  const raw = card?.mentor || {};
  const p = profile || {};
  const name = p.name || raw.username || raw.name || "Atyant Mentor";
  const first = firstName(name);
  const college = p.college || raw.education?.institutionName || raw.education?.institution || "";
  const branch = p.branch || raw.education?.field || "";
  const initials = p.initials || name.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2);

  const outcome =
    (/@/.test(p.outcome || "") && p.outcome) ||
    (raw.topCompanies?.[0] && `${raw.expertise?.[0] || "Placed"} @ ${raw.topCompanies[0]}`) ||
    (c.mainAnswer?.includes("→") ? c.mainAnswer.split("→").pop().trim() : "");
  const flair = [outcome, [college, branch].filter(Boolean).join(", ")].filter(Boolean).join(" · ");

  const rawSteps = Array.isArray(c.actionableSteps) ? c.actionableSteps : [];
  // A "before → after" mainAnswer is a summary of the journey, not an answer - prefer
  // the first line of what actually worked as the TL;DR in that case.
  const tldr = c.mainAnswer && !c.mainAnswer.includes("→")
    ? c.mainAnswer
    : sentencesOf(c.whatWorked)[0] || c.mainAnswer || "";
  const allSteps = rawSteps.length
    ? rawSteps.map((s) => ({ title: s.step || s.description || "", detail: s.step ? s.description || "" : "" }))
    : sentencesOf(c.whatWorked).filter((t) => t !== tldr).map((t) => ({ title: t, detail: "" }));
  const steps = allSteps.slice(0, 3);
  const mistakes = (Array.isArray(c.keyMistakes) ? c.keyMistakes : []).map(mistakeText).filter(Boolean);

  // Why this senior was matched - the engine's honest label first.
  let matchLabel = card?.matchLabel && card.matchLabel !== "Closest match" ? card.matchLabel : "";
  if (!matchLabel) {
    const sameCollege = userCtx.college && college && norm(userCtx.college) === norm(college);
    const sameBranch = userCtx.branch && branch && norm(userCtx.branch) === norm(branch);
    matchLabel = sameCollege && sameBranch ? "Same college & branch" : sameBranch ? "Same branch" : sameCollege ? "Same college" : "";
  }

  const storeKey = `atyant_playbook_${card?.id || name}`;
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storeKey)) || []; } catch { return []; }
  });
  const [openStep, setOpenStep] = useState(null);
  const [showStory, setShowStory] = useState(false);
  const [shareNote, setShareNote] = useState("");

  const toggleDone = (i) => {
    setDone((prev) => {
      const next = prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i];
      try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* storage unavailable */ }
      if (!prev.includes(i)) eventsAPI.track("playbook_step_checked", { cardId: String(card?.id || ""), step: i });
      return next;
    });
  };
  const toggleStory = () => {
    if (!showStory) eventsAPI.track("playbook_story_opened", { cardId: String(card?.id || "") });
    setShowStory((v) => !v);
  };
  const share = async () => {
    const lines = [question && `Q: ${question}`, `${name}${outcome ? ` (${outcome})` : ""}:`, tldr && `"${tldr}"`, ...steps.map((s, k) => `${k + 1}. ${s.title}`)];
    const text = `${lines.filter(Boolean).join("\n")}\n\nAsk seniors from colleges like yours on Atyant:`;
    const url = window.location.origin;
    eventsAPI.track("answer_shared", { cardId: String(card?.id || "") });
    try {
      if (navigator.share) { await navigator.share({ title: "Answer on Atyant", text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareNote("Copied!");
    } catch {
      setShareNote("");
      return;
    }
    setTimeout(() => setShareNote(""), 1800);
  };

  const doneCount = steps.filter((_, i) => done.includes(i)).length;
  const sectionLabel = (text) => (
    <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--c-textMuted)", margin: 0 }}>{text}</p>
  );
  const barBtn = { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, borderRadius: 999, padding: "7px 12px", cursor: "pointer", border: "1px solid var(--c-cardBorder)", background: "var(--c-card)", color: "var(--c-textSub)", whiteSpace: "nowrap" };

  return (
    <article style={{ borderRadius: 16, border: "1px solid var(--c-cardBorder)", background: "var(--c-card)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <div className="px-4 sm:px-5 pt-4 pb-3">
        {/* Author row - who's answering, with their "flair" */}
        <div className="flex items-start gap-3">
          <button onClick={onProfile} style={{ position: "relative", flexShrink: 0, background: "none", border: "none", padding: 0, cursor: "pointer" }} aria-label={`View ${name}'s profile`}>
            {p.profilePicture ? (
              <img src={p.profilePicture} alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: "2px solid #7567C9", padding: 1.5, background: "var(--c-card)" }} />
            ) : (
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(117,103,201,0.18)", border: "2px solid #7567C9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--c-accentText)" }}>
                {initials}
              </div>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={onProfile} style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-display)" }}>
                {name}
              </button>
              <ShieldCheck size={14} style={{ color: "#3DBE82" }} aria-label="Verified senior" />
              {rankLabel && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#7567C9", borderRadius: 999, padding: "2px 8px" }}>{rankLabel}</span>
              )}
            </div>
            {flair && <div style={{ fontSize: 12.5, color: "var(--c-textSub)", marginTop: 2, lineHeight: 1.35 }}>{flair}</div>}
            {matchLabel && (
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#3DBE82", marginTop: 3 }}>✓ {matchLabel} as you</div>
            )}
          </div>
        </div>

        {/* TL;DR - the answer in one line */}
        {tldr && (
          <p style={{ fontSize: 16, lineHeight: 1.45, color: "var(--c-text)", margin: "14px 0 0", fontWeight: 600 }}>
            <span style={{ fontWeight: 800, color: "var(--c-accentText)" }}>TL;DR </span>{tldr}
          </p>
        )}

        {/* What I did - checkable */}
        {steps.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              {sectionLabel("What I did")}
              <span style={{ fontSize: 11, fontWeight: 700, color: doneCount === steps.length ? "#3DBE82" : "var(--c-textMuted)" }}>
                {doneCount === 0 ? "Tick what you've done" : doneCount === steps.length ? "All done 🎉" : `${doneCount}/${steps.length} done`}
              </span>
            </div>
            <ol className="flex flex-col gap-1.5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {steps.map((s, k) => {
                const isDone = done.includes(k);
                const isOpen = openStep === k;
                return (
                  <li key={k} style={{ borderRadius: 12, background: isDone ? "rgba(61,190,130,0.08)" : "var(--c-sidebar)" }}>
                    <div className="flex items-start gap-3" style={{ padding: "10px 12px" }}>
                      <button
                        onClick={() => toggleDone(k)}
                        aria-label={isDone ? "Mark as not done" : "Mark as done"}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0, marginTop: 1 }}
                      >
                        {isDone ? (
                          <CheckCircle size={20} style={{ color: "#3DBE82" }} />
                        ) : (
                          <span style={{ display: "flex", width: 20, height: 20, borderRadius: "50%", border: "2px solid #7567C9", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--c-accentText)" }}>{k + 1}</span>
                        )}
                      </button>
                      <button
                        onClick={() => s.detail && setOpenStep(isOpen ? null : k)}
                        className="flex-1 flex items-start justify-between gap-2 text-left"
                        style={{ background: "none", border: "none", padding: 0, cursor: s.detail ? "pointer" : "default" }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: isDone ? "var(--c-textMuted)" : "var(--c-text)", textDecoration: isDone ? "line-through" : "none" }}>
                          {s.title}
                        </span>
                        {s.detail && (
                          <ChevronDown size={16} style={{ color: "var(--c-textMuted)", flexShrink: 0, marginTop: 2, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                        )}
                      </button>
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
                          <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--c-textSub)", margin: 0, padding: "0 12px 11px 44px" }}>{s.detail}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* My mistake */}
        {mistakes[0] && (
          <div className="mt-3 flex items-start gap-2.5" style={{ padding: "9px 12px", borderRadius: 12, background: "rgba(248,113,113,0.08)" }}>
            <AlertTriangle size={15} style={{ color: "#f87171", flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, lineHeight: 1.45, color: "var(--c-textSub)", margin: 0 }}>
              <strong style={{ color: "var(--c-text)" }}>My mistake: </strong>{mistakes[0]}
            </p>
          </div>
        )}

        {/* Full story - only for those who want it */}
        <button
          onClick={toggleStory}
          className="mt-3 flex items-center gap-1"
          style={{ fontSize: 13, fontWeight: 600, color: "var(--c-accentText)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          {showStory ? "Hide full story" : "Read my full story"}
          <ChevronDown size={14} style={{ transform: showStory ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        <AnimatePresence initial={false}>
          {showStory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <div className="mt-3 pl-4" style={{ borderLeft: "2px solid var(--c-sidebarBorder)" }}>
                {c.mainAnswer && c.mainAnswer !== tldr && <AnswerSection label="In short">{c.mainAnswer}</AnswerSection>}
                <AnswerSection label="Where I started">{c.situation}</AnswerSection>
                <AnswerSection label="What worked">{rawSteps.length ? c.whatWorked : null}</AnswerSection>
                {allSteps.length > steps.length && (
                  <AnswerSection label="More of what I did">
                    <ul className="flex flex-col gap-1.5">
                      {allSteps.slice(steps.length).map((s, k) => (
                        <li key={k}><strong style={{ color: "var(--c-text)" }}>{s.title}</strong>{s.detail ? ` - ${s.detail}` : ""}</li>
                      ))}
                    </ul>
                  </AnswerSection>
                )}
                {mistakes.length > 1 && (
                  <AnswerSection label="Other mistakes">
                    <ul className="flex flex-col gap-1.5">
                      {mistakes.slice(1).map((m, k) => (
                        <li key={k} className="flex gap-2"><span style={{ color: "#f87171" }}>✕</span><span>{m}</span></li>
                      ))}
                    </ul>
                  </AnswerSection>
                )}
                <AnswerSection label="How long it took">{c.timeline}</AnswerSection>
                <AnswerSection label="If I did it today">{c.differentApproach}</AnswerSection>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action bar - Helpful · Ask follow-up · Share. Sticky, so it's always on
          screen while the answer is, no matter how long the answer gets. */}
      <div style={{ position: "sticky", bottom: 0, zIndex: 2, borderTop: "1px solid var(--c-sidebarBorder)", background: "var(--c-sidebar)", borderRadius: "0 0 16px 16px", boxShadow: "0 -6px 16px -10px rgba(20,16,40,0.18)" }}>
        <div className="flex items-center gap-2 px-3 sm:px-5 pt-2.5 pb-1.5">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onHelpful}
            aria-pressed={voted}
            style={{ ...barBtn, color: voted ? "#fff" : "var(--c-textSub)", background: voted ? "#7567C9" : "var(--c-card)", borderColor: voted ? "#7567C9" : "var(--c-cardBorder)" }}
          >
            <ArrowBigUp size={17} fill={voted ? "#fff" : "none"} />
            Helpful{helpfulCount > 0 ? ` · ${helpfulCount}` : ""}
          </motion.button>
          {onBook && (
            <button onClick={onBook} style={{ ...barBtn, flex: 1, minWidth: 0, justifyContent: "center", color: "#fff", background: "#7567C9", borderColor: "#7567C9" }}>
              <MessageCircle size={15} style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>Ask {first} a follow-up</span>
            </button>
          )}
          <button onClick={share} style={{ ...barBtn, padding: "7px 10px" }} aria-label="Share this answer" title="Share">
            <Share2 size={15} />{shareNote && <span>{shareNote}</span>}
          </button>
        </div>
        {onBook && (
          <p style={{ fontSize: 11, color: "var(--c-textMuted)", margin: 0, padding: "0 16px 9px", textAlign: "center" }}>
            Advice for <em>your</em> case, 1:1 with {first} · from ₹{STARTING_PRICE}
          </p>
        )}
      </div>
    </article>
  );
}
