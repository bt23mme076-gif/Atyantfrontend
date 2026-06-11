import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  FiSearch,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiPhone,
  FiShield,
  FiTarget,
  FiVideo,
  FiStar,
  FiMessageCircle,
  FiChevronDown,
  FiChevronUp,
  FiGift,
  FiZap,
  FiTrendingUp,
  FiUsers,
  FiArrowRight,
  FiX,
  FiCheck,
  FiHeart,
  FiShare2,
  FiRefreshCw,
  FiAlertCircle,
  FiLinkedin,
  FiTwitter,
  FiMail,
  FiBookOpen,
  FiCpu,
  FiCode,
  FiMapPin,
  FiExternalLink,
  FiInfo,
  FiThumbsUp,
  FiArrowLeft,
  FiLock,
} from "react-icons/fi";
import { MdOutlineRoute, MdVerified, MdWorkspacePremium } from "react-icons/md";
import { HiSparkles } from "react-icons/hi2";
import { RiMedalLine } from "react-icons/ri";
import { api, paymentAPI, servicesAPI } from "../api";

// Lazily inject the Razorpay Checkout script (once).
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_FEE = 25;
const MAX_GOALS = 3;

const SESSIONS = [
  {
    id: "text-qa",
    serviceId: "text-qa",
    title: "Text Q&A",
    subtitle: "Quick doubt, one specific question",
    price: 49,
    originalPrice: 49,
    duration: "48hr async",
    icon: FiMessageCircle,
    badge: "Quick doubt",
    color: "blue",
    bestFor: "Quick doubt, one specific question",
    outcomes: ["Quick doubt solved async"],
    popular: false,
    tag: null,
  },
  {
    id: "audio-call",
    serviceId: "audio-call",
    title: "Audio Call",
    subtitle: "Resume talk, strategy, no video needed",
    price: 99,
    originalPrice: 99,
    duration: "25 min",
    icon: FiPhone,
    badge: "Voice call",
    color: "blue",
    bestFor: "Resume talk, strategy, no video needed",
    outcomes: ["Resume talk & strategy"],
    popular: false,
    tag: null,
  },
  {
    id: "video-call",
    serviceId: "video-call",
    title: "Video Call",
    subtitle: "Mock interview, screen share, deep dive",
    price: 299,
    originalPrice: 299,
    duration: "45 min",
    icon: FiVideo,
    badge: "Most booked",
    color: "gold",
    bestFor: "Mock interview, screen share, deep dive",
    outcomes: ["Mock interview & deep dive"],
    popular: true,
    tag: "⭐ RECOMMENDED",
  },
  {
    id: "resume-review",
    serviceId: "resume-review",
    title: "Resume Review",
    subtitle: "Written feedback on PDF, no call needed",
    price: 199,
    originalPrice: 199,
    duration: "48hr async",
    icon: FiBookOpen,
    badge: "PDF feedback",
    color: "green",
    bestFor: "Written feedback on PDF, no call needed",
    outcomes: ["Written feedback on PDF"],
    popular: false,
    tag: null,
  },
];

const TIME_SLOTS = [
  { id: 1, time: "10:00", period: "Morning", available: true, spotsLeft: 1 },
  { id: 2, time: "11:30", period: "Morning", available: true, spotsLeft: 3 },
  { id: 3, time: "14:00", period: "Afternoon", available: true, spotsLeft: 2 },
  { id: 4, time: "16:30", period: "Afternoon", available: false, spotsLeft: 0 },
  { id: 5, time: "19:00", period: "Evening", available: true, spotsLeft: 4 },
  { id: 6, time: "20:30", period: "Evening", available: true, spotsLeft: 2 },
];

const FOCUS_AREAS = [
  { label: "Resume review", icon: FiCheckCircle, desc: "ATS-ready resume" },
  { label: "AI/ML roadmap", icon: FiCpu, desc: "Structured learning path" },
  { label: "Mock interview", icon: FiMessageCircle, desc: "Simulate real interviews" },
  { label: "Project selection", icon: FiCode, desc: "Portfolio-worthy projects" },
  { label: "Job strategy", icon: FiTrendingUp, desc: "Application game plan" },
  { label: "Portfolio review", icon: FiBookOpen, desc: "GitHub & projects audit" },
];

const AGENDA_STEPS = [
  {
    title: "Pre-session Prep",
    desc: "Share your profile 24hrs before. Arjun reviews your resume, GitHub, and goals so the session starts fast.",
    icon: FiCheckCircle,
    color: "blue",
  },
  {
    title: "Live Session",
    desc: "Screen-shared, action-packed session with live feedback, roadmap building, and Q&A.",
    icon: FiZap,
    color: "gold",
  },
  {
    title: "Post-session Notes",
    desc: "Detailed notes, curated resources, and a 30-day action checklist delivered within 24 hours.",
    icon: FiGift,
    color: "green",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "SDE Intern at Google",
    college: "IIT Bombay, 3rd Year",
    avatar: "PS",
    rating: 5,
    text: "Arjun's roadmap session completely changed my approach. Got my first interview call within 3 weeks of following his plan. The resume review alone was worth 10x the price.",
    date: "2 weeks ago",
    session: "Career Roadmap",
    verified: true,
    helpful: 24,
  },
  {
    name: "Rahul Verma",
    role: "ML Engineer at Flipkart",
    college: "NIT Trichy, 2023 Grad",
    avatar: "RV",
    rating: 5,
    text: "The mock interview prep was incredibly detailed. He pointed out gaps I never noticed. The project feedback helped me build something that actually impressed interviewers.",
    date: "1 month ago",
    session: "Video Call",
    verified: true,
    helpful: 31,
  },
  {
    name: "Sneha Patel",
    role: "Data Scientist at Amazon",
    college: "BITS Pilani",
    avatar: "SP",
    rating: 5,
    text: "Best investment I made in my career. The 90-day roadmap was practical and achievable. Landed my dream role at Amazon! Arjun's advice on ML projects was spot on.",
    date: "3 weeks ago",
    session: "Career Roadmap",
    verified: true,
    helpful: 47,
  },
  {
    name: "Karan Mehta",
    role: "Backend Dev at Zomato",
    college: "VIT Vellore",
    avatar: "KM",
    rating: 5,
    text: "From no internship to Zomato in 4 months. The job strategy session gave me a clear picture of what companies actually look for. Highly recommend to any CS student.",
    date: "5 days ago",
    session: "Audio Call",
    verified: true,
    helpful: 18,
  },
];

const FAQS = [
  {
    q: "What if I need to reschedule?",
    a: "You can reschedule up to 4 hours before your session at no extra cost. Just use the reschedule link in your confirmation email. We understand plans change!",
    icon: FiCalendar,
  },
  {
    q: "Will I get session notes?",
    a: "Yes! Every session includes detailed handwritten notes, action items, and curated resources (courses, projects, articles) sent to your email within 24 hours of the call.",
    icon: FiBookOpen,
  },
  {
    q: "Can I book a follow-up session?",
    a: "Absolutely. Returning students get 15% off their next session automatically. Just use the same email you booked with. A follow-up link will also be in your post-session email.",
    icon: FiHeart,
  },
  {
    q: "What platform is used for calls?",
    a: "Audio calls use WhatsApp or regular phone (your choice). Video calls use Google Meet with screen-sharing. You'll get the link 30 minutes before your session.",
    icon: FiVideo,
  },
  {
    q: "Is there a refund policy?",
    a: "100% refund if the session doesn't happen or you're unsatisfied within 48 hours. No questions asked. Your trust matters more than the fee.",
    icon: FiShield,
  },
  {
    q: "How should I prepare?",
    a: "Share your resume, GitHub link, and top 3 goals when booking. The more context Arjun has, the more impactful your session will be.",
    icon: FiInfo,
  },
];

const MENTOR = {
  _id: "68e734e869e09ade6196daa2",
  name: "Aditya Khanna",
  title: "Decision Analytics Associate at ZS",
  subtitle: "Data Analytics & Business Strategy Mentor",
  location: "Nagpur, India",
  bio: "Decision Analytics Associate at ZS, VNIT Nagpur. Skilled in data-driven problem solving, analytics, and applying business insights to create practical impact.",
  skills: [
    "Decision Analytics",
    "Data Analysis",
    "Business Insights",
    "Problem Solving",
    "Consulting",
    "Strategy",
    "Project Management",
    "Entrepreneurship",
    "Team Collaboration"
  ],
  stats: [
    { value: "50+", label: "Sessions taken", icon: FiUsers },
    { value: "4.8/5", label: "Avg. rating", icon: FiStar },
    { value: "ZS Associates", label: "Current Company", icon: FiTrendingUp },
    { value: "95%", label: "Satisfaction", icon: FiHeart },
  ],
  badges: ["VNIT Nagpur", "ZS Associate", "Analytics Pro"],
  socials: {
    linkedin: "#", // Add his actual LinkedIn link here when available
    twitter: "#",
    email: "adikhanna532@gmail.com",
  },
  responseTime: "1 hr",
  slotsLeft: 5,
};

const VALID_COUPONS = {
  FIRST50: { type: "fixed", value: 50, desc: "₹50 off for first-time students" },
  CAREER20: { type: "percent", value: 20, desc: "20% off on any session" },
  SUMMER15: { type: "percent", value: 15, desc: "Summer special discount" },
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "Not selected";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function generateBookingId() {
  return `MNT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CountdownBanner() {
  const TARGET_HOURS = 5;
  const startRef = useRef(Date.now());

  const [secondsLeft, setSecondsLeft] = useState(TARGET_HOURS * 3600);

  useEffect(() => {
    const t = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const remaining = Math.max(0, TARGET_HOURS * 3600 - elapsed);
      setSecondsLeft(remaining);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const h = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
  const s = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-red-200/60 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 dark:border-red-900/30 dark:from-red-950/30 dark:via-orange-950/20 dark:to-amber-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/25">
            <FiZap className="text-white" size={14} />
          </div>
          <div>
            <p className="text-sm font-bold text-red-800 dark:text-red-300">
              🔥 Early-bird pricing ends soon
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">
              Save up to ₹500 on any session before the timer runs out
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          {[h, m, s].map((unit, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-sm font-black text-white shadow-lg shadow-red-500/30">
                {unit}
              </span>
              {i < 2 && (
                <span className="text-lg font-black text-red-500">:</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressStepper({ percent }) {
  const steps = ["Session", "Schedule", "Details", "Payment"];
  return (
    <div className="mb-8 rounded-2xl border p-5 shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)]">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--c-textSub)]">Booking progress</span>
        <span className="text-xs font-bold text-[#7567C9]">{percent}% complete</span>
      </div>
      <div className="relative">
        <div className="h-1.5 w-full rounded-full bg-[var(--c-active)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7567C9] to-[#8E80DB] transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-4">
          {steps.map((step, i) => {
            const done = percent >= (i + 1) * 25;
            return (
              <div key={step} className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-all duration-300 ${done
                    ? "bg-[#7567C9] text-white shadow-[#7567C9]/30"
                    : "bg-black/5 text-[var(--c-textMuted)] bg-[var(--c-active)] text-[var(--c-textSub)]"
                    }`}
                >
                  {done ? <FiCheck size={12} /> : i + 1}
                </div>
                <span
                  className={`hidden text-[10px] font-semibold sm:block ${done ? "text-[#7567C9]" : "text-gray-400"}`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MentorCard({ mentor }) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)]">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7567C9]/3 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#7567C9]/5 pointer-events-none" />

      <div className="relative p-6 md:p-8">
        {/* Top row */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="relative h-24 w-24 overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#7567C9] to-[#a07035] ring-4 ring-[#7567C9]/20 shadow-xl shadow-[#7567C9]/20">
              <img
                src="/mentor-photo.png"
                alt={mentor.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white">
                {mentor.name ? mentor.name.split(" ").map(n => n[0]).join("") : "KT"}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-400 dark:border-[var(--c-card)]">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black text-[var(--c-text)] sm:text-3xl">
                    {mentor.name}
                  </h2>
                  <MdVerified className="text-blue-500 flex-shrink-0" size={20} />
                </div>
                <p className="mt-0.5 text-sm font-semibold text-[#7567C9]">{mentor.title}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--c-textMuted)]">
                  <FiMapPin size={11} />
                  {mentor.location}
                </div>
              </div>

              {/* Social + rating */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-1 text-sm font-bold text-[var(--c-text)]">4.9</span>
                  <span className="text-xs text-[var(--c-textMuted)]">(94 reviews)</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { icon: FiLinkedin, href: mentor.socials?.linkedin || "#" },
                    { icon: FiTwitter, href: mentor.socials?.twitter || "#" },
                    { icon: FiMail, href: `mailto:${mentor.socials?.email || ""}` },
                  ].map(({ icon: Icon, href }) => (
                    <a
                      key={href}
                      href={href}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border text-[var(--c-textSub)] transition hover:border-[#7567C9] hover:text-[#7567C9] border-[var(--c-cardBorder)] text-[var(--c-textMuted)]"
                    >
                      <Icon size={13} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Bio */}
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--c-textSub)]">
              {mentor.bio}
            </p>

            {/* Skill tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {mentor.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-[#7567C9]/20 bg-[#7567C9]/5 px-3 py-1 text-xs font-semibold text-[var(--c-accentText)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online now · Responds in {mentor.responseTime}
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 dark:border-orange-800 dark:text-orange-400">
            <FiClock size={11} />
            Only {mentor.slotsLeft} slots left today
          </div>
          {mentor.badges.map((b) => (
            <div key={b} className="flex items-center gap-1.5 rounded-full border bg-[var(--c-active)] px-3 py-1.5 text-xs font-semibold text-[var(--c-textSub)] border-[var(--c-cardBorder)] bg-[var(--c-active)] text-[var(--c-textMuted)]">
              <RiMedalLine size={11} className="text-[#7567C9]" />
              {b}
            </div>
          ))}
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {mentor.stats.map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="group rounded-2xl border bg-[var(--c-active)] p-4 transition-all hover:border-[#7567C9]/40 hover:shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-active)]"
            >
              <Icon size={16} className="mb-2 text-[#7567C9]" />
              <div className="text-xl font-black text-[var(--c-text)]">{value}</div>
              <div className="mt-0.5 text-xs text-[var(--c-textSub)]">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session, selected, onSelect }) {
  const Icon = session.icon;
  const isSelected = selected.id === session.id;
  const discount = Math.round(((session.originalPrice - session.price) / session.originalPrice) * 100);

  return (
    <button
      type="button"
      onClick={() => onSelect(session)}
      className={`group relative flex min-h-[300px] flex-col rounded-[1.25rem] border p-5 text-left transition-all duration-300 ${isSelected
        ? "border-[#7567C9] bg-gradient-to-b from-[var(--c-card)] to-white shadow-xl shadow-[#7567C9]/15 ring-1 ring-[#7567C9]/40 dark:from-[var(--c-active)] dark:to-[var(--c-card)]"
        : "hover:border-[#7567C9]/50 hover:shadow-md border-[var(--c-cardBorder)] bg-[var(--c-card)]"
        }`}
    >
      {/* Tag */}
      {session.tag && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="rounded-full bg-gradient-to-r from-[#7567C9] to-[#8E80DB] px-4 py-1 text-[11px] font-black text-white shadow-lg shadow-[#7567C9]/30">
            {session.tag}
          </span>
        </div>
      )}

      {/* Discount ribbon */}
      <div className="absolute right-4 top-4">
        <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-400">
          {discount}% OFF
        </div>
      </div>

      {/* Icon + badge */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={`rounded-2xl p-3 transition-all duration-300 ${isSelected
            ? "bg-gradient-to-br from-[#7567C9] to-[#5a52a8] text-white shadow-lg shadow-[#7567C9]/30"
            : "bg-[#7567C9]/10 text-[#7567C9] group-hover:bg-[#7567C9]/20"
            }`}
        >
          <Icon size={26} />
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-xl font-black text-[var(--c-text)]">{session.title}</h3>
        <p className="text-xs font-semibold text-[#7567C9]">{session.subtitle}</p>
      </div>

      {/* Description */}
      <p className="mt-3 flex-1 text-sm leading-6 text-[var(--c-textSub)]">
        {session.bestFor}
      </p>

      {/* Outcomes */}
      <div className="mt-4 space-y-1.5">
        {session.outcomes.map((o) => (
          <div key={o} className="flex items-center gap-2 text-xs text-[var(--c-textSub)] text-[var(--c-textMuted)]">
            <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isSelected ? "bg-[#7567C9]" : "bg-emerald-500"}`} />
            {o}
          </div>
        ))}
      </div>

      {/* Price + check */}
      <div className="mt-5 flex items-end justify-between border-t pt-4 border-[var(--c-cardBorder)]">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--c-accentText)]">
              ₹{session.price}
            </span>
            <span className="text-sm text-[var(--c-textMuted)] line-through">
              ₹{session.originalPrice}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--c-textMuted)]">
            <FiClock size={11} />
            {session.duration}
          </div>
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${isSelected
            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
            : "bg-black/5 text-[var(--c-textMuted)] group-hover:bg-[#7567C9]/15 group-hover:text-[#7567C9] bg-[var(--c-active)]"
            }`}
        >
          <FiCheck size={16} />
        </div>
      </div>
    </button>
  );
}

function SchedulePicker({ mentorId, date, setDate, time, setTime, today, refreshKey }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  // Fetch slots whenever date or mentorId changes
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTime('');

    const url = mentorId && mentorId !== 'null'
      ? `/api/mentors/${mentorId}/slots?date=${date}`
      : `/api/slots?date=${date}`;

    api.get(url)
      .then(res => { if (!cancelled) setSlots(res.slots); })
      .catch(() => { if (!cancelled) setError('Could not load slots. Please try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [date, mentorId, refreshKey]);

  const visibleSlots = showAll ? slots : slots.slice(0, 4);

  return (
    <div className="rounded-[1.5rem] border p-6 shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)] md:p-8">
      <h2 className="text-xl font-black text-[var(--c-text)]">Schedule</h2>
      <p className="mt-1 text-sm text-[var(--c-textSub)]">Pick your preferred date and time slot.</p>

      {/* Date */}
      <div className="mt-6">
        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--c-text)]">
          <FiCalendar size={14} className="text-[#7567C9]" />
          Preferred Date
        </label>
        <input
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-2xl border bg-[var(--c-bg)] p-4 text-sm outline-none transition focus:border-[#7567C9] focus:ring-2 focus:ring-[#7567C9]/20 border-[var(--c-cardBorder)] text-[var(--c-text)]"
        />
      </div>

      {/* Slots */}
      {date && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--c-text)]">
              <FiClock size={14} className="text-[#7567C9]" />
              Time Slots
            </div>
            {!loading && slots.length > 4 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-bold text-[#7567C9] hover:underline"
              >
                {showAll ? 'Show less' : `Show all ${slots.length}`}
              </button>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl border border-[var(--c-cardBorder)] bg-[var(--c-active)]"
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-800 bg-red-950/20 p-4 text-sm text-red-400">
              <FiAlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && slots.length === 0 && (
            <div className="rounded-2xl border border-[var(--c-cardBorder)] bg-[var(--c-active)] p-6 text-center text-sm text-[var(--c-textSub)]">
              No slots available for this date. Try another day.
            </div>
          )}

          {/* Slot grid */}
          {!loading && !error && slots.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {visibleSlots.map((slot) => {
                const isSelected = time === slot.time;
                const booked = !slot.available;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={booked}
                    onClick={() => !booked && setTime(slot.time)}
                    className={`relative flex flex-col items-center rounded-2xl border py-3.5 text-sm font-bold transition-all ${booked
                      ? 'cursor-not-allowed border-[var(--c-cardBorder)] text-[var(--c-textSub)] opacity-50'
                      : isSelected
                        ? 'border-[#7567C9] bg-gradient-to-b from-[#7567C9] to-[#5a52a8] text-white shadow-lg shadow-[#7567C9]/30'
                        : 'border-[var(--c-cardBorder)] bg-[var(--c-bg)] text-[var(--c-text)] hover:border-[#7567C9]/60'
                      }`}
                  >
                    {booked ? (
                      <>
                        <span>{slot.time}</span>
                        <span className="mt-0.5 text-[10px] font-semibold text-red-400">Booked</span>
                      </>
                    ) : (
                      <>
                        <span>{slot.time}</span>
                        <span className={`mt-0.5 text-[10px] font-semibold ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                          {slot.period}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation pill */}
      {date && time && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-800 bg-emerald-950/20 p-4">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-900/40">
            <FiCheckCircle className="text-emerald-400" size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-300">Slot confirmed!</p>
            <p className="text-xs text-emerald-500">{formatDate(date)} at {time} IST</p>
          </div>
        </div>
      )}
    </div>
  );
}

function UserDetailsForm({ name, setName, email, setEmail, phone, setPhone }) {
  return (
    <div className="rounded-[1.5rem] border p-6 shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)] md:p-8">
      <h2 className="text-xl font-black text-[var(--c-text)]">Your Details</h2>
      <p className="mt-1 text-sm text-[var(--c-textSub)]">
        We'll send your confirmation and meeting link here.
      </p>

      <div className="mt-6 space-y-4">
        {[
          { label: "Full Name", value: name, setter: setName, type: "text", placeholder: "Rahul Sharma", icon: null },
          { label: "Email Address", value: email, setter: setEmail, type: "email", placeholder: "rahul@example.com", icon: null },
          { label: "Phone (optional)", value: phone, setter: setPhone, type: "tel", placeholder: "+91 98765 43210", icon: null },
        ].map(({ label, value, setter, type, placeholder }) => (
          <div key={label}>
            <label className="mb-2 block text-sm font-bold text-[var(--c-text)]">
              {label}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-2xl border bg-[var(--c-card)] px-4 py-3.5 text-sm outline-none transition placeholder:text-[var(--c-textMuted)] focus:border-[#7567C9] focus:ring-2 focus:ring-[#7567C9]/20 border-[var(--c-cardBorder)] bg-[var(--c-bg)] text-[var(--c-text)]"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800">
        <FiShield size={14} className="flex-shrink-0 text-blue-500" />
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Your information is encrypted and never shared with third parties.
        </p>
      </div>
    </div>
  );
}

function SessionBriefForm({ selectedGoals, toggleGoal, brief, setBrief }) {
  return (
    <div className="rounded-[1.5rem] border p-6 shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)] md:p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-[var(--c-text)]">Session Brief</h2>
          <p className="mt-1 text-sm text-[var(--c-textSub)]">
            Select up to {MAX_GOALS} focus areas.
          </p>
        </div>
        <span className="rounded-full border border-[#7567C9]/30 bg-[var(--c-active)] px-2.5 py-1 text-xs font-bold text-[var(--c-accentText)] bg-[var(--c-active)] text-[var(--c-accentText)]">
          {selectedGoals.length}/{MAX_GOALS}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {FOCUS_AREAS.map((goal) => {
          const Icon = goal.icon;
          const active = selectedGoals.includes(goal.label);
          const maxed = !active && selectedGoals.length >= MAX_GOALS;
          return (
            <button
              key={goal.label}
              type="button"
              onClick={() => toggleGoal(goal.label)}
              disabled={maxed}
              className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${active
                ? "border-[#7567C9] bg-[var(--c-card)] shadow-sm bg-[var(--c-active)]"
                : maxed
                  ? "cursor-not-allowed opacity-40 border-[var(--c-cardBorder)]"
                  : "hover:border-[#7567C9]/40 border-[var(--c-cardBorder)]"
                }`}
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition ${active
                  ? "bg-[#7567C9] text-white"
                  : "bg-[#7567C9]/10 text-[#7567C9]"
                  }`}
              >
                <Icon size={16} />
              </div>
              <div>
                <div
                  className={`text-sm font-bold ${active ? "text-[var(--c-accentText)]" : "text-[var(--c-text)]"}`}
                >
                  {goal.label}
                </div>
                <div className="text-xs text-[var(--c-textSub)]">{goal.desc}</div>
              </div>
              {active && (
                <FiCheck size={14} className="ml-auto flex-shrink-0 text-[#7567C9]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-bold text-[var(--c-text)]">
          Additional context{""}
          <span className="font-normal text-[var(--c-textMuted)]">(optional but recommended)</span>
        </label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          maxLength={600}
          rows={4}
          placeholder="Example: I'm in 3rd year CSE, know Python basics, and want a roadmap to crack ML internships before my final year. Currently on LeetCode for 2 weeks."
          className="w-full resize-none rounded-2xl border bg-[var(--c-card)] p-4 text-sm leading-6 outline-none transition placeholder:text-[var(--c-textMuted)] focus:border-[#7567C9] focus:ring-2 focus:ring-[#7567C9]/20 border-[var(--c-cardBorder)] bg-[var(--c-bg)] text-[var(--c-text)]"
        />
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-xs text-[var(--c-textMuted)]">
            More context = more impactful session
          </p>
          <span className={`text-xs font-semibold ${brief.length > 500 ? "text-red-500" : "text-gray-400"}`}>
            {brief.length}/600
          </span>
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection({ active, setActive }) {
  const [helpfulClicked, setHelpfulClicked] = useState({});

  return (
    <div className="rounded-[1.5rem] border p-6 shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)] md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--c-text)]">
            What Students Say
          </h2>
          <p className="mt-1 text-sm text-[var(--c-textSub)]">
            {TESTIMONIALS.length} verified reviews · 4.9 average rating
          </p>
        </div>
        <div className="flex items-center gap-1">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-300 ${active === i ? "h-2 w-6 bg-[#7567C9]" : "h-2 w-2 bg-black/10 hover:bg-black/20 bg-[var(--c-active)]"
                }`}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={t.name}
            className={`rounded-2xl border p-5 transition-all duration-500 ${active === i
              ? "border-[#7567C9]/40 bg-gradient-to-br from-[var(--c-card)] to-white shadow-md dark:from-[var(--c-active)] dark:to-[var(--c-card)]"
              : "bg-[var(--c-active)] border-[var(--c-cardBorder)] bg-[var(--c-active)]"
              }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7567C9] to-[#a07035] text-sm font-black text-white shadow-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-[var(--c-text)]">
                      {t.name}
                    </span>
                    {t.verified && (
                      <MdVerified size={13} className="text-blue-500" />
                    )}
                  </div>
                  <div className="text-xs text-[var(--c-textSub)]">{t.role}</div>
                  <div className="text-[10px] text-[var(--c-textMuted)]">{t.college}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex">
                  {[...Array(t.rating)].map((_, j) => (
                    <FiStar key={j} size={11} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="rounded-full border bg-[var(--c-card)] px-2 py-0.5 text-[10px] font-semibold text-[var(--c-textSub)] border-[var(--c-cardBorder)] bg-[var(--c-card)]">
                  {t.session}
                </span>
              </div>
            </div>

            {/* Review text */}
            <p className="mt-4 text-sm leading-6 text-[var(--c-textSub)]">
              "{t.text}"
            </p>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[var(--c-textMuted)]">{t.date}</span>
              <button
                onClick={() =>
                  setHelpfulClicked((prev) => ({ ...prev, [i]: !prev[i] }))
                }
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${helpfulClicked[i]
                  ? "bg-[#7567C9]/10 text-[#7567C9]"
                  : "bg-black/5 text-[var(--c-textSub)] hover:bg-[#7567C9]/10 hover:text-[#7567C9] bg-[var(--c-active)]"
                  }`}
              >
                <FiThumbsUp size={11} />
                Helpful ({t.helpful + (helpfulClicked[i] ? 1 : 0)})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgendaSection() {
  const colorMap = {
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600 dark:text-blue-400",
      ring: "ring-blue-200 dark:ring-blue-800",
      num: "bg-blue-500",
    },
    gold: {
      bg: "bg-[var(--c-active)]",
      text: "text-[#7567C9]",
      ring: "ring-[#7567C9]/20",
      num: "bg-[#7567C9]",
    },
    green: {
      bg: "bg-emerald-100",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-200 dark:ring-emerald-800",
      num: "bg-emerald-500",
    },
  };

  return (
    <div className="rounded-[1.5rem] border p-6 shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)] md:p-8">
      <h2 className="text-xl font-black text-[var(--c-text)]">
        What Happens After Booking
      </h2>
      <p className="mt-1 text-sm text-[var(--c-textSub)]">
        A structured 3-part experience built for maximum impact.
      </p>

      <div className="relative mt-8">
        {/* Connector line */}
        <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-blue-300 via-[#7567C9] to-emerald-300 opacity-30 dark:opacity-20 hidden md:block" />

        <div className="space-y-5">
          {AGENDA_STEPS.map((step, i) => {
            const c = colorMap[step.color];
            const Icon = step.icon;
            return (
              <div key={step.title} className="group flex gap-5">
                <div className="relative flex-shrink-0">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c.bg} ring-2 ${c.ring} shadow-sm`}
                  >
                    <Icon size={20} className={c.text} />
                  </div>
                  <div
                    className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full ${c.num} text-[10px] font-black text-white shadow`}
                  >
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1 rounded-2xl border bg-[var(--c-active)] p-5 transition group-hover:group-hover:shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-active)]">
                  <h3 className="font-black text-[var(--c-text)]">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--c-textSub)]">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FAQSection() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="rounded-[1.5rem] border p-6 shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)] md:p-8">
      <h2 className="text-xl font-black text-[var(--c-text)]">
        Frequently Asked Questions
      </h2>
      <p className="mt-1 text-sm text-[var(--c-textSub)]">
        Everything you need to know before booking.
      </p>

      <div className="mt-6 space-y-2">
        {FAQS.map((faq, i) => {
          const Icon = faq.icon;
          const open = expanded === i;
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-2xl border transition-all ${open
                ? "border-[#7567C9]/30 shadow-sm"
                : "border-[var(--c-cardBorder)]"
                }`}
            >
              <button
                onClick={() => setExpanded(open ? null : i)}
                className="flex w-full items-center gap-4 p-5 text-left"
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition ${open
                    ? "bg-[#7567C9] text-white"
                    : "bg-[#7567C9]/10 text-[#7567C9]"
                    }`}
                >
                  <Icon size={14} />
                </div>
                <span className="flex-1 text-sm font-bold text-[var(--c-text)]">
                  {faq.q}
                </span>
                <div
                  className={`flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                >
                  <FiChevronDown
                    size={16}
                    className={open ? "text-[#7567C9]" : "text-gray-400"}
                  />
                </div>
              </button>
              {open && (
                <div className="border-t px-5 pb-5 pt-3 border-[var(--c-cardBorder)]">
                  <p className="text-sm leading-7 text-[var(--c-textSub)]">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingSidebar({
  selectedSession,
  date,
  time,
  name,
  selectedGoals,
  couponCode,
  setCouponCode,
  couponApplied,
  couponDiscount,
  couponMeta,
  applyCoupon,
  removeCoupon,
  isFormValid,
  showPayment,
  isBooking,
  handleContinue,
  handleBooking,
  setShowPayment,
  onReset,
}) {
  const sessionDiscount = selectedSession.originalPrice - selectedSession.price;
  const subtotal = selectedSession.price + PLATFORM_FEE;
  const total = subtotal - couponDiscount;
  const totalSaved = sessionDiscount + couponDiscount;

  return (
    <div className="space-y-4">
      {/* Main summary card */}
      <div className="rounded-[1.5rem] border shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6 border-[var(--c-cardBorder)]">
          <div>
            <h2 className="text-xl font-black text-[var(--c-text)]">
              Booking Summary
            </h2>
            <p className="mt-0.5 text-xs text-[var(--c-textSub)]">Review before payment</p>
          </div>
          <button
            onClick={onReset}
            className="rounded-xl border p-2 text-[var(--c-textMuted)] transition hover:border-red-300 hover:text-red-500 border-[var(--c-cardBorder)]"
            title="Reset selections"
          >
            <FiRefreshCw size={14} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Session info */}
          <div className="rounded-2xl bg-[var(--c-active)] p-4 bg-[var(--c-active)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7567C9]/10 text-[#7567C9]">
                {(() => {
                  const Icon = selectedSession.icon;
                  return <Icon size={18} />;
                })()}
              </div>
              <div>
                <div className="font-black text-[var(--c-text)]">
                  {selectedSession.title}
                </div>
                <div className="text-xs text-[var(--c-textSub)]">{selectedSession.duration} · {selectedSession.subtitle}</div>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3">
            {[
              ["Date", date ? formatDate(date) : "Not selected"],
              ["Time", time ? `${time} IST` : "Not selected"],
              ["Name", name || "Not entered"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span
                  className={`font-semibold ${value.includes("Not") ? "text-gray-400" : "text-[var(--c-text)]"
                    }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="rounded-2xl border p-4 space-y-3 border-[var(--c-cardBorder)]">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Session fee</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--c-textMuted)] line-through">
                  ₹{selectedSession.originalPrice}
                </span>
                <span className="font-bold text-[var(--c-text)]">
                  ₹{selectedSession.price}
                </span>
              </div>
            </div>
            {sessionDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600 dark:text-emerald-400">Early-bird discount</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  −₹{sessionDiscount}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Platform fee</span>
              <span className="font-bold text-[var(--c-text)]">₹{PLATFORM_FEE}</span>
            </div>
            {couponApplied && couponMeta && (
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <FiGift size={12} />
                  <span>
                    {couponCode.toUpperCase()} applied
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    −₹{couponDiscount}
                  </span>
                  <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500">
                    <FiX size={12} />
                  </button>
                </div>
              </div>
            )}
            <div className="border-t pt-3 border-[var(--c-cardBorder)]">
              <div className="flex items-end justify-between">
                <span className="text-base font-black text-[var(--c-text)]">Total</span>
                <div className="text-right">
                  <div className="text-2xl font-black text-[var(--c-text)]">
                    ₹{total}
                  </div>
                  {totalSaved > 0 && (
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      You save ₹{totalSaved}!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Coupon input */}
          {!couponApplied && (
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FiGift
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--c-textMuted)]"
                  />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    placeholder="COUPON CODE"
                    className="w-full rounded-xl border bg-[var(--c-card)] py-3 pl-9 pr-4 font-mono text-sm font-bold uppercase tracking-wide outline-none transition focus:border-[#7567C9] border-[var(--c-cardBorder)] bg-[var(--c-bg)] text-[var(--c-text)]"
                  />
                </div>
                <button
                  onClick={applyCoupon}
                  disabled={!couponCode.trim()}
                  className="rounded-xl bg-[#7567C9] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#5a52a8] disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-[var(--c-textMuted)]">Try:</span>
                {["FIRST50", "CAREER20"].map((code) => (
                  <button
                    key={code}
                    onClick={() => setCouponCode(code)}
                    className="rounded-full border border-[#7567C9]/30 bg-[var(--c-active)] px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--c-accentText)] hover:bg-[#7567C9]/10 bg-[var(--c-active)] text-[var(--c-accentText)]"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {couponApplied && couponMeta && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800">
              <FiCheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                <span className="font-bold">{couponMeta.desc}</span>
              </p>
            </div>
          )}

          {/* Focus areas */}
          {selectedGoals.length > 0 && (
            <div className="rounded-2xl bg-[var(--c-active)] p-4 bg-[var(--c-active)]">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--c-text)]">
                <FiTarget size={14} className="text-[#7567C9]" />
                Focus areas ({selectedGoals.length}/{MAX_GOALS})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedGoals.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--c-card)] px-3 py-1.5 text-xs font-semibold text-[var(--c-textSub)] shadow-sm bg-[var(--c-card)] text-[var(--c-textMuted)]"
                  >
                    <FiCheck size={9} className="text-emerald-500" />
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trust items */}
          <div className="space-y-2.5">
            {[
              [FiAward, "Mentor-approved session notes included"],
              [FiCalendar, "Google Calendar invite sent instantly"],
              [FiShield, "256-bit SSL encrypted payment"],
              [FiRefreshCw, "Free reschedule up to 4 hrs before"],
            ].map(([Icon, text]) => (
              <div key={text} className="flex items-center gap-3 text-xs text-[var(--c-textSub)]">
                <Icon size={13} className="flex-shrink-0 text-[#7567C9]" />
                {text}
              </div>
            ))}
          </div>

          {/* CTA */}
          {!showPayment ? (
            <>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!isFormValid}
                className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#7567C9] to-[#5a52a8] py-4 text-base font-black text-white shadow-xl shadow-[#7567C9]/30 transition-all hover:shadow-2xl hover:shadow-[#7567C9]/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <span className="flex items-center justify-center gap-2">
                  Continue to Payment
                  <FiArrowRight size={18} />
                </span>
              </button>
              {!isFormValid && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800">
                  <FiAlertCircle size={13} className="mt-0.5 flex-shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Complete your name, email, date, and time to continue.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleBooking}
                disabled={isBooking}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7567C9] to-[#5a52a8] py-4 text-base font-black text-white shadow-xl shadow-[#7567C9]/30 transition-all hover:shadow-2xl hover:shadow-[#7567C9]/40 disabled:opacity-70"
              >
                {isBooking ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiLock size={16} />
                    Pay ₹{total} Securely
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPayment(false)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-bold text-[var(--c-textSub)] transition hover:bg-gray-50 border-[var(--c-cardBorder)] text-[var(--c-textMuted)] hover:bg-[var(--c-active)]"
              >
                <FiArrowLeft size={14} />
                Go Back
              </button>
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--c-textMuted)]">
                <FiLock size={11} />
                256-bit SSL · Razorpay secured
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Social proof */}
      <div className="rounded-2xl border p-4 shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)]">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {["AK", "PS", "RV", "SM"].map((init, i) => (
              <div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#7567C9] to-[#a07035] text-[10px] font-black text-white dark:border-[var(--c-card)]"
              >
                {init}
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--c-text)]">
              18 students booked this week
            </p>
            <p className="text-[10px] text-[var(--c-textSub)]">
              Next available slot: Today
            </p>
          </div>
        </div>
      </div>

      {/* Guarantee */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm dark:border-emerald-800 dark:from-emerald-950/20 dark:to-teal-950/20">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 -900/30">
            <MdWorkspacePremium size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-300">
              100% Satisfaction Guarantee
            </h3>
            <p className="mt-0.5 text-xs leading-5 text-emerald-700 dark:text-emerald-400">
              Not satisfied? Full refund within 48 hours. Zero risk, maximum value.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ isOpen, onClose, bookingDetails }) {
  const bookingId = bookingDetails?.bookingId
    ? String(bookingDetails.bookingId).slice(-8).toUpperCase()   // last 8 chars of mongo id
    : generateBookingId();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border shadow-2xl border-[var(--c-cardBorder)] bg-[var(--c-card)]">
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#7567C9] via-yellow-400 to-emerald-400" />

        <div className="p-8">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full p-2 text-[var(--c-textMuted)] hover:bg-gray-100 hover:bg-[var(--c-active)]"
          >
            <FiX size={18} />
          </button>

          {/* Success icon */}
          <div className="text-center">
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-100 -900/30 animate-ping opacity-30" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 -900/30">
                <FiCheck className="text-4xl text-emerald-500" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-[var(--c-text)]">
              You're all set! 🎉
            </h3>
            <p className="mt-2 text-sm text-[var(--c-textSub)]">
              Check your email for the meeting link and calendar invite.
            </p>
          </div>

          {/* Details */}
          <div className="mt-6 space-y-3 rounded-2xl border bg-[var(--c-active)] p-5 border-[var(--c-cardBorder)] bg-[var(--c-active)]">
            {[
              ["Session", bookingDetails?.sessionType],
              ["Date", bookingDetails?.date],
              ["Time", bookingDetails?.time],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-bold text-[var(--c-text)]">{value}</span>
              </div>
            ))}
            <div className="border-t pt-3 border-[var(--c-cardBorder)]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Booking ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-[#7567C9]">{bookingId}</span>
                  <button
                    onClick={handleCopy}
                    className="rounded-lg p-1 text-[var(--c-textMuted)] hover:text-[#7567C9] transition"
                  >
                    {copied ? <FiCheck size={13} className="text-emerald-500" /> : <FiShare2 size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* What's next */}
          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold text-[var(--c-textSub)] uppercase tracking-wide">What happens next</p>
            {[
              "Check your email for the Google Meet link",
              "Share your resume and GitHub before the session",
              "Join 5 minutes early for a smooth start",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-[var(--c-textSub)]">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#7567C9]/10 text-[10px] font-black text-[#7567C9]">
                  {i + 1}
                </div>
                {step}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-gradient-to-r from-[#7567C9] to-[#5a52a8] py-3.5 text-sm font-black text-white shadow-lg shadow-[#7567C9]/25 hover:shadow-xl"
            >
              View Details
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "Session Booked!",
                    text: `I just booked a ${bookingDetails?.sessionType} with Arjun Khanna on MentorConnect!`,
                    url: window.location.href,
                  });
                }
              }}
              className="flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-bold text-[var(--c-textSub)] transition hover:bg-gray-50 border-[var(--c-cardBorder)] text-[var(--c-textMuted)] hover:bg-[var(--c-active)]"
            >
              <FiShare2 size={15} />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoMentorState({ onFindMentor }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-[#7567C9]/5 blur-3xl" />

      <div className="relative w-full max-w-lg text-center">
        {/* Icon cluster */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-[#7567C9]/20 bg-[var(--c-card)] shadow-xl shadow-[#7567C9]/10">
          <div className="relative">
            <FiUsers size={32} className="text-[#7567C9]" />
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#7567C9] shadow-lg shadow-[#7567C9]/40">
              <FiSearch size={10} className="text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black text-[var(--c-text)] sm:text-3xl">
          Find your mentor first
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--c-textSub)] max-w-sm mx-auto">
          Tell us your goal and we'll match you with the right mentor — then booking takes under 2 minutes.
        </p>

        {/* Steps */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: FiTarget, label: "Share your goal" },
            { icon: FiUsers, label: "Get matched" },
            { icon: FiCalendar, label: "Book in 2 mins" },
          ].map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--c-cardBorder)] bg-[var(--c-card)] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7567C9]/10">
                <Icon size={16} className="text-[#7567C9]" />
              </div>
              <span className="text-xs font-semibold text-[var(--c-textSub)]">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onFindMentor}
          className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#7567C9] to-[#5a52a8] px-8 py-4 text-base font-black text-white shadow-xl shadow-[#7567C9]/30 transition-all hover:shadow-2xl hover:shadow-[#7567C9]/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <HiSparkles size={18} />
          Find My Mentor
          <FiArrowRight size={18} />
        </button>

        <p className="mt-4 text-xs text-[var(--c-textMuted)]">
          Free to use · No sign-up required to explore
        </p>
      </div>
    </div>
  );
}
// ─── Right-side payment panel (matches the Book the Session design) ─────────────
function PaymentPanel({
  selectedSession, mentorId, date, setDate, time, setTime, today, refreshSlots,
  name, setName, email, setEmail, phone, setPhone, brief, setBrief,
  couponCode, setCouponCode, couponApplied, couponDiscount, couponMeta,
  applyCoupon, removeCoupon, isFormValid, isBooking, handleBooking,
}) {
  const packagePrice = selectedSession.originalPrice;
  const sessionDiscount = selectedSession.originalPrice - selectedSession.price;
  const totalDiscount = sessionDiscount + couponDiscount;
  const discountPct = packagePrice > 0 ? Math.round((totalDiscount / packagePrice) * 100) : 0;
  const total = selectedSession.price + PLATFORM_FEE - couponDiscount;
  const totalSaved = totalDiscount;

  const handleConfirm = () => {
    if (!isFormValid) {
      alert("Add your name, email, preferred date and a time slot to continue.");
      return;
    }
    handleBooking();
  };

  return (
    <div className="space-y-4">
      {/* Price Breakdown */}
      <div className="rounded-[1.5rem] border p-6 shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)]">
        <h2 className="text-base font-black text-[var(--c-text)]">Price Breakdown</h2>

        {totalSaved > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/20">
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Your total savings</span>
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">₹{totalSaved}</span>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--c-textSub)]">Selected Package Price</span>
            <span className="font-bold text-[var(--c-text)]">₹{packagePrice}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600 dark:text-emerald-400">Discount</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">−₹{totalDiscount} ({discountPct}%)</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--c-textSub)]">Platform fee</span>
            <span className="font-bold text-[var(--c-text)]">₹{PLATFORM_FEE}</span>
          </div>
          {couponApplied && couponMeta && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <FiGift size={12} /> {couponCode.toUpperCase()}
              </span>
              <button onClick={removeCoupon} className="text-[var(--c-textMuted)] hover:text-red-500"><FiX size={13} /></button>
            </div>
          )}
          <div className="flex items-end justify-between border-t pt-3 border-[var(--c-cardBorder)]">
            <span className="text-base font-black text-[var(--c-text)]">Total amount &amp; taxes</span>
            <span className="text-2xl font-black text-[var(--c-accentText)]">₹{total}</span>
          </div>
        </div>

        {/* Coupon */}
        {!couponApplied && (
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <FiGift size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--c-textMuted)]" />
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                placeholder="COUPON CODE"
                className="w-full rounded-xl border bg-[var(--c-bg)] py-3 pl-9 pr-4 font-mono text-sm font-bold uppercase tracking-wide outline-none transition focus:border-[#7567C9] border-[var(--c-cardBorder)] text-[var(--c-text)]"
              />
            </div>
            <button
              onClick={applyCoupon}
              disabled={!couponCode.trim()}
              className="rounded-xl bg-[#7567C9] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#5a52a8] disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Describe your query */}
      <div className="rounded-[1.5rem] border p-6 shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)]">
        <label className="mb-2 block text-sm font-bold text-[var(--c-text)]">Describe your query</label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="What do you want to get out of this session? The more context, the more useful the call."
          className="w-full resize-none rounded-2xl border bg-[var(--c-bg)] p-4 text-sm leading-6 outline-none transition placeholder:text-[var(--c-textMuted)] focus:border-[#7567C9] focus:ring-2 focus:ring-[#7567C9]/20 border-[var(--c-cardBorder)] text-[var(--c-text)]"
        />
      </div>

      {/* Your details (name / email / phone) */}
      <UserDetailsForm
        name={name} setName={setName}
        email={email} setEmail={setEmail}
        phone={phone} setPhone={setPhone}
      />

      {/* Preferred date + time slot */}
      <SchedulePicker
        mentorId={mentorId}
        date={date}
        setDate={setDate}
        time={time}
        setTime={setTime}
        today={today}
        refreshKey={refreshSlots}
      />

      {/* Confirm Payment */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isBooking}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7567C9] to-[#5a52a8] py-4 text-base font-black text-white shadow-xl shadow-[#7567C9]/30 transition-all hover:shadow-2xl hover:shadow-[#7567C9]/40 disabled:opacity-70"
      >
        {isBooking ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Processing...
          </>
        ) : (
          <>
            <FiLock size={16} />
            Confirm Payment · ₹{total}
          </>
        )}
      </button>
      <div className="flex items-center justify-center gap-2 text-xs text-[var(--c-textMuted)]">
        <FiLock size={11} /> 256-bit SSL · Razorpay secured
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function BookingPage({ mentor, onFindMentor, user, onAuthRequired }) {
  // 1. Define today's date string first (Local Timezone safe)
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const activeMentor = useMemo(() => {
    if (!mentor) return null;
    return {
      _id: mentor?._id || mentor?.id,
      name: mentor.name,
      title: mentor.role || mentor.title || "Senior Mentor",
      subtitle: mentor.branch || "Placement Mentor",
      location: mentor.location || "Bengaluru, India",
      bio: mentor.story || mentor.bio || "Verified outcome-based career mentor on Atyant.",
      skills: mentor.skills || mentor.tags || ["Python", "Machine Learning", "System Design"],
      stats: [
        { value: mentor.studentsHelped ? `${mentor.studentsHelped}+` : "50+", label: "Students mentored", icon: FiUsers },
        { value: mentor.rating ? `${mentor.rating}/5` : "4.8/5", label: "Avg. rating", icon: FiStar },
        { value: mentor.timeline || "Active", label: "Timeline", icon: FiTrendingUp },
        { value: "98%", label: "Satisfaction", icon: FiHeart },
      ],
      badges: mentor.tags || ["Verified", "Top Mentor"],
      socials: mentor.socials || { linkedin: "#", twitter: "#", email: "mentor@atyant.com" },
      responseTime: mentor.responseTime || "2 hrs",
      slotsLeft: mentor.slotsLeft || 3,
    };
  }, [mentor]);

  // Platform service catalog → the mentor's bookable services (prices are fixed by Atyant)
  const [serviceCatalog, setServiceCatalog] = useState([]);
  useEffect(() => {
    servicesAPI.catalog().then(d => setServiceCatalog(d.services || [])).catch(() => {});
  }, []);

  const SERVICE_ICONS = { "text-qa": FiMessageCircle, "audio-call": FiPhone, "video-call": FiVideo, "resume-review": FiBookOpen };
  const sessionOptions = useMemo(() => {
    const offered = mentor?.servicesOffered || [];
    const picked = serviceCatalog.filter(s => offered.includes(s.id));
    const list = picked.length ? picked : serviceCatalog; // fallback to full catalog if mentor hasn't chosen yet
    if (!list.length) return SESSIONS;                     // ultimate fallback before catalog loads
    return list.map((s, i) => ({
      id: s.id, serviceId: s.id, title: s.label, subtitle: s.description,
      price: s.price, originalPrice: s.price, duration: s.duration || `${s.durationMin} mins`, durationMin: s.durationMin,
      icon: SERVICE_ICONS[s.id] || FiVideo,
      badge: s.id === "video-call" ? "Most booked" : "",
      color: s.id === "video-call" ? "gold" : s.id === "resume-review" ? "green" : "blue",
      bestFor: s.description, outcomes: [s.description],
      popular: s.id === "video-call",
      tag: s.id === "video-call" ? "⭐ RECOMMENDED" : null,
    }));
  }, [serviceCatalog, mentor]);

  // 2. Initialize states with the reliable local string source
  const [selectedSession, setSelectedSession] = useState(SESSIONS[2]);
  // Keep the selected session valid against the mentor's offered services
  useEffect(() => {
    if (sessionOptions.length && !sessionOptions.find(s => s.id === selectedSession?.id)) {
      setSelectedSession(sessionOptions.find(s => s.popular) || sessionOptions[0]);
    }
  }, [sessionOptions]);
  const [date, setDate] = useState(todayStr); // Defaults to today's date string automatically
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedGoals, setSelectedGoals] = useState(["Resume review"]);
  const [brief, setBrief] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMeta, setCouponMeta] = useState(null);
  const [bookingId, setBookingId] = useState('');
  const [refreshSlots, setRefreshSlots] = useState(0);
  const [pendingPay, setPendingPay] = useState(false);
  
  const isFormValid = useMemo(
    () => !!(date && time && name.trim() && email.trim()),
    [date, time, name, email]
  );

  const completionPercentage = useMemo(() => {
    if (!activeMentor) return 0;
    let p = 25;
    if (date && time !== '') p += 25;       // Schedule: slot picked
    if (name.trim() && email.trim()) p += 25; // Details: name + email filled
    if (showPayment) p += 25;               // Payment: continued to pay
    return p;
  }, [activeMentor, date, time, name, email, showPayment]);
  // Theme is now managed globally by ThemeProvider (persisted, user-toggleable).

  useEffect(() => {
    const id = setInterval(
      () => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length),
      5000
    );
    return () => clearInterval(id);
  }, []);

  // In BookingPage, after the other useEffects
  useEffect(() => {
    if (!user) return;
    if (!name && (user.username || user.name)) {
      setName(user.username || user.name);
    }
    if (!email && user.email) {
      setEmail(user.email);
    }
  }, [user]);
  useEffect(() => {
    if (user && pendingPay && isFormValid) {
      setPendingPay(false);
      setShowPayment(true);     // seamlessly continue where they left off
    }
  }, [user, pendingPay, isFormValid]);
  const toggleGoal = useCallback((goal) => {
    setSelectedGoals((curr) =>
      curr.includes(goal)
        ? curr.filter((g) => g !== goal)
        : curr.length < MAX_GOALS
          ? [...curr, goal]
          : curr
    );
  }, []);

  const applyCoupon = () => {
    const meta = VALID_COUPONS[couponCode.toUpperCase()];
    if (!meta) {
      alert("Invalid coupon. Try FIRST50, CAREER20, or SUMMER15");
      return;
    }
    const discount =
      meta.type === "fixed"
        ? meta.value
        : Math.round(selectedSession.price * (meta.value / 100));
    setCouponApplied(true);
    setCouponDiscount(discount);
    setCouponMeta(meta);
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponMeta(null);
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setShowPayment(false);
    removeCoupon();
  };

  const handleContinue = () => {
    if (!isFormValid) return;
    if (!user) {
      setPendingPay(true);
      onAuthRequired?.();
      return;
    }
    setShowPayment(true);
  };

  const handleBooking = async () => {
    if (!user) {
      onAuthRequired?.();
      return;
    }
    const mentorId = mentor?._id || mentor?.id || activeMentor?._id || null;
    if (!mentorId) {
      alert('Please pick a mentor from your matches first.');
      return;
    }

    setIsBooking(true);
    try {
      const topic = (selectedGoals && selectedGoals.length ? selectedGoals.join(', ') : selectedSession.title);
      const durationMin = selectedSession.durationMin || 30;

      // 1) Create order — serviceId drives the platform-fixed price server-side
      const order = await paymentAPI.createOrder({
        mentorId, date, time, topic, durationMin, serviceId: selectedSession.serviceId,
      });

      // Free mentor → already confirmed server-side
      if (order?.free) {
        setBookingId(order?.session?._id || '');
        setShowSuccess(true);
        setRefreshSlots(c => c + 1);
        setIsBooking(false);
        return;
      }

      // 2) Open Razorpay Checkout
      const ok = await loadRazorpay();
      if (!ok) { alert('Could not load payment gateway. Check your connection.'); setIsBooking(false); return; }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,        // paise
        currency: order.currency,
        name: 'Atyant',
        description: `Session with ${order.mentorName}`,
        order_id: order.orderId,
        prefill: { name: name || user?.username, email: email || user?.email, contact: phone || '' },
        theme: { color: '#7567C9' },
        handler: async (resp) => {
          try {
            // 3) Verify payment server-side → confirms session, generates Meet, emails both
            const result = await paymentAPI.verify({
              sessionId: order.sessionId,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            if (result?.ok) {
              setBookingId(order.sessionId);
              setShowSuccess(true);
              setRefreshSlots(c => c + 1);
            } else {
              alert(result?.error || 'Payment verification failed. If you were charged, contact support.');
            }
          } catch (e) {
            alert(e.message || 'Payment verification failed. If you were charged, contact support.');
          } finally {
            setIsBooking(false);
          }
        },
        modal: { ondismiss: () => setIsBooking(false) },
      });
      rzp.on('payment.failed', (resp) => {
        alert(resp?.error?.description || 'Payment failed. Please try again.');
        setIsBooking(false);
      });
      rzp.open();
    } catch (err) {
      alert(err?.data?.error || err?.message || 'Booking failed. Please try again.');
      setIsBooking(false);
    }
  };

  const handleReset = () => {
    setDate(todayStr); // Resetting drops date back to today instead of clearing it out entirely
    setTime("");
    setShowPayment(false);
  };

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8 lg:px-8">

        {/* Early Bird offer banner */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#7567C9]/25 bg-gradient-to-r from-[#7567C9]/10 via-[#7567C9]/5 to-transparent px-4 py-3 sm:px-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7567C9] to-[#5a52a8] shadow-lg shadow-[#7567C9]/25">
            <HiSparkles className="text-white" size={16} />
          </div>
          <p className="flex-1 text-sm font-semibold text-[var(--c-text)]">
            Early Bird Offer —{" "}
            <span className="text-[#7567C9]">Save up to 50% on your first session!</span>
          </p>
          <span className="rounded-full border border-[#7567C9]/30 bg-[var(--c-active)] px-3 py-1 text-xs font-bold text-[var(--c-accentText)]">
            Limited slots
          </span>
        </div>

        {/* Header */}
        <header className="mb-8 flex items-start gap-3 border-b pb-6 border-[var(--c-cardBorder)]">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Go back"
            className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--c-cardBorder)] bg-[var(--c-card)] text-[var(--c-textSub)] transition hover:border-[#7567C9] hover:text-[#7567C9]"
          >
            <FiArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--c-text)] sm:text-4xl">
              Book the Session
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-7 text-[var(--c-textSub)] sm:text-base">
              Get personalised guidance from your matched senior.
            </p>
          </div>
        </header>

        {/* ── No mentor selected ─────────────────────────────── */}
        {!activeMentor ? (
          <NoMentorState onFindMentor={onFindMentor} />   // prop explained below
        ) : (
          /* ── Main Layout (existing code, unchanged) ────────── */
          <main className="grid gap-8 xl:grid-cols-[1fr_400px]">
            <section className="space-y-8">
              <MentorCard mentor={activeMentor} />

              {/* Sessions */}
              <div className="rounded-[1.5rem] border p-6 shadow-sm border-[var(--c-cardBorder)] bg-[var(--c-card)] md:p-8">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-[var(--c-text)]">
                      Available Sessions
                    </h2>
                    <p className="mt-1 text-sm text-[var(--c-textSub)]">
                      Pick the format that matches your current goal.
                    </p>
                  </div>
                </div>

                {/* All sessions include banner */}
                <div style={{ background: "rgba(61,190,130,0.06)", border: "1px solid rgba(61,190,130,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                  <FiGift size={14} color="#3DBE82" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#3DBE82", fontWeight: 500 }}>
                    All sessions include: written notes + curated resources after every call — yours to keep forever.
                  </span>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  {sessionOptions.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      selected={selectedSession}
                      onSelect={handleSessionSelect}
                    />
                  ))}
                </div>

                {/* Trust line */}
                <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "#5F576F" }}>
                  Senior keeps 83% · Razorpay UPI · Reschedule anytime
                </div>
              </div>

            </section>

            {/* ── Right: schedule, details, query & payment ── */}
            <aside className="xl:sticky xl:top-8 xl:self-start">
              <PaymentPanel
                selectedSession={selectedSession}
                mentorId={mentor?._id || mentor?.id || null}
                date={date}
                setDate={(d) => setDate(d)}
                time={time}
                setTime={(t) => setTime(t)}
                today={todayStr}
                refreshSlots={refreshSlots}
                name={name} setName={setName}
                email={email} setEmail={setEmail}
                phone={phone} setPhone={setPhone}
                brief={brief} setBrief={setBrief}
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                couponApplied={couponApplied}
                couponDiscount={couponDiscount}
                couponMeta={couponMeta}
                applyCoupon={applyCoupon}
                removeCoupon={removeCoupon}
                isFormValid={isFormValid}
                isBooking={isBooking}
                handleBooking={handleBooking}
              />
            </aside>
          </main>
        )}
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        bookingDetails={{
          sessionType: selectedSession.title,
          date: formatDate(date),
          time: time ? `${time} IST` : '',
          bookingId,
        }}
      />
    </div>
  );
}