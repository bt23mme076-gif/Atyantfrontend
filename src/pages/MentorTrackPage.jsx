import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api";

import {
  DollarSign,
  CalendarDays,
  Clock,
  CheckCircle,
  Users,
  MessageCircle,
  Headphones,
  Video,
  FileText,
  TrendingUp,
} from "lucide-react";

// ── Theme ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0b1120",
  bgGlow1: "rgba(99, 102, 241, 0.18)",
  bgGlow2: "rgba(16, 185, 129, 0.10)",
  card: "rgba(255, 255, 255, 0.035)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  cardHoverBorder: "rgba(165, 180, 252, 0.35)",
  text: "#f8fafc",
  textSub: "#94a3b8",
  textMuted: "#64748b",
};

const ACCENTS = {
  indigo: { bg: "linear-gradient(135deg,#6366f1,#4f46e5)", glow: "rgba(99,102,241,0.35)", text: "#a5b4fc" },
  emerald: { bg: "linear-gradient(135deg,#10b981,#059669)", glow: "rgba(16,185,129,0.30)", text: "#6ee7b7" },
  amber: { bg: "linear-gradient(135deg,#f59e0b,#d97706)", glow: "rgba(245,158,11,0.30)", text: "#fcd34d" },
  sky: { bg: "linear-gradient(135deg,#0ea5e9,#0284c7)", glow: "rgba(14,165,233,0.30)", text: "#7dd3fc" },
  violet: { bg: "linear-gradient(135deg,#a855f7,#7c3aed)", glow: "rgba(168,85,247,0.30)", text: "#d8b4fe" },
  rose: { bg: "linear-gradient(135deg,#f43f5e,#e11d48)", glow: "rgba(244,63,94,0.30)", text: "#fda4af" },
  cyan: { bg: "linear-gradient(135deg,#06b6d4,#0891b2)", glow: "rgba(6,182,212,0.30)", text: "#67e8f9" },
  fuchsia: { bg: "linear-gradient(135deg,#d946ef,#c026d3)", glow: "rgba(217,70,239,0.30)", text: "#f0abfc" },
};

function StatCard({ Icon, label, value, accent = "indigo", big, trend }) {
  const a = ACCENTS[accent];
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        background: C.card,
        backdropFilter: "blur(10px)",
        border: `1px solid ${hover ? C.cardHoverBorder : C.cardBorder}`,
        borderRadius: 18,
        padding: "1.3rem 1.4rem",
        minWidth: 0,
        overflow: "hidden",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hover
          ? `0 14px 28px -10px ${a.glow}, 0 0 0 1px ${a.glow}`
          : "0 4px 14px -8px rgba(0,0,0,0.4)",
        transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
      }}
    >
      {/* soft glow blob */}
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: a.glow,
          filter: "blur(36px)",
          opacity: hover ? 0.9 : 0.5,
          transition: "opacity 0.25s",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: a.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
            boxShadow: `0 6px 16px -4px ${a.glow}`,
          }}
        >
          <Icon size={18} color="#fff" strokeWidth={2.2} />
        </div>

        {trend && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: "0.68rem",
              fontWeight: 700,
              color: ACCENTS.emerald.text,
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 999,
              padding: "3px 8px",
            }}
          >
            <TrendingUp size={11} /> {trend}
          </span>
        )}
      </div>

      <div
        style={{
          position: "relative",
          fontSize: big ? "1.9rem" : "1.5rem",
          fontWeight: 800,
          color: C.text,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>

      <div
        style={{
          position: "relative",
          fontSize: "0.78rem",
          color: C.textSub,
          marginTop: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 18,
        padding: "1.3rem 1.4rem",
        height: 118,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.06)", marginBottom: 14, animation: "atyantPulse 1.4s ease-in-out infinite" }} />
      <div style={{ width: "55%", height: 22, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginBottom: 8, animation: "atyantPulse 1.4s ease-in-out infinite" }} />
      <div style={{ width: "70%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "atyantPulse 1.4s ease-in-out infinite" }} />
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 18, display: "flex", alignItems: "baseline", gap: 10 }}>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
      {subtitle && <span style={{ fontSize: "0.78rem", color: C.textMuted }}>{subtitle}</span>}
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
      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          color: C.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1rem",
        }}
      >
        Please login first.
      </div>
    );
  }

  const totalSessions = stats.bookedToday + stats.pending + stats.completed;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes atyantPulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes atyantFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Ambient background glows */}
      <div style={{ position: "absolute", top: -120, left: -100, width: 420, height: 420, borderRadius: "50%", background: C.bgGlow1, filter: "blur(110px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 200, right: -140, width: 380, height: 380, borderRadius: "50%", background: C.bgGlow2, filter: "blur(110px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "2.5rem 1.75rem 4rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.2rem", animation: "atyantFadeUp 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 4px rgba(16,185,129,0.18)" }} />
            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Mentor Workspace
            </span>
          </div>
          <h1
            style={{
              fontSize: "2.1rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
              background: "linear-gradient(135deg,#ffffff,#cbd5e1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Welcome back{user?.username ? `, ${user.username}` : ""} 👋
          </h1>
          <p style={{ color: C.textSub, fontSize: "0.92rem", marginTop: 8 }}>
            Here's how your mentoring is going{totalSessions > 0 ? ` — ${totalSessions} sessions tracked so far.` : "."}
          </p>
        </div>

        {/* Main Stats */}
        <div style={{ marginBottom: "2.4rem" }}>
          <SectionTitle title="Overview" subtitle="Updated in real time" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <StatCard Icon={DollarSign} label="Total Earnings" value={`₹${stats.totalEarnings.toLocaleString("en-IN")}`} accent="emerald" big />
                <StatCard Icon={CalendarDays} label="Sessions Today" value={stats.bookedToday} accent="sky" />
                <StatCard Icon={Clock} label="Pending Sessions" value={stats.pending} accent="amber" />
                <StatCard Icon={CheckCircle} label="Completed Sessions" value={stats.completed} accent="indigo" />
                <StatCard Icon={Users} label="Students Helped" value={stats.totalStudents} accent="violet" />
              </>
            )}
          </div>
        </div>

        {/* Session Breakdown */}
        <div>
          <SectionTitle title="Session Breakdown" subtitle="By format" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <StatCard Icon={MessageCircle} label="Chat Sessions" value={stats.chatSessions} accent="cyan" />
                <StatCard Icon={Headphones} label="Audio Calls" value={stats.audioSessions} accent="rose" />
                <StatCard Icon={Video} label="Video Sessions" value={stats.videoSessions} accent="fuchsia" />
                <StatCard Icon={FileText} label="Resume Reviews" value={stats.resumeReviews} accent="amber" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}