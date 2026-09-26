import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api";
import PageHeader from "../components/ui/PageHeader";

import {
  IndianRupee,
  Headphones,
  Video,
  FileText,
  CalendarDays,
  Clock,
  CheckCircle,
  Users,
  MessageCircle,
} from "lucide-react";

// Shared app tokens (index.css) — same surfaces as every other page, light + dark.
const C = {
  bg: "var(--c-bg)",
  card: "var(--c-card)",
  cardBorder: "var(--c-cardBorder)",
  active: "var(--c-active)",
  accent: "#7567C9",
  accentText: "var(--c-accentText)",
  text: "var(--c-text)",
  textSub: "var(--c-textSub)",
  textMuted: "var(--c-textMuted)",
  green: "#3DBE82",
};

const card = { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12 };

function StatCard({ Icon, label, value, note }) {
  return (
    <div style={{ ...card, padding: "16px 18px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.8rem", fontWeight: 600, color: C.textSub }}>
        <Icon size={15} color={C.textMuted} strokeWidth={2} />
        {label}
      </div>
      <div style={{ marginTop: 10, fontFamily: "var(--font-display)", fontSize: "1.9rem", lineHeight: 1.1, color: C.text, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {note && <div style={{ marginTop: 4, fontSize: "0.74rem", color: C.textMuted }}>{note}</div>}
    </div>
  );
}

function SkeletonCard() {
  const bar = (w, h, mb) => (
    <div style={{ width: w, height: h, borderRadius: 6, background: C.active, marginBottom: mb, animation: "atyantPulse 1.4s ease-in-out infinite" }} />
  );
  return (
    <div style={{ ...card, padding: "16px 18px", height: 96, boxSizing: "border-box" }}>
      {bar("45%", 12, 14)}
      {bar("35%", 26, 0)}
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 12, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
      {subtitle && <span style={{ fontSize: "0.78rem", color: C.textMuted }}>{subtitle}</span>}
    </div>
  );
}

// Session formats as one list with a share-of-total bar, instead of four look-alike tiles.
function FormatBreakdown({ rows }) {
  const total = rows.reduce((n, r) => n + r.value, 0);
  return (
    <div style={{ ...card, padding: "6px 18px" }}>
      {rows.map((r, i) => {
        const pct = total ? Math.round((r.value / total) * 100) : 0;
        return (
          <div key={r.label} style={{ display: "grid", gridTemplateColumns: "minmax(130px, 1fr) 2fr 48px", alignItems: "center", gap: 14, padding: "12px 0", borderTop: i ? `1px solid ${C.cardBorder}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.86rem", color: C.text }}>
              <r.Icon size={15} color={C.textMuted} /> {r.label}
            </div>
            <div style={{ height: 6, borderRadius: 3, background: C.active, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: C.accent, borderRadius: 3 }} />
            </div>
            <div style={{ textAlign: "right", fontSize: "0.9rem", fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{r.value}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function MentorTrackPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalEarnings: 0,
    bookedToday: 0,
    pending: 0,
    completed: 0,
    totalStudents: 0,
    chatSessions: 0,
    audioSessions: 0,
    videoSessions: 0,
    resumeReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/sessions/mentor/${user._id}/stats`
        );

        const data = response.data;

        // Guard against malformed/non-object responses so the UI never
        // shows "undefined" or blank values again.
        if (data && typeof data === "object" && !Array.isArray(data)) {
          setStats({
            totalEarnings: Number(data.totalEarnings) || 0,
            bookedToday: Number(data.bookedToday) || 0,
            pending: Number(data.pending) || 0,
            completed: Number(data.completed) || 0,
            totalStudents: Number(data.totalStudents) || 0,
            chatSessions: Number(data.chatSessions) || 0,
            audioSessions: Number(data.audioSessions) || 0,
            videoSessions: Number(data.videoSessions) || 0,
            resumeReviews: Number(data.resumeReviews) || 0,
          });
        } else {
          console.error("Unexpected stats response:", data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (!user) {
    return (
      <div style={{ minHeight: "100%", background: C.bg, color: C.textSub, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", padding: 24 }}>
        Sign in to see your mentor dashboard.
      </div>
    );
  }

  const totalSessions = stats.bookedToday + stats.pending + stats.completed;

  return (
    <div style={{ minHeight: "100%", background: C.bg, color: C.text }}>
      <style>{`@keyframes atyantPulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }`}</style>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 16px 60px" }}>
        <PageHeader
          title={`Welcome back${user?.username ? `, ${user.username}` : ""}`}
          subtitle={totalSessions > 0
            ? `You've had ${totalSessions} session${totalSessions === 1 ? "" : "s"} so far. Here's where things stand.`
            : "No sessions yet. Once students book you, they'll show up here."}
        />

        <div style={{ marginBottom: 28 }}>
          <SectionTitle title="Overview" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <StatCard Icon={IndianRupee} label="Total earnings" value={`₹${stats.totalEarnings.toLocaleString("en-IN")}`} />
                <StatCard Icon={CalendarDays} label="Sessions today" value={stats.bookedToday} />
                <StatCard Icon={Clock} label="Pending" value={stats.pending} />
                <StatCard Icon={CheckCircle} label="Completed" value={stats.completed} />
                <StatCard Icon={Users} label="Students helped" value={stats.totalStudents} />
              </>
            )}
          </div>
        </div>

        <div>
          <SectionTitle title="Sessions by format" />
          {loading ? <SkeletonCard /> : (
            <FormatBreakdown rows={[
              { Icon: MessageCircle, label: "Chat", value: stats.chatSessions },
              { Icon: Headphones, label: "Audio calls", value: stats.audioSessions },
              { Icon: Video, label: "Video calls", value: stats.videoSessions },
              { Icon: FileText, label: "Resume reviews", value: stats.resumeReviews },
            ]} />
          )}
        </div>
      </div>
    </div>
  );
}
