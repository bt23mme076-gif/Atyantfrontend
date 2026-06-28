import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
} from "lucide-react";

function StatCard({ Icon, label, value, hint }) {
  return (
    <div
      style={{
        background: "#1f2937",
        border: "1px solid #374151",
        borderRadius: 16,
        padding: "1rem 1.1rem",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: "#312e81",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Icon size={16} style={{ color: "#a5b4fc" }} />
      </div>

      <div
        style={{
          fontSize: "1.35rem",
          fontWeight: 700,
          color: "white",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: ".72rem",
          color: "#9ca3af",
          marginTop: 4,
          fontWeight: 500,
        }}
      >
        {label}
      </div>

      {hint && (
        <div
          style={{
            fontSize: ".66rem",
            color: "#6b7280",
            marginTop: 2,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export default function MentorTrackPage() {
    const { user } = useAuth();

console.log(user);
console.log(user?._id);
    
    
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
        `/api/sessions/mentor/${user._id}/stats`
      );

      setStats(response.data);
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
    <div style={{ color: "white", padding: "40px" }}>
      Please login first.
    </div>
  );
}
if (loading) {
  return (
    <div
      style={{
        color: "white",
        padding: "40px",
        fontSize: "20px",
      }}
    >
      Loading dashboard...
    </div>
  );
}
  return (
    <div
      style={{
        padding: "30px",
        minHeight: "100vh",
        background: "#111827",
        color: "white",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "700",
          marginBottom: "25px",
        }}
      >
        Mentor Dashboard
      </h1>

      {/* Main Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <StatCard Icon={DollarSign} label="Total Earnings" value={`₹${stats.totalEarnings}`} />
        <StatCard Icon={CalendarDays} label="Sessions Today" value={stats.bookedToday} />
        <StatCard Icon={Clock} label="Pending Sessions" value={stats.pending} />
        <StatCard Icon={CheckCircle} label="Completed Sessions" value={stats.completed} />
        <StatCard Icon={Users} label="Students Helped" value={stats.totalStudents} />
      </div>

      <h2 style={{ marginBottom: "20px" }}>Session Breakdown</h2>

      {/* Session Types */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
       <StatCard Icon={MessageCircle} label="Chat Sessions" value={stats.chatSessions} />
<StatCard Icon={Headphones} label="Audio Calls" value={stats.audioSessions} />
<StatCard Icon={Video} label="Video Sessions" value={stats.videoSessions} />
<StatCard Icon={FileText} label="Resume Reviews" value={stats.resumeReviews} />
      </div>
    </div>
  );
}