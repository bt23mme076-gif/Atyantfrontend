import React, { useState, useMemo, useEffect } from "react";
import {
  Download, Search, Star, Plus, Building2,
  X, BarChart3, Users, Calendar, Loader2, FileText,
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
  { _id:"dm1", name:"Vedang Lokhande",  branch:"CSE",   displayName:"Vedang Lokhande · SDE, Accenture" },
  { _id:"dm2", name:"Shreyansh Dixit",  branch:"MME",   displayName:"Shreyansh Dixit · Product Intern, Linkfluencor" },
  { _id:"dm3", name:"Ravi Kumar",       branch:"ECE",   displayName:"Ravi Kumar · SDE-2, Samsung R&D" },
  { _id:"dm4", name:"Neha Agarwal",     branch:"CSE",   displayName:"Neha Agarwal · SDE-2, Microsoft" },
  { _id:"dm5", name:"Arjun Mehta",      branch:"Mech",  displayName:"Arjun Mehta · Engineer, L&T ECC" },
  { _id:"dm6", name:"Pooja Singh",      branch:"CSE",   displayName:"Pooja Singh · Data Analyst, TCS" },
  { _id:"dm7", name:"Rahul Dev",        branch:"CSE",   displayName:"Rahul Dev · SDE, Amazon" },
  { _id:"dm8", name:"Kirti Verma",      branch:"CSE",   displayName:"Kirti Verma · SWE, Google" },
];

// VNIT roll-number email → branch. e.g. bt23cse097@students.vnit.ac.in → CSE
const ROLL_BRANCH = {
  cse: "Computer Science and Engineering (CSE)",
  ece: "Electronics and Communication Engineering (ECE)",
  eee: "Electrical and Electronics Engineering (EE)",
  eel: "Electrical and Electronics Engineering (EE)",
  mec: "Mechanical Engineering (ME)",
  mee: "Mechanical Engineering (ME)",
  che: "Chemical Engineering",
  cml: "Chemical Engineering",
  civ: "Civil Engineering",
  cvl: "Civil Engineering",
  min: "Mining Engineering",
  mnl: "Mining Engineering",
  mme: "Metallurgical and Materials Engineering",
  mmd: "Metallurgical and Materials Engineering",
  met: "Metallurgical and Materials Engineering",
};

function branchFromEmail(email) {
  const local = (email || "").split("@")[0].toLowerCase();
  const m = local.match(/[a-z]+\d{2}([a-z]{2,4})\d/); // <prefix><yy><code><num>
  if (!m) return "";
  const code = m[1];
  return ROLL_BRANCH[code] || ROLL_BRANCH[code.slice(0, 3)] || "";
}

// Map a backend student document → internal row shape
function mapStudent(s) {
  const edu = Array.isArray(s.education) ? s.education[0] : {};
  return {
    id:       s._id,
    name:     s.name || s.username || "Unknown",
    email:    s.email || "",
    branch:   edu.field || s.branch || branchFromEmail(s.email) || "",
    year:     parseInt(edu.year || s.year) || 4,
    cgpa:     String(edu.cgpa || s.cgpa || ""),
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
    name:        m.name || m.username || "Mentor",
    branch:      m.branch || "",
    displayName: suffix ? `${m.name || m.username} · ${suffix}` : (m.name || m.username),
  };
}

// Backend session.status → dashboard row status
const SESSION_STATUS = { completed:"completed", upcoming:"booked", pending:"pending" };

function fmtSessionDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
    + ", " + d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
}

// Merge backend sessions onto student rows — latest session per student wins.
// Without this every student stays "pending" no matter what's in the DB.
//
// A session's student may not be in `students` at all (e.g. they signed up
// with a personal Gmail instead of their @vnit.ac.in address, so /students'
// VNIT-domain filter excluded them) — that used to make the session vanish
// silently even though the mentor genuinely held it. Those are synthesized
// into their own row instead of being dropped, flagged `unverified: true`.
function applySessions(students, sessions) {
  const byStudent = new Map();
  sessions.forEach(sess => {
    const uid = String(sess.userId?._id || sess.userId || "");
    if (!uid) return;
    const prev = byStudent.get(uid);
    if (!prev || new Date(sess.scheduledAt) > new Date(prev.scheduledAt)) byStudent.set(uid, sess);
  });

  const applyFields = (s, sess) => {
    const mentorName = sess.mentorName || sess.mentorId?.name || sess.mentorId?.username || "";
    return {
      ...s,
      status:        SESSION_STATUS[sess.status] || s.status,
      mentor:        mentorName || s.mentor,
      mentorId:      String(sess.mentorId?._id || sess.mentorId || s.mentorId || ""),
      mentorCompany: sess.mentorCompany || sess.mentorId?.currentCompany || "",
      date:          fmtSessionDate(sess.scheduledAt) || s.date,
      scheduledAt:   sess.scheduledAt || null,   // raw, for sorting
      type:          sess.topic?.split("·")[0].trim() || s.type,
      rating:        sess.rating ?? s.rating,
      sessionId:     String(sess._id || ""),
      hasInsight:    !!sess.hasInsight,
    };
  };

  const knownIds = new Set(students.map(s => String(s.id)));
  const merged = students.map(s => {
    const sess = byStudent.get(String(s.id));
    return sess ? applyFields(s, sess) : s;
  });

  // Sessions whose student never appeared in /students — add them as their
  // own row so the mentor's work is never invisible to the TPO.
  const orphanRows = [];
  byStudent.forEach((sess, uid) => {
    if (knownIds.has(uid)) return;
    const base = {
      id: uid, name: sess.userId?.name || "Unknown student", email: sess.userId?.email || "",
      branch: "", year: "", cgpa: "", company: "", status: "pending",
      mentor: "", mentorId: "", date: "", rating: 0, type: "",
      unverified: true, // not in the VNIT-verified student roster
    };
    orphanRows.push(applyFields(base, sess));
  });

  return [...merged, ...orphanRows];
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

// Map any raw branch string → canonical label (null if unrecognised)
function normalizeBranch(raw) {
  if (!raw) return null;
  const b = raw.toLowerCase();
  for (const [label, keys] of Object.entries(BRANCH_KEYS)) {
    if (keys.some(k => b.includes(k))) return label;
  }
  return null;
}

// Do a student and mentor share the same canonical branch?
function sameBranch(studentBranch, mentorBranch) {
  const a = normalizeBranch(studentBranch);
  const b = normalizeBranch(mentorBranch);
  return !!a && a === b;
}

const BRANCH_SHORT = {
  "Computer Science and Engineering (CSE)":        "CSE",
  "Electronics and Communication Engineering (ECE)":"ECE",
  "Electrical and Electronics Engineering (EE)":   "EE",
  "Mechanical Engineering (ME)":                   "ME",
  "Chemical Engineering":                          "Chemical",
  "Civil Engineering":                             "Civil",
  "Mining Engineering":                            "Mining",
  "Metallurgical and Materials Engineering":       "MME",
};

// Short label for narrow columns (CSE, ECE, …); falls back to a paren code.
function shortBranch(raw) {
  if (!raw) return "";
  const norm = normalizeBranch(raw);
  if (norm && BRANCH_SHORT[norm]) return BRANCH_SHORT[norm];
  const paren = raw.match(/\(([^)]+)\)/);
  return paren ? paren[1] : raw;
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

function SessionCard({ s, accent, dateLabel, onViewSummary }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderLeft:`3px solid ${accent}`, borderRadius:14, padding:"1.1rem 1.25rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem", marginBottom:"0.9rem", flexWrap:"wrap" }}>
        <div style={{ minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontWeight:700, color:C.text, fontSize:"0.95rem" }}>{s.name}</span>
            {s.unverified && (
              <span title="Not in the VNIT-verified roster — email/college didn't match, but a real session exists for them"
                style={{ fontSize:"0.6rem", fontWeight:700, color:C.orange, background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:999, padding:"1px 7px", letterSpacing:"0.03em" }}>
                UNVERIFIED
              </span>
            )}
          </div>
          <div style={{ fontSize:"0.75rem", color:C.textMuted, marginTop:2 }}>
            {[shortBranch(s.branch), s.year && `Year ${s.year}`, s.cgpa && `CGPA ${s.cgpa}`, s.email].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {s.rating > 0 && (
            <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:"0.8rem", fontWeight:700, color:C.text }}>
              <Star size={13} fill="#F59E0B" stroke="#F59E0B" />{s.rating}
            </span>
          )}
          <StatusBadge status={s.status} />
          {onViewSummary && (
            <button
              onClick={() => onViewSummary(s)}
              title={s.hasInsight ? "See what happened in this interview" : "No AI summary generated for this session"}
              style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8, border:`1px solid ${C.cardBorder}`, background:C.active, color:C.textSub, fontSize:"0.76rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
            >
              <FileText size={13} /> View Summary
            </button>
          )}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"0.65rem" }}>
        {[
          { label:"Company",  value:s.mentorCompany },
          { label:"Mentor",   value:s.mentor  },
          { label:"Type",     value:s.type    },
          { label:dateLabel,  value:s.date    },
        ].map(({ label, value }) => (
          <div key={label} style={{ minWidth:0 }}>
            <div style={{ fontSize:"0.64rem", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>{label}</div>
            <div style={{ fontSize:"0.82rem", color:C.text, wordBreak:"break-word" }}>{value || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Session Summary Modal — what actually happened in the interview ───────────
function SummaryModal({ student, onClose }) {
  const [state, setState] = useState({ loading:true, error:"", session:null, insight:null });

  useEffect(() => {
    let alive = true;
    if (!student.sessionId) {
      setState({ loading:false, error:"This session has no record on the server yet.", session:null, insight:null });
      return;
    }
    tpoAPI.sessionInsight(student.sessionId)
      .then(res => { if (alive) setState({ loading:false, error:"", session:res.session, insight:res.insight }); })
      .catch(err => { if (alive) setState({ loading:false, error:err.message || "Could not load the summary.", session:null, insight:null }); });
    return () => { alive = false; };
  }, [student.sessionId]);

  const { loading, error, session, insight } = state;

  const List = ({ title, items, color }) => (
    !items?.length ? null : (
      <div>
        <div style={{ fontSize:"0.66rem", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:7 }}>{title}</div>
        <ul style={{ margin:0, paddingLeft:0, listStyle:"none", display:"grid", gap:6 }}>
          {items.map((it, i) => (
            <li key={i} style={{ display:"flex", gap:8, fontSize:"0.83rem", color:C.text, lineHeight:1.5 }}>
              <span style={{ color:color || C.accent, flexShrink:0, marginTop:1 }}>•</span>
              <span>{typeof it === "string" ? it : it.point}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  );

  return (
    <div className="tpo-modal-overlay" style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tpo-modal" style={{ background:"var(--c-sidebar)", border:`1px solid ${C.cardBorder}`, borderRadius:20, padding:"1.75rem", width:600, maxWidth:"100%", position:"relative", maxHeight:"88vh", overflowY:"auto" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:"50%", width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textSub }}>
          <X size={14} />
        </button>

        <div style={{ marginBottom:"1.25rem", paddingRight:36 }}>
          <div style={{ fontWeight:700, fontSize:"1.05rem", color:C.text }}>Interview Summary</div>
          <div style={{ fontSize:"0.8rem", color:C.textMuted, marginTop:3 }}>
            {student.name}{student.mentor ? ` · with ${student.mentor}` : ""}{student.date ? ` · ${student.date}` : ""}
          </div>
        </div>

        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"2.5rem", justifyContent:"center", color:C.textMuted, fontSize:"0.85rem" }}>
            <Spin size={16} /> Loading summary…
          </div>
        )}

        {!loading && error && (
          <div style={{ padding:"0.85rem 1rem", borderRadius:10, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", color:"#f87171", fontSize:"0.83rem" }}>
            {error}
          </div>
        )}

        {!loading && !error && !insight && (
          <div style={{ padding:"2.5rem 1.5rem", textAlign:"center", background:C.active, border:`1px dashed ${C.cardBorder}`, borderRadius:12 }}>
            <div style={{ fontSize:"0.88rem", color:C.text, fontWeight:600, marginBottom:6 }}>No AI summary for this session</div>
            <div style={{ fontSize:"0.8rem", color:C.textMuted, lineHeight:1.6 }}>
              {session?.pipelineStatus === "no_audio"
                ? "The recording had no usable audio, so no summary was generated."
                : "Summaries are generated after a recorded session is processed."}
            </div>
            {session?.notes && (
              <div style={{ marginTop:"1.25rem", textAlign:"left" }}>
                <div style={{ fontSize:"0.66rem", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Mentor Notes</div>
                <div style={{ fontSize:"0.83rem", color:C.text, lineHeight:1.6 }}>{session.notes}</div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && insight && (
          <div style={{ display:"grid", gap:"1.4rem" }}>
            {/* Signal chips */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {insight.studentSentiment && (
                <span style={{ fontSize:"0.72rem", fontWeight:600, padding:"5px 11px", borderRadius:999,
                  background: insight.studentSentiment === "positive" ? "rgba(61,190,130,0.14)" : insight.studentSentiment === "negative" ? "rgba(248,113,113,0.14)" : C.active,
                  color: insight.studentSentiment === "positive" ? C.green : insight.studentSentiment === "negative" ? "#f87171" : C.textSub }}>
                  Sentiment: {insight.studentSentiment}
                </span>
              )}
              {insight.mentorQualityScore != null && (
                <span title={insight.mentorQualityReason || ""} style={{ fontSize:"0.72rem", fontWeight:600, padding:"5px 11px", borderRadius:999, background:"rgba(117,103,201,0.14)", color:C.accent }}>
                  Mentor quality: {insight.mentorQualityScore}/10
                </span>
              )}
              {insight.careerContext && (
                <span style={{ fontSize:"0.72rem", fontWeight:600, padding:"5px 11px", borderRadius:999, background:C.active, color:C.textSub }}>
                  {insight.careerContext.replace(/_/g, " ")}
                </span>
              )}
            </div>

            {(insight.detailedSummary || insight.summary) && (
              <div>
                <div style={{ fontSize:"0.66rem", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:7 }}>Summary</div>
                <div style={{ fontSize:"0.86rem", color:C.text, lineHeight:1.7, whiteSpace:"pre-wrap" }}>
                  {insight.detailedSummary || insight.summary}
                </div>
              </div>
            )}

            {!!insight.topics?.length && (
              <div>
                <div style={{ fontSize:"0.66rem", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:7 }}>Topics</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {insight.topics.map(t => (
                    <span key={t} style={{ fontSize:"0.75rem", padding:"4px 10px", borderRadius:7, background:C.active, border:`1px solid ${C.cardBorder}`, color:C.textSub }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            <List title="Key Discussion Points" items={insight.keyDiscussionPoints} />
            <List title="Strengths"             items={insight.strengths} color={C.green} />
            <List title="Areas to Improve"      items={insight.areasToImprove} color={C.orange} />
            <List title="Pain Points"           items={insight.studentPainPoints} color={C.orange} />
            <List title="Action Items · Student" items={insight.actionItems?.student} />
            <List title="Action Items · Mentor"  items={insight.actionItems?.mentor} />
            <List title="Recommended Resources" items={insight.recommendedResources} />
            <List title="Next Session Focus"    items={insight.nextSessionFocus} />

            {session?.notes && (
              <div>
                <div style={{ fontSize:"0.66rem", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:7 }}>Mentor Notes</div>
                <div style={{ fontSize:"0.83rem", color:C.text, lineHeight:1.6 }}>{session.notes}</div>
              </div>
            )}

            {session?.review?.comment && (
              <div>
                <div style={{ fontSize:"0.66rem", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:7 }}>Student Review</div>
                <div style={{ fontSize:"0.83rem", color:C.text, lineHeight:1.6, fontStyle:"italic" }}>“{session.review.comment}”</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Donut chart (inline SVG, no deps) ─────────────────────────────────────────
function Donut({ segments, total, size = 168, stroke = 18 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const pct = total ? Math.round((segments[0]?.value || 0) / total * 100) : 0;

  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.active} strokeWidth={stroke} />
        {segments.map(seg => {
          if (!seg.value || !total) return null;
          const len = (seg.value / total) * circ;
          const el = (
            <circle key={seg.label} cx={size/2} cy={size/2} r={r} fill="none"
              stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset}
              strokeLinecap="butt" />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:"1.75rem", fontWeight:800, color:C.text, lineHeight:1 }}>{pct}%</div>
        <div style={{ fontSize:"0.66rem", color:C.textMuted, marginTop:3, letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:700 }}>Completed</div>
      </div>
    </div>
  );
}

// ── Schedule Modal ────────────────────────────────────────────────────────────
function ScheduleModal({ students, mentors, preselectId, onClose, onScheduled }) {
  const pending = students.filter(s => s.status === "pending");

  const [studentId,     setStudentId]     = useState(preselectId || pending[0]?.id || "");
  const [studentQuery,  setStudentQuery]  = useState("");
  const [studentOpen,   setStudentOpen]   = useState(false);

  // Honour the student the TPO clicked "Schedule" on (may change between opens)
  useEffect(() => { if (preselectId) setStudentId(preselectId); }, [preselectId]);
  const [mentorId,      setMentorId]      = useState("");
  const [mentorQuery,   setMentorQuery]   = useState("");
  const [mentorOpen,    setMentorOpen]    = useState(false);
  const [date,          setDate]          = useState("");
  const [time,          setTime]          = useState("10:00");
  const [type,          setType]          = useState("Mock Interview");
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");

  const selected      = students.find(s => s.id === studentId);
  const selectedMentor = mentors.find(m => m._id === mentorId);
  const canSubmit     = studentId && mentorId && date && !saving;

  // Type-to-search over pending students (name / email / branch), so all
  // students don't dump into one dropdown at once.
  const sq = studentQuery.trim().toLowerCase();
  const studentMatches = pending.filter(s =>
    !sq || s.name.toLowerCase().includes(sq)
        || (s.email || "").toLowerCase().includes(sq)
        || (s.branch || "").toLowerCase().includes(sq)
  );

  // Auto-detected branch from the chosen student
  const studentBranch = normalizeBranch(selected?.branch) || selected?.branch || "";

  // Reset mentor selection whenever the student (and thus branch) changes
  useEffect(() => { setMentorId(""); setMentorQuery(""); }, [studentId]);

  // Branch-matched mentors, used as the default suggestion list when the
  // search box is empty. If no mentor matches the branch, fall back to all
  // mentors so TPO isn't blocked.
  const branchMentors = mentors.filter(m => sameBranch(selected?.branch, m.branch));
  const noBranchMatch = branchMentors.length === 0;

  const q = mentorQuery.trim().toLowerCase();
  // Typing a name must always be able to find ANY mentor — branch is a
  // suggestion, not a hard filter, otherwise a mentor with missing/mismatched
  // branch data becomes permanently unfindable by search.
  const pool = q ? mentors : (branchMentors.length ? branchMentors : mentors);
  const mentorMatches = pool
    .filter(m => !q || m.name.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q))
    .sort((a, b) => {
      if (!q) return 0; // keep default order when just browsing branch suggestions
      const aIn = sameBranch(selected?.branch, a.branch) ? 0 : 1;
      const bIn = sameBranch(selected?.branch, b.branch) ? 0 : 1;
      return aIn - bIn; // branch-matching mentors surface first while searching
    });

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
      const res = await tpoAPI.bookSession({
        studentId,
        mentorId,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        topic:       `${type} · ${selected?.company || ""}`,
        serviceId:   "video-call",
        durationMin: 30,
      });
      // Only mark it "booked" once the backend confirms a session was actually
      // created — a 404 here means "student/mentor not found", a real failure,
      // not "route missing". Pretending it succeeded hid sessions that were
      // never saved and vanished after the next refresh.
      onScheduled({
        studentId,
        mentor:      selectedMentor?.displayName || "",
        mentorId,
        date:        fmtDate(date, time),
        scheduledAt: res?.session?.scheduledAt || new Date(`${date}T${time}`).toISOString(),
        sessionId:   res?.session?._id || "",
        type,
      });
      setSaving(false);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to schedule. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="tpo-modal-overlay" style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tpo-modal" style={{ background:"var(--c-sidebar)", border:`1px solid ${C.cardBorder}`, borderRadius:20, padding:"1.75rem", width:440, maxWidth:"100%", position:"relative", maxHeight:"90vh", overflowY:"auto" }}>
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

            <div style={{ position:"relative" }}>
              <label style={{ fontSize:"0.72rem", color:C.textSub, display:"block", marginBottom:5, fontWeight:700, letterSpacing:"0.05em" }}>STUDENT</label>
              <input
                type="text"
                value={studentId ? (selected?.name || "") : studentQuery}
                onChange={e => { setStudentId(""); setStudentQuery(e.target.value); setStudentOpen(true); }}
                onFocus={() => setStudentOpen(true)}
                onBlur={() => setTimeout(() => setStudentOpen(false), 150)}
                placeholder="Type student name…"
                style={{ ...inp, cursor:"text" }}
              />

              {studentOpen && (
                <div style={{ position:"absolute", top:"100%", left:0, right:0, marginTop:4, zIndex:30, background:"var(--c-sidebar)", border:`1px solid ${C.cardBorder}`, borderRadius:10, boxShadow:"0 10px 30px rgba(0,0,0,0.35)", maxHeight:220, overflowY:"auto" }}>
                  {studentMatches.length === 0 ? (
                    <div style={{ padding:"10px 12px", fontSize:"0.82rem", color:C.textMuted }}>No students match “{studentQuery}”.</div>
                  ) : studentMatches.map(s => (
                    <div
                      key={s.id}
                      onMouseDown={() => { setStudentId(s.id); setStudentQuery(""); setStudentOpen(false); }}
                      style={{ padding:"9px 12px", fontSize:"0.85rem", color:C.text, cursor:"pointer", borderBottom:`1px solid ${C.cardBorder}`, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}
                      onMouseEnter={e => e.currentTarget.style.background = C.active}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span>{s.name}</span>
                      {s.branch && <span style={{ fontSize:"0.66rem", color:C.textMuted, flexShrink:0 }}>{shortBranch(s.branch)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selected && (
              <div style={{ padding:"0.85rem 1rem", background:C.active, borderRadius:10, border:`1px solid ${C.cardBorder}` }}>
                <div style={{ fontWeight:700, color:C.text, fontSize:"0.9rem" }}>{selected.name}</div>
                {selected.email && <div style={{ fontSize:"0.74rem", color:C.textMuted, marginTop:2, wordBreak:"break-all" }}>{selected.email}</div>}
                <div style={{ display:"flex", gap:"1.25rem", flexWrap:"wrap", marginTop:8, fontSize:"0.78rem", color:C.textSub }}>
                  <span>Year: <strong style={{ color:C.text }}>{selected.year || "—"}</strong></span>
                  <span>CGPA: <strong style={{ color:C.text }}>{selected.cgpa || "—"}</strong></span>
                  <span>Branch: <strong style={{ color:C.text }}>{studentBranch || "—"}</strong></span>
                  {selected.company && <span>Target: <strong style={{ color:C.text }}>{selected.company}</strong></span>}
                </div>
              </div>
            )}

            <div style={{ position:"relative" }}>
              <label style={{ fontSize:"0.72rem", color:C.textSub, display:"flex", alignItems:"center", gap:8, marginBottom:5, fontWeight:700, letterSpacing:"0.05em" }}>
                MENTOR
                {studentBranch && (
                  <span title={studentBranch} style={{ fontWeight:700, fontSize:"0.62rem", color:"#7567C9", background:"rgba(117,103,201,0.14)", border:"1px solid rgba(117,103,201,0.3)", borderRadius:999, padding:"2px 8px", letterSpacing:"0.03em", textTransform:"none" }}>
                    {shortBranch(studentBranch)}
                  </span>
                )}
              </label>

              <input
                type="text"
                value={mentorId ? (selectedMentor?.displayName || "") : mentorQuery}
                onChange={e => { setMentorId(""); setMentorQuery(e.target.value); setMentorOpen(true); }}
                onFocus={() => setMentorOpen(true)}
                onBlur={() => setTimeout(() => setMentorOpen(false), 150)}
                placeholder="Type mentor name…"
                style={{ ...inp, cursor:"text" }}
              />

              {mentorOpen && (
                <div style={{ position:"absolute", top:"100%", left:0, right:0, marginTop:4, zIndex:20, background:"var(--c-sidebar)", border:`1px solid ${C.cardBorder}`, borderRadius:10, boxShadow:"0 10px 30px rgba(0,0,0,0.35)", maxHeight:220, overflowY:"auto" }}>
                  {noBranchMatch && (
                    <div style={{ padding:"7px 12px", fontSize:"0.68rem", color:C.textMuted, borderBottom:`1px solid ${C.cardBorder}`, background:C.active }}>
                      No {studentBranch || "branch"} mentor found — showing all mentors
                    </div>
                  )}
                  {mentorMatches.length === 0 ? (
                    <div style={{ padding:"10px 12px", fontSize:"0.82rem", color:C.textMuted }}>No mentors match “{mentorQuery}”.</div>
                  ) : mentorMatches.map(m => (
                    <div
                      key={m._id}
                      onMouseDown={() => { setMentorId(m._id); setMentorQuery(""); setMentorOpen(false); }}
                      style={{ padding:"9px 12px", fontSize:"0.85rem", color:C.text, cursor:"pointer", borderBottom:`1px solid ${C.cardBorder}`, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}
                      onMouseEnter={e => e.currentTarget.style.background = C.active}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span>{m.displayName}</span>
                      {m.branch && <span style={{ fontSize:"0.66rem", color:C.textMuted, flexShrink:0 }}>{normalizeBranch(m.branch) ? m.branch : ""}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize:"0.72rem", color:C.textSub, display:"block", marginBottom:5, fontWeight:700, letterSpacing:"0.05em" }}>SESSION TYPE</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="tpo-modal-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
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
  const [scheduleFor,  setScheduleFor]  = useState(null);   // student id to preselect
  const [summaryFor,   setSummaryFor]   = useState(null);   // student row to show a summary for
  const [expandedId,   setExpandedId]   = useState(null);
  const [page,         setPage]         = useState(1);
  const PAGE_SIZE = 10;

  // Fetch real students + mentors + sessions; silently fall back to demo data
  useEffect(() => {
    if (user?.email !== TPO_EMAIL) { setLoading(false); return; }

    Promise.allSettled([tpoAPI.students(), tpoAPI.mentors(), tpoAPI.sessions()])
      .then(([studentsRes, mentorsRes, sessionsRes]) => {
        const sessions = sessionsRes.status === "fulfilled" ? (sessionsRes.value?.sessions || []) : [];

        if (studentsRes.status === "fulfilled" && studentsRes.value?.students?.length) {
          const mapped = applySessions(studentsRes.value.students.map(mapStudent), sessions);
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

  // Newest first for completed (most recent interview on top),
  // soonest first for upcoming (next session on top).
  const byDate = (dir) => (a, b) => {
    const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
    const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
    return dir * (tb - ta);
  };

  const completed     = students.filter(s => s.status === "completed").sort(byDate(1));
  const booked        = students.filter(s => s.status === "booked").sort(byDate(-1));
  const pending       = students.filter(s => s.status === "pending");
  const avgRating     = completed.length
    ? (completed.reduce((a, s) => a + s.rating, 0) / completed.length).toFixed(1)
    : "—";
  const completionPct = Math.round((completed.length / students.length) * 100);

  const handleScheduled = ({ studentId, mentor, mentorId, date, scheduledAt, sessionId, type }) => {
    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, status:"booked", mentor, mentorId, date, scheduledAt, sessionId, type } : s
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
    { id:"students",  label:"Students",          count:students.length },
    { id:"upcoming",  label:"Upcoming Sessions", count:booked.length },
    { id:"completed", label:"Completed",         count:completed.length },
    { id:"analytics", label:"Analytics",         count:null },
  ];

  const inp = { background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:9, padding:"8px 12px", color:C.text, fontSize:"0.85rem", outline:"none", fontFamily:"inherit" };
  const COL = "2.2fr 0.9fr 0.7fr 1.3fr 1.1fr 1.6fr 0.7fr";

  return (
    <div className="tpo-page" style={{ padding:"2rem", maxWidth:1120, margin:"0 auto" }}>

      <style>{`
        /* Tabs never overflow the viewport */
        .tpo-tabs { overflow-x: auto; scrollbar-width: none; }
        .tpo-tabs::-webkit-scrollbar { display: none; }
        .tpo-tabs > button { flex-shrink: 0; }

        /* Modal is always inset from the viewport edges */
        .tpo-modal-overlay { padding: 1rem; box-sizing: border-box; }

        @media (max-width: 860px) {
          .tpo-stats { display: grid !important; grid-template-columns: 1fr 1fr; }
          .tpo-stats > div { min-width: 0 !important; }
        }

        @media (max-width: 720px) {
          .tpo-page { padding: 1rem !important; }

          /* Header: title stacks, actions go full-width */
          .tpo-header-actions { width: 100%; }
          .tpo-header-actions > button { flex: 1; justify-content: center; }

          /* Filters stack */
          .tpo-filters { flex-direction: column; }
          .tpo-filters > * { width: 100%; min-width: 0 !important; box-sizing: border-box; }

          /* Table → stacked cards. Header row is meaningless without columns. */
          .tpo-thead { display: none !important; }
          .tpo-row { grid-template-columns: 1fr !important; gap: 7px; padding: 14px !important; }
          /* !important: several cells carry inline display/gap that must not win */
          .tpo-cell[data-label] {
            display: flex !important; align-items: center !important;
            justify-content: space-between !important; gap: 12px !important;
          }
          .tpo-cell[data-label]::before {
            content: attr(data-label);
            font-size: 0.63rem; font-weight: 700; letter-spacing: 0.08em;
            text-transform: uppercase; color: var(--c-textMuted); flex-shrink: 0;
          }
          /* Mentor cell can ellipsis, but must not force the row wider */
          .tpo-cell-mentor { min-width: 0; }
          .tpo-cell-mentor > span { min-width: 0; }

          /* Pagination stacks and centres */
          .tpo-pagination { flex-direction: column; gap: 10px; align-items: stretch !important; }
          .tpo-pagination .tpo-pages { justify-content: center; flex-wrap: wrap; }
          .tpo-pagination .tpo-count { text-align: center; }

          /* Modal fills the inset width */
          .tpo-modal { width: 100% !important; border-radius: 16px !important; padding: 1.25rem !important; }
          .tpo-modal-grid-2 { grid-template-columns: 1fr !important; }

          /* Donut stacks above its legend */
          .tpo-analytics-top { grid-template-columns: 1fr !important; justify-items: center; gap: 1.25rem !important; }
          .tpo-analytics-top > div:last-child { width: 100%; }
        }

        @media (max-width: 380px) {
          .tpo-stats { grid-template-columns: 1fr; }
        }
      `}</style>

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
        <div className="tpo-header-actions" style={{ display:"flex", gap:"0.75rem" }}>
          <button onClick={exportCSV}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:9, border:`1px solid ${C.cardBorder}`, background:C.active, color:C.textSub, fontSize:"0.82rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => { setScheduleFor(null); setShowModal(true); }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#7567C9,#5a52a8)", color:"#fff", fontSize:"0.82rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px -4px #7567C9" }}>
            <Plus size={14} /> Schedule Session
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="tpo-stats" style={{ display:"flex", gap:"0.9rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
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
      <div className="tpo-tabs" style={{ display:"flex", gap:"0.4rem", borderBottom:`1px solid ${C.cardBorder}`, marginBottom:"1.5rem" }}>
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
          <div className="tpo-filters" style={{ display:"flex", gap:"0.75rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
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
            <div className="tpo-thead" style={{ display:"grid", gridTemplateColumns:COL, padding:"10px 16px", background:C.active, borderBottom:`1px solid ${C.cardBorder}` }}>
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
                  className="tpo-row"
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  style={{ display:"grid", gridTemplateColumns:COL, padding:"13px 16px", borderBottom:(i < filtered.length-1 || expandedId === s.id) ? `1px solid ${C.cardBorder}` : "none", cursor:"pointer", alignItems:"center", background:expandedId === s.id ? C.active : "transparent", transition:"background 0.12s" }}
                  onMouseEnter={e => { if (expandedId !== s.id) e.currentTarget.style.background = C.active; }}
                  onMouseLeave={e => { if (expandedId !== s.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="tpo-cell" style={{ minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:600, color:C.text, fontSize:"0.88rem" }}>{s.name}</span>
                      {s.unverified && (
                        <span title="Not in the VNIT-verified roster — email/college didn't match, but a real session exists for them"
                          style={{ fontSize:"0.6rem", fontWeight:700, color:C.orange, background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:999, padding:"1px 7px", letterSpacing:"0.03em" }}>
                          UNVERIFIED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:"0.71rem", color:C.textMuted, marginTop:1, wordBreak:"break-word" }}>Year {s.year}{s.email ? ` · ${s.email}` : ""}</div>
                  </div>
                  <div className="tpo-cell" data-label="Branch" style={{ fontSize:"0.83rem", color:C.textSub }}>{shortBranch(s.branch) || <span style={{ color:C.textMuted }}>—</span>}</div>
                  <div className="tpo-cell" data-label="CGPA" style={{ fontSize:"0.83rem", color:C.textSub, fontWeight:600 }}>{s.cgpa || <span style={{ color:C.textMuted }}>—</span>}</div>
                  <div className="tpo-cell" data-label="Target Co." style={{ fontSize:"0.82rem", color:C.text }}>{s.company || <span style={{ color:C.textMuted }}>—</span>}</div>
                  <div className="tpo-cell" data-label="Status"><StatusBadge status={s.status} /></div>
                  <div className="tpo-cell tpo-cell-mentor" data-label="Mentor" style={{ fontSize:"0.76rem", color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {s.mentor ? s.mentor.split("·")[0].trim() : <span style={{ color:C.textMuted }}>—</span>}
                  </div>
                  <div className="tpo-cell" data-label="Rating" style={{ display:"flex", alignItems:"center", gap:3 }}>
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
                      <button onClick={e => { e.stopPropagation(); setScheduleFor(s.id); setShowModal(true); }}
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
              <div className="tpo-pagination" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"1.25rem", padding:"0 2px" }}>
                <span className="tpo-count" style={{ fontSize:"0.78rem", color:C.textMuted }}>
                  {(page-1)*PAGE_SIZE + 1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} students
                </span>
                <div className="tpo-pages" style={{ display:"flex", gap:5, alignItems:"center" }}>
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
          {booked.map(s => <SessionCard key={s.id} s={s} accent="#7567C9" dateLabel="Scheduled" />)}
        </div>
      )}

      {/* ── Completed Tab ── */}
      {tab === "completed" && (
        <div style={{ display:"grid", gap:"1rem" }}>
          {completed.length === 0 && (
            <div style={{ padding:"3rem", textAlign:"center", color:C.textMuted, background:C.card, border:`1px dashed ${C.cardBorder}`, borderRadius:14, fontSize:"0.85rem" }}>
              No completed sessions yet.
            </div>
          )}
          {completed.map(s => <SessionCard key={s.id} s={s} accent={C.green} dateLabel="Completed on" onViewSummary={setSummaryFor} />)}
        </div>
      )}

      {/* ── Analytics Tab ── */}
      {tab === "analytics" && (
        <div style={{ display:"grid", gap:"1.5rem" }}>

          {/* Session status overview — donut + legend */}
          <div className="tpo-analytics-top" style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"1.75rem", alignItems:"center", background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:14, padding:"1.5rem" }}>
            <Donut
              total={students.length}
              segments={[
                { label:"Completed", value:completed.length, color:C.green },
                { label:"Booked",    value:booked.length,    color:"#7567C9" },
                { label:"Pending",   value:pending.length,   color:C.orange },
              ]}
            />
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:700, color:C.text, marginBottom:"1rem", fontSize:"0.95rem" }}>Session Status</div>
              <div style={{ display:"grid", gap:"0.8rem" }}>
                {[
                  { label:"Completed", value:completed.length, color:C.green },
                  { label:"Booked",    value:booked.length,    color:"#7567C9" },
                  { label:"Pending",   value:pending.length,   color:C.orange },
                ].map(x => {
                  const pct = students.length ? Math.round(x.value / students.length * 100) : 0;
                  return (
                    <div key={x.label}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5, gap:8 }}>
                        <span style={{ display:"flex", alignItems:"center", gap:7, fontSize:"0.83rem", color:C.text, fontWeight:500 }}>
                          <span style={{ width:9, height:9, borderRadius:3, background:x.color, flexShrink:0 }} />
                          {x.label}
                        </span>
                        <span style={{ fontSize:"0.76rem", color:C.textMuted, whiteSpace:"nowrap" }}>{x.value} · {pct}%</span>
                      </div>
                      <div style={{ height:7, background:C.active, borderRadius:999, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:x.color, borderRadius:999, transition:"width .5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

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

      {summaryFor && (
        <SummaryModal student={summaryFor} onClose={() => setSummaryFor(null)} />
      )}

      {showModal && (
        <ScheduleModal
          students={students}
          mentors={mentors}
          preselectId={scheduleFor}
          onClose={() => { setShowModal(false); setScheduleFor(null); }}
          onScheduled={handleScheduled}
        />
      )}
    </div>
  );
}
