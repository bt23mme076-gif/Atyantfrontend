import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Users, Clock, Phone, Video, CalendarRange, ArrowLeft,
  Check, Shield, Award, Sparkles, Gift, Lock, RefreshCw, X, Loader2
} from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";
import { api } from "../../api";

// Design tokens
const T = {
  bg: "#13121A",
  card: "#1A1823",
  cardBorder: "#322E40",
  accent: "#7567C9",
  accentSoft: "#7567C922",
  accentText: "#8E80DB",
  text: "#ECEAF3",
  textSub: "#978FAB",
  textMuted: "#5F576F",
  green: "#3DBE82",
};

const AVATAR = {
  AK: { bg: "rgba(117,103,201,0.28)", text: "#8E80DB" },
  PS: { bg: "rgba(59,130,246,0.22)",  text: "#7EB8F7" },
  RT: { bg: "rgba(61,190,130,0.22)",  text: "#3DBE82" },
};

const SESSIONS = [
  {
    id: 1,
    title: "Audio Call",
    subtitle: "Quick & Focused",
    price: 499,
    originalPrice: 699,
    duration: "30 mins",
    icon: Phone,
    color: "blue",
  },
  {
    id: 2,
    title: "Video Call",
    subtitle: "Deep Dive Review",
    price: 699,
    originalPrice: 999,
    duration: "45 mins",
    icon: Video,
    color: "gold",
    popular: true,
  },
  {
    id: 3,
    title: "Career Roadmap",
    subtitle: "Full Strategy Session",
    price: 999,
    originalPrice: 1499,
    duration: "60 mins",
    icon: CalendarRange,
    color: "green",
  },
];

const TIME_SLOTS = ["10:00 AM", "11:30 AM", "2:00 PM", "4:30 PM", "7:00 PM", "8:30 PM"];

export default function SeniorDetail({ mentor, user, onClose, onSelect, onTalkToMentor }) {
  if (!mentor) return null;
  const av = AVATAR[mentor.initials] || { bg: "rgba(150,144,171,0.2)", text: T.textSub };

  // Booking UI State
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSession, setSelectedSession] = useState(SESSIONS[1]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState(user?.username || user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [brief, setBrief] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const applyCoupon = () => {
    const code = couponCode.toUpperCase().trim();
    if (code === "FIRST50") {
      setCouponApplied(true);
      setCouponDiscount(50);
    } else if (code === "CAREER20") {
      setCouponApplied(true);
      setCouponDiscount(Math.round(selectedSession.price * 0.2));
    } else {
      alert("Invalid coupon code. Try FIRST50 or CAREER20!");
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponApplied(false);
    setCouponDiscount(0);
  };

  const handleBookingSubmit = async () => {
    setIsBooking(true);
    try {
      await api.post("/api/book-session", {
        mentor: mentor.name,
        sessionType: selectedSession.title,
        date,
        time,
        amount: selectedSession.price + 25 - couponDiscount,
        goals: [selectedSession.title],
        brief,
        name,
        email,
      });
      setShowSuccess(true);
    } catch (err) {
      alert("Booking failed. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden h-full"
      style={{ position: "relative", background: T.bg }}
    >
      {/* ── Header ── */}
      <div className="px-6 py-2.5 flex-shrink-0" style={{ borderBottom: `1px solid ${T.cardBorder}`, background: T.card }}>
        <div className="flex items-center gap-3.5 max-w-3xl mx-auto">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: av.bg, color: av.text, fontFamily: "Fraunces, serif" }}
          >
            {mentor.initials}
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold"
                style={{ color: T.text, fontFamily: "Fraunces, serif" }}>
                {mentor.name}
              </h2>
              <VerifiedBadge verifiedVia={mentor.verifiedVia} />
            </div>
            <p className="text-xs mt-0.5" style={{ color: T.textSub, fontFamily: "Inter, sans-serif" }}>
              {mentor.role}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>
              {mentor.college} · {mentor.branch}
            </p>
          </div>

          {/* Match % */}
          <div className="text-right flex-shrink-0">
            <span className="text-xl font-bold"
              style={{ color: T.accent, fontFamily: "Fraunces, serif" }}>
              {mentor.matchPct}%
            </span>
            <p className="text-xs" style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>match</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
      <div className="p-4 flex flex-col gap-3.5 max-w-3xl mx-auto">
        {/* Journey */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5"
            style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>
            Their Journey
          </p>
          <p className="text-sm leading-[1.85]"
            style={{ color: T.textSub, fontFamily: "Inter, sans-serif" }}
            dangerouslySetInnerHTML={{ __html: mentor.story }}
          />
        </div>

        {/* Outcome box */}
        <div
          className="rounded-xl p-3 flex items-start gap-3"
          style={{ background: `${T.green}10`, border: `1px solid ${T.green}30` }}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${T.green}25` }}>
            <span style={{ color: T.green, fontSize: "10px", lineHeight: 1 }}>✓</span>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: T.green, fontFamily: "Inter, sans-serif" }}>
              Outcome
            </p>
            <p className="text-sm leading-relaxed" style={{ color: T.textSub, fontFamily: "Inter, sans-serif" }}>
              {mentor.outcome}
            </p>
          </div>
        </div>

        {/* Similarity tags */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5"
            style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>
            Why You Match
          </p>
          <div className="flex flex-wrap gap-2">
            {mentor.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: T.accentSoft,
                  border: `1px solid ${T.accent}55`,
                  color: T.accentText,
                  fontFamily: "Inter, sans-serif",
                  boxShadow: `0 0 8px ${T.accent}14`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 rounded-xl overflow-hidden"
          style={{ border: `1px solid ${T.cardBorder}` }}>
          {[
            { icon: <Users size={13} />, label: "Students", value: mentor.studentsHelped },
            { icon: <Star size={13} />,  label: "Rating",   value: mentor.rating },
            { icon: <Clock size={13} />, label: "Timeline", value: mentor.timeline },
          ].map((s, i) => (
            <div key={s.label} className="p-2 text-center"
              style={{
                background: T.bg,
                borderRight: i < 2 ? `1px solid ${T.cardBorder}` : "none",
              }}>
              <div className="flex justify-center mb-1" style={{ color: T.textMuted }}>{s.icon}</div>
              <p className="text-sm font-bold" style={{ color: T.text, fontFamily: "Fraunces, serif" }}>
                {s.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: T.textMuted, fontFamily: "Inter, sans-serif" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

      </div>
      </div>

      {/* ── Fixed Footer CTA ── */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${T.cardBorder}`, background: T.card }}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => {
              if (onTalkToMentor) {
                onTalkToMentor(mentor);
              } else {
                setShowBooking(true);
                if (onSelect) onSelect();
              }
            }}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #7567C9, #5a52a8)",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              boxShadow: `0 4px 20px ${T.accent}40`,
              border: "none",
              letterSpacing: "0.01em",
              cursor: "pointer",
            }}
          >
            <Phone size={15} />
            Talk to {mentor.name.split(" ")[0]}
          </button>
        </div>
      </div>

      {/* ── Slide-up Booking Sheet ── */}
      <AnimatePresence>
        {showBooking && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            style={{
              position: "absolute",
              inset: 0,
              background: T.bg,
              zIndex: 30,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Success state overlay */}
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#1A1823",
                  zIndex: 40,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px",
                  textAlign: "center"
                }}
              >
                <div className="w-16 h-16 rounded-full bg-[#3DBE82]/10 border border-[#3DBE82]/30 flex items-center justify-center mb-4">
                  <Check size={32} className="text-[#3DBE82]" />
                </div>
                <h3 className="text-xl font-bold text-[#ECEAF3] mb-2">Booking Confirmed! 🎉</h3>
                <p className="text-xs text-[#978FAB] leading-relaxed max-w-xs mb-6">
                  Your session with {mentor.name.split(" ")[0]} has been booked. A calendar invite and Google Meet link have been sent to <strong>{email}</strong>.
                </p>
                <button
                  onClick={() => {
                    setShowBooking(false);
                    setShowSuccess(false);
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#322E40] hover:bg-[#322E40] transition border border-transparent"
                >
                  Back to Profile
                </button>
              </motion.div>
            )}

            {/* Booking Sheet Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#322E40] bg-[#1A1823]">
              <button
                onClick={() => setShowBooking(false)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#978FAB] hover:text-[#ECEAF3] transition"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5F576F]">
                Book a Session
              </span>
              <div className="w-8" />
            </div>

            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* 1. Format */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#5F576F]">
                  1. Call Format
                </label>
                <div className="space-y-1.5">
                  {SESSIONS.map(s => {
                    const isSelected = selectedSession.id === s.id;
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSession(s);
                          removeCoupon();
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-[#7567C9] bg-[#7567C9]/5"
                            : "border-[#322E40] bg-[#1A1823] hover:border-[#7567C9]/30"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${isSelected ? "bg-[#7567C9] text-white" : "bg-[#7567C9]/10 text-[#7567C9]"}`}>
                            <Icon size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#ECEAF3]">{s.title}</p>
                            <p className="text-[10px] text-[#978FAB]">{s.duration} · {s.subtitle}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#8E80DB]">₹{s.price}</p>
                          <p className="text-[9px] text-[#5F576F] line-through">₹{s.originalPrice}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5F576F]">
                    2. Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-[#1A1823] border border-[#322E40] rounded-xl px-3 py-2 text-xs text-[#ECEAF3] outline-none focus:border-[#7567C9]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5F576F]">
                    3. Time Slot
                  </label>
                  <select
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full bg-[#1A1823] border border-[#322E40] rounded-xl px-3 py-2 text-xs text-[#ECEAF3] outline-none focus:border-[#7567C9]"
                  >
                    <option value="">Select time...</option>
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t} IST</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Personal Details */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5F576F]">
                  4. Your Details
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#1A1823] border border-[#322E40] rounded-xl px-3 py-2 text-xs text-[#ECEAF3] outline-none focus:border-[#7567C9]"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#1A1823] border border-[#322E40] rounded-xl px-3 py-2 text-xs text-[#ECEAF3] outline-none focus:border-[#7567C9]"
                  />
                </div>
                <textarea
                  placeholder="What do you want to cover? (optional)"
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                  rows={2}
                  className="w-full bg-[#1A1823] border border-[#322E40] rounded-xl p-2.5 text-xs text-[#ECEAF3] outline-none focus:border-[#7567C9] resize-none"
                />
              </div>

              {/* 4. Coupons */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5F576F]">
                  5. Coupon Code
                </label>
                {!couponApplied ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. FIRST50"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      className="flex-1 bg-[#1A1823] border border-[#322E40] rounded-xl px-3 py-2 text-xs text-[#ECEAF3] outline-none focus:border-[#7567C9] uppercase"
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-4 py-2 bg-[#322E40] hover:bg-[#322E40] text-xs font-bold text-[#ECEAF3] rounded-xl transition"
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-[#3DBE82]/10 border border-[#3DBE82]/30 rounded-xl">
                    <span className="text-xs text-[#3DBE82] font-semibold">✓ Coupon Applied (Saved ₹{couponDiscount})</span>
                    <button onClick={removeCoupon} className="text-[#5F576F] hover:text-[#f87171] p-1">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* 5. Summary */}
              <div className="p-3.5 rounded-xl border border-[#322E40] bg-[#1A1823] space-y-2">
                <div className="flex justify-between text-[11px] text-[#978FAB]">
                  <span>Session Fee</span>
                  <span>₹{selectedSession.price}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#978FAB]">
                  <span>Platform Fee</span>
                  <span>₹25</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-[11px] text-[#3DBE82]">
                    <span>Discount</span>
                    <span>−₹{couponDiscount}</span>
                  </div>
                )}
                <div className="border-t border-[#322E40] pt-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-[#ECEAF3]">Total Due</span>
                  <span className="text-base font-black text-[#8E80DB]">
                    ₹{selectedSession.price + 25 - couponDiscount}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Pay Button */}
            <div className="p-4 border-t border-[#322E40] bg-[#1A1823]">
              <button
                disabled={isBooking || !date || !time || !name || !email}
                onClick={handleBookingSubmit}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #7567C9, #5a52a8)",
                  color: "#fff",
                  border: "none",
                  boxShadow: `0 4px 15px ${T.accent}30`
                }}
              >
                {isBooking ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Lock size={13} /> Pay Securely ₹{selectedSession.price + 25 - couponDiscount}
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-[#5F576F]">
                <Shield size={10} /> Secure SSL · Razorpay Gateway
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
