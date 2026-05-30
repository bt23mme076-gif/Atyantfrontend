import { useState, useRef } from "react";
import { Menu, X, MessageSquare } from "lucide-react";
import SeniorsPanel from "./SeniorsPanel";
import SeniorDetail from "./SeniorDetail";

// ── Design tokens (warmer dark theme, neutral cards)
const T = {
  bg: "#120f0c",
  sidebar: "#15120f",
  sidebarBorder: "#2d2a24",
  card: "#161412",
  cardBorder: "#2d2923",
  active: "#25211d",
  activeBorder: "#41382f",
  accent: "#f08e2b",
  accentSoft: "#f08e2b22",
  accentText: "#ffbd7c",
  text: "#f0e7dd",
  textSub: "#c1b19f",
  textMuted: "#968c7e",
  green: "#3ec27f",
};

// ── Mock mentor data ──────────────────────────────────────────────────────────
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
    matchReason: "Same college, same branch, same zero-ML starting point. Solved this in 6 months.",
    verifiedVia: "Offer Letter + LinkedIn",
    story:
      "I started with <strong style='color:#ECEAF3'>zero ML experience in Y2</strong>. The honest answer: college syllabus won't help here. I did Andrew Ng's ML course first (3 weeks), then built 2 projects on Kaggle. The key was <strong style='color:#ECEAF3'>cold-emailing VNIT professors first</strong> — got a minor project under Prof. Bhushan which gave me a project to mention. From there, applied to 40+ startups on LinkedIn, not big companies. Walmart Labs was application #34.",
    outcome: "ML Intern @ Walmart Labs (₹35K/mo) · 6 months after starting · Now full-time SDE-1",
    tags: ["Same College", "Same Branch", "Zero ML Start", "Tier-2 College", "Y2 Start"],
    studentsHelped: "47",
    rating: "4.9★",
    timeline: "6 mo",
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
      "Materials Engineering sounds miles away from Data Science, but the math overlap is real. I leaned into my <strong style='color:#ECEAF3'>stats coursework from metallurgy</strong> and picked up Python during semester breaks. Applied for finance-side DS roles where the quant background was actually valued. Goldman wanted someone who understood structured data — that's exactly what a materials engineer brings.",
    outcome: "Data Science Analyst @ Goldman Sachs · 8 months after starting quantitative prep",
    tags: ["Same College Type", "Materials Background", "Analytics → ML", "Finance Track", "Tier-2 NIT"],
    studentsHelped: "31",
    rating: "4.8★",
    timeline: "8 mo",
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
      "Mechanical to ML is the most common non-CS pivot I've seen. The trick nobody tells you: <strong style='color:#ECEAF3'>don't hide your branch, weaponize it</strong>. Flipkart's supply chain ML team actively wanted domain knowledge from mechanical/industrial folks. Built a demand forecasting model using manufacturing principles I already knew. That framing got me the interview — the skills got me the offer.",
    outcome: "ML Intern @ Flipkart (Supply Chain AI) · ₹30K/mo · 7 months after starting",
    tags: ["NIT Tier-2", "Non-CS Branch", "Product Company", "Supply Chain AI", "Domain Pivot"],
    studentsHelped: "28",
    rating: "4.7★",
    timeline: "7 mo",
  },
];

// ── QueryCard — pinned user question ─────────────────────────────────────────
function QueryCard() {
  return (
    <div
      className="rounded-2xl p-4 flex-shrink-0"
      style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${T.accent}28`, border: `1px solid ${T.accent}40` }}
        >
          <MessageSquare size={14} style={{ color: T.accentText }} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-snug"
            style={{ color: T.text, fontFamily: "Fraunces, serif" }}>
            How do I get an AI/ML internship from VNIT Metallurgy with no prior experience?
          </p>
          <p className="text-xs mt-1.5" style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>
            Context: VNIT Nagpur · Metallurgy · Y3 · CGPA 7.8 · Goal: AI/ML
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Divider label between query and answer ────────────────────────────────────
function AnswerLabel({ mentorName }) {
  return (
    <div className="flex items-center gap-2">
      <div style={{ flex: 1, height: "1px", background: T.cardBorder }} />
      <span
        className="text-xs font-bold uppercase tracking-widest px-2 whitespace-nowrap"
        style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}
      >
        Verified Answer · {mentorName}
      </span>
      <div style={{ flex: 1, height: "1px", background: T.cardBorder }} />
    </div>
  );
}

// ── ClarityView — receives setActivePage from App.jsx ────────────────────────
// Props:
//   setActivePage  (function) — from App.jsx, used by "Talk to Mentor" button
//
export default function ClarityView({ setActivePage }) {
  const [selectedMentor, setSelectedMentor] = useState(MOCK_MENTORS[0]);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const detailRef = useRef(null);

  // Resize listener — update isMobile on window resize
  useState(() => {
    if (typeof window === "undefined") return;
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  });

  const handleSelectMentor = (mentor) => {
    setSelectedMentor(mentor);
    setMobileSidebarOpen(false);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  // Navigates to Book a Session using App.jsx's navigation state
  const handleTalkToMentor = () => {
    if (setActivePage) {
      setActivePage("book");
    }
  };

  // ── DESKTOP ───────────────────────────────────────────────────────────────
  // App.jsx already renders the sidebar — ClarityView only renders content area
  if (!isMobile) {
    return (
      <div
        className="flex w-full"
        style={{
          background: T.bg,
          fontFamily: "Inter, sans-serif",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* ── Center column: query card + scrollable mentor detail ── */}
        <div
          className="flex flex-col flex-1"
          style={{
            borderRight: `1px solid ${T.sidebarBorder}`,
            overflow: "hidden",
            height: "100%",
          }}
        >
          {/* Pinned query card */}
          <div
            className="px-6 pt-5 pb-4 flex-shrink-0"
            style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}
          >
            <QueryCard />
          </div>

          {/* Scrollable detail */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            <AnswerLabel mentorName={selectedMentor.name} />

              <div key={selectedMentor.id} ref={detailRef}>
                <SeniorDetail
                  mentor={selectedMentor}
                  onTalkToMentor={handleTalkToMentor}
                />
              </div>
          </div>
        </div>

        {/* ── Right panel: scrollable mentor list ── */}
        <div className="flex-shrink-0" style={{ width: 296, overflow: "hidden", height: "100%" }}>
          <SeniorsPanel
            mentors={MOCK_MENTORS}
            selectedId={selectedMentor?.id}
            onSelect={handleSelectMentor}
            isMobile={false}
          />
        </div>
      </div>
    );
  }

  // ── MOBILE ────────────────────────────────────────────────────────────────
  // App.jsx has no mobile handling — mobile sidebar overlay lives here
  return (
    <div
      className="flex flex-col w-full"
      style={{
        background: T.bg,
        fontFamily: "Inter, sans-serif",
        minHeight: "100%",
      }}
    >
      {/* Mobile top bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${T.sidebarBorder}`, background: T.sidebar }}
      >
        <button
          onClick={() => setMobileSidebarOpen((v) => !v)}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}
        >
          <Menu size={15} style={{ color: T.accentText }} />
        </button>
        <p className="text-sm font-semibold flex-1"
          style={{ color: T.text, fontFamily: "Fraunces, serif" }}>
          Clarity Results
        </p>
      </div>

      {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <>
            <div
              key="mob-backdrop"
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div
              key="mob-sidebar"
              className="fixed left-0 top-0 bottom-0 z-50 flex flex-col overflow-y-auto"
              style={{
                width: 260,
                background: T.sidebar,
                borderRight: `1px solid ${T.sidebarBorder}`,
              }}
            >
              <div
                className="flex items-center justify-between px-4 pt-4 pb-3"
                style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}
              >
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
                  Menu
                </p>
                <button onClick={() => setMobileSidebarOpen(false)}>
                  <X size={16} style={{ color: T.textSub }} />
                </button>
              </div>

              {[
                { label: "Ask Atyant", icon: "◎", id: "ask" },
                { label: "Clarity Results", icon: "⊙", id: "clarity", active: true },
                { label: "Book a Session", icon: "◷", id: "book" },
                { label: "My Sessions", icon: "☰", id: "sessions" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  style={{
                    background: item.active ? T.active : "transparent",
                    borderLeft: item.active ? `2px solid ${T.accent}` : "2px solid transparent",
                  }}
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    if (setActivePage && !item.active) setActivePage(item.id);
                  }}
                >
                  <span style={{ color: item.active ? T.accentText : T.textMuted, fontSize: 13 }}>
                    {item.icon}
                  </span>
                  <span className="text-sm" style={{ color: item.active ? T.text : T.textSub }}>
                    {item.label}
                  </span>
                </div>
              ))}

              <div className="mt-4 px-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: T.textMuted }}>Journey</p>
                {[
                  { label: "My Roadmap", id: "roadmap" },
                  { label: "Saved Answers", id: "saved" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                    onClick={() => { setMobileSidebarOpen(false); if (setActivePage) setActivePage(item.id); }}
                  >
                    <span style={{ color: T.textMuted, fontSize: 13 }}>↗</span>
                    <span className="text-sm" style={{ color: T.textSub }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      {/* Mobile main scroll area */}
      <div className="flex-1">
        {/* Query */}
        <div className="px-4 pt-4 pb-3">
          <QueryCard />
        </div>

        {/* Horizontal mentor slider */}
        <SeniorsPanel
          mentors={MOCK_MENTORS}
          selectedId={selectedMentor?.id}
          onSelect={handleSelectMentor}
          isMobile={true}
        />

        {/* Divider + answer label */}
        <div className="px-4 pt-3 pb-1">
          <AnswerLabel mentorName={selectedMentor.name} />
        </div>

        {/* Expanded mentor detail — scrollable inline */}
        <div className="px-4 pb-8" ref={detailRef}>
            <div key={selectedMentor.id}>
              <SeniorDetail
                mentor={selectedMentor}
                onTalkToMentor={handleTalkToMentor}
              />
            </div>
        </div>
      </div>
    </div>
  );
}

