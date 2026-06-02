import { useState, useEffect } from "react";
import {
  MessageSquare, Target, CalendarDays, Video,
  TrendingUp, Bookmark, Pencil,
  Plus, Clock, Lock, ChevronRight, Search,
  LogIn, LogOut, X, Loader2,
} from "lucide-react";

import BookingPage from "./pages/user";
import ClarityView from "./components/clarity/ClarityView";
import AskAtyantPage from "./components/clarity/AskAtyantPage";
import { useAuth } from "./context/AuthContext";
import { profileAPI, sessionAPI, savedAnswerAPI, roadmapAPI } from "./api";
import { api } from "./api";
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

function Spin({ size = 18 }) {
  return <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />;
}

// ─── My Sessions ─────────────────────────────────────────────────────────────
function MySessionsPage({ onAuthRequired }) {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleModal, setRescheduleModal] = useState(null); // booking obj
  const [cancelModal, setCancelModal] = useState(null);         // booking obj
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); onAuthRequired?.(); return; }
    sessionAPI.my()
      .then(data => { setUpcoming(data.upcoming || []); setPast(data.past || []); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [user]);

  const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const fmtTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};
  const getInitials = (name = "", max = 2) =>
    name.trim().split(/\s+/).slice(0, max).map(w => w[0].toUpperCase()).join("");

  const handleCancel = async (bookingId, reason) => {
    setActionLoading(true);
    try {
      await sessionAPI.cancel(bookingId, reason);
      setUpcoming(prev => prev.filter(s => s._id !== bookingId));
      setCancelModal(null);
    } catch (e) { alert(e.message || "Cancel failed"); }
    finally { setActionLoading(false); }
  };

  const handleReschedule = async (bookingId, newDate, newTime) => {
    setActionLoading(true);
    try {
      const res = await sessionAPI.reschedule(bookingId, newDate, newTime);
      const updatedBooking = res.booking || res;                    // ← unwrap { ok, booking }
      setUpcoming(prev => prev.map(s =>
        s._id === bookingId
          ? { ...s, scheduledAt: updatedBooking.scheduledAt }      // ← now has the real value
          : s
      ));
      setRescheduleModal(null);
    } catch (e) { alert(e.message || "Reschedule failed"); }
    finally { setActionLoading(false); }
  };

  // ── Upcoming card with action buttons ─────────────────────────────────────
  const UpcomingCard = ({ s }) => (
    <div style={{ background: C.card, border: `1px solid ${C.accent}55`, borderRadius: 14, padding: "1.1rem 1.4rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.accentSoft, border: `1.5px solid ${C.accent}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: C.accentText, flexShrink: 0 }}>
          {getInitials(s.mentorId?.username || s.mentorId?.name || "")}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, color: C.text, fontSize: "0.88rem" }}>
            {s.mentorId?.name || s.mentorId?.username || "Your Mentor"}
          </div>
          <div style={{ fontSize: "0.8rem", color: C.textSub, marginTop: 2 }}>{s.topic || "Career Guidance"}</div>
          <div style={{ fontSize: "0.72rem", color: C.textMuted, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={10} /> {fmtDate(s.scheduledAt)} · {fmtTime(s.scheduledAt)}
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: "flex", gap: 8, marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: `1px solid ${C.cardBorder}` }}>
        <button
          onClick={() => setRescheduleModal(s)}
          style={{ flex: 1, background: C.accentSoft, border: `1px solid ${C.accent}55`, borderRadius: 8, padding: "7px 0", color: C.accentText, fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          ↻ Reschedule
        </button>
        <button
          onClick={() => setCancelModal(s)}
          style={{ flex: 1, background: "transparent", border: `1px solid #f8717155`, borderRadius: 8, padding: "7px 0", color: "#f87171", fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          ✕ Cancel
        </button>
      </div>
    </div>
  );

  // ── Past card (unchanged chip) ─────────────────────────────────────────────
  const PastCard = ({ s }) => (
    <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "1.1rem 1.4rem", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.active, border: `1.5px solid ${C.activeBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: C.accentText, flexShrink: 0 }}>
        {getInitials(s.mentorId?.username || s.mentorId?.name || "")}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, color: C.text, fontSize: "0.88rem" }}>{s.mentorId?.name || s.mentorId?.username || "Your Mentor"}</div>
        <div style={{ fontSize: "0.8rem", color: C.textSub, marginTop: 2 }}>{s.topic || "Career Guidance"}</div>
        <div style={{ fontSize: "0.72rem", color: C.textMuted, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={10} /> {fmtDate(s.scheduledAt)} · {fmtTime(s.scheduledAt)}
        </div>
      </div>
      <span style={{ fontSize: "0.72rem", padding: "4px 11px", borderRadius: 999, background: C.active, color: C.textMuted, border: `1px solid ${C.cardBorder}` }}>
        Completed
      </span>
    </div>
  );

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: C.textMuted }}><Spin /></div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ fontSize: "1.35rem", fontWeight: 500, color: C.text, marginBottom: "2rem" }}>My Sessions</h2>

      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: C.textMuted, marginBottom: "0.85rem" }}>UPCOMING</div>
        {upcoming.length === 0
          ? <p style={{ fontSize: "0.85rem", color: C.textMuted }}>No upcoming sessions. Book one from the calendar!</p>
          : <div style={{ display: "grid", gap: 10 }}>{upcoming.map((s, i) => <UpcomingCard key={s._id || i} s={s} />)}</div>}
      </div>

      <div>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: C.textMuted, marginBottom: "0.85rem" }}>PAST SESSIONS</div>
        {past.length === 0
          ? <p style={{ fontSize: "0.85rem", color: C.textMuted }}>No past sessions yet.</p>
          : <div style={{ display: "grid", gap: 10 }}>{past.map((s, i) => <PastCard key={s._id || i} s={s} />)}</div>}
      </div>

      {/* ── Reschedule Modal ── */}
      {rescheduleModal && (
        <RescheduleModal
          booking={rescheduleModal}
          loading={actionLoading}
          onConfirm={(date, time) => handleReschedule(rescheduleModal._id, date, time)}
          onClose={() => setRescheduleModal(null)}
        />
      )}

      {/* ── Cancel Modal ── */}
      {cancelModal && (
        <CancelModal
          booking={cancelModal}
          loading={actionLoading}
          onConfirm={(reason) => handleCancel(cancelModal._id, reason)}
          onClose={() => setCancelModal(null)}
        />
      )}
    </div>
  );
}

// ── Reschedule Modal ───────────────────────────────────────────────────────────
function RescheduleModal({ booking, loading, onConfirm, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);

  const mentorId = booking.mentorId?._id || booking.mentorId;

  // Fetch slots whenever date changes
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    setTime("");

    const url = mentorId
      ? `/api/mentors/${mentorId}/slots?date=${date}`
      : `/api/slots?date=${date}`;

    api.get(url)
      .then(res => { if (!cancelled) setSlots(res.slots || []); })
      .catch(() => { if (!cancelled) setSlotsError("Could not load slots. Try again."); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });

    return () => { cancelled = true; };
  }, [date, mentorId]);

  const availableSlots = slots.filter(s => s.available);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: C.sidebar, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "2rem", width: 380, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>

        {/* Header */}
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.textSub }}>
          <X size={14} />
        </button>
        <div style={{ fontWeight: 600, fontSize: "1rem", color: C.text, marginBottom: 4 }}>Reschedule Session</div>
        <div style={{ fontSize: "0.8rem", color: C.textSub, marginBottom: "1.5rem" }}>
          with <span style={{ color: C.text, fontWeight: 500 }}>{booking.mentorId?.name || booking.mentorId?.username || "your mentor"}</span>
        </div>

        {/* Date picker */}
        <label style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: C.textMuted, display: "block", marginBottom: 6 }}>NEW DATE</label>
        <input
          type="date" min={today} value={date}
          onChange={e => setDate(e.target.value)}
          style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 9, padding: "9px 13px", color: C.text, fontSize: "0.88rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "1.25rem" }}
        />

        {/* Slots */}
        <label style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: C.textMuted, display: "block", marginBottom: 8 }}>
          AVAILABLE SLOTS (IST)
        </label>

        {/* Loading skeleton */}
        {slotsLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: "1.25rem" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 58, borderRadius: 10, background: C.active, border: `1px solid ${C.cardBorder}`, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        )}

        {/* Error */}
        {!slotsLoading && slotsError && (
          <div style={{ background: "#f8717122", border: "1px solid #f8717155", borderRadius: 10, padding: "10px 14px", fontSize: "0.8rem", color: "#f87171", marginBottom: "1.25rem" }}>
            {slotsError}
          </div>
        )}

        {/* No available slots */}
        {!slotsLoading && !slotsError && availableSlots.length === 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "1rem", textAlign: "center", fontSize: "0.82rem", color: C.textMuted, marginBottom: "1.25rem" }}>
            No available slots for this date. Try another day.
          </div>
        )}

        {/* Slot grid — available only */}
        {!slotsLoading && !slotsError && availableSlots.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: "1.25rem" }}>
            {availableSlots.map(slot => {
              const isSelected = time === slot.time;
              return (
                <button
                  key={slot.time}
                  onClick={() => setTime(slot.time)}
                  style={{
                    padding: "10px 0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    border: `1px solid ${isSelected ? C.accent : C.cardBorder}`,
                    background: isSelected ? C.accentSoft : C.card,
                    color: isSelected ? C.accentText : C.textSub,
                    fontWeight: isSelected ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: "0.85rem" }}>{slot.time}</span>
                  <span style={{ fontSize: "0.68rem", color: isSelected ? C.accentText : C.textMuted }}>{slot.period}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Confirmed pill */}
        {date && time && (
          <div style={{ background: "#3DBE8215", border: "1px solid #3DBE8240", borderRadius: 10, padding: "10px 14px", fontSize: "0.8rem", color: C.green, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
            <span>✓</span>
            <span>{new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at {time} IST</span>
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={() => onConfirm(date, time)}
          disabled={loading || !time}
          style={{ width: "100%", background: time ? C.accent : C.active, border: "none", borderRadius: 10, padding: 11, color: time ? "#fff" : C.textMuted, fontSize: "0.92rem", fontWeight: 600, cursor: loading || !time ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
          {loading ? <><Spin size={15} /> Rescheduling…</> : "Confirm Reschedule →"}
        </button>

      </div>
    </div>
  );
}
// ── Cancel Modal ───────────────────────────────────────────────────────────────
function CancelModal({ booking, loading, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const hoursUntil = (new Date(booking.scheduledAt) - new Date()) / (1000 * 60 * 60);
  const refundPct = hoursUntil >= 24 ? 100 : hoursUntil >= 2 ? 50 : 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.sidebar, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "2rem", width: 340, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.textSub }}>
          <X size={14} />
        </button>

        <div style={{ fontWeight: 600, fontSize: "1rem", color: C.text, marginBottom: 6 }}>Cancel Session</div>
        <div style={{ fontSize: "0.82rem", color: C.textSub, marginBottom: "1.25rem", lineHeight: 1.5 }}>
          This will cancel your session with <strong style={{ color: C.text }}>{booking.mentorId?.name || booking.mentorId?.username}</strong>.
        </div>

        {/* Refund info */}
        <div style={{ background: refundPct === 100 ? "#3DBE8222" : refundPct === 50 ? "#F59E0B22" : "#f8717122", border: `1px solid ${refundPct === 100 ? "#3DBE8255" : refundPct === 50 ? "#F59E0B55" : "#f8717155"}`, borderRadius: 10, padding: "10px 14px", marginBottom: "1.25rem", fontSize: "0.8rem", color: refundPct === 100 ? C.green : refundPct === 50 ? "#F59E0B" : "#f87171" }}>
          {refundPct === 100 ? "✓ Full refund eligible (>24h notice)" : refundPct === 50 ? "⚠ 50% refund (2–24h notice)" : "✕ No refund (<2h notice)"}
        </div>

        <label style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: C.textMuted, display: "block", marginBottom: 6 }}>REASON (optional)</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Let your mentor know why…"
          style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 9, padding: "9px 13px", color: C.text, fontSize: "0.85rem", outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box", marginBottom: "1.25rem" }} />

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 10, color: C.textSub, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
            Keep Session
          </button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            style={{ flex: 1, background: "#f8717122", border: "1px solid #f8717155", borderRadius: 10, padding: 10, color: "#f87171", fontSize: "0.85rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {loading ? <><Spin size={13} /> Cancelling…</> : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── My Roadmap ───────────────────────────────────────────────────────────────
function MyRoadmapPage({ user }) {
  const [expanded, setExpanded] = useState(0);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);

  const generate = () => {
    setGenLoading(true);
    const edu = user?.education?.[0] || {};
    roadmapAPI.generate({
      goal: user?.interests?.[0] || "Career Growth",
      college: edu.institutionName || edu.institution || "",
      branch: edu.field || "",
      year: edu.year || "",
      cgpa: edu.cgpa || "",
    })
      .then(data => { if (data.roadmap?.steps) setSteps(data.roadmap.steps); })
      .catch(() => { })
      .finally(() => setGenLoading(false));
  };

  useEffect(() => {
    roadmapAPI.get()
      .then(data => {
        if (data.roadmap?.steps?.length) setSteps(data.roadmap.steps);
        else generate();
      })
      .catch(() => generate())
      .finally(() => setLoading(false));
  }, []);

  const FALLBACK = [
    { phase: "Phase 1", title: "Python & ML Foundations", duration: "4–6 weeks", status: "active", tasks: ["NumPy, Pandas, Matplotlib basics", "Andrew Ng's ML Specialization (Coursera)", "Build 1 end-to-end project on Kaggle"] },
    { phase: "Phase 2", title: "Project Portfolio", duration: "6–8 weeks", status: "upcoming", tasks: ["Enter a Kaggle competition", "GitHub portfolio with 3 solid repos", "Domain project: materials + ML angle"] },
    { phase: "Phase 3", title: "Application Strategy", duration: "2–3 weeks", status: "upcoming", tasks: ["Resume tailored for AI/ML roles", "LinkedIn with projects highlighted", "Target 50+ startup + FAANG intern openings"] },
    { phase: "Phase 4", title: "Interview Prep", duration: "Ongoing", status: "locked", tasks: ["DSA (LeetCode easy/medium)", "ML theory & scenario questions", "System design basics"] },
  ];

  const displaySteps = steps.length ? steps : FALLBACK;
  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: C.textMuted }}><Spin /></div>;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 500, color: C.text }}>My Roadmap</h2>
        <button onClick={generate} disabled={genLoading}
          style={{ fontSize: "0.78rem", background: C.accentSoft, border: `1px solid ${C.accent}55`, color: C.accentText, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          {genLoading ? <><Spin size={13} /> Generating…</> : "↻ Regenerate"}
        </button>
      </div>
      <p style={{ color: C.textSub, fontSize: "0.88rem", marginBottom: "2rem" }}>
        {user?.interests?.[0]
          ? `${user?.education?.[0]?.field || "Engineering"} → ${user.interests[0]} · personalised for your profile`
          : "Personalised for your profile"}
      </p>

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 23, top: 28, bottom: 28, width: 1.5, background: C.cardBorder }} />
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {displaySteps.map((s, i) => {
            const isActive = s.status === "active";
            const isLocked = s.status === "locked";
            return (
              <div key={i} style={{ display: "flex", gap: 16, cursor: !isLocked ? "pointer" : "default" }}
                onClick={() => !isLocked && setExpanded(expanded === i ? -1 : i)}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: isActive ? C.accent : isLocked ? C.bg : C.card, border: `1.5px solid ${isActive ? C.accent : isLocked ? C.textMuted : C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: isActive ? "#fff" : isLocked ? C.textMuted : C.textSub, flexShrink: 0, zIndex: 1, position: "relative" }}>
                  {isLocked ? <Lock size={14} /> : i + 1}
                </div>
                <div style={{ flex: 1, background: C.card, border: `1px solid ${isActive ? C.accent + "55" : C.cardBorder}`, borderRadius: 14, padding: "1rem 1.25rem" }}>
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
                      {(s.tasks || []).map((t, j) => (
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
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = (q = "") => {
    savedAnswerAPI.list(q)
      .then(data => setAnswers(data.answers || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleRemove = async (id) => {
    await savedAnswerAPI.remove(id).catch(() => { });
    setAnswers(prev => prev.filter(a => a._id !== id));
  };

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: C.textMuted }}><Spin /></div>;

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
        {answers.map((a, i) => (
          <div key={a._id || i}
            style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "1.1rem 1.4rem" }}
            onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
            onMouseLeave={e => e.currentTarget.style.background = C.card}>
            <div style={{ fontWeight: 400, color: C.text, marginBottom: 10, fontSize: "0.88rem", lineHeight: 1.55 }}>{a.question}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {(a.tags || []).map((t, j) => (
                  <span key={j} style={{ fontSize: "0.7rem", padding: "2px 9px", borderRadius: 999, background: C.active, color: C.textSub, border: `1px solid ${C.cardBorder}` }}>{t}</span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.72rem", color: C.textMuted }}>
                  {a.savedAt ? new Date(a.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                </span>
                <button onClick={() => handleRemove(a._id)}
                  style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "0.75rem", padding: 0 }}>✕</button>
              </div>
            </div>
          </div>
        ))}
        {answers.length === 0 && (
          <div style={{ textAlign: "center", color: C.textMuted, padding: "3rem", fontSize: "0.88rem" }}>
            {search ? `No saved answers match "${search}"` : "Nothing saved yet. Bookmark answers from the Clarity view."}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", college: "", branch: "", year: "", cgpa: "", bio: "", goals: [], skills: [] });

  useEffect(() => {
    if (!user) return;
    const edu = user.education?.[0] || {};
    setForm({
      name: user.username || "",
      college: edu.institutionName || edu.institution || "",
      branch: edu.field || "",
      year: edu.year || "",
      cgpa: edu.cgpa ? String(edu.cgpa) : "",
      bio: user.bio || "",
      goals: user.interests || [],
      skills: user.skills || [],
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await profileAPI.update({ username: form.name, bio: form.bio, college: form.college, branch: form.branch, year: form.year, cgpa: form.cgpa, goals: form.goals, skills: form.skills });
      setUser(res.user || res);
      setEditing(false);
    } catch (e) { alert(e.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const edu = user?.education?.[0] || {};
  const initials = (user?.username || user?.name || "?").slice(0, 2).toUpperCase();

  const Field = ({ label, value, onChange }) => (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", color: C.textMuted, display: "block", marginBottom: 5 }}>{label}</label>
      {editing
        ? <input value={value} onChange={e => onChange(e.target.value)}
          style={{ width: "100%", background: C.active, border: `1px solid ${C.accent}55`, borderRadius: 8, padding: "9px 13px", color: C.text, fontSize: "0.88rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        : <div style={{ fontSize: "0.9rem", color: C.text, padding: "9px 0" }}>{value || "—"}</div>
      }
    </div>
  );

  return (
    <div style={{ padding: "2rem", maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ position: "relative" }}>
            {user?.profilePicture
              ? <img src={user.profilePicture} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${C.accent}` }} />
              : <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.accentSoft, border: `2.5px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: C.accentText }}>{initials}</div>
            }
            <span style={{ position: "absolute", bottom: 3, right: 3, width: 13, height: 13, borderRadius: "50%", background: C.green, border: `2.5px solid ${C.bg}` }} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 600, color: C.text, margin: 0, marginBottom: 4 }}>{user?.username || user?.name || "—"}</h2>
            <div style={{ fontSize: "0.82rem", color: C.textSub }}>{edu.institutionName || edu.institution || "—"} · {edu.field || "—"} · {edu.year || "—"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
              <span style={{ fontSize: "0.72rem", color: C.textMuted }}>Active now</span>
            </div>
          </div>
        </div>
        <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6, background: editing ? C.accent : C.card, border: `1px solid ${editing ? C.accent : C.cardBorder}`, borderRadius: 9, padding: "8px 16px", color: editing ? "#fff" : C.textSub, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
          {saving ? <><Spin size={13} /> Saving…</> : <><Pencil size={13} />{editing ? "Save" : "Edit Profile"}</>}
        </button>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.textMuted, marginBottom: "1.25rem" }}>PROFILE DETAILS</div>
        <Field label="DISPLAY NAME" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <Field label="COLLEGE" value={form.college} onChange={v => setForm(f => ({ ...f, college: v }))} />
        <Field label="BRANCH" value={form.branch} onChange={v => setForm(f => ({ ...f, branch: v }))} />
        <Field label="YEAR" value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))} />
        <Field label="CGPA" value={form.cgpa} onChange={v => setForm(f => ({ ...f, cgpa: v }))} />
        <div>
          <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", color: C.textMuted, display: "block", marginBottom: 5 }}>BIO</label>
          {editing
            ? <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3}
              style={{ width: "100%", background: C.active, border: `1px solid ${C.accent}55`, borderRadius: 8, padding: "9px 13px", color: C.text, fontSize: "0.88rem", outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} />
            : <div style={{ fontSize: "0.88rem", color: C.textSub, lineHeight: 1.6, paddingTop: 6 }}>{form.bio || "—"}</div>
          }
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.textMuted, marginBottom: "1rem" }}>CURRENT GOALS</div>
        {form.goals.length === 0
          ? <p style={{ fontSize: "0.82rem", color: C.textMuted }}>No goals set. Edit profile to add goals.</p>
          : <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {form.goals.map((g, i) => (
              <span key={i} style={{ background: i === 0 ? C.accentSoft : C.active, border: `1px solid ${i === 0 ? C.accent + "55" : C.cardBorder}`, borderRadius: 999, padding: "5px 14px", fontSize: "0.8rem", color: i === 0 ? C.accentText : C.textSub }}>
                {i === 0 && "→ "}{g}
              </span>
            ))}
          </div>
        }
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.textMuted, marginBottom: "1rem" }}>SKILLS</div>
        {form.skills.length === 0
          ? <p style={{ fontSize: "0.82rem", color: C.textMuted }}>No skills added yet.</p>
          : <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {form.skills.map((s, i) => (
              <span key={i} style={{ background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 999, padding: "5px 14px", fontSize: "0.8rem", color: C.textSub }}>{s}</span>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ onClose }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await signup(username, email, password, phone);
      onClose();
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inp = { width: "100%", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 9, padding: "10px 14px", color: C.text, fontSize: "0.88rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const lbl = { fontSize: "0.75rem", color: C.textSub, display: "block", marginBottom: 6, letterSpacing: "0.05em" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.sidebar, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "2rem", width: 360, position: "relative" }}>
        <button onClick={onClose}
          style={{ position: "absolute", top: 14, right: 14, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.textSub }}>
          <X size={14} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: "1.5rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 700 }}>A</div>
          <span style={{ fontWeight: 600, fontSize: "1rem", color: C.text }}>{mode === "login" ? "Sign in to Atyant" : "Create your account"}</span>
        </div>

        {/* Google Sign-in Button */}
        <button onClick={() => {
          const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
          window.location.href = `${apiBase}/api/auth/google`;
        }}
          style={{
            width: "100%",
            background: C.active,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: 10,
            padding: "10px 14px",
            color: C.text,
            fontSize: "0.88rem",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: "1rem",
            transition: "all 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.borderColor = C.accent + "66"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.active; e.currentTarget.style.borderColor = C.cardBorder; }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
          <div style={{ flex: 1, height: 1, background: C.cardBorder }} />
          <span style={{ fontSize: "0.72rem", color: C.textMuted, fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: C.cardBorder }} />
        </div>

        {mode === "signup" && <>
          <div style={{ marginBottom: "1rem" }}>
            <label style={lbl}>USERNAME</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="rahulmehta" style={inp} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={lbl}>PHONE (10-digit Indian number)</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" style={inp} />
          </div>
        </>}

        <div style={{ marginBottom: "1rem" }}>
          <label style={lbl}>EMAIL</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.ac.in" style={inp} />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={lbl}>PASSWORD</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inp}
            onKeyDown={e => e.key === "Enter" && handle()} />
        </div>

        {error && <p style={{ color: "#f87171", fontSize: "0.82rem", marginBottom: "1rem" }}>{error}</p>}

        <button onClick={handle} disabled={loading}
          style={{ width: "100%", background: C.accent, border: "none", borderRadius: 10, padding: 11, color: "#fff", fontSize: "0.92rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {loading ? <><Spin size={16} /> {mode === "login" ? "Signing in…" : "Creating account…"}</> : mode === "login" ? "Sign in →" : "Create account →"}
        </button>

        <p style={{ textAlign: "center", fontSize: "0.78rem", color: C.textMuted, marginTop: "1.25rem", marginBottom: 0 }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: C.accentText, cursor: "pointer" }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading, logout } = useAuth();
  const [activePage, setActivePage] = useState("ask");
  const [showAuth, setShowAuth] = useState(false);
  const [clarityQuery, setClarityQuery] = useState("");
  const [bookingMentor, setBookingMentor] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(false);
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap";
    document.head.appendChild(link);
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = C.bg;
  }, []);

  useEffect(() => {
    if (user && pendingBooking) {
      setPendingBooking(false);
      setActivePage("book");   // ensure we're on the booking page
    }
  }, [user, pendingBooking]);
  const goToClarity = (query) => { setClarityQuery(query); setActivePage("clarity"); };

  const handleStartBooking = (mentor) => {
    setBookingMentor(mentor);
    setActivePage("book");
  };

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
    ask: <AskAtyantPage user={user} onGoToClarity={goToClarity} />,
    clarity: <ClarityView key={clarityQuery || "empty"} initialQuery={clarityQuery} user={user} onTalkToMentor={handleStartBooking} />,
    book: <BookingPage
      mentor={bookingMentor}
      onFindMentor={() => setActivePage("clarity")}
      user={user}
      onAuthRequired={() => { setPendingBooking(true); setShowAuth(true); }}
    />,
    sessions: <MySessionsPage onAuthRequired={() => setShowAuth(true)} />,
    roadmap: <MyRoadmapPage user={user} />,
    saved: <SavedAnswersPage />,
    profile: <ProfilePage />,
  };

  const initials = user ? (user.username || user.name || "?").slice(0, 2).toUpperCase() : null;

  if (loading) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted }}>
      <Spin size={28} />
    </div>
  );

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
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", fontFamily: "'Satoshi',-apple-system,sans-serif", color: C.text }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 254, flexShrink: 0, background: C.sidebar, borderRight: `1px solid ${C.sidebarBorder}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
        <div style={{ height: 57, display: "flex", alignItems: "center", padding: "0 1.25rem", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: "1.3rem", letterSpacing: "-0.02em", lineHeight: 1 }}>
            <span style={{ fontWeight: 700, color: "#ffffff" }}>Aty</span><span style={{ color: C.text }}>ant</span>
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 0.625rem" }}>
          {/* ── New Chat Button ── */}
          <button
            onClick={() => {
              setClarityQuery("");
              setActivePage("ask");
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              background: "transparent",
              color: C.textSub,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.88rem",
              fontWeight: 500,
              transition: "all 0.15s",
              textAlign: "left",
              marginBottom: "1.25rem",
              boxSizing: "border-box",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = C.text;
              const circle = e.currentTarget.querySelector(".new-chat-circle");
              if (circle) circle.style.background = "rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = C.textSub;
              const circle = e.currentTarget.querySelector(".new-chat-circle");
              if (circle) circle.style.background = "rgba(255, 255, 255, 0.07)";
            }}
          >
            <div
              className="new-chat-circle"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s"
              }}
            >
              <Plus size={14} color="#FFF" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "0.92rem", fontWeight: 500 }}>New chat</span>
          </button>

          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", color: C.textMuted, padding: "0 10px", marginBottom: 6 }}>WORKSPACE</div>
            {workspaceItems.map(item => <NavItem key={item.id} item={item} />)}
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", color: C.textMuted, padding: "0 10px", marginBottom: 6 }}>JOURNEY</div>
            {journeyItems.map(item => <NavItem key={item.id} item={item} />)}
          </div>
        </div>

        <div style={{ padding: "0.875rem", borderTop: `1px solid ${C.sidebarBorder}` }}>
          {user ? (
            <div onClick={() => setActivePage("profile")}
              style={{ background: activePage === "profile" ? C.cardHover : C.active, border: `1px solid ${activePage === "profile" ? C.accent + "55" : C.activeBorder}`, borderRadius: 12, padding: "11px 13px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.borderColor = C.accent + "55"; }}
              onMouseLeave={e => { e.currentTarget.style.background = activePage === "profile" ? C.cardHover : C.active; e.currentTarget.style.borderColor = activePage === "profile" ? C.accent + "55" : C.activeBorder; }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                {user.profilePicture
                  ? <img src={user.profilePicture} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${C.accent}70` }} />
                  : <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.accentSoft, border: `1.5px solid ${C.accent}70`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: C.accentText }}>{initials}</div>
                }
                <span style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: C.green, border: `2px solid ${C.sidebar}` }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.86rem", fontWeight: 500, color: C.text }}>{user.username || user.name || "You"}</div>
                <div style={{ fontSize: "0.7rem", color: C.textMuted, marginTop: 1 }}>{user.education?.[0]?.institutionName || user.education?.[0]?.institution || "Atyant"}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); logout(); }}
                style={{ background: "transparent", border: "none", padding: 6, borderRadius: 6, color: C.textSub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.active; e.currentTarget.style.color = "#f87171"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; }}
                title="Sign out">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.accent, border: "none", borderRadius: 12, padding: "11px 13px", color: "#fff", fontSize: "0.86rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              <LogIn size={15} /> Sign in
            </button>
          )}
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, overflowY: "auto", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 57, display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "0 24px", borderBottom: `1px solid ${C.sidebarBorder}`, background: C.bg, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 7, padding: "5px 12px", color: C.textMuted, fontSize: "0.75rem" }}>Free Plan</span>
            <button style={{ background: C.accent, border: "none", borderRadius: 7, padding: "5px 12px", color: "#fff", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Upgrade</button>
          </div>
        </div>
        <div style={{ flex: 1 }}>{pages[activePage]}</div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}
