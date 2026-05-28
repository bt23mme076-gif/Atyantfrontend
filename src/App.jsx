import { useState, useEffect } from "react";
import {
  MessageSquare, Target, CalendarDays, Video,
  TrendingUp, Bookmark, Send, Pencil, Star,
  Clock, CheckCircle, Lock, ChevronRight, Search
} from "lucide-react";

const C = {
  bg: "#0d0c0a",
  sidebar: "#131210",
  sidebarBorder: "#232018",
  card: "#1a1714",
  cardHover: "#201d17",
  cardBorder: "#2d2820",
  active: "#221f19",
  activeBorder: "#3a3228",
  accent: "#d4891a",
  accentSoft: "#d4891a22",
  accentText: "#f0a93a",
  text: "#ede8de",
  textSub: "#967f68",
  textMuted: "#5a5040",
  green: "#3aba7a",
};

// ─── Ask Atyant ──────────────────────────────────────────────────────────────
function AskAtyantPage() {
  const [query, setQuery] = useState("");
  const tags = ["VNIT Nagpur", "Metallurgy · Y3", "CGPA 7.8", "→ Goal: AI/ML internship"];
  const cards = [
    { tag: "CAREER SWITCH", title: "Metallurgy → AI/ML", sub: "skills, timeline, and what actually worked" },
    { tag: "TARGET PREP", title: "VNIT → IIM internship", sub: "the exact path, not the generic advice" },
    { tag: "PLACEMENT", title: "Core vs non-core at VNIT", sub: "real tradeoffs from people who chose" },
    { tag: "SKILLS", title: "Python for ML beginners", sub: "where to start with zero CS background" },
  ];

  return (
    <div style={{ maxWidth: 660, margin: "0 auto", padding: "3rem 2rem" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 999, padding: "6px 20px", display: "flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: "0.1em", color: C.textSub, fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, display: "inline-block", flexShrink: 0 }} />
          800+ VERIFIED JOURNEYS · 300+ OUTCOME CONTRIBUTORS
        </div>
      </div>

      <h1 style={{ textAlign: "center", fontSize: "clamp(1.9rem, 4.5vw, 2.8rem)", fontWeight: 400, lineHeight: 1.2, marginBottom: "1.5rem", color: C.text, fontFamily: "Georgia, 'Times New Roman', serif" }}>
        Find someone exactly like you<br />
        who already solved <em style={{ color: C.accentText, fontStyle: "italic" }}>your</em> problem.
      </h1>

      <p style={{ textAlign: "center", color: C.textSub, fontSize: "0.95rem", lineHeight: 1.75, maxWidth: 500, margin: "0 auto 2.5rem" }}>
        Tell Atyant what you're trying to achieve. We match you with seniors from your background who've already walked the same path — and if you need to talk, book a live session in minutes.
      </p>

      <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
          {tags.map((t, i) => (
            <span key={i} style={{ background: C.active, border: `1px solid ${C.activeBorder}`, borderRadius: 999, padding: "3px 12px", fontSize: 11.5, color: C.textSub }}>
              {i === 0 && "👤 "}{t}
            </span>
          ))}
          <span style={{ background: C.active, border: `1px solid ${C.activeBorder}`, borderRadius: 999, padding: "3px 12px", fontSize: 11.5, color: C.accentText, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Pencil size={10} /> Edit
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="How do I get an AI/ML internship from VNIT Metallurgy with no prior experience?"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: "0.92rem", lineHeight: 1.65, resize: "none", minHeight: 58, fontFamily: "inherit", color: C.text }}
            rows={2}
          />
          <button style={{ background: C.accent, border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Send size={16} color="#fff" />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {cards.map((c, i) => (
          <div key={i}
            style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "1rem 1.25rem", cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
            onMouseLeave={e => e.currentTarget.style.background = C.card}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: C.accent, marginBottom: 6 }}>{c.tag}</div>
            <div style={{ fontSize: "0.85rem", color: C.text, lineHeight: 1.4 }}>
              <strong style={{ fontWeight: 500 }}>{c.title}</strong>
              <span style={{ color: C.textSub }}> — {c.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Clarity Results ─────────────────────────────────────────────────────────
function ClarityResultsPage() {
  const mentors = [
    { name: "Arjun Verma", role: "AI/ML Engineer at Flipkart", bg: "VNIT · Metallurgy · 2023", match: 97, sessions: 18, rating: 4.9 },
    { name: "Priya Sharma", role: "Data Scientist at Razorpay", bg: "VNIT · Civil · 2022", match: 94, sessions: 24, rating: 4.8 },
    { name: "Rohan Desai", role: "ML Intern at Google", bg: "VNIT · Mech · 2024", match: 91, sessions: 9, rating: 5.0 },
    { name: "Sneha Nair", role: "SWE at Microsoft", bg: "VNIT · Metallurgy · 2023", match: 88, sessions: 31, rating: 4.7 },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 500, color: C.text, marginBottom: 4 }}>Clarity Results</h2>
        <p style={{ color: C.textSub, fontSize: "0.88rem" }}>Seniors who solved exactly what you're working on — ranked by background match.</p>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {mentors.map((m, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${i === 0 ? C.accent + "50" : C.cardBorder}`, borderRadius: 14, padding: "1.1rem 1.4rem", display: "flex", alignItems: "center", gap: 14 }}>
            {i === 0 && <div style={{ position: "absolute", background: C.accent, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999, letterSpacing: "0.1em" }} />}
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: C.active, border: `1.5px solid ${C.activeBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: C.accentText, flexShrink: 0 }}>
              {m.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: C.text, fontSize: "0.9rem", marginBottom: 2 }}>{m.name}</div>
              <div style={{ fontSize: "0.8rem", color: C.textSub }}>{m.role}</div>
              <div style={{ fontSize: "0.74rem", color: C.textMuted, marginTop: 2 }}>{m.bg}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 8 }}>
              <Star size={12} fill={C.accentText} color={C.accentText} />
              <span style={{ fontSize: "0.8rem", color: C.textSub }}>{m.rating}</span>
              <span style={{ fontSize: "0.74rem", color: C.textMuted, marginLeft: 4 }}>{m.sessions} sessions</span>
            </div>
            <div style={{ textAlign: "right", marginRight: 12 }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 600, color: C.accentText, lineHeight: 1 }}>{m.match}%</div>
              <div style={{ fontSize: "0.68rem", color: C.textMuted }}>match</div>
            </div>
            <button style={{ background: C.accent, border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Book
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Book a Session ───────────────────────────────────────────────────────────
function BookSessionPage() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const times = ["9:00 AM", "10:30 AM", "11:00 AM", "2:00 PM", "3:30 PM", "5:00 PM", "6:30 PM", "8:00 PM"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dates = [26, 27, 28, 29, 30, 31];

  if (confirmed) return (
    <div style={{ padding: "3rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.accentSoft, border: `1.5px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CheckCircle size={28} color={C.accentText} />
      </div>
      <h2 style={{ color: C.text, fontWeight: 500 }}>Session Confirmed!</h2>
      <p style={{ color: C.textSub, textAlign: "center", maxWidth: 360, fontSize: "0.9rem" }}>
        Your session has been booked for <strong style={{ color: C.text }}>May {dates[selectedDate]}</strong> at <strong style={{ color: C.text }}>{selectedTime}</strong>. You'll receive a confirmation shortly.
      </p>
      <button onClick={() => { setConfirmed(false); setSelectedDate(null); setSelectedTime(null); }}
        style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "9px 22px", color: C.text, cursor: "pointer", fontFamily: "inherit", fontSize: "0.88rem" }}>
        Book another
      </button>
    </div>
  );

  return (
    <div style={{ padding: "2rem", maxWidth: 580 }}>
      <h2 style={{ fontSize: "1.35rem", fontWeight: 500, color: C.text, marginBottom: 4 }}>Book a Session</h2>
      <p style={{ color: C.textSub, fontSize: "0.88rem", marginBottom: "2rem" }}>Choose a date and time to connect with your matched mentor.</p>

      <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.textMuted, marginBottom: "1rem" }}>SELECT DATE — MAY 2026</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {days.map((d, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.68rem", color: C.textMuted, marginBottom: 6 }}>{d}</div>
              <button onClick={() => setSelectedDate(i)}
                style={{ width: "100%", aspectRatio: "1", borderRadius: 10, border: `1px solid ${selectedDate === i ? C.accent : C.cardBorder}`, background: selectedDate === i ? C.accent : C.active, color: selectedDate === i ? "#fff" : C.text, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit", fontWeight: selectedDate === i ? 600 : 400 }}>
                {dates[i]}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.textMuted, marginBottom: "1rem" }}>SELECT TIME</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {times.map((t, i) => (
            <button key={i} onClick={() => setSelectedTime(t)}
              style={{ padding: "8px 4px", borderRadius: 8, border: `1px solid ${selectedTime === t ? C.accent : C.cardBorder}`, background: selectedTime === t ? C.accent : C.active, color: selectedTime === t ? "#fff" : C.text, fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => (selectedDate !== null && selectedTime) && setConfirmed(true)}
        style={{ width: "100%", background: C.accent, border: "none", borderRadius: 10, padding: "13px", color: "#fff", fontSize: "0.95rem", fontWeight: 500, cursor: selectedDate !== null && selectedTime ? "pointer" : "not-allowed", fontFamily: "inherit", opacity: selectedDate !== null && selectedTime ? 1 : 0.4, transition: "opacity 0.2s" }}>
        Confirm Booking →
      </button>
    </div>
  );
}

// ─── My Sessions ─────────────────────────────────────────────────────────────
function MySessionsPage() {
  const upcoming = [
    { mentor: "Arjun Verma", initials: "AV", topic: "AI/ML Internship Roadmap", date: "May 29, 2026", time: "6:30 PM" },
  ];
  const past = [
    { mentor: "Priya Sharma", initials: "PS", topic: "CGPA impact on placements", date: "May 20, 2026", time: "5:00 PM" },
    { mentor: "Karan Mehta", initials: "KM", topic: "Resume for non-CS students", date: "May 12, 2026", time: "8:00 PM" },
    { mentor: "Divya Iyer", initials: "DI", topic: "Open source to get noticed", date: "May 3, 2026", time: "7:00 PM" },
  ];

  const SessionCard = ({ s, isUpcoming }) => (
    <div style={{ background: C.card, border: `1px solid ${isUpcoming ? C.accent + "55" : C.cardBorder}`, borderRadius: 14, padding: "1.1rem 1.4rem", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: isUpcoming ? C.accentSoft : C.active, border: `1.5px solid ${isUpcoming ? C.accent + "60" : C.activeBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: C.accentText, flexShrink: 0 }}>
        {s.initials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, color: C.text, fontSize: "0.88rem" }}>{s.mentor}</div>
        <div style={{ fontSize: "0.8rem", color: C.textSub, marginTop: 2 }}>{s.topic}</div>
        <div style={{ fontSize: "0.72rem", color: C.textMuted, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={10} /> {s.date} · {s.time}
        </div>
      </div>
      <span style={{ fontSize: "0.72rem", padding: "4px 11px", borderRadius: 999, background: isUpcoming ? C.accentSoft : C.active, color: isUpcoming ? C.accentText : C.textMuted, border: `1px solid ${isUpcoming ? C.accent + "40" : C.cardBorder}` }}>
        {isUpcoming ? "Upcoming" : "Completed"}
      </span>
    </div>
  );

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ fontSize: "1.35rem", fontWeight: 500, color: C.text, marginBottom: "2rem" }}>My Sessions</h2>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: C.textMuted, marginBottom: "0.85rem" }}>UPCOMING</div>
        <div style={{ display: "grid", gap: 10 }}>{upcoming.map((s, i) => <SessionCard key={i} s={s} isUpcoming={true} />)}</div>
      </div>
      <div>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: C.textMuted, marginBottom: "0.85rem" }}>PAST SESSIONS</div>
        <div style={{ display: "grid", gap: 10 }}>{past.map((s, i) => <SessionCard key={i} s={s} isUpcoming={false} />)}</div>
      </div>
    </div>
  );
}

// ─── My Roadmap ───────────────────────────────────────────────────────────────
function MyRoadmapPage() {
  const [expanded, setExpanded] = useState(0);
  const steps = [
    { phase: "Phase 1", title: "Python & ML Foundations", duration: "4–6 weeks", status: "active", tasks: ["NumPy, Pandas, Matplotlib basics", "Andrew Ng's ML Specialization (Coursera)", "Build 1 end-to-end project on Kaggle"] },
    { phase: "Phase 2", title: "Project Portfolio", duration: "6–8 weeks", status: "upcoming", tasks: ["Enter a Kaggle competition", "GitHub portfolio with 3 solid repos", "Domain project: materials + ML angle"] },
    { phase: "Phase 3", title: "Application Strategy", duration: "2–3 weeks", status: "upcoming", tasks: ["Resume tailored for AI/ML roles", "LinkedIn with projects highlighted", "Target 50+ startup + FAANG intern openings"] },
    { phase: "Phase 4", title: "Interview Prep", duration: "Ongoing", status: "locked", tasks: ["DSA (LeetCode easy/medium)", "ML theory & scenario questions", "System design basics"] },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ fontSize: "1.35rem", fontWeight: 500, color: C.text, marginBottom: 4 }}>My Roadmap</h2>
      <p style={{ color: C.textSub, fontSize: "0.88rem", marginBottom: "2rem" }}>Metallurgy → AI/ML · personalized for your profile</p>

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 23, top: 28, bottom: 28, width: 1.5, background: C.cardBorder }} />
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {steps.map((s, i) => {
            const isActive = s.status === "active";
            const isLocked = s.status === "locked";
            return (
              <div key={i} style={{ display: "flex", gap: 16, cursor: !isLocked ? "pointer" : "default" }}
                onClick={() => !isLocked && setExpanded(expanded === i ? -1 : i)}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: isActive ? C.accent : isLocked ? C.bg : C.card, border: `1.5px solid ${isActive ? C.accent : isLocked ? C.textMuted : C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: isActive ? "#fff" : isLocked ? C.textMuted : C.textSub, flexShrink: 0, zIndex: 1, position: "relative" }}>
                  {isLocked ? <Lock size={14} /> : i + 1}
                </div>
                <div style={{ flex: 1, background: C.card, border: `1px solid ${isActive ? C.accent + "55" : C.cardBorder}`, borderRadius: 14, padding: "1rem 1.25rem", transition: "border-color 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: C.accentText, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 3 }}>{s.phase}</div>
                      <div style={{ fontWeight: 500, color: isLocked ? C.textMuted : C.text, fontSize: "0.9rem" }}>{s.title}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.7rem", color: C.textMuted, background: C.active, borderRadius: 999, padding: "3px 10px", border: `1px solid ${C.cardBorder}` }}>{s.duration}</span>
                      {!isLocked && <ChevronRight size={14} color={C.textMuted} style={{ transform: expanded === i ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />}
                    </div>
                  </div>
                  {expanded === i && !isLocked && (
                    <ul style={{ margin: "10px 0 0", paddingLeft: "1.2rem" }}>
                      {s.tasks.map((t, j) => (
                        <li key={j} style={{ fontSize: "0.82rem", color: C.textSub, marginBottom: 4, lineHeight: 1.5 }}>{t}</li>
                      ))}
                    </ul>
                  )}
                  {isLocked && <div style={{ fontSize: "0.78rem", color: C.textMuted, marginTop: 6 }}>Unlocks after Phase 3</div>}
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
function SavedAnswersPage() {
  const [search, setSearch] = useState("");
  const answers = [
    { q: "How to transition into AI/ML from core engineering?", tags: ["Career Switch", "AI/ML"], date: "May 22" },
    { q: "What CGPA is needed for top companies at VNIT?", tags: ["Placements", "CGPA"], date: "May 18" },
    { q: "Best online courses for ML with no CS background?", tags: ["Learning", "Resources"], date: "May 15" },
    { q: "How important is DSA for ML roles vs SWE roles?", tags: ["DSA", "AI/ML"], date: "May 10" },
    { q: "When should I start applying for internships in Y3?", tags: ["Timeline", "Internships"], date: "May 5" },
  ];

  const filtered = answers.filter(a => a.q.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ fontSize: "1.35rem", fontWeight: 500, color: C.text, marginBottom: 4 }}>Saved Answers</h2>
      <p style={{ color: C.textSub, fontSize: "0.88rem", marginBottom: "1.5rem" }}>Insights you've bookmarked for quick reference.</p>

      <div style={{ position: "relative", marginBottom: "1.5rem" }}>
        <Search size={14} color={C.textMuted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saved answers…"
          style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "9px 14px 9px 36px", color: C.text, fontSize: "0.88rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((a, i) => (
          <div key={i}
            style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "1.1rem 1.4rem", cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
            onMouseLeave={e => e.currentTarget.style.background = C.card}>
            <div style={{ fontWeight: 400, color: C.text, marginBottom: 10, fontSize: "0.88rem", lineHeight: 1.55 }}>{a.q}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {a.tags.map((t, j) => (
                  <span key={j} style={{ fontSize: "0.7rem", padding: "2px 9px", borderRadius: 999, background: C.active, color: C.textSub, border: `1px solid ${C.cardBorder}` }}>{t}</span>
                ))}
              </div>
              <span style={{ fontSize: "0.72rem", color: C.textMuted }}>{a.date}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: C.textMuted, padding: "3rem", fontSize: "0.88rem" }}>No saved answers match "{search}"</div>
        )}
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState("ask");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap";
    document.head.appendChild(link);
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = C.bg;
  }, []);

  const workspaceItems = [
    { id: "ask", Icon: MessageSquare, label: "Ask Atyant" },
    { id: "clarity", Icon: Target, label: "Clarity Results" },
    { id: "book", Icon: CalendarDays, label: "Book a Session" },
    { id: "sessions", Icon: Video, label: "My Sessions" },
  ];
  const journeyItems = [
    { id: "roadmap", Icon: TrendingUp, label: "My Roadmap" },
    { id: "saved", Icon: Bookmark, label: "Saved Answers" },
  ];

  const pages = {
    ask: <AskAtyantPage />,
    clarity: <ClarityResultsPage />,
    book: <BookSessionPage />,
    sessions: <MySessionsPage />,
    roadmap: <MyRoadmapPage />,
    saved: <SavedAnswersPage />,
  };

  const NavItem = ({ item }) => {
    const isActive = activePage === item.id;
    return (
      <button onClick={() => setActivePage(item.id)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 9, border: "none", background: isActive ? C.active : "transparent", color: isActive ? C.text : C.textSub, cursor: "pointer", fontFamily: "inherit", fontSize: "0.86rem", textAlign: "left", transition: "all 0.15s", fontWeight: isActive ? 500 : 400 }}>
        <item.Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
        {item.label}
      </button>
    );
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', -apple-system, sans-serif", color: C.text }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 254, flexShrink: 0, background: C.sidebar, borderRight: `1px solid ${C.sidebarBorder}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>

        {/* Logo */}
        <div style={{ padding: "1.25rem 1.25rem 1.25rem", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700 }}>✦</div>
          <span style={{ fontWeight: 600, fontSize: "1rem", color: C.text, letterSpacing: "-0.01em" }}>Atyant</span>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 0.625rem" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", color: C.textMuted, padding: "0 10px", marginBottom: 6 }}>WORKSPACE</div>
            {workspaceItems.map(item => <NavItem key={item.id} item={item} />)}
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", color: C.textMuted, padding: "0 10px", marginBottom: 6 }}>JOURNEY</div>
            {journeyItems.map(item => <NavItem key={item.id} item={item} />)}
          </div>
        </div>

        {/* Profile */}
        <div style={{ padding: "0.875rem 0.875rem", borderTop: `1px solid ${C.sidebarBorder}` }}>
          <div style={{ background: C.active, border: `1px solid ${C.activeBorder}`, borderRadius: 12, padding: "11px 13px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
            onMouseLeave={e => e.currentTarget.style.background = C.active}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.accentSoft, border: `1.5px solid ${C.accent + "70"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: C.accentText, flexShrink: 0 }}>
              RM
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.86rem", fontWeight: 500, color: C.text }}>Rahul Mehta</div>
              <div style={{ fontSize: "0.7rem", color: C.textMuted, marginTop: 1 }}>VNIT · Metallurgy · Y3</div>
            </div>
            <ChevronRight size={13} color={C.textMuted} />
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, overflowY: "auto", height: "100vh" }}>
        {pages[activePage]}
      </div>

    </div>
  );
}
