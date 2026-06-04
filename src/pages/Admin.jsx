import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMoon,
  FiPhone,
  FiShield,
  FiSun,
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
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiSave,
  FiEye,
  FiSettings,
  FiBarChart2,
  FiDollarSign,
  FiToggleLeft,
  FiToggleRight,
  FiUpload,
  FiSearch,
  FiFilter,
  FiBell,
  FiGrid,
  FiList,
  FiDownload,
  FiCopy,
  FiActivity,
  FiLogOut,
  FiMenu,
  FiHome,
  FiSliders,
  FiTag,
  FiPercent,
  FiMail,
  FiUser,
  FiLock,
} from "react-icons/fi";
import {
  MdOutlineRoute,
  MdOutlineDashboard,
  MdOutlineReviews,
  MdOutlineSchedule,
} from "react-icons/md";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialSessions = [
  {
    id: 1,
    title: "Audio Call",
    price: 499,
    originalPrice: 699,
    duration: "30 mins",
    iconKey: "phone",
    badge: "Quick clarity",
    bestFor:
      "A focused doubt-solving call for one clear career blocker.",
    outcomes: ["Resume direction", "Role fit check", "Next 3 actions"],
    popular: false,
    active: true,
    bookings: 34,
    revenue: 16966,
  },
  {
    id: 2,
    title: "Video Call",
    price: 699,
    originalPrice: 999,
    duration: "45 mins",
    iconKey: "video",
    badge: "Most booked",
    bestFor:
      "A deeper review with screen-share for profile, projects, and interview prep.",
    outcomes: [
      "Profile review",
      "Project feedback",
      "Interview plan",
    ],
    popular: true,
    active: true,
    bookings: 78,
    revenue: 54522,
  },
  {
    id: 3,
    title: "Career Roadmap",
    price: 999,
    originalPrice: 1499,
    duration: "60 mins",
    iconKey: "route",
    badge: "Best value",
    bestFor:
      "A complete roadmap for moving from beginner to placement-ready.",
    outcomes: [
      "90-day roadmap",
      "Skill gap analysis",
      "Weekly milestones",
    ],
    popular: false,
    active: true,
    bookings: 52,
    revenue: 51948,
  },
];

const initialSlots = [
  { id: 1, time: "10:00", period: "Morning", available: true, bookings: 12 },
  { id: 2, time: "11:30", period: "Morning", available: true, bookings: 8 },
  { id: 3, time: "14:00", period: "Afternoon", available: true, bookings: 15 },
  { id: 4, time: "16:30", period: "Afternoon", available: false, bookings: 20 },
  { id: 5, time: "19:00", period: "Evening", available: true, bookings: 18 },
  { id: 6, time: "20:30", period: "Evening", available: true, bookings: 6 },
];

const initialTestimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "SDE Intern at Google",
    avatar: "PS",
    rating: 5,
    text: "Arjun's roadmap session completely changed my approach. Got my first interview call within 3 weeks.",
    date: "2 weeks ago",
    approved: true,
  },
  {
    id: 2,
    name: "Rahul Verma",
    role: "ML Engineer at Flipkart",
    avatar: "RV",
    rating: 5,
    text: "The mock interview prep was incredibly detailed. He pointed out gaps I never noticed.",
    date: "1 month ago",
    approved: true,
  },
  {
    id: 3,
    name: "Sneha Patel",
    role: "Data Scientist at Amazon",
    avatar: "SP",
    rating: 5,
    text: "Best investment I made in my career. The 90-day roadmap was practical and achievable.",
    date: "3 weeks ago",
    approved: true,
  },
  {
    id: 4,
    name: "Karan Mehta",
    role: "Backend Dev at Zomato",
    avatar: "KM",
    rating: 4,
    text: "Very insightful session. Arjun knows exactly what companies look for.",
    date: "5 days ago",
    approved: false,
  },
];

const initialFaqs = [
  {
    id: 1,
    q: "What if I need to reschedule?",
    a: "You can reschedule up to 4 hours before your session at no extra cost.",
    active: true,
  },
  {
    id: 2,
    q: "Will I get session notes?",
    a: "Yes! Every session includes detailed notes, action items, and curated resources sent within 24 hours.",
    active: true,
  },
  {
    id: 3,
    q: "Can I book a follow-up?",
    a: "Absolutely. Returning students get 15% off their next session.",
    active: true,
  },
  {
    id: 4,
    q: "What platform is used for calls?",
    a: "Audio calls use regular phone/WhatsApp. Video calls use Google Meet.",
    active: true,
  },
  {
    id: 5,
    q: "Is there a refund policy?",
    a: "If the mentor doesn't show up or you're unsatisfied, we offer a full refund within 48 hours.",
    active: true,
  },
];

const initialCoupons = [
  {
    id: 1,
    code: "FIRST50",
    type: "fixed",
    value: 50,
    usageCount: 23,
    maxUsage: 100,
    active: true,
    expiry: "2025-12-31",
  },
  {
    id: 2,
    code: "CAREER20",
    type: "percent",
    value: 20,
    usageCount: 41,
    maxUsage: 200,
    active: true,
    expiry: "2025-09-30",
  },
  {
    id: 3,
    code: "SUMMER15",
    type: "percent",
    value: 15,
    usageCount: 67,
    maxUsage: 50,
    active: false,
    expiry: "2025-06-30",
  },
];

const recentBookings = [
  {
    id: "MNT-A1B2C3",
    student: "Aryan Singh",
    email: "aryan@email.com",
    session: "Video Call",
    date: "2025-01-15",
    time: "14:00",
    amount: 724,
    status: "confirmed",
    goals: ["Mock interview", "Resume review"],
  },
  {
    id: "MNT-D4E5F6",
    student: "Meera Joshi",
    email: "meera@email.com",
    session: "Career Roadmap",
    date: "2025-01-16",
    time: "10:00",
    amount: 1024,
    status: "pending",
    goals: ["AI/ML roadmap"],
  },
  {
    id: "MNT-G7H8I9",
    student: "Dev Patel",
    email: "dev@email.com",
    session: "Audio Call",
    date: "2025-01-14",
    time: "19:00",
    amount: 524,
    status: "completed",
    goals: ["Job strategy"],
  },
  {
    id: "MNT-J1K2L3",
    student: "Ananya Rao",
    email: "ananya@email.com",
    session: "Video Call",
    date: "2025-01-17",
    time: "11:30",
    amount: 724,
    status: "cancelled",
    goals: ["Project selection", "Resume review"],
  },
  {
    id: "MNT-M4N5O6",
    student: "Vikram Das",
    email: "vikram@email.com",
    session: "Career Roadmap",
    date: "2025-01-18",
    time: "20:30",
    amount: 1024,
    status: "confirmed",
    goals: ["AI/ML roadmap", "Mock interview"],
  },
];

const iconMap = {
  phone: <FiPhone size={22} />,
  video: <FiVideo size={22} />,
  route: <MdOutlineRoute size={22} />,
};

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: <MdOutlineDashboard size={18} /> },
  { key: "sessions", label: "Sessions", icon: <FiGrid size={18} /> },
  { key: "schedule", label: "Schedule", icon: <MdOutlineSchedule size={18} /> },
  { key: "bookings", label: "Bookings", icon: <FiCalendar size={18} /> },
  { key: "testimonials", label: "Testimonials", icon: <MdOutlineReviews size={18} /> },
  { key: "coupons", label: "Coupons", icon: <FiTag size={18} /> },
  { key: "faqs", label: "FAQs", icon: <FiMessageCircle size={18} /> },
  { key: "profile", label: "Profile", icon: <FiUser size={18} /> },
  { key: "settings", label: "Settings", icon: <FiSettings size={18} /> },
];

// ─── Reusable Components ──────────────────────────────────────────────────────

function Badge({ children, color = "gold" }) {
  const colors = {
    gold: "bg-[#fff8ef] text-[#8f5f2c] border-[#c88b4a]/30 dark:bg-[#211a13] dark:text-[#e1b57e]",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
    gray: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

function StatCard({ icon, label, value, sub, trend, color = "gold" }) {
  const colors = {
    gold: "from-[#c88b4a]/10 to-[#c88b4a]/5 border-[#c88b4a]/20",
    green: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  };
  const iconColors = {
    gold: "bg-[#c88b4a]/10 text-[#c88b4a]",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${colors[color]} backdrop-blur-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-2.5 ${iconColors[color]}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-bold ${trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="mt-4 text-2xl font-bold text-black dark:text-white">{value}</div>
      <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

function Modal({ isOpen, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`relative w-full ${sizes[size]} max-h-[90vh] overflow-y-auto rounded-[1.5rem] border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#151515]`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white px-6 py-4 dark:border-white/5 dark:bg-[#151515]">
          <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-white/10">
            <FiX size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-[#c88b4a]" : "bg-gray-200 dark:bg-white/10"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, className = "", rows }) {
  const cls = `w-full rounded-xl border border-black/10 bg-[#f6f3ef] px-4 py-3 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-[#c88b4a] focus:ring-2 focus:ring-[#c88b4a]/20 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white ${className}`;
  return (
    <div>
      {label && <label className="mb-2 block text-sm font-semibold text-black dark:text-white">{label}</label>}
      {rows ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className={cls + " resize-none"} />
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

function Notification({ notifications, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 w-80">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-sm transition-all ${
            n.type === "success"
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/80"
              : n.type === "error"
                ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/80"
                : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/80"
          }`}
        >
          <div className={`mt-0.5 flex-shrink-0 ${n.type === "success" ? "text-emerald-600 dark:text-emerald-400" : n.type === "error" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
            {n.type === "success" ? <FiCheckCircle size={16} /> : n.type === "error" ? <FiAlertCircle size={16} /> : <FiBell size={16} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-black dark:text-white">{n.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
          </div>
          <button onClick={() => onDismiss(n.id)} className="text-gray-400 hover:text-gray-600">
            <FiX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Section Components ───────────────────────────────────────────────────────

function DashboardSection({ sessions, slots, bookings, testimonials, coupons }) {
  const totalRevenue = sessions.reduce((sum, s) => sum + s.revenue, 0);
  const totalBookings = sessions.reduce((sum, s) => sum + s.bookings, 0);
  const pendingTestimonials = testimonials.filter((t) => !t.approved).length;
  const activeCoupons = coupons.filter((c) => c.active).length;

  const chartData = sessions.map((s) => ({
    label: s.title,
    value: s.revenue,
    percent: Math.round((s.revenue / totalRevenue) * 100),
  }));

  const statusCounts = recentBookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">Dashboard Overview</h2>
        <p className="mt-1 text-gray-500">Welcome back, Arjun. Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<FiDollarSign size={20} />} label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} sub="All sessions combined" trend={12} color="gold" />
        <StatCard icon={<FiCalendar size={20} />} label="Total Bookings" value={totalBookings} sub="Across all session types" trend={8} color="green" />
        <StatCard icon={<FiUsers size={20} />} label="Students Helped" value="120+" sub="Unique students" trend={5} color="blue" />
        <StatCard icon={<FiStar size={20} />} label="Avg. Rating" value="4.9 / 5" sub="Based on 94 reviews" trend={2} color="purple" />
      </div>

      {/* Revenue by session + Booking status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#151515]">
          <h3 className="text-lg font-bold text-black dark:text-white">Revenue by Session</h3>
          <div className="mt-6 space-y-5">
            {chartData.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span className="font-bold text-black dark:text-white">₹{item.value.toLocaleString()} ({item.percent}%)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c88b4a] to-[#e1b57e] transition-all duration-1000"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#151515]">
          <h3 className="text-lg font-bold text-black dark:text-white">Booking Status</h3>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {[
              ["confirmed", "Confirmed", "emerald"],
              ["pending", "Pending", "yellow"],
              ["completed", "Completed", "blue"],
              ["cancelled", "Cancelled", "red"],
            ].map(([key, label, color]) => {
              const colorMap = {
                emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              };
              return (
                <div key={key} className={`rounded-2xl p-4 ${colorMap[color]}`}>
                  <div className="text-3xl font-bold">{statusCounts[key] || 0}</div>
                  <div className="mt-1 text-sm font-medium">{label}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-2">
            <div className="text-sm font-semibold text-black dark:text-white">Quick alerts</div>
            {pendingTestimonials > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400">
                <FiBell size={14} />
                {pendingTestimonials} testimonial(s) awaiting approval
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-400">
              <FiActivity size={14} />
              {activeCoupons} active coupon codes running
            </div>
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#151515]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-black dark:text-white">Recent Bookings</h3>
          <Badge color="gray">Last 7 days</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                {["Booking ID", "Student", "Session", "Date & Time", "Amount", "Status"].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {recentBookings.map((b) => {
                const statusStyles = {
                  confirmed: "green",
                  pending: "blue",
                  completed: "gray",
                  cancelled: "red",
                };
                return (
                  <tr key={b.id} className="hover:bg-black/2 dark:hover:bg-white/2">
                    <td className="py-3 font-mono text-xs text-[#c88b4a]">{b.id}</td>
                    <td className="py-3">
                      <div className="font-semibold text-black dark:text-white">{b.student}</div>
                      <div className="text-xs text-gray-400">{b.email}</div>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{b.session}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{b.date} · {b.time}</td>
                    <td className="py-3 font-bold text-black dark:text-white">₹{b.amount}</td>
                    <td className="py-3">
                      <Badge color={statusStyles[b.status]}>{b.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SessionsSection({ sessions, setSessions, notify }) {
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "", price: "", originalPrice: "", duration: "", iconKey: "phone",
    badge: "", bestFor: "", outcomes: [""], popular: false, active: true,
  });

  const openEdit = (session) => {
    setEditData({ ...session, outcomes: [...session.outcomes] });
    setEditModal(true);
  };

  const saveEdit = () => {
    setSessions((prev) => prev.map((s) => s.id === editData.id ? { ...editData, price: Number(editData.price), originalPrice: Number(editData.originalPrice) } : s));
    setEditModal(false);
    notify("success", "Session Updated", `"${editData.title}" has been saved.`);
  };

  const toggleActive = (id) => {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
    notify("info", "Status Changed", "Session visibility updated.");
  };

  const togglePopular = (id) => {
    setSessions((prev) => prev.map((s) => ({ ...s, popular: s.id === id ? !s.popular : false })));
  };

  const deleteSession = (id) => {
    if (window.confirm("Delete this session?")) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      notify("success", "Deleted", "Session removed.");
    }
  };

  const addSession = () => {
    const id = Date.now();
    setSessions((prev) => [...prev, {
      ...newSession,
      id,
      price: Number(newSession.price),
      originalPrice: Number(newSession.originalPrice),
      outcomes: newSession.outcomes.filter(Boolean),
      bookings: 0,
      revenue: 0,
    }]);
    setAddModal(false);
    setNewSession({ title: "", price: "", originalPrice: "", duration: "", iconKey: "phone", badge: "", bestFor: "", outcomes: [""], popular: false, active: true });
    notify("success", "Session Added", "New session is now live.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Sessions</h2>
          <p className="mt-1 text-gray-500">Manage all available mentorship sessions.</p>
        </div>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-2 rounded-2xl bg-[#c88b4a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ad7437]">
          <FiPlus size={16} /> Add Session
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sessions.map((session) => (
          <div key={session.id} className={`rounded-[1.25rem] border p-5 transition-all ${session.active ? "border-black/10 bg-white dark:border-white/10 dark:bg-[#151515]" : "border-black/5 bg-gray-50 opacity-60 dark:border-white/5 dark:bg-[#111]"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2.5 ${session.active ? "bg-[#c88b4a]/10 text-[#c88b4a]" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                  {iconMap[session.iconKey]}
                </div>
                <div>
                  <h3 className="font-bold text-black dark:text-white">{session.title}</h3>
                  <p className="text-xs text-gray-500">{session.duration}</p>
                </div>
              </div>
              <Toggle checked={session.active} onChange={() => toggleActive(session.id)} />
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">{session.bestFor}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {session.outcomes.map((o) => (
                <span key={o} className="rounded-full bg-[#faf8f5] px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-400">
                  {o}
                </span>
              ))}
            </div>

            <div className="mt-5 border-t border-black/5 pt-4 dark:border-white/5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-black dark:text-white">₹{session.price}</div>
                  <div className="text-xs text-gray-400">Price</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-black dark:text-white">{session.bookings}</div>
                  <div className="text-xs text-gray-400">Bookings</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-black dark:text-white">₹{(session.revenue / 1000).toFixed(1)}k</div>
                  <div className="text-xs text-gray-400">Revenue</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => openEdit(session)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-black/10 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5">
                <FiEdit3 size={14} /> Edit
              </button>
              <button
                onClick={() => togglePopular(session.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold transition ${session.popular ? "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400" : "border-black/10 text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"}`}
              >
                <FiStar size={14} /> {session.popular ? "Popular" : "Set Popular"}
              </button>
              <button onClick={() => deleteSession(session.id)} className="rounded-xl border border-red-200 p-2.5 text-red-500 transition hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20">
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Session" size="lg">
        {editData && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Session Title" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Icon</label>
                <select value={editData.iconKey} onChange={(e) => setEditData({ ...editData, iconKey: e.target.value })} className="w-full rounded-xl border border-black/10 bg-[#f6f3ef] px-4 py-3 text-sm text-black outline-none focus:border-[#c88b4a] dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white">
                  <option value="phone">Phone</option>
                  <option value="video">Video</option>
                  <option value="route">Route</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Price (₹)" type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: e.target.value })} />
              <Input label="Original Price (₹)" type="number" value={editData.originalPrice} onChange={(e) => setEditData({ ...editData, originalPrice: e.target.value })} />
              <Input label="Duration" value={editData.duration} onChange={(e) => setEditData({ ...editData, duration: e.target.value })} placeholder="e.g. 45 mins" />
            </div>
            <Input label="Badge Label" value={editData.badge} onChange={(e) => setEditData({ ...editData, badge: e.target.value })} />
            <Input label="Best For" value={editData.bestFor} onChange={(e) => setEditData({ ...editData, bestFor: e.target.value })} rows={3} />
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Outcomes</label>
              <div className="space-y-2">
                {editData.outcomes.map((o, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={o} onChange={(e) => {
                      const outcomes = [...editData.outcomes];
                      outcomes[i] = e.target.value;
                      setEditData({ ...editData, outcomes });
                    }} placeholder={`Outcome ${i + 1}`} />
                    <button onClick={() => setEditData({ ...editData, outcomes: editData.outcomes.filter((_, j) => j !== i) })} className="rounded-xl border border-red-200 px-3 text-red-500 hover:bg-red-50 dark:border-red-800">
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setEditData({ ...editData, outcomes: [...editData.outcomes, ""] })} className="flex items-center gap-2 text-sm font-semibold text-[#c88b4a] hover:underline">
                  <FiPlus size={14} /> Add outcome
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setEditModal(false)} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold dark:border-white/10">Cancel</button>
              <button onClick={saveEdit} className="flex items-center gap-2 rounded-xl bg-[#c88b4a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ad7437]">
                <FiSave size={14} /> Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add New Session" size="lg">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Session Title" value={newSession.title} onChange={(e) => setNewSession({ ...newSession, title: e.target.value })} placeholder="e.g. Deep Dive Call" />
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Icon</label>
              <select value={newSession.iconKey} onChange={(e) => setNewSession({ ...newSession, iconKey: e.target.value })} className="w-full rounded-xl border border-black/10 bg-[#f6f3ef] px-4 py-3 text-sm outline-none focus:border-[#c88b4a] dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white">
                <option value="phone">Phone</option>
                <option value="video">Video</option>
                <option value="route">Route</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Price (₹)" type="number" value={newSession.price} onChange={(e) => setNewSession({ ...newSession, price: e.target.value })} />
            <Input label="Original Price (₹)" type="number" value={newSession.originalPrice} onChange={(e) => setNewSession({ ...newSession, originalPrice: e.target.value })} />
            <Input label="Duration" value={newSession.duration} onChange={(e) => setNewSession({ ...newSession, duration: e.target.value })} placeholder="45 mins" />
          </div>
          <Input label="Badge Label" value={newSession.badge} onChange={(e) => setNewSession({ ...newSession, badge: e.target.value })} placeholder="e.g. New" />
          <Input label="Best For" value={newSession.bestFor} onChange={(e) => setNewSession({ ...newSession, bestFor: e.target.value })} rows={3} placeholder="Describe who this is best for..." />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={() => setAddModal(false)} className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold dark:border-white/10">Cancel</button>
            <button onClick={addSession} disabled={!newSession.title || !newSession.price} className="flex items-center gap-2 rounded-xl bg-[#c88b4a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ad7437] disabled:opacity-50">
              <FiPlus size={14} /> Add Session
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ScheduleSection({ slots, setSlots, notify }) {
  const [addModal, setAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({ time: "", period: "Morning", available: true });

  const toggleSlot = (id) => {
    setSlots((prev) => prev.map((s) => s.id === id ? { ...s, available: !s.available } : s));
    notify("info", "Slot Updated", "Availability changed.");
  };

  const deleteSlot = (id) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    notify("success", "Slot Removed", "Time slot deleted.");
  };

  const addSlot = () => {
    if (!newSlot.time) return;
    setSlots((prev) => [...prev, { ...newSlot, id: Date.now(), bookings: 0 }]);
    setAddModal(false);
    setNewSlot({ time: "", period: "Morning", available: true });
    notify("success", "Slot Added", "New time slot is now live.");
  };

  const grouped = ["Morning", "Afternoon", "Evening"].map((period) => ({
    period,
    slots: slots.filter((s) => s.period === period),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Schedule & Slots</h2>
          <p className="mt-1 text-gray-500">Control available time slots for bookings.</p>
        </div>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-2 rounded-2xl bg-[#c88b4a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ad7437]">
          <FiPlus size={16} /> Add Slot
        </button>
      </div>

      <div className="space-y-6">
        {grouped.map(({ period, slots: periodSlots }) => (
          <div key={period} className="rounded-[1.5rem] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#151515]">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#c88b4a]" />
              <h3 className="font-bold text-black dark:text-white">{period}</h3>
              <Badge color="gray">{periodSlots.length} slots</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {periodSlots.map((slot) => (
                <div key={slot.id} className={`rounded-2xl border p-4 transition ${slot.available ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/10" : "border-red-200 bg-red-50 opacity-70 dark:border-red-800 dark:bg-red-950/10"}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-black dark:text-white">{slot.time}</div>
                    <Toggle checked={slot.available} onChange={() => toggleSlot(slot.id)} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs font-semibold ${slot.available ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {slot.available ? "Available" : "Blocked"}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{slot.bookings} bookings</span>
                      <button onClick={() => deleteSlot(slot.id)} className="text-gray-400 hover:text-red-500 transition">
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {periodSlots.length === 0 && (
                <div className="col-span-3 rounded-2xl border border-dashed border-black/10 py-8 text-center text-sm text-gray-400 dark:border-white/10">
                  No slots in this period
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Time Slot" size="sm">
        <div className="space-y-4">
          <Input label="Time (HH:MM)" value={newSlot.time} onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })} placeholder="e.g. 13:00" />
          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Period</label>
            <select value={newSlot.period} onChange={(e) => setNewSlot({ ...newSlot, period: e.target.value })} className="w-full rounded-xl border border-black/10 bg-[#f6f3ef] px-4 py-3 text-sm outline-none focus:border-[#c88b4a] dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white">
              {["Morning", "Afternoon", "Evening"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-black dark:text-white">Available by default</span>
            <Toggle checked={newSlot.available} onChange={(v) => setNewSlot({ ...newSlot, available: v })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddModal(false)} className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-semibold dark:border-white/10">Cancel</button>
            <button onClick={addSlot} className="flex-1 rounded-xl bg-[#c88b4a] py-2.5 text-sm font-semibold text-white hover:bg-[#ad7437]">Add Slot</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BookingsSection({ notify }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewModal, setViewModal] = useState(false);
  const [viewBooking, setViewBooking] = useState(null);

  const filtered = recentBookings.filter((b) => {
    const matchesSearch = b.student.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = { confirmed: "green", pending: "blue", completed: "gray", cancelled: "red" };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">Bookings</h2>
        <p className="mt-1 text-gray-500">View and manage all student bookings.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or booking ID..."
            className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#c88b4a] dark:border-white/10 dark:bg-[#151515] dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#c88b4a] dark:border-white/10 dark:bg-[#151515] dark:text-white"
        >
          {["all", "confirmed", "pending", "completed", "cancelled"].map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-[#c88b4a] dark:border-white/10 dark:bg-[#151515] dark:text-gray-400">
          <FiDownload size={16} /> Export
        </button>
      </div>

      <div className="rounded-[1.5rem] border border-black/10 bg-white overflow-hidden dark:border-white/10 dark:bg-[#151515]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-black/5 dark:border-white/5">
              <tr>
                {["Booking ID", "Student", "Session", "Date & Time", "Amount", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-4 font-mono text-xs text-[#c88b4a]">{b.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#c88b4a] to-[#a07035] text-[10px] font-bold text-white">
                        {b.student.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-semibold text-black dark:text-white">{b.student}</div>
                        <div className="text-xs text-gray-400">{b.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-400">{b.session}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-400">{b.date} · {b.time}</td>
                  <td className="px-5 py-4 font-bold text-black dark:text-white">₹{b.amount}</td>
                  <td className="px-5 py-4"><Badge color={statusColors[b.status]}>{b.status}</Badge></td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => { setViewBooking(b); setViewModal(true); }}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-[#c88b4a] hover:text-[#c88b4a] dark:border-white/10 dark:text-gray-400"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">No bookings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Booking Details" size="md">
        {viewBooking && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c88b4a] to-[#a07035] text-lg font-bold text-white">
                {viewBooking.student.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h4 className="text-xl font-bold text-black dark:text-white">{viewBooking.student}</h4>
                <p className="text-sm text-gray-500">{viewBooking.email}</p>
              </div>
              <div className="ml-auto"><Badge color={statusColors[viewBooking.status]}>{viewBooking.status}</Badge></div>
            </div>
            <div className="grid gap-3 rounded-2xl bg-[#faf8f5] p-5 dark:bg-[#101010]">
              {[
                ["Booking ID", viewBooking.id],
                ["Session", viewBooking.session],
                ["Date", viewBooking.date],
                ["Time", viewBooking.time + " IST"],
                ["Amount Paid", `₹${viewBooking.amount}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-black dark:text-white">{value}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-black dark:text-white">Focus Goals</p>
              <div className="flex flex-wrap gap-2">
                {viewBooking.goals.map((g) => <Badge key={g} color="gold">{g}</Badge>)}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-sm font-semibold dark:border-white/10">
                <FiMail size={14} /> Email Student
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c88b4a] py-2.5 text-sm font-semibold text-white hover:bg-[#ad7437]">
                <FiCopy size={14} /> Copy ID
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TestimonialsSection({ testimonials, setTestimonials, notify }) {
  const [addModal, setAddModal] = useState(false);
  const [newT, setNewT] = useState({ name: "", role: "", rating: 5, text: "", date: "Just now", approved: false });

  const toggleApprove = (id) => {
    setTestimonials((prev) => prev.map((t) => t.id === id ? { ...t, approved: !t.approved } : t));
    notify("success", "Updated", "Testimonial status changed.");
  };

  const deleteT = (id) => {
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
    notify("success", "Deleted", "Testimonial removed.");
  };

  const addT = () => {
    setTestimonials((prev) => [...prev, {
      ...newT,
      id: Date.now(),
      avatar: newT.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
    }]);
    setAddModal(false);
    setNewT({ name: "", role: "", rating: 5, text: "", date: "Just now", approved: false });
    notify("success", "Added", "Testimonial added.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Testimonials</h2>
          <p className="mt-1 text-gray-500">Approve, manage and add student reviews.</p>
        </div>
        <div className="flex gap-3">
          <Badge color="gray">{testimonials.filter((t) => !t.approved).length} pending</Badge>
          <button onClick={() => setAddModal(true)} className="flex items-center gap-2 rounded-2xl bg-[#c88b4a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ad7437]">
            <FiPlus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((t) => (
          <div key={t.id} className={`rounded-[1.25rem] border p-5 transition ${t.approved ? "border-black/10 bg-white dark:border-white/10 dark:bg-[#151515]" : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/10"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#c88b4a] to-[#a07035] text-sm font-bold text-white">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-black dark:text-white">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
              <Badge color={t.approved ? "green" : "blue"}>{t.approved ? "Live" : "Pending"}</Badge>
            </div>

            <div className="mt-3 flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} size={13} className={i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">"{t.text}"</p>
            <div className="mt-3 text-xs text-gray-400">{t.date}</div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => toggleApprove(t.id)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-semibold transition ${t.approved ? "border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"}`}>
                <FiCheck size={13} /> {t.approved ? "Unpublish" : "Approve"}
              </button>
              <button onClick={() => deleteT(t.id)} className="rounded-xl border border-red-200 p-2 text-red-500 hover:bg-red-50 dark:border-red-800">
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Testimonial" size="md">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Student Name" value={newT.name} onChange={(e) => setNewT({ ...newT, name: e.target.value })} placeholder="Priya Sharma" />
            <Input label="Role / Company" value={newT.role} onChange={(e) => setNewT({ ...newT, role: e.target.value })} placeholder="SDE at Google" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} onClick={() => setNewT({ ...newT, rating: r })}>
                  <FiStar size={22} className={r <= newT.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                </button>
              ))}
            </div>
          </div>
          <Input label="Review Text" value={newT.text} onChange={(e) => setNewT({ ...newT, text: e.target.value })} rows={4} placeholder="Write the testimonial..." />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-black dark:text-white">Approve immediately</span>
            <Toggle checked={newT.approved} onChange={(v) => setNewT({ ...newT, approved: v })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddModal(false)} className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-semibold dark:border-white/10">Cancel</button>
            <button onClick={addT} disabled={!newT.name || !newT.text} className="flex-1 rounded-xl bg-[#c88b4a] py-2.5 text-sm font-semibold text-white hover:bg-[#ad7437] disabled:opacity-50">Add</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CouponsSection({ coupons, setCoupons, notify }) {
  const [addModal, setAddModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", type: "fixed", value: "", maxUsage: "", expiry: "", active: true });

  const toggleCoupon = (id) => {
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c));
    notify("info", "Updated", "Coupon status changed.");
  };

  const deleteCoupon = (id) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    notify("success", "Deleted", "Coupon removed.");
  };

  const addCoupon = () => {
    setCoupons((prev) => [...prev, {
      ...newCoupon,
      id: Date.now(),
      code: newCoupon.code.toUpperCase(),
      value: Number(newCoupon.value),
      maxUsage: Number(newCoupon.maxUsage),
      usageCount: 0,
    }]);
    setAddModal(false);
    setNewCoupon({ code: "", type: "fixed", value: "", maxUsage: "", expiry: "", active: true });
    notify("success", "Coupon Created", `Code "${newCoupon.code.toUpperCase()}" is now active.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Coupon Codes</h2>
          <p className="mt-1 text-gray-500">Create and manage discount codes for students.</p>
        </div>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-2 rounded-2xl bg-[#c88b4a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ad7437]">
          <FiPlus size={16} /> Create Coupon
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {coupons.map((c) => {
          const usagePercent = Math.round((c.usageCount / c.maxUsage) * 100);
          return (
            <div key={c.id} className={`rounded-[1.25rem] border p-5 transition ${c.active ? "border-black/10 bg-white dark:border-white/10 dark:bg-[#151515]" : "border-black/5 bg-gray-50 opacity-60 dark:border-white/5 dark:bg-[#111]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold text-[#c88b4a]">{c.code}</span>
                    <Badge color={c.active ? "green" : "gray"}>{c.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {c.type === "fixed" ? `₹${c.value} off` : `${c.value}% off`} · Expires {c.expiry}
                  </p>
                </div>
                <Toggle checked={c.active} onChange={() => toggleCoupon(c.id)} />
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Usage</span>
                  <span className="font-semibold">{c.usageCount} / {c.maxUsage}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 60 ? "bg-yellow-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-xs text-gray-400">{usagePercent}% used</div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(c.code); notify("success", "Copied!", `Code "${c.code}" copied to clipboard.`); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-black/10 py-2 text-sm font-semibold text-gray-600 hover:border-[#c88b4a] hover:text-[#c88b4a] dark:border-white/10 dark:text-gray-400"
                >
                  <FiCopy size={13} /> Copy
                </button>
                <button onClick={() => deleteCoupon(c.id)} className="rounded-xl border border-red-200 p-2 text-red-500 hover:bg-red-50 dark:border-red-800">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Create Coupon Code" size="md">
        <div className="space-y-4">
          <Input label="Coupon Code" value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER25" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Discount Type</label>
              <select value={newCoupon.type} onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })} className="w-full rounded-xl border border-black/10 bg-[#f6f3ef] px-4 py-3 text-sm outline-none focus:border-[#c88b4a] dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white">
                <option value="fixed">Fixed (₹)</option>
                <option value="percent">Percentage (%)</option>
              </select>
            </div>
            <Input label={newCoupon.type === "fixed" ? "Amount (₹)" : "Percentage (%)"} type="number" value={newCoupon.value} onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })} placeholder={newCoupon.type === "fixed" ? "50" : "20"} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Max Usage" type="number" value={newCoupon.maxUsage} onChange={(e) => setNewCoupon({ ...newCoupon, maxUsage: e.target.value })} placeholder="100" />
            <Input label="Expiry Date" type="date" value={newCoupon.expiry} onChange={(e) => setNewCoupon({ ...newCoupon, expiry: e.target.value })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-black dark:text-white">Active immediately</span>
            <Toggle checked={newCoupon.active} onChange={(v) => setNewCoupon({ ...newCoupon, active: v })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddModal(false)} className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-semibold dark:border-white/10">Cancel</button>
            <button onClick={addCoupon} disabled={!newCoupon.code || !newCoupon.value} className="flex-1 rounded-xl bg-[#c88b4a] py-2.5 text-sm font-semibold text-white hover:bg-[#ad7437] disabled:opacity-50">Create</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FAQsSection({ faqs, setFaqs, notify }) {
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [newFaq, setNewFaq] = useState({ q: "", a: "", active: true });

  const toggleFaq = (id) => {
    setFaqs((prev) => prev.map((f) => f.id === id ? { ...f, active: !f.active } : f));
    notify("info", "Updated", "FAQ visibility changed.");
  };

  const deleteFaq = (id) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    notify("success", "Deleted", "FAQ removed.");
  };

  const saveEdit = () => {
    setFaqs((prev) => prev.map((f) => f.id === editData.id ? editData : f));
    setEditModal(false);
    notify("success", "Saved", "FAQ updated.");
  };

  const addFaq = () => {
    setFaqs((prev) => [...prev, { ...newFaq, id: Date.now() }]);
    setAddModal(false);
    setNewFaq({ q: "", a: "", active: true });
    notify("success", "Added", "New FAQ added.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">FAQs</h2>
          <p className="mt-1 text-gray-500">Manage frequently asked questions shown on the booking page.</p>
        </div>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-2 rounded-2xl bg-[#c88b4a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ad7437]">
          <FiPlus size={16} /> Add FAQ
        </button>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <div key={faq.id} className={`rounded-2xl border p-5 transition ${faq.active ? "border-black/10 bg-white dark:border-white/10 dark:bg-[#151515]" : "border-black/5 bg-gray-50 opacity-60 dark:border-white/5 dark:bg-[#111]"}`}>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="font-semibold text-black dark:text-white">{faq.q}</p>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{faq.a}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Toggle checked={faq.active} onChange={() => toggleFaq(faq.id)} />
                <button onClick={() => { setEditData({ ...faq }); setEditModal(true); }} className="rounded-lg border border-black/10 p-2 text-gray-500 hover:border-[#c88b4a] hover:text-[#c88b4a] dark:border-white/10">
                  <FiEdit3 size={14} />
                </button>
                <button onClick={() => deleteFaq(faq.id)} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 dark:border-red-800">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit FAQ" size="md">
        {editData && (
          <div className="space-y-4">
            <Input label="Question" value={editData.q} onChange={(e) => setEditData({ ...editData, q: e.target.value })} />
            <Input label="Answer" value={editData.a} onChange={(e) => setEditData({ ...editData, a: e.target.value })} rows={4} />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditModal(false)} className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-semibold dark:border-white/10">Cancel</button>
              <button onClick={saveEdit} className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-[#c88b4a] py-2.5 text-sm font-semibold text-white hover:bg-[#ad7437]">
                <FiSave size={14} /> Save
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add FAQ" size="md">
        <div className="space-y-4">
          <Input label="Question" value={newFaq.q} onChange={(e) => setNewFaq({ ...newFaq, q: e.target.value })} placeholder="What if I need to reschedule?" />
          <Input label="Answer" value={newFaq.a} onChange={(e) => setNewFaq({ ...newFaq, a: e.target.value })} rows={4} placeholder="Write the answer here..." />
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddModal(false)} className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-semibold dark:border-white/10">Cancel</button>
            <button onClick={addFaq} disabled={!newFaq.q || !newFaq.a} className="flex-1 rounded-xl bg-[#c88b4a] py-2.5 text-sm font-semibold text-white hover:bg-[#ad7437] disabled:opacity-50">Add FAQ</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ProfileSection({ notify }) {
  const [profile, setProfile] = useState({
    name: "Arjun Khanna",
    title: "SDE-1 at Walmart",
    bio: "VNIT Metallurgy 2023 → ML Intern at Walmart Labs → SDE-1 at Walmart. Helps students build practical AI/ML profiles and convert preparation into interviews.",
    responseTime: "2 hrs",
    skills: ["Python", "Machine Learning", "System Design", "DSA"],
    stats: { students: "120+", rating: "4.9", placement: "6 mo", satisfaction: "96%" },
    platformFee: 25,
    mentorPhoto: "",
  });

  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile((p) => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill) => {
    setProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  };

  const save = () => notify("success", "Profile Saved", "All changes have been applied.");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">Mentor Profile</h2>
        <p className="mt-1 text-gray-500">Update what students see on the booking page.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5 rounded-[1.5rem] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#151515]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Display Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <Input label="Title / Role" value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} />
          </div>
          <Input label="Bio" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={4} />
          <Input label="Response Time" value={profile.responseTime} onChange={(e) => setProfile({ ...profile, responseTime: e.target.value })} placeholder="e.g. 2 hrs" />

          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Skills / Tags</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.skills.map((s) => (
                <span key={s} className="flex items-center gap-1.5 rounded-full border border-[#c88b4a]/30 bg-[#fff8ef] px-3 py-1.5 text-sm font-semibold text-[#8f5f2c] dark:bg-[#211a13] dark:text-[#e1b57e]">
                  {s}
                  <button onClick={() => removeSkill(s)}><FiX size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} placeholder="Add a skill and press Enter" className="flex-1 rounded-xl border border-black/10 bg-[#f6f3ef] px-4 py-3 text-sm outline-none focus:border-[#c88b4a] dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white" />
              <button onClick={addSkill} className="rounded-xl bg-[#c88b4a] px-4 text-white hover:bg-[#ad7437]">
                <FiPlus size={16} />
              </button>
            </div>
          </div>

          <div className="border-t border-black/5 pt-5 dark:border-white/5">
            <label className="mb-3 block text-sm font-semibold text-black dark:text-white">Stats</label>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(profile.stats).map(([key, val]) => (
                <Input key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val} onChange={(e) => setProfile({ ...profile, stats: { ...profile.stats, [key]: e.target.value } })} />
              ))}
            </div>
          </div>

          <div className="border-t border-black/5 pt-5 dark:border-white/5">
            <Input label="Platform Fee (₹)" type="number" value={profile.platformFee} onChange={(e) => setProfile({ ...profile, platformFee: Number(e.target.value) })} />
          </div>

          <button onClick={save} className="flex items-center gap-2 rounded-2xl bg-[#c88b4a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#ad7437]">
            <FiSave size={16} /> Save Profile
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#151515]">
            <h3 className="mb-4 font-bold text-black dark:text-white">Profile Photo</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#c88b4a] to-[#a07035]">
                {profile.mentorPhoto ? (
                  <img src={profile.mentorPhoto} alt="Mentor" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                    {profile.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-[#c88b4a] hover:text-[#c88b4a] dark:border-white/10 dark:text-gray-400">
                <FiUpload size={14} /> Upload Photo
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setProfile({ ...profile, mentorPhoto: ev.target.result });
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#151515]">
            <h3 className="mb-4 font-bold text-black dark:text-white">Live Preview</h3>
            <div className="rounded-2xl border border-black/10 bg-[#faf8f5] p-4 dark:border-white/10 dark:bg-[#101010]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#c88b4a] to-[#a07035] text-sm font-bold text-white">
                  {profile.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="font-bold text-black dark:text-white">{profile.name}</div>
                  <div className="text-xs text-gray-500">{profile.title}</div>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-600 dark:text-gray-400 line-clamp-3">{profile.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.skills.slice(0, 3).map((s) => (
                  <span key={s} className="rounded-full bg-[#c88b4a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#8f5f2c] dark:text-[#e1b57e]">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ darkMode, setDarkMode, notify }) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    bookingAlerts: true,
    weeklyReport: false,
    maintenanceMode: false,
    allowCancellations: true,
    maxBookingsPerDay: 5,
    cancellationWindow: 4,
    timezone: "Asia/Kolkata",
  });

  const save = () => notify("success", "Settings Saved", "All preferences have been updated.");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">Settings</h2>
        <p className="mt-1 text-gray-500">Configure platform behaviour and notifications.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#151515]">
          <h3 className="mb-5 font-bold text-black dark:text-white">Notifications</h3>
          <div className="space-y-5">
            {[
              ["emailNotifications", "Email Notifications", "Receive emails for new bookings"],
              ["bookingAlerts", "Booking Alerts", "Real-time alerts for new sessions"],
              ["weeklyReport", "Weekly Report", "Get a summary every Monday"],
            ].map(([key, label, desc]) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-black dark:text-white">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <Toggle checked={settings[key]} onChange={(v) => setSettings({ ...settings, [key]: v })} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#151515]">
          <h3 className="mb-5 font-bold text-black dark:text-white">Booking Rules</h3>
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">Allow Cancellations</p>
                <p className="text-xs text-gray-500 mt-0.5">Students can cancel before the window</p>
              </div>
              <Toggle checked={settings.allowCancellations} onChange={(v) => setSettings({ ...settings, allowCancellations: v })} />
            </div>
            <Input label="Max Bookings Per Day" type="number" value={settings.maxBookingsPerDay} onChange={(e) => setSettings({ ...settings, maxBookingsPerDay: Number(e.target.value) })} />
            <Input label="Cancellation Window (hours)" type="number" value={settings.cancellationWindow} onChange={(e) => setSettings({ ...settings, cancellationWindow: Number(e.target.value) })} />
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#151515]">
          <h3 className="mb-5 font-bold text-black dark:text-white">Appearance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">Dark Mode</p>
                <p className="text-xs text-gray-500">Toggle admin panel theme</p>
              </div>
              <Toggle checked={darkMode} onChange={setDarkMode} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Timezone</label>
              <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="w-full rounded-xl border border-black/10 bg-[#f6f3ef] px-4 py-3 text-sm outline-none focus:border-[#c88b4a] dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white">
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/10">
          <h3 className="mb-5 font-bold text-red-800 dark:text-red-400">Danger Zone</h3>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-400">Maintenance Mode</p>
                <p className="text-xs text-red-600/70 dark:text-red-500/70 mt-0.5">Hides the booking page from students</p>
              </div>
              <Toggle checked={settings.maintenanceMode} onChange={(v) => setSettings({ ...settings, maintenanceMode: v })} />
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30">
              <FiTrash2 size={14} /> Clear All Booking Data
            </button>
          </div>
        </div>
      </div>

      <button onClick={save} className="flex items-center gap-2 rounded-2xl bg-[#c88b4a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#ad7437]">
        <FiSave size={16} /> Save All Settings
      </button>
    </div>
  );
}

// ─── Main Admin App ───────────────────────────────────────────────────────────

export default function AdminApp() {
  // Initialise from the globally-persisted theme so Admin stays in sync with the rest of the site.
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("atyant-theme") !== "light"; } catch { return true; }
  });
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [sessions, setSessions] = useState(initialSessions);
  const [slots, setSlots] = useState(initialSlots);
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [coupons, setCoupons] = useState(initialCoupons);
  const [faqs, setFaqs] = useState(initialFaqs);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    try { localStorage.setItem("atyant-theme", darkMode ? "dark" : "light"); } catch { /* ignore */ }
  }, [darkMode]);

  const notify = useCallback((type, title, message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 4000);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard": return <DashboardSection sessions={sessions} slots={slots} bookings={recentBookings} testimonials={testimonials} coupons={coupons} />;
      case "sessions": return <SessionsSection sessions={sessions} setSessions={setSessions} notify={notify} />;
      case "schedule": return <ScheduleSection slots={slots} setSlots={setSlots} notify={notify} />;
      case "bookings": return <BookingsSection notify={notify} />;
      case "testimonials": return <TestimonialsSection testimonials={testimonials} setTestimonials={setTestimonials} notify={notify} />;
      case "coupons": return <CouponsSection coupons={coupons} setCoupons={setCoupons} notify={notify} />;
      case "faqs": return <FAQsSection faqs={faqs} setFaqs={setFaqs} notify={notify} />;
      case "profile": return <ProfileSection notify={notify} />;
      case "settings": return <SettingsSection darkMode={darkMode} setDarkMode={setDarkMode} notify={notify} />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f3ef] text-[#171412] dark:bg-[#0b0b0b] dark:text-white">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r border-black/10 bg-white transition-all duration-300 dark:border-white/10 dark:bg-[#151515] ${sidebarOpen ? "w-64" : "w-[72px]"} ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-black/5 px-4 dark:border-white/5">
          {sidebarOpen && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#c88b4a] to-[#ad7437]">
                <FiZap className="text-white" size={14} />
              </div>
              <span className="font-bold text-black dark:text-white">Admin Panel</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 lg:block">
            <FiMenu size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setActiveSection(item.key); setMobileSidebarOpen(false); }}
                title={!sidebarOpen ? item.label : ""}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  activeSection === item.key
                    ? "bg-[#c88b4a] text-white shadow-lg shadow-[#c88b4a]/25"
                    : "text-gray-600 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/5"
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-black/5 p-3 dark:border-white/5">
          <div className={`flex items-center gap-3 rounded-xl p-2 ${sidebarOpen ? "" : "justify-center"}`}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c88b4a] to-[#a07035] text-xs font-bold text-white">
              AK
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-black dark:text-white">Arjun Khanna</p>
                <p className="truncate text-xs text-gray-500">Mentor Admin</p>
              </div>
            )}
            {sidebarOpen && (
              <button className="text-gray-400 hover:text-red-500 transition">
                <FiLogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-[72px]"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-black/10 bg-white/80 px-4 backdrop-blur-sm dark:border-white/10 dark:bg-[#0b0b0b]/80 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 lg:hidden">
              <FiMenu size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold capitalize text-black dark:text-white">{activeSection}</h1>
              <p className="hidden text-xs text-gray-500 sm:block">Mentor Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open("/", "_blank")}
              className="hidden items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#c88b4a] hover:text-[#c88b4a] dark:border-white/10 dark:text-gray-400 sm:flex"
            >
              <FiEye size={14} /> Preview Page
            </button>
            <div className="relative">
              <button className="relative rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">
                <FiBell size={18} />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-xl border border-black/10 p-2 text-gray-600 transition hover:border-[#c88b4a] dark:border-white/10 dark:text-gray-400"
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {renderSection()}
          </div>
        </main>
      </div>

      <Notification notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
}