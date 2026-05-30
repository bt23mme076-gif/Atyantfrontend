import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import SeniorsPanel from "./SeniorsPanel";
import SeniorDetail from "./SeniorDetail";

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_MENTORS = [
  {
    id: 1,
    name: "Arjun Khanna",
    initials: "AK",
    role: "ML @ Walmart Labs",
    company: "Walmart Labs",
    college: "VNIT Nagpur",
    branch: "Metallurgy",
    matchPct: 96,
    matchReason: "Same college, same branch, same starting point (zero ML). Solved this in 6 months.",
    verifiedVia: "Offer Letter + LinkedIn",
    story:
      "I started with <strong style='color:#F5F5F4'>zero ML experience in Y2</strong>. The honest answer: college syllabus won't help here. I did Andrew Ng's ML course first (3 weeks), then built 2 projects on Kaggle. The key was <strong style='color:#F5F5F4'>cold-emailing VNIT professors first</strong> — got a minor project under Prof. Bhushan which gave me a project to mention. From there, applied to 40+ startups on LinkedIn, not big companies. Walmart Labs was application #34.",
    outcome: "ML Intern @ Walmart Labs (₹35K/mo) · 6 months after starting · Now full-time SDE-1",
    tags: ["Same College", "Same Branch", "Zero ML Start", "Tier-2 College", "Y2 Start"],
    studentsHelped: "47",
    rating: "4.9★",
    timeline: "6 months",
  },
  {
    id: 2,
    name: "Priya Sharma",
    initials: "PS",
    role: "DS @ Goldman Sachs",
    company: "Goldman Sachs",
    college: "MNNIT Allahabad",
    branch: "Materials Engineering",
    matchPct: 89,
    matchReason: "Same college type, materials background, went analytics → ML. Finance-tech target.",
    verifiedVia: "Offer Letter + LinkedIn",
    story:
      "Materials Engineering sounds miles away from Data Science, but the math overlap is real. I leaned into my <strong style='color:#F5F5F4'>stats coursework from metallurgy</strong> and picked up Python during semester breaks. Applied for finance-side DS roles where the quant background was actually valued. Goldman wanted someone who understood structured data from domain knowledge — that's exactly what a materials engineer brings.",
    outcome: "Data Science Analyst @ Goldman Sachs · 8 months after starting quantitative prep",
    tags: ["Same College Type", "Materials Background", "Analytics → ML", "Finance Track", "Tier-2 NIT"],
    studentsHelped: "31",
    rating: "4.8★",
    timeline: "8 months",
  },
  {
    id: 3,
    name: "Rohan Tiwari",
    initials: "RT",
    role: "ML Intern @ Flipkart",
    company: "Flipkart",
    college: "MNNIT Allahabad",
    branch: "Mechanical Engineering",
    matchPct: 82,
    matchReason: "NIT Tier-2 (MNNIT), Mechanical → ML path. Product company internship focus.",
    verifiedVia: "Offer Letter + LinkedIn",
    story:
      "Mechanical to ML is the most common non-CS pivot I've seen. The trick nobody tells you: <strong style='color:#F5F5F4'>don't hide your branch, weaponize it</strong>. Flipkart's supply chain ML team actively wanted domain knowledge from mechanical/industrial folks. Built a demand forecasting model using manufacturing principles I already knew. That framing got me the interview — the skills got me the offer.",
    outcome: "ML Intern @ Flipkart (Supply Chain AI) · ₹30K/mo · 7 months after starting",
    tags: ["NIT Tier-2", "Non-CS Branch", "Product Company", "Supply Chain AI", "Domain Pivot"],
    studentsHelped: "28",
    rating: "4.7★",
    timeline: "7 months",
  },
];

// ── Chat message sequence ─────────────────────────────────────────────────────
// Phase 1: the 4 onboarding Q&A pairs (already happened before clarity state)
const ONBOARDING_MESSAGES = [
  { id: 1,  type: "bot",  text: "Hey! What's your name?" },
  { id: 2,  type: "user", text: "Rahul Mehta" },
  { id: 3,  type: "bot",  text: "Nice to meet you Rahul! Which college and branch are you in?" },
  { id: 4,  type: "user", text: "VNIT Nagpur, Metallurgy, Y3" },
  { id: 5,  type: "bot",  text: "What year are you in currently?" },
  { id: 6,  type: "user", text: "Third year" },
  { id: 7,  type: "bot",  text: "What's your main goal right now? Just say it like you'd tell a friend." },
  { id: 8,  type: "user", text: "I want an AI/ML internship but I have zero experience and I'm from Metallurgy." },
];

// Phase 2: user's actual question that triggered clarity
const CLARITY_QUESTION = {
  id: 9,
  type: "user",
  text: "How do I get an AI/ML internship from VNIT Metallurgy with no prior experience?",
};

// Phase 3: bot's response after the question
const BOT_FINDING = {
  id: 10,
  type: "bot",
  text: "Got it. Finding seniors from your exact background...",
};

// ── ChatBubble ────────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.type === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg,#F59E0B,#FB923C)" }}
        >
          <span className="text-xs font-bold" style={{ color: "#0A0A0A", fontFamily: "Fraunces, serif" }}>A</span>
        </div>
      )}
      <div
        className="max-w-xs px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
        style={{
          background: isUser
            ? "linear-gradient(135deg,rgba(245,158,11,0.22),rgba(251,146,60,0.18))"
            : "#1a1a1a",
          border: isUser ? "1px solid rgba(245,158,11,0.28)" : "1px solid #262626",
          color: "#F5F5F4",
          fontFamily: "Inter, sans-serif",
          borderTopRightRadius: isUser ? "4px" : "16px",
          borderTopLeftRadius: isUser ? "16px" : "4px",
        }}
      >
        {msg.text}
      </div>
    </div>
  );
}

// ── VerifiedAnswerCard (appears in chat after mentor selected) ─────────────────
function VerifiedAnswerCard({ mentor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="rounded-2xl p-5"
      style={{
        background: "#141414",
        border: "1px solid rgba(16,185,129,0.25)",
        boxShadow: "0 0 32px rgba(16,185,129,0.06)",
      }}
    >
      {/* Header label */}
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle size={14} style={{ color: "#10B981" }} />
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#10B981", fontFamily: "Inter, sans-serif" }}
        >
          Verified Answer Card
        </span>
      </div>

      {/* Mentor identity */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: "rgba(139,92,246,0.25)", color: "#a78bfa", fontFamily: "Fraunces, serif" }}
        >
          {mentor.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ color: "#F5F5F4", fontFamily: "Fraunces, serif", fontSize: "15px" }}>
            {mentor.name}
          </p>
          <p className="text-xs truncate" style={{ color: "#A8A29E", fontFamily: "Inter, sans-serif" }}>
            {mentor.college} · {mentor.branch} → {mentor.role}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
        >
          <span className="text-xs" style={{ color: "#10B981", fontFamily: "Inter, sans-serif" }}>✓ Verified outcome</span>
        </div>
      </div>

      {/* Story */}
      <p
        className="text-sm leading-loose mb-4"
        style={{ color: "#A8A29E", fontFamily: "Inter, sans-serif" }}
        dangerouslySetInnerHTML={{ __html: mentor.story }}
      />

      {/* Outcome box */}
      <div
        className="rounded-xl p-3.5 mb-4 flex items-start gap-2.5"
        style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)" }}
      >
        <span style={{ color: "#10B981", fontSize: "12px", marginTop: "2px" }}>✓</span>
        <div>
          <span className="text-xs font-semibold" style={{ color: "#10B981", fontFamily: "Inter, sans-serif" }}>Outcome: </span>
          <span className="text-sm" style={{ color: "#A8A29E", fontFamily: "Inter, sans-serif" }}>{mentor.outcome}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {mentor.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-full text-xs"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "#F59E0B",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main ClarityView ──────────────────────────────────────────────────────────
export default function ClarityView() {
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [modalMentor, setModalMentor]       = useState(null);
  const [confirmedMentor, setConfirmedMentor] = useState(null);
  const [inputValue, setInputValue]         = useState("");
  const bottomRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [confirmedMentor]);

  const handleCardClick = (mentor) => {
    setModalMentor(mentor);
    setSelectedMentor(mentor);
  };

  const handleSelectMentor = () => {
    setConfirmedMentor(modalMentor);
    setModalMentor(null);
  };

  return (
    // NO sidebar here — the parent App.jsx already renders the sidebar.
    // ClarityView fills whatever space the parent gives it.
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ background: "#0A0A0A", fontFamily: "Inter, sans-serif", minHeight: 0 }}
    >
      {/* ── Chat Area ── */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ borderRight: "1px solid #1a1a1a" }}
      >
        {/* Scrollable messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-3">

          {/* ── Step 1: Onboarding Q&A (the 4-question chat that already happened) ── */}
          {ONBOARDING_MESSAGES.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              <ChatBubble msg={msg} />
            </motion.div>
          ))}

          {/* ── Divider: context collected ── */}
          <div className="flex items-center gap-3 py-1">
            <div style={{ flex: 1, height: "1px", background: "#1f1f1f" }} />
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{
                color: "#737373",
                fontFamily: "Inter, sans-serif",
                background: "#141414",
                border: "1px solid #262626",
                whiteSpace: "nowrap",
              }}
            >
              Context collected · VNIT Nagpur · Metallurgy · Y3
            </span>
            <div style={{ flex: 1, height: "1px", background: "#1f1f1f" }} />
          </div>

          {/* ── Step 2: User's main question that triggered clarity ── */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.25 }}
          >
            <ChatBubble msg={CLARITY_QUESTION} />
          </motion.div>

          {/* ── Step 3: Bot reply ── */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.25 }}
          >
            <ChatBubble msg={BOT_FINDING} />
          </motion.div>

          {/* ── Step 4: "VERIFIED ANSWER CARDS" label + card, after mentor selected ── */}
          {confirmedMentor && (
            <>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xs font-bold uppercase tracking-widest pt-2"
                style={{ color: "#737373", fontFamily: "Inter, sans-serif" }}
              >
                Verified Answer Cards
              </motion.p>
              <VerifiedAnswerCard mentor={confirmedMentor} />
            </>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid #1a1a1a" }}>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: "#141414", border: "1px solid #262626" }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#F5F5F4", fontFamily: "Inter, sans-serif" }}
            />
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#F59E0B,#FB923C)" }}
            >
              <Send size={13} style={{ color: "#0A0A0A" }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Seniors Panel ── */}
      <div
        className="flex flex-col overflow-hidden flex-shrink-0"
        style={{ width: "300px", background: "#0f0f0f" }}
      >
        <SeniorsPanel
          mentors={MOCK_MENTORS}
          selectedId={selectedMentor?.id}
          onSelect={handleCardClick}
        />
      </div>

      {/* ── Mentor Detail Modal ── */}
      <AnimatePresence>
        {modalMentor && (
          <SeniorDetail
            mentor={modalMentor}
            onClose={() => setModalMentor(null)}
            onSelect={handleSelectMentor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}