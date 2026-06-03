import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";
import SeniorsPanel from "./SeniorsPanel";
import SeniorDetail from "./SeniorDetail";
import useIsMobile from "../../hooks/useIsMobile";
import { clarityAPI } from "../../api";

export default function ClarityView({ initialQuery = "", initialContext = null, user, onTalkToMentor }) {
  const isMobile = useIsMobile();
  const [mentors,        setMentors]        = useState([]);
  const [answerCards,    setAnswerCards]    = useState([]);   // scrollable feed
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [inputValue,     setInputValue]     = useState("");
  const [fetchLoading,   setFetchLoading]   = useState(false);
  const [fetchError,     setFetchError]     = useState("");
  const [activeQuery,    setActiveQuery]    = useState(initialQuery);

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
      const edu  = user?.education?.[0] || {};
      // Send only what we actually know. No fake defaults — an unknown college must
      // stay empty so the engine matches on the query, not on a wrong college.
      const data = await clarityAPI.match({
        query,
        college: initialContext?.college || edu.institutionName || edu.institution || "",
        branch:  initialContext?.branch  || edu.field           || "",
        year:    initialContext?.year    || edu.year            || "",
        goal:    initialContext?.goal    || user?.interests?.[0]|| "",
        cgpa:    initialContext?.cgpa    || edu.cgpa            || "",
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
      rating: cm.rating ? `${cm.rating}★` : "4.8★",
      studentsHelped: String(cm.successfulMatches || 0),
      timeline: "Active",
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
    initialContext?.branch  || edu.field || null,
    initialContext?.year    || edu.year  || null,
    initialContext?.cgpa    ? `CGPA ${initialContext.cgpa}` : (edu.cgpa ? `CGPA ${edu.cgpa}` : null),
    goalText ? `Goal: ${goalText}` : null,
  ]
    .filter(Boolean)
    .join(" · ") || "Based on your question";

  // Shared question header (compact on mobile)
  const header = (
    <div
      className="px-4 sm:px-6 pt-5 pb-4 flex-shrink-0"
      style={{ borderBottom: "1px solid #211F2B" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg,#7567C9,#5a52a8)" }}
        >
          <span className="text-xs font-bold" style={{ color: "#ECEAF3", fontFamily: "Fraunces, serif" }}>A</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug" style={{ color: "#ECEAF3", fontFamily: "Fraunces, serif" }}>
            {activeQuery}
          </p>
          <p className="text-xs mt-1" style={{ color: "#5F576F", fontFamily: "Inter, sans-serif" }}>
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
        <div key={card.id || i} style={{ borderTop: i > 0 ? "8px solid #0D0C12" : "none" }}>
          <InstantAnswerCard card={card} onTalk={() => setSelectedMentor(resolveMentor(card.mentor))} />
        </div>
      ))}
    </div>
  ) : null;

  // ── MOBILE: single column, one view at a time ──
  if (isMobile) {
    return (
      <div className="flex flex-col w-full" style={{ background: "#13121A", fontFamily: "Inter, sans-serif", height: "100%", minHeight: 0 }}>
        {header}
        <div className="flex-1" style={{ minHeight: 0 }}>
          {fetchLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: "#5F576F" }}>
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
                style={{ color: "#8E80DB", borderBottom: "1px solid #211F2B", background: "rgba(117,103,201,0.06)" }}
              >
                ← Back to matched seniors
              </button>
              <div className="flex-1" style={{ minHeight: 0 }}>
                <SeniorDetail
                  mentor={selectedMentor}
                  user={user}
                  onClose={() => setSelectedMentor(null)}
                  onTalkToMentor={onTalkToMentor}
                />
              </div>
            </div>
          ) : (
            // Mobile: interleaved — mentor profile then their answer card, one pair at a time
            <div className="h-full overflow-y-auto hide-scrollbar">
              {answerCards.length > 0 ? (
                answerCards.map((card, i) => {
                  const mentor = resolveMentor(card.mentor);
                  return (
                    <div key={card.id || i} style={{ borderTop: i > 0 ? "8px solid #0D0C12" : "none" }}>
                      {/* Mentor profile pill — tappable to open detail */}
                      {mentor && (
                        <button
                          onClick={() => setSelectedMentor(mentor)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                          style={{ background: "#0D0C12", borderBottom: "1px solid #211F2B" }}
                        >
                          {mentor.profilePicture ? (
                            <img src={mentor.profilePicture} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(117,103,201,0.18)", border: "1.5px solid rgba(117,103,201,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#8E80DB", flexShrink: 0 }}>
                              {mentor.initials}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#ECEAF3", fontFamily: "Fraunces, serif" }}>{mentor.name}</div>
                            <div style={{ fontSize: 11, color: "#5F576F", fontFamily: "Inter, sans-serif", marginTop: 1 }}>
                              {[mentor.college, mentor.branch].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                          {mentor.matchPct > 0 && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#7567C9", fontFamily: "Fraunces, serif", flexShrink: 0 }}>{mentor.matchPct}%</span>
                          )}
                          <span style={{ fontSize: 10, color: "#443A6B", marginLeft: 4 }}>→</span>
                        </button>
                      )}
                      {/* Answer card */}
                      <InstantAnswerCard card={card} onTalk={() => setSelectedMentor(mentor)} />
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
                <p className="text-xs text-center px-6 py-16" style={{ color: "#5F576F" }}>
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
      style={{ background: "#13121A", fontFamily: "Inter, sans-serif", minHeight: 0, flexDirection: "row" }}
    >
      {/* ── Left: Main content ── */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ borderRight: "1px solid #211F2B", minHeight: 0 }}
      >
        {header}

        {/* Main area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {fetchLoading ? (
              <motion.div
                key="loading"
                className="flex flex-col items-center justify-center h-full gap-3"
                style={{ color: "#5F576F" }}
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
                  style={{ borderBottom: "1px solid #211F2B", background: "rgba(117,103,201,0.06)" }}
                >
                  <span className="text-xs font-bold tracking-wide" style={{ color: "#8E80DB", fontFamily: "Inter, sans-serif" }}>
                    ← Back to answers · Connect with {selectedMentor.name}
                  </span>
                </button>

                {/* Senior detail fills the rest — scrollable */}
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                  <SeniorDetail
                    mentor={selectedMentor}
                    user={user}
                    onClose={() => setSelectedMentor(null)}
                    onTalkToMentor={onTalkToMentor}
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
                <p className="text-xs" style={{ color: "#5F576F", fontFamily: "Inter, sans-serif" }}>
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
          borderTop: isMobile ? "1px solid #211F2B" : "none",
          background: "#0D0C12",
        }}
      >
        {fetchLoading ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3"
            style={{ color: "#5F576F" }}
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
            onSelect={(mentor) => setSelectedMentor(mentor)}
          />
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center"
            style={{ color: "#5F576F" }}
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
        style={{ color: "#8E80DB", fontFamily: "Inter, sans-serif" }}>
        {label}
      </p>
      <div className="text-sm leading-relaxed" style={{ color: "#C9C4D6", fontFamily: "Inter, sans-serif" }}>
        {children}
      </div>
    </div>
  );
}

// ── Instant verified answer, built from a real mentor's experience ──
function InstantAnswerCard({ card, onTalk }) {
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
        style={{ borderBottom: "1px solid #211F2B", background: "rgba(117,103,201,0.06)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={13} style={{ color: "#8E80DB", flexShrink: 0 }} />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate"
            style={{ color: "#8E80DB", fontFamily: "Inter, sans-serif" }}>
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
        <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: "#5F576F", fontFamily: "Inter, sans-serif" }}>
          <CheckCircle size={12} style={{ color: "#3DBE82" }} />
          <span>
            {mentorName}
            {edu.institutionName ? ` · ${edu.institutionName}` : ""}
            {edu.field ? ` · ${edu.field}` : ""}
          </span>
        </div>

        {c.mainAnswer && (
          <p className="text-base font-semibold leading-snug mb-5"
            style={{ color: "#ECEAF3", fontFamily: "Fraunces, serif" }}>
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
                    style={{ background: "rgba(117,103,201,0.22)", color: "#8E80DB" }}>
                    {i + 1}
                  </span>
                  <span>
                    {s.step && <strong style={{ color: "#ECEAF3" }}>{s.step}: </strong>}
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

        {/* Bridge to this senior */}
        {onTalk && (
          <button
            onClick={onTalk}
            className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#7567C9,#5a52a8)", color: "#ECEAF3", fontFamily: "Inter, sans-serif" }}
          >
            Talk to {mentorName} <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
