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
  const [answerCard,     setAnswerCard]     = useState(null);
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

  // Auto-select top match once results arrive — but only if there's no
  // instant answer to show first (answer takes the main panel by default).
  useEffect(() => {
    if (mentors.length > 0 && !selectedMentor && !answerCard) {
      setSelectedMentor(mentors[0]);
    }
  }, [mentors, answerCard]);

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
      setAnswerCard(data.answerCard || null);
    } catch (e) {
      setFetchError(e.message || "Failed to fetch mentors");
    } finally {
      setFetchLoading(false);
    }
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

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ background: "#13121A", fontFamily: "Inter, sans-serif", minHeight: 0, flexDirection: isMobile ? "column" : "row" }}
    >
      {/* ── Left: Main content ── */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ borderRight: isMobile ? "none" : "1px solid #211F2B", minHeight: 0 }}
      >
        {/* Question header */}
        <div
          className="px-6 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #211F2B" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "linear-gradient(135deg,#7567C9,#5a52a8)" }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: "#ECEAF3", fontFamily: "Fraunces, serif" }}
              >
                A
              </span>
            </div>
            <div>
              <p
                className="text-sm font-semibold leading-snug"
                style={{ color: "#ECEAF3", fontFamily: "Fraunces, serif" }}
              >
                {activeQuery}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "#5F576F", fontFamily: "Inter, sans-serif" }}
              >
                Context: {contextLine}
              </p>
            </div>
          </div>
        </div>

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
                {/* Verified Answer banner */}
                <div
                  className="flex items-center gap-2 px-6 py-2.5 flex-shrink-0"
                  style={{
                    borderBottom: "1px solid #211F2B",
                    background: "rgba(61,190,130,0.04)",
                  }}
                >
                  <CheckCircle size={13} style={{ color: "#3DBE82" }} />
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "#3DBE82", fontFamily: "Inter, sans-serif" }}
                  >
                    Verified Answer · {selectedMentor.name}
                  </span>
                </div>

                {/* Senior detail fills the rest — scrollable */}
                <div className="flex-1 overflow-y-auto">
                  <SeniorDetail
                    mentor={selectedMentor}
                    user={user}
                    onClose={() => setSelectedMentor(null)}
                    onTalkToMentor={onTalkToMentor}
                  />
                </div>
              </motion.div>
            ) : answerCard ? (
              <motion.div
                key="instant-answer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full overflow-y-auto"
              >
                <InstantAnswerCard
                  card={answerCard}
                  hasMentors={mentors.length > 0}
                  onSeeMentor={() => mentors[0] && setSelectedMentor(mentors[0])}
                />
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
function InstantAnswerCard({ card, hasMentors, onSeeMentor }) {
  const c = card?.content || {};
  const mentor = card?.mentor || {};
  const mentorName = mentor.username || mentor.name || "Atyant Mentor";
  const edu = mentor.education || {};
  const steps = Array.isArray(c.actionableSteps) ? c.actionableSteps : [];
  const mistakes = Array.isArray(c.keyMistakes) ? c.keyMistakes : [];

  return (
    <div className="flex flex-col h-full">
      {/* Instant Answer banner */}
      <div className="flex items-center justify-between gap-2 px-6 py-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid #211F2B", background: "rgba(117,103,201,0.06)" }}>
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: "#8E80DB" }} />
          <span className="text-xs font-bold uppercase tracking-widest"
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
      <div className="flex-1 overflow-y-auto px-6 py-5">
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

        {/* Bridge to live mentors */}
        {hasMentors && (
          <button
            onClick={onSeeMentor}
            className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#7567C9,#5a52a8)", color: "#ECEAF3", fontFamily: "Inter, sans-serif" }}
          >
            Talk to a matched senior <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
