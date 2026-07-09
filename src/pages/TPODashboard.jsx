import React, { useState, useMemo, useEffect } from "react";
import {
  Download, Search, Star, Plus, Building2,
  X, BarChart3, Users, Calendar, Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { tpoAPI } from "../api";

const C = {
  bg:          "var(--c-bg)",
  card:        "var(--c-card)",
  cardHover:   "var(--c-cardHover)",
  cardBorder:  "var(--c-cardBorder)",
  active:      "var(--c-active)",
  activeBorder:"var(--c-activeBorder)",
  accentSoft:  "var(--c-accentSoft)",
  accentText:  "var(--c-accentText)",
  text:        "var(--c-text)",
  textSub:     "var(--c-textSub)",
  textMuted:   "var(--c-textMuted)",
  accent:      "#7567C9",
  green:       "#3DBE82",
  orange:      "#F59E0B",
};

const TPO_EMAIL = "atyant.in@gmail.com";

// ── Demo data (shown while backend endpoints are being built) ─────────────────
const DEMO_STUDENTS = [
  { id:"mock_1",  name:"Vedant Shelke",   email:"", branch:"CSE",   year:4, cgpa:"8.7", company:"TCS",       status:"completed", mentor:"Vedang Lokhande",         mentorId:"", date:"01 Jul 2026, 11:00 AM", rating:5, type:"Mock Interview" },
  { id:"mock_2",  name:"Dev Mehta",       email:"", branch:"MME",   year:2, cgpa:"7.9", company:"Accenture", status:"completed", mentor:"Shreyansh Dixit",         mentorId:"", date:"02 Jul 2026, 02:00 PM", rating:5, type:"Mock Interview" },
  { id:"mock_3",  name:"Shravya Puram",   email:"", branch:"CSE",   year:4, cgpa:"8.2", company:"Infosys",   status:"completed", mentor:"Vedang Lokhande",         mentorId:"", date:"03 Jul 2026, 10:30 AM", rating:4, type:"Mock Interview" },
  { id:"mock_4",  name:"Priyanshu Barad", email:"", branch:"CSE",   year:2, cgpa:"8.5", company:"Google",    status:"completed", mentor:"Shreyansh Dixit",         mentorId:"", date:"04 Jul 2026, 03:00 PM", rating:4, type:"Mock Interview" },
  { id:"mock_5",  name:"Ankit Sharma",    email:"", branch:"ECE",   year:4, cgpa:"7.6", company:"Samsung",   status:"booked",    mentor:"Ravi Kumar",              mentorId:"", date:"12 Jul 2026, 11:00 AM", rating:0, type:"Mock Interview" },
  { id:"mock_6",  name:"Priya Nair",      email:"", branch:"CSE",   year:4, cgpa:"9.1", company:"Microsoft", status:"booked",    mentor:"Neha Agarwal",            mentorId:"", date:"13 Jul 2026, 10:00 AM", rating:0, type:"Mock Interview" },
  { id:"mock_7",  name:"Rohan Verma",     email:"", branch:"Mech",  year:4, cgpa:"7.3", company:"L&T",       status:"booked",    mentor:"Arjun Mehta",             mentorId:"", date:"14 Jul 2026, 02:00 PM", rating:0, type:"Mock Interview" },
  { id:"mock_8",  name:"Sneha Joshi",     email:"", branch:"CSE",   year:4, cgpa:"8.9", company:"Amazon",    status:"pending",   mentor:"", mentorId:"", date:"", rating:0, type:"" },
  { id:"mock_9",  name:"Karan Patel",     email:"", branch:"ECE",   year:4, cgpa:"7.8", company:"Wipro",     status:"pending",   mentor:"", mentorId:"", date:"", rating:0, type:"" },
  { id:"mock_10", name:"Aisha Khan",      email:"", branch:"CSE",   year:4, cgpa:"8.3", company:"Deloitte",  status:"pending",   mentor:"", mentorId:"", date:"", rating:0, type:"" },
  { id:"mock_11", name:"Amit Tiwari",     email:"", branch:"Civil", year:4, cgpa:"7.1", company:"AECOM",     status:"pending",   mentor:"", mentorId:"", date:"", rating:0, type:"" },
  { id:"mock_12", name:"Divya Reddy",     email:"", branch:"Chem",  year:4, cgpa:"8.0", company:"Reliance",  status:"pending",   mentor:"", mentorId:"", date:"", rating:0, type:"" },
];

const DEMO_MENTORS = [
  { _id:"dm1", displayName:"Vedang Lokhande · SDE, Accenture" },
  { _id:"dm2", displayName:"Shreyansh Dixit · Product Intern, Linkfluencor" },
  { _id:"dm3", displayName:"Ravi Kumar · SDE-2, Samsung R&D" },
  { _id:"dm4", displayName:"Neha Agarwal · SDE-2, Microsoft" },
  { _id:"dm5", displayName:"Arjun Mehta · Engineer, L&T ECC" },
  { _id:"dm6", displayName:"Pooja Singh · Data Analyst, TCS" },
  { _id:"dm7", displayName:"Rahul Dev · SDE, Amazon" },
  { _id:"dm8", displayName:"Kirti Verma · SWE, Google" },
];

// Map a backend student document → internal row shape
function mapStudent(s) {
  const edu = Array.isArray(s.education) ? s.education[0] : {};
  return {
    id:       s._id,
    name:     s.name || s.username || "Unknown",
    email:    s.email || "",
    branch:   edu.field || s.branch || "—",
    year:     parseInt(edu.year || s.year) || 4,
    cgpa:     String(edu.cgpa || s.cgpa || "—"),
    company:  s.targetCompany || s.company || "",
    status:   s.sessionStatus || "pending",
    mentor:   s.mentorName   || "",
    mentorId: s.mentorId     || "",
    date:     s.sessionDate  || "",
    rating:   s.sessionRating || 0,
    type:     s.sessionType  || "",
  };
}

// Map a backend mentor document → { _id, displayName }
function mapMentor(m) {
  const role    = m.currentRole    || m.role    || "";
  const company = m.currentCompany || m.company || "";
  const suffix  = [role, company].filter(Boolean).join(", ");
  return {
    _id:         m._id,
    displayName: suffix ? `${m.name || m.username} · ${suffix}` : (m.name || m.username),
  };
}

const BRANCHES = [
  "All",
  "Computer Science and Engineering (CSE)",
  "Electronics and Communication Engineering (ECE)",
  "Electrical and Electronics Engineering (EE)",
  "Mechanical Engineering (ME)",
  "Chemical Engineering",
  "Civil Engineering",
  "Mining Engineering",
  "Metallurgical and Materials Engineering",
];

// Keywords to match against student.branch (which may be abbreviated in DB)
const BRANCH_KEYS = {
  "Computer Science and Engineering (CSE)":        ["cse", "computer science"],
  "Electronics and Communication Engineering (ECE)":["ece", "electronics"],
  "Electrical and Electronics Engineering (EE)":   ["ee", "electrical"],
  "Mechanical Engineering (ME)":                   ["me", "mechanical"],
  "Chemical Engineering":                          ["chemical"],
  "Civil Engineering":                             ["civil"],
  "Mining Engineering":                            ["mining"],
  "Metallurgical and Materials Engineering":       ["metallurgical", "materials", "mme"],
};

function branchMatches(studentBranch, filter) {
  if (filter === "All") return true;
  const b = (studentBranch || "").toLowerCase();
  const keys = BRANCH_KEYS[filter] || [filter.toLowerCase()];
  return keys.some(k => b.includes(k));
}
const STATUS_OPTS = ["All", "completed", "booked", "pending"];
const TYPES       = ["Mock Interview", "Resume Review", "OA Prep"];

function Spin({ size = 18 }) {
  return <Loader2 size={size} style={{ animation:"spin 1s linear infinite" }} />;
}

function StatusBadge({ status }) {
  const config = {
    completed: { label:"Completed", bg:"rgba(61,190,130,0.15)",  color:"#3DBE82" },
    booked:    { label:"Booked",    bg:"rgba(117,103,201,0.12)", color:"#7567C9" },
    pending:   { label:"Pending",   bg:"rgba(245,158,11,0.12)",  color:"#F59E0B" },
  }[status] || { label:status, bg:C.active, color:C.textMuted };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:999, background:config.bg, color:config.color, fontSize:"0.72rem", fontWeight:600, whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:config.color, flexShrink:0 }} />
      {config.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"1.1rem 1.25rem", flex:1, minWidth:130 }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
        <Icon size={14} color={color || C.textMuted} />
        <div style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", color:C.textMuted, textTransform:"uppercase" }}>{label}</div>
      </div>
      <div style={{ fontSize:"1.7rem", fontWeight:700, color:color || C.text, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:"0.73rem", color:C.textMuted, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

// ── Schedule Modal ────────────────────────────────────────────────────────────
function ScheduleModal({ students, mentors, onClose, onScheduled }) {
  const pending = students.filter(s => s.status === "pending");

  const [studentId,     setStudentId]     = useState(pending[0]?.id || "");
  const [mentorId,      setMentorId]      = useState("");
  const [date,          setDate]          = useState("");
  const [time,          setTime]          = useState("10:00");
  const [type,          setType]          = useState("Mock Interview");
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");

  const selected      = students.find(s => s.id === studentId);
  const selectedMentor = mentors.find(m => m._id === mentorId);
  const canSubmit     = studentId && mentorId && date && !saving;

  const inp = { width:"100%", background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:9, padding:"9px 12px", color:C.text, fontSize:"0.88rem", outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

  const fmtDate = (d, t) => {
    const obj = new Date(`${d}T${t}`);
    return obj.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
      + ", " + obj.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    try {
      await tpoAPI.bookSession({
        studentId,
        mentorId,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        topic:       `${type} · ${selected?.company || ""}`,
        serviceId:   "video-call",
        durationMin: 30,
      });
    } catch (err) {
      // 404 = backend endpoint not built yet → proceed optimistically
      // Any other error = surface to TPO
      if (err.status !== 404 && err.status !== 405) {
        setError(err.message || "Failed to schedule. Please try again.");
        setSaving(false);
        return;
      }
    }
    onScheduled({
      studentId,
      mentor:   selectedMentor?.displayName || "",
      mentorId,
      date:     fmtDate(date, time),
      type,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"var(--c-sidebar)", border:`1px solid ${C.cardBorder}`, borderRadius:20, padding:"1.75rem", width:440, position:"relative", maxHeight:"90vh", overflowY:"auto" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:"50%", width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textSub }}>
          <X size={14} />
        </button>

        <div style={{ fontWeight:700, fontSize:"1.05rem", color:C.text, marginBottom:"1.5rem" }}>Schedule Mock Interview</div>

        {pending.length === 0 ? (
          <div style={{ textAlign:"center", padding:"2rem", color:C.textMuted, fontSize:"0.85rem" }}>
            All students have sessions scheduled or completed.
          </div>
        ) : (
          <div style={{ display:"grid", gap:"1rem" }}>

            <div>
              <label style={{ fontSize:"0.72rem", color:C.textSub, display:"block", marginBottom:5, fontWeight:700, letterSpacing:"0.05em" }}>STUDENT</label>
              <select value={studentId} onChange={e => setStudentId(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
                {pending.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.branch ? ` · ${s.branch}` : ""}{s.company ? ` · ${s.company}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {selected && (
              <div style={{ padding:"0.75rem 1rem", background:C.active, borderRadius:10, border:`1px solid ${C.cardBorder}`, fontSize:"0.79rem", color:C.textSub, display:"flex", gap:"1.5rem", flexWrap:"wrap" }}>
                {selected.cgpa    && <span>CGPA: <strong style={{ color:C.text }}>{selected.cgpa}</strong></span>}
                {selected.company && <span>Target: <strong style={{ color:C.text }}>{selected.company}</strong></span>}
                {selected.branch  && <span>Branch: <strong style={{ color:C.text }}>{selected.branch}</strong></span>}
              </div>
            )}

            <div>
              <label style={{ fontSize:"0.72rem", color:C.textSub, display:"block", marginBottom:5, fontWeight:700, letterSpacing:"0.05em" }}>MENTOR</label>
              <select value={mentorId} onChange={e => setMentorId(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
                <option value="">Select mentor…</option>
                {mentors.map(m => (
                  <option key={m._id} value={m._id}>{m.displayName}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize:"0.72rem", color:C.textSub, display:"block", marginBottom:5, fontWeight:700, letterSpacing:"0.05em" }}>SESSION TYPE</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
              <div>
                <label style={{ fontSize:"0.72rem", color:C.textSub, display:"block", marginBottom:5, fontWeight:700, letterSpacing:"0.05em" }}>DATE</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ fontSize:"0.72rem", color:C.textSub, display:"block", marginBottom:5, fontWeight:700, letterSpacing:"0.05em" }}>TIME</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inp} />
              </div>
            </div>

            {error && (
              <div style={{ padding:"0.65rem 0.9rem", borderRadius:9, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", color:"#f87171", fontSize:"0.8rem" }}>
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{ marginTop:"0.25rem", width:"100%", padding:"11px", borderRadius:10, background:"linear-gradient(135deg,#7567C9,#5a52a8)", color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", cursor:canSubmit ? "pointer" : "not-allowed", opacity:canSubmit ? 1 : 0.55, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {saving ? <><Spin size={15} /> Scheduling…</> : "Confirm Schedule →"}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function TPODashboard() {
  const { user } = useAuth();

  const [students,     setStudents]     = useState(DEMO_STUDENTS);
  const [mentors,      setMentors]      = useState(DEMO_MENTORS);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("students");
  const [search,       setSearch]       = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal,    setShowModal]    = useState(false);
  const [expandedId,   setExpandedId]   = useState(null);
  const [page,         setPage]         = useState(1);
  const PAGE_SIZE = 10;

  // Fetch real students + mentors from backend; silently fall back to demo data
  useEffect(() => {
    if (user?.email !== TPO_EMAIL) { setLoading(false); return; }

    Promise.allSettled([tpoAPI.students(), tpoAPI.mentors()])
      .then(([studentsRes, mentorsRes]) => {
        if (studentsRes.status === "fulfilled" && studentsRes.value?.students?.length) {
          const mapped = studentsRes.value.students.map(mapStudent);
          // Keep completed pilot sessions from demo if not yet in DB
          setStudents(prev => {
            const dbIds = new Set(mapped.map(s => s.id));
            const pilotOnly = prev.filter(s => !dbIds.has(s.id) && s.status === "completed");
            return [...mapped, ...pilotOnly];
          });
        }
        if (mentorsRes.status === "fulfilled" && mentorsRes.value?.mentors?.length) {
          setMentors(mentorsRes.value.mentors.map(mapMentor));
        }
      })
      .finally(() => setLoading(false));
  }, [user?.email]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(s => {
      const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.company||"").toLowerCase().includes(q) || s.branch.toLowerCase().includes(q);
      const matchBranch = branchMatches(s.branch, branchFilter);
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      return matchSearch && matchBranch && matchStatus;
    });
  }, [students, search, branchFilter, statusFilter]);

  useEffect(() => { setPage(1); }, [search, branchFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const branchStats = useMemo(() => {
    function normalizeBranch(raw) {
      if (!raw) return null;
      const b = raw.toLowerCase();
      for (const [label, keys] of Object.entries(BRANCH_KEYS)) {
        if (keys.some(k => b.includes(k))) return label;
      }
      return null; // skip unrecognised branches
    }
    const map = {};
    students.forEach(s => {
      const label = normalizeBranch(s.branch);
      if (!label) return;
      if (!map[label]) map[label] = { total: 0, completed: 0 };
      map[label].total++;
      if (s.status === "completed") map[label].completed++;
    });
    return Object.entries(map)
      .map(([branch, { total, completed }]) => ({
        branch, total, completed, pct: Math.round(completed / total * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [students]);

  if (user?.email !== TPO_EMAIL) {
    return (
      <div style={{ padding:"4rem 2rem", textAlign:"center" }}>
        <div style={{ fontSize:"2.5rem", marginBottom:"1rem" }}>🔒</div>
        <div style={{ fontWeight:700, fontSize:"1.1rem", color:C.text, marginBottom:6 }}>Access Restricted</div>
        <div style={{ fontSize:"0.85rem", color:C.textMuted }}>This page is only accessible to VNIT T&P administrators.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding:"4rem", display:"flex", alignItems:"center", justifyContent:"center", color:C.textMuted }}>
        <Spin size={24} />
      </div>
    );
  }

  const completed     = students.filter(s => s.status === "completed");
  const booked        = students.filter(s => s.status === "booked");
  const pending       = students.filter(s => s.status === "pending");
  const avgRating     = completed.length
    ? (completed.reduce((a, s) => a + s.rating, 0) / completed.length).toFixed(1)
    : "—";
  const completionPct = Math.round((completed.length / students.length) * 100);

  const handleScheduled = ({ studentId, mentor, mentorId, date, type }) => {
    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, status:"booked", mentor, mentorId, date, type } : s
    ));
  };

  const exportCSV = () => {
    const rows = [
      ["Name","Email","Branch","Year","CGPA","Target Company","Status","Mentor","Session Date","Session Type","Rating"],
      ...students.map(s => [s.name, s.email, s.branch, s.year, s.cgpa, s.company, s.status, s.mentor||"Not assigned", s.date||"Not scheduled", s.type||"—", s.rating||"—"]),
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `vnit-tpo-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id:"students",  label:"Students",         count:students.length },
    { id:"upcoming",  label:"Upcoming Sessions", count:booked.length },
    { id:"analytics", label:"Analytics",         count:null },
  ];

  const inp = { background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:9, padding:"8px 12px", color:C.text, fontSize:"0.85rem", outline:"none", fontFamily:"inherit" };
  const COL = "2.2fr 0.9fr 0.7fr 1.3fr 1.1fr 1.6fr 0.7fr";

  return (
    <div style={{ padding:"2rem", maxWidth:1120, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.75rem", flexWrap:"wrap", gap:"1rem" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#7567C9,#9F7AEA)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Building2 size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize:"1.4rem", fontWeight:700, color:C.text, margin:0 }}>VNIT T&P Dashboard</h1>
          </div>
          <p style={{ fontSize:"0.83rem", color:C.textMuted, margin:0 }}>
            Phase 1 · Mock Interview Pilot · {new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
          </p>
        </div>
        <div style={{ display:"flex", gap:"0.75rem" }}>
          <button onClick={exportCSV}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:9, border:`1px solid ${C.cardBorder}`, background:C.active, color:C.textSub, fontSize:"0.82rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#7567C9,#5a52a8)", color:"#fff", fontSize:"0.82rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px -4px #7567C9" }}>
            <Plus size={14} /> Schedule Session
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:"0.9rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        <StatCard icon={Users}    label="Total"     value={students.length} sub="Phase 1 batch"   />
        <StatCard icon={BarChart3} label="Completed" value={completed.length} sub={`${completionPct}% done`} color={C.green} />
        <StatCard icon={Calendar} label="Upcoming"  value={booked.length}   sub="Sessions booked" color="#7567C9" />
        <StatCard icon={Calendar} label="Pending"   value={pending.length}  sub="Not scheduled"   color={C.orange} />
        <StatCard icon={Star}     label="Avg Rating" value={avgRating}       sub="Out of 5.0"      color={C.orange} />
      </div>

      {/* Progress bar */}
      <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"1rem 1.25rem", marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:"0.8rem", fontWeight:600, color:C.text }}>Phase 1 Progress</span>
          <span style={{ fontSize:"0.76rem", color:C.textMuted }}>{completed.length} of {students.length} complete</span>
        </div>
        <div style={{ height:8, background:C.active, borderRadius:999, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${completionPct}%`, background:"linear-gradient(90deg,#7567C9,#3DBE82)", borderRadius:999, transition:"width 0.5s ease" }} />
        </div>
        <div style={{ display:"flex", gap:"1.5rem", marginTop:10 }}>
          {[
            { label:"Completed", color:C.green,  count:completed.length },
            { label:"Booked",    color:"#7567C9", count:booked.length },
            { label:"Pending",   color:C.orange,  count:pending.length },
          ].map(x => (
            <div key={x.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:x.color }} />
              <span style={{ fontSize:"0.72rem", color:C.textMuted }}>{x.label}: <strong style={{ color:C.textSub }}>{x.count}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.4rem", borderBottom:`1px solid ${C.cardBorder}`, marginBottom:"1.5rem" }}>
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:"10px 16px", borderRadius:"10px 10px 0 0", border:`1px solid ${active ? C.cardBorder : "transparent"}`, borderBottom:active ? "1px solid var(--c-bg)" : "1px solid transparent", background:active ? "var(--c-bg)" : "transparent", color:active ? C.text : C.textMuted, fontWeight:active ? 600 : 500, fontSize:"0.85rem", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6, marginBottom:"-1px" }}>
              {t.label}
              {t.count !== null && (
                <span style={{ fontSize:"0.7rem", background:active ? C.accentSoft : C.active, color:active ? C.accentText : C.textMuted, padding:"2px 7px", borderRadius:999, fontWeight:600 }}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Students Tab ── */}
      {tab === "students" && (
        <div>
          <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
            <div style={{ position:"relative", flex:1, minWidth:220 }}>
              <Search size={14} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:C.textMuted, pointerEvents:"none" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, company, branch…"
                style={{ ...inp, paddingLeft:34, width:"100%", boxSizing:"border-box" }} />
            </div>
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
              {BRANCHES.map(b => <option key={b} value={b}>{b === "All" ? "All Branches" : b}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
              {STATUS_OPTS.map(s => <option key={s} value={s}>{s === "All" ? "All Status" : s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:COL, padding:"10px 16px", background:C.active, borderBottom:`1px solid ${C.cardBorder}` }}>
              {["Student","Branch","CGPA","Target Co.","Status","Mentor","Rating"].map(h => (
                <div key={h} style={{ fontSize:"0.66rem", fontWeight:700, letterSpacing:"0.08em", color:C.textMuted, textTransform:"uppercase" }}>{h}</div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ padding:"3rem", textAlign:"center", color:C.textMuted, fontSize:"0.85rem" }}>No students match your filters.</div>
            )}

            {paginated.map((s, i) => (
              <div key={s.id}>
                <div
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  style={{ display:"grid", gridTemplateColumns:COL, padding:"13px 16px", borderBottom:(i < filtered.length-1 || expandedId === s.id) ? `1px solid ${C.cardBorder}` : "none", cursor:"pointer", alignItems:"center", background:expandedId === s.id ? C.active : "transparent", transition:"background 0.12s" }}
                  onMouseEnter={e => { if (expandedId !== s.id) e.currentTarget.style.background = C.active; }}
                  onMouseLeave={e => { if (expandedId !== s.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <div>
                    <div style={{ fontWeight:600, color:C.text, fontSize:"0.88rem" }}>{s.name}</div>
                    <div style={{ fontSize:"0.71rem", color:C.textMuted, marginTop:1 }}>Year {s.year}{s.email ? ` · ${s.email}` : ""}</div>
                  </div>
                  <div style={{ fontSize:"0.83rem", color:C.textSub }}>{s.branch}</div>
                  <div style={{ fontSize:"0.83rem", color:C.textSub, fontWeight:600 }}>{s.cgpa}</div>
                  <div style={{ fontSize:"0.82rem", color:C.text }}>{s.company || <span style={{ color:C.textMuted }}>—</span>}</div>
                  <StatusBadge status={s.status} />
                  <div style={{ fontSize:"0.76rem", color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {s.mentor ? s.mentor.split("·")[0].trim() : <span style={{ color:C.textMuted }}>—</span>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    {s.rating > 0 ? (
                      <><Star size={12} fill="#F59E0B" stroke="#F59E0B" /><span style={{ fontSize:"0.82rem", fontWeight:600, color:C.text }}>{s.rating}</span></>
                    ) : <span style={{ color:C.textMuted, fontSize:"0.78rem" }}>—</span>}
                  </div>
                </div>

                {expandedId === s.id && (
                  <div style={{ padding:"1rem 1.25rem 1.25rem", background:C.active, borderBottom:`1px solid ${C.cardBorder}` }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:"0.85rem", marginBottom:"1rem" }}>
                      {[
                        { label:"Session Type", value:s.type   || "Not assigned" },
                        { label:"Session Date", value:s.date   || "Not scheduled" },
                        { label:"Mentor",       value:s.mentor || "Not assigned" },
                        s.status === "completed" ? { label:"Outcome", value:"✓ Roadmap + summary generated", color:C.green } : null,
                      ].filter(Boolean).map(({ label, value, color }) => (
                        <div key={label}>
                          <div style={{ fontSize:"0.65rem", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:3 }}>{label}</div>
                          <div style={{ fontSize:"0.82rem", color:color || C.text, fontWeight:color ? 600 : 400 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    {s.status === "pending" && (
                      <button onClick={e => { e.stopPropagation(); setShowModal(true); }}
                        style={{ padding:"6px 14px", borderRadius:8, background:"linear-gradient(135deg,#7567C9,#5a52a8)", color:"#fff", fontSize:"0.78rem", fontWeight:600, border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                        + Schedule Session
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (() => {
            const pgBase = {
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              minWidth:34, height:34, padding:"0 10px", borderRadius:8,
              border:`1px solid ${C.cardBorder}`, background:C.card,
              color:C.textSub, fontSize:"0.82rem", fontWeight:600,
              cursor:"pointer", fontFamily:"inherit", transition:"all .15s",
            };
            const pgActive = { ...pgBase, background:"#7567C9", borderColor:"#7567C9", color:"#fff" };
            const pgDisabled = { ...pgBase, opacity:0.35, cursor:"not-allowed" };

            // Smart ellipsis pages: always show first, last, current ±1
            const pages = (() => {
              if (totalPages <= 7) return Array.from({length:totalPages},(_,i)=>i+1);
              const s = new Set([1, totalPages, page, page-1, page+1].filter(n=>n>=1&&n<=totalPages));
              const sorted = [...s].sort((a,b)=>a-b);
              const result = [];
              sorted.forEach((n,i) => {
                if (i > 0 && n - sorted[i-1] > 1) result.push("…");
                result.push(n);
              });
              return result;
            })();

            return (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"1.25rem", padding:"0 2px" }}>
                <span style={{ fontSize:"0.78rem", color:C.textMuted }}>
                  {(page-1)*PAGE_SIZE + 1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} students
                </span>
                <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                  <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
                    style={page===1 ? pgDisabled : pgBase}>‹</button>
                  {pages.map((n,i) =>
                    n === "…"
                      ? <span key={`e${i}`} style={{ color:C.textMuted, fontSize:"0.85rem", padding:"0 2px", userSelect:"none" }}>…</span>
                      : <button key={n} onClick={() => setPage(n)} style={n===page ? pgActive : pgBase}>{n}</button>
                  )}
                  <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                    style={page===totalPages ? pgDisabled : pgBase}>›</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Upcoming Tab ── */}
      {tab === "upcoming" && (
        <div style={{ display:"grid", gap:"1rem" }}>
          {booked.length === 0 && (
            <div style={{ padding:"3rem", textAlign:"center", color:C.textMuted, background:C.card, border:`1px dashed ${C.cardBorder}`, borderRadius:14, fontSize:"0.85rem" }}>
              No upcoming sessions scheduled.
            </div>
          )}
          {booked.map(s => (
            <div key={s.id} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderLeft:"3px solid #7567C9", borderRadius:14, padding:"1.1rem 1.25rem" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.9rem" }}>
                <div>
                  <div style={{ fontWeight:700, color:C.text, fontSize:"0.95rem" }}>{s.name}</div>
                  <div style={{ fontSize:"0.75rem", color:C.textMuted, marginTop:2 }}>{s.branch} · Year {s.year} · CGPA {s.cgpa}</div>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"0.65rem" }}>
                {[
                  { label:"Company",    value:s.company },
                  { label:"Mentor",     value:s.mentor  },
                  { label:"Type",       value:s.type    },
                  { label:"Scheduled",  value:s.date    },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize:"0.64rem", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:"0.82rem", color:C.text }}>{value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Analytics Tab ── */}
      {tab === "analytics" && (
        <div style={{ display:"grid", gap:"1.5rem" }}>
          <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"1.25rem" }}>
            <div style={{ fontWeight:700, color:C.text, marginBottom:"1.25rem", fontSize:"0.95rem" }}>Completion by Branch</div>
            <div style={{ display:"grid", gap:"0.85rem" }}>
              {branchStats.map(b => (
                <div key={b.branch}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:"0.83rem", color:C.text, fontWeight:500 }}>{b.branch}</span>
                    <span style={{ fontSize:"0.76rem", color:C.textMuted }}>{b.completed}/{b.total} · {b.pct}%</span>
                  </div>
                  <div style={{ height:7, background:C.active, borderRadius:999, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${b.pct}%`, background:"linear-gradient(90deg,#7567C9,#3DBE82)", borderRadius:999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"1.25rem" }}>
            <div style={{ fontWeight:700, color:C.text, marginBottom:"1.25rem", fontSize:"0.95rem" }}>By Target Company</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:"0.75rem" }}>
              {[...new Set(students.map(s => s.company).filter(Boolean))].map(company => {
                const co   = students.filter(s => s.company === company);
                const done = co.filter(s => s.status === "completed").length;
                return (
                  <div key={company} style={{ padding:"0.9rem 1rem", background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:12 }}>
                    <div style={{ fontWeight:600, color:C.text, fontSize:"0.85rem", marginBottom:3 }}>{company}</div>
                    <div style={{ fontSize:"0.73rem", color:C.textMuted, marginBottom:6 }}>{done}/{co.length} completed</div>
                    <div style={{ height:4, background:C.cardBorder, borderRadius:999, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.round(done/co.length*100)}%`, background:C.green, borderRadius:999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"1.25rem" }}>
            <div style={{ fontWeight:700, color:C.text, marginBottom:"1.25rem", fontSize:"0.95rem" }}>Session Ratings</div>
            {completed.length === 0 && <div style={{ color:C.textMuted, fontSize:"0.84rem" }}>No completed sessions yet.</div>}
            {[5,4,3,2,1].map(r => {
              const count = completed.filter(s => s.rating === r).length;
              const pct   = completed.length ? count/completed.length*100 : 0;
              return (
                <div key={r} style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"0.6rem" }}>
                  <div style={{ display:"flex", gap:2, width:70, flexShrink:0 }}>
                    {[1,2,3,4,5].map(n => <Star key={n} size={12} fill={n<=r?"#F59E0B":"none"} stroke={n<=r?"#F59E0B":C.textMuted} />)}
                  </div>
                  <div style={{ flex:1, height:8, background:C.active, borderRadius:999, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:"#F59E0B", borderRadius:999 }} />
                  </div>
                  <span style={{ fontSize:"0.75rem", color:C.textMuted, width:20, textAlign:"right", flexShrink:0 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <ScheduleModal
          students={students}
          mentors={mentors}
          onClose={() => setShowModal(false)}
          onScheduled={handleScheduled}
        />
      )}
    </div>
  );
}
