import { useState, useEffect, useMemo } from "react";
import {
  Pencil, Camera, X, Loader2, Check, FileText, Sparkles,
  UserRound, GraduationCap, Briefcase, Zap, Trophy, Compass,
  CalendarCheck, Link2, ShieldCheck, Eye, MessageSquareText,
  Activity, Users, Plus, MapPin, Target, BadgeCheck, TrendingUp,
  CalendarClock, Clock, IndianRupee, Rocket, Star, Upload, Globe, Copy,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import useIsMobile from "../hooks/useIsMobile";
import { profileAPI, servicesAPI, availabilityAPI, mentorAPI } from "../api";
import Avatar from "../components/Avatar";
import ShareProfile from "../components/ShareProfile";
import AnswerCardManager from "../components/AnswerCardManager";

// Chip color palette — cycles so each tag has a distinct hue
const CHIP_PALETTE = [
  { bg: "rgba(117,103,201,0.13)", border: "rgba(117,103,201,0.38)", text: "#9B8FD4" },
  { bg: "rgba(61,190,130,0.12)", border: "rgba(61,190,130,0.38)", text: "#3DBE82" },
  { bg: "rgba(249,115,22,0.11)", border: "rgba(249,115,22,0.35)", text: "#FB923C" },
  { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.38)", text: "#60A5FA" },
  { bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.35)", text: "#F472B6" },
];

// Theme palette — every value maps to a CSS variable (light + dark in index.css).
const C = {
  bg: "var(--c-bg)",
  card: "var(--c-card)",
  cardHover: "var(--c-cardHover)",
  cardBorder: "var(--c-cardBorder)",
  active: "var(--c-active)",
  activeBorder: "var(--c-activeBorder)",
  accent: "#7567C9",
  accentSoft: "var(--c-accentSoft)",
  accentText: "var(--c-accentText)",
  text: "var(--c-text)",
  textSub: "var(--c-textSub)",
  textMuted: "var(--c-textMuted)",
  green: "#3DBE82",
};

function Spin({ size = 18 }) {
  return <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />;
}

/* ────────────────────────────────────────────────────────────────────────────
   Page-scoped styles: focus rings, hover lifts, animations, responsive grid.
   Inline styles handle theming; classes handle pseudo-states & breakpoints.
   ──────────────────────────────────────────────────────────────────────────── */
const PageStyles = () => (
  <style>{`
    @keyframes pfFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pfShimmer { 0% { background-position:-400px 0 } 100% { background-position:400px 0 } }
    .pf-anim { animation: pfFadeUp .35s ease-out both; }
    .pf-anim-1 { animation-delay:.03s } .pf-anim-2 { animation-delay:.08s }
    .pf-anim-3 { animation-delay:.13s } .pf-anim-4 { animation-delay:.18s }

    .pf-card { transition: border-color .2s ease, box-shadow .25s ease, transform .25s ease; }
    .pf-card:hover { border-color: #7567C955; box-shadow: var(--shadow); transform: translateY(-1px); }

    .pf-stat { transition: border-color .2s ease, box-shadow .25s ease, transform .25s ease; }
    .pf-stat:hover { border-color:#7567C966; transform: translateY(-2px); box-shadow: var(--shadow); }

    .pf-input, .pf-select, .pf-textarea {
      width:100%; box-sizing:border-box; background:var(--c-active);
      border:1px solid var(--c-cardBorder); border-radius:10px;
      padding:10px 13px; color:var(--c-text); font-size:.88rem;
      outline:none; font-family:inherit; transition: border-color .18s, box-shadow .18s, background .18s;
    }
    .pf-textarea { resize:vertical; line-height:1.55; min-height:84px; }
    .pf-select { cursor:pointer; appearance:none;
      background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e");
      background-repeat:no-repeat; background-position:right 12px center; padding-right:34px; }
    .pf-input:hover, .pf-select:hover, .pf-textarea:hover { border-color:#7567C955; }
    .pf-input:focus, .pf-select:focus, .pf-textarea:focus {
      border-color:#7567C9; box-shadow:0 0 0 3px #7567C926; background:var(--c-card);
    }
    .pf-input::placeholder, .pf-textarea::placeholder { color:var(--c-textMuted); }

    .pf-chipbtn { transition: all .15s ease; }
    .pf-chipbtn:hover { border-color:#7567C9 !important; color:var(--c-accentText) !important; background:var(--c-accentSoft) !important; }
    .pf-chip { transition: transform .15s ease, box-shadow .15s ease; }
    .pf-chip:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.12); }
    .pf-val { background:var(--c-active); border:1px solid var(--c-cardBorder); border-radius:9px; padding:8px 13px; color:var(--c-text); font-size:.88rem; line-height:1.5; }
    .pf-icon-btn { transition: background .15s, color .15s, transform .15s; }
    .pf-icon-btn:hover { background: var(--c-accentSoft) !important; color: var(--c-accentText) !important; transform: translateY(-1px); }

    .pf-editbtn { opacity:1; transition: background .15s, transform .15s, box-shadow .15s; }
    .pf-editbtn:hover { background:#f87171 !important; color:#fff !important; border-color:#f87171 !important; transform:translateY(-1px); box-shadow:0 3px 10px rgba(248,113,113,0.4) !important; }
    @media (hover:none) { .pf-editbtn { opacity:1; } }

    .pf-skel { background:linear-gradient(90deg, var(--c-active) 25%, var(--c-cardHover) 50%, var(--c-active) 75%);
      background-size:400px 100%; animation:pfShimmer 1.3s infinite linear; border-radius:8px; }

    .pf-svc-row { transition: all .15s ease; cursor:pointer; }
    .pf-svc-row:hover { border-color:#7567C9 !important; transform:translateY(-1px); box-shadow:0 4px 14px rgba(117,103,201,0.18); }
    .pf-svc-row.on { border-color:#7567C9 !important; background:rgba(117,103,201,0.09) !important; }
    .pf-mono-inner { display:grid; grid-template-columns:1fr 1fr; gap:18px; align-items:start; }
    @media (max-width:880px) { .pf-mono-inner { grid-template-columns:1fr; } }
    .pf-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; align-items:start; }
    .pf-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    .pf-hero-actions { display:flex; gap:9px; flex-wrap:wrap; }
    @media (max-width: 880px) {
      .pf-grid { grid-template-columns:1fr; }
      .pf-stats { grid-template-columns:repeat(2,1fr); }
    }
    @media (max-width: 480px) {
      .pf-stats { gap:10px; }
    }
  `}</style>
);

/* ─── Completion ring (SVG) ─────────────────────────────────────────────────── */
function Ring({ pct, size = 76, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct < 40 ? "#F87171" : pct < 75 ? "#F5A623" : C.green;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }} role="img" aria-label={`Profile ${pct}% complete`}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.active} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset .8s ease, stroke .3s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size > 70 ? "1rem" : ".85rem", fontWeight: 700, color: C.text, lineHeight: 1 }}>{pct}%</span>
      </div>
    </div>
  );
}

/* ─── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({ Icon, label, value, hint, delay }) {
  return (
    <div className={`pf-stat pf-anim pf-anim-${delay}`} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "1rem 1.1rem", minWidth: 0 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <Icon size={16} style={{ color: C.accentText }} />
      </div>
      <div style={{ fontSize: "1.35rem", fontWeight: 700, color: C.text, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: ".72rem", color: C.textSub, marginTop: 4, fontWeight: 500 }}>{label}</div>
      {hint && <div style={{ fontSize: ".66rem", color: C.textMuted, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

/* ─── Section card shell ────────────────────────────────────────────────────── */
function Section({ Icon, title, subtitle, children, onEdit, editing, delay = 2, id }) {
  return (
    <section id={id} className={`pf-card pf-anim pf-anim-${delay}`} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "1.35rem 1.4rem", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.2rem", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(117,103,201,0.22) 0%, rgba(117,103,201,0.08) 100%)",
            border: `1px solid rgba(117,103,201,0.25)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={16} style={{ color: C.accentText }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: ".95rem", fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>{title}</h3>
            {subtitle && <div style={{ fontSize: ".69rem", color: C.textMuted, marginTop: 2, letterSpacing: ".01em" }}>{subtitle}</div>}
          </div>
        </div>
        {onEdit && !editing && (
          <button className="pf-editbtn pf-icon-btn" onClick={onEdit} aria-label={`Edit ${title}`}
            style={{ background: C.active, border: `1px solid ${C.cardBorder}`, color: C.textMuted, cursor: "pointer", padding: "6px 7px", display: "flex", flexShrink: 0, borderRadius: 8 }}>
            <Pencil size={13} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/* ─── Display / edit field row ──────────────────────────────────────────────── */
function FieldRow({ label, value, onChange, editing, placeholder, type = "text", error }) {
  return (
    <div style={{ marginBottom: "0.95rem" }}>
      <label style={{ fontSize: ".64rem", fontWeight: 700, letterSpacing: ".09em", color: C.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
      {editing
        ? <>
          <input className="pf-input" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={label} />
          {error && <div style={{ fontSize: ".7rem", color: "#F87171", marginTop: 4 }}>{error}</div>}
        </>
        : value
          ? <div className="pf-val">{value}</div>
          : <div style={{ fontSize: ".84rem", color: C.textMuted, padding: "2px 0", fontStyle: "italic" }}>Not set</div>}
    </div>
  );
}

function SelectRow({ label, value, onChange, editing, options }) {
  const current = options.find(o => o.value === value)?.label;
  return (
    <div style={{ marginBottom: "0.95rem" }}>
      <label style={{ fontSize: ".64rem", fontWeight: 700, letterSpacing: ".09em", color: C.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
      {editing
        ? <select className="pf-select" value={value || ""} onChange={e => onChange(e.target.value)} aria-label={label}>
          <option value="">— Select —</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        : current
          ? <div className="pf-val">{current}</div>
          : <div style={{ fontSize: ".84rem", color: C.textMuted, padding: "2px 0", fontStyle: "italic" }}>Not set</div>}
    </div>
  );
}

/* ─── Tag / chip editor ─────────────────────────────────────────────────────── */
function ChipEditor({ items, editing, onChange, placeholder, emptyText, highlightFirst }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setDraft("");
  };
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  if (items.length === 0 && !editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px", background: C.active, borderRadius: 10, border: `1px dashed ${C.cardBorder}` }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Plus size={12} style={{ color: C.accentText }} />
        </div>
        <span style={{ fontSize: ".8rem", color: C.textMuted, lineHeight: 1.5 }}>{emptyText}</span>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((s, i) => {
          const primary = highlightFirst && i === 0;
          const clr = CHIP_PALETTE[i % CHIP_PALETTE.length];
          return (
            <span key={i} className="pf-chip" style={{
              background: primary ? C.accentSoft : clr.bg,
              border: `1px solid ${primary ? C.accent + "66" : clr.border}`,
              borderRadius: 999, padding: "5px 14px", fontSize: ".8rem", fontWeight: 600,
              color: primary ? C.accentText : clr.text,
              display: "inline-flex", alignItems: "center", gap: 6,
              cursor: "default",
            }}>
              {primary && <Target size={11} />}{s}
              {editing && (
                <button type="button" onClick={() => remove(i)} aria-label={`Remove ${s}`}
                  style={{ background: "transparent", border: "none", color: clr.text + "99", cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={11} />
                </button>
              )}
            </span>
          );
        })}
      </div>
      {editing && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input className="pf-input" style={{ flex: 1, border: `1.5px solid ${draft.trim() ? "#3DBE82" : C.cardBorder}`, outline: "none", transition: "border-color .15s" }} value={draft} placeholder={placeholder}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
          <button type="button" onClick={add} disabled={!draft.trim()}
            style={{ background: draft.trim() ? "#3DBE82" : C.active, border: `1px solid ${draft.trim() ? "#3DBE82" : C.cardBorder}`, color: draft.trim() ? "#fff" : C.textMuted, borderRadius: 10, padding: "0 16px", cursor: draft.trim() ? "pointer" : "not-allowed", fontSize: ".82rem", fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}>
            <Plus size={13} /> Add
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Availability Editor — Topmate-style weekly list (day toggle + time ranges) ───── */
const DOW_LABELS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SLOT_INTERVAL_MIN = 30; // a saved range expands into discrete bookable slots on this grid

const fmtSlot = (s) => { const [h,m] = s.split(':').map(Number); const p = h >= 12 ? 'PM' : 'AM'; const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h; return `${h12}:${String(m).padStart(2,'0')} ${p}`; };
const toMin   = (hhmm) => { const [h,m] = hhmm.split(':').map(Number); return h*60+m; };
const toHHMM  = (min)  => `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;

// Expand a start/end range into discrete "HH:MM" slots at SLOT_INTERVAL_MIN steps.
// End is exclusive of the final partial step (so "09:00–10:00" → ["09:00","09:30"]).
function expandRange(start, end) {
  const startMin = toMin(start), endMin = toMin(end);
  const out = [];
  for (let m = startMin; m + SLOT_INTERVAL_MIN <= endMin; m += SLOT_INTERVAL_MIN) out.push(toHHMM(m));
  return out;
}

// Collapse a sorted list of discrete slots back into contiguous [start,end] ranges,
// so ranges saved earlier still display as ranges instead of a flat slot list.
function collapseToRanges(slots) {
  if (!slots.length) return [];
  const sorted = [...new Set(slots)].sort();
  const ranges = [];
  let rangeStart = sorted[0], prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (toMin(sorted[i]) - toMin(prev) === SLOT_INTERVAL_MIN) { prev = sorted[i]; continue; }
    ranges.push({ start: rangeStart, end: toHHMM(toMin(prev) + SLOT_INTERVAL_MIN) });
    rangeStart = prev = sorted[i];
  }
  ranges.push({ start: rangeStart, end: toHHMM(toMin(prev) + SLOT_INTERVAL_MIN) });
  return ranges;
}

function AvailabilityEditor({ userId }) {
  const [weekly, setWeekly] = useState(null); // [{ day, slots: ["HH:MM",...] }]
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    availabilityAPI.getSchedule(userId)
      .then(d => setWeekly(d.availability?.weekly || []))
      .catch(() => setWeekly([]));
  }, [userId]);

  const dayEntry  = (dow) => (weekly||[]).find(d => d.day === dow);
  const dayRanges = (dow) => collapseToRanges(dayEntry(dow)?.slots || []);

  const toggleDay = (dow) => {
    setWeekly(prev => {
      if (prev.some(d => d.day === dow)) return prev.filter(d => d.day !== dow);
      return [...prev, { day: dow, slots: expandRange("09:00", "18:00") }];
    });
  };

  const setDaySlots = (dow, slots) => {
    setWeekly(prev => prev.map(d => d.day === dow ? { ...d, slots } : d));
  };

  const addRange = (dow) => {
    const existing = dayEntry(dow)?.slots || [];
    setDaySlots(dow, [...new Set([...existing, ...expandRange("09:00","10:00")])].sort());
  };

  const removeRange = (dow, idx) => {
    const ranges = dayRanges(dow);
    const next = ranges.filter((_, i) => i !== idx).flatMap(r => expandRange(r.start, r.end));
    setDaySlots(dow, next);
  };

  const updateRange = (dow, idx, field, value) => {
    const ranges = dayRanges(dow);
    const updated = ranges.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    const next = updated
      .filter(r => toMin(r.end) > toMin(r.start))
      .flatMap(r => expandRange(r.start, r.end));
    setDaySlots(dow, next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await availabilityAPI.save({ weekly });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const totalSlots = (weekly||[]).reduce((s,d)=>s+d.slots.length,0);
  const activeDays  = (weekly||[]).length;

  if (weekly === null) return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {[0,1,2,3].map(i=><div key={i} className="pf-skel" style={{ height:52, borderRadius:10 }} />)}
    </div>
  );

  return (
    <div>
      {/* ── Weekly day list ── */}
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
        {DOW_LABELS.map((label, dow) => {
          const entry  = dayEntry(dow);
          const on     = !!entry;
          const ranges = dayRanges(dow);
          return (
            <div key={dow} style={{ background:C.card, border:`1px solid ${on?C.accent+"55":C.cardBorder}`, borderRadius:12, padding:"12px 14px" }}>
              {/* Day row: toggle + label */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <button type="button" onClick={()=>toggleDay(dow)} role="switch" aria-checked={on}
                    style={{
                      width:38, height:22, borderRadius:999, border:"none", cursor:"pointer", position:"relative",
                      background: on ? C.accent : C.active, transition:"background .15s", flexShrink:0, padding:0,
                    }}>
                    <span style={{
                      position:"absolute", top:2, left: on ? 18 : 2, width:18, height:18, borderRadius:"50%",
                      background:"#fff", transition:"left .15s", boxShadow:"0 1px 3px rgba(0,0,0,.3)",
                    }} />
                  </button>
                  <span style={{ fontSize:".84rem", fontWeight:700, color: on ? C.text : C.textMuted, minWidth:84 }}>{label}</span>
                </div>
                {!on && <span style={{ fontSize:".72rem", color:C.textMuted }}>Unavailable</span>}
                {on && (
                  <button type="button" onClick={()=>addRange(dow)}
                    style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:`1px solid ${C.cardBorder}`, borderRadius:8, padding:"5px 9px", color:C.accentText, fontSize:".7rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    <Plus size={12} /> Add range
                  </button>
                )}
              </div>

              {/* Time ranges for this day */}
              {on && (
                <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:10 }}>
                  {ranges.map((r, idx) => (
                    <div key={idx} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <input type="time" value={r.start} onChange={e=>updateRange(dow, idx, 'start', e.target.value)}
                        style={{ background:C.active, border:`1.5px solid ${C.cardBorder}`, borderRadius:8, padding:"6px 9px", color:C.text, fontSize:".76rem", fontFamily:"inherit", outline:"none", cursor:"pointer" }} />
                      <span style={{ color:C.textMuted, fontSize:".75rem" }}>to</span>
                      <input type="time" value={r.end} onChange={e=>updateRange(dow, idx, 'end', e.target.value)}
                        style={{ background:C.active, border:`1.5px solid ${C.cardBorder}`, borderRadius:8, padding:"6px 9px", color:C.text, fontSize:".76rem", fontFamily:"inherit", outline:"none", cursor:"pointer" }} />
                      <span style={{ fontSize:".68rem", color:C.textMuted, marginLeft:2 }}>
                        {fmtSlot(r.start)} – {fmtSlot(r.end)}
                      </span>
                      <button type="button" onClick={()=>removeRange(dow, idx)}
                        style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:4, display:"flex" }}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  {ranges.length === 0 && (
                    <span style={{ fontSize:".72rem", color:C.textMuted }}>No time ranges yet — tap "Add range"</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeDays === 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:10, background:C.active, borderRadius:10, border:`1px dashed ${C.cardBorder}`, padding:"11px 14px", marginBottom:12 }}>
          <CalendarClock size={14} style={{ color:C.textMuted, flexShrink:0 }} />
          <span style={{ fontSize:".78rem", color:C.textMuted }}>Turn on the days you're available, then set your hours</span>
        </div>
      )}

      {/* ── Save ── */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <button type="button" onClick={handleSave} disabled={saving || activeDays===0}
          style={{ display:"flex", alignItems:"center", gap:6, background:activeDays>0?C.green:C.active, border:"none", borderRadius:10, padding:"9px 18px", color:activeDays>0?"#fff":C.textMuted, fontSize:".8rem", fontWeight:700, cursor:activeDays>0?"pointer":"not-allowed", fontFamily:"inherit", opacity:saving?.7:1 }}>
          {saving?<><Spin size={13}/>Saving…</>:<><Check size={12}/>Save schedule</>}
        </button>
        {saved && <span style={{ fontSize:".78rem", color:C.green, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}><Check size={12}/>Saved</span>}
        {activeDays>0 && <span style={{ fontSize:".72rem", color:C.textMuted }}>{totalSlots} slots/week</span>}
      </div>
    </div>
  );
}

/* ─── Profile page ──────────────────────────────────────────────────────────── */
export default function ProfilePage({ activeSection: sectionProp, setActiveSection: setSectionProp } = {}) {
  const { user, setUser } = useAuth();
  const isMobileView = useIsMobile();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [servicesSaved, setServicesSaved] = useState(false); // brief "Saved ✓" flash
  const [uploading, setUploading] = useState(false);
  const [importing,  setImporting]  = useState(false);
  const [importMsg,  setImportMsg]  = useState("");
  const [importTab,  setImportTab]  = useState("url"); // "url" | "pdf"
  const [importUrl,  setImportUrl]  = useState("");
  const [importDone, setImportDone] = useState(false);
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugValue,   setSlugValue]   = useState("");
  const [slugSaving,  setSlugSaving]  = useState(false);
  const [slugError,   setSlugError]   = useState("");
  const [_activeSection, _setActiveSection] = useState('overview');
  const activeSection = sectionProp ?? _activeSection;
  const setActiveSection = setSectionProp ?? _setActiveSection;

  // Just onboarded? The onboarding flow set this flag — open the new card on arrival.
  const justOnboarded = (() => {
    try { return sessionStorage.getItem("atyant_open_answercard") === "1"; } catch { return false; }
  })();
  const [showAnswerCards, setShowAnswerCards] = useState(justOnboarded);
  const [autoOpenCard, setAutoOpenCard] = useState(justOnboarded);

  // Capture referral when someone lands on a shared profile link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ref") === "share" && user?.username) {
      sessionStorage.setItem("referredBy", user.username);
    }
  }, [user]);

  // Consume the one-shot onboarding flag so it doesn't re-open on later visits.
  useEffect(() => {
    try { sessionStorage.removeItem("atyant_open_answercard"); } catch { /* ignore */ }
  }, []);

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image too large (max 5MB)."); return; }
    setUploading(true);
    try {
      const res = await profileAPI.uploadPicture(file);
      setUser(prev => ({ ...(prev || {}), profilePicture: res.profilePicture }));
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const isMentor = user?.role === "mentor";
  const [serviceCatalog, setServiceCatalog] = useState(null); // null = loading
  const [form, setForm] = useState({
    name: "", phone: "", college: "", branch: "", year: "", cgpa: "", bio: "", goals: [], skills: [],
    expertise: [], topCompanies: [], specialTags: [], city: "", linkedinProfile: "", price: "", yearsOfExperience: "",
    primaryDomain: "", companyDomain: "", servicesOffered: []
  });

  // Initialize slug value when user changes.
  // If no slug is set yet, derive one from username and auto-save it silently.
  useEffect(() => {
    if (user?.slug) {
      setSlugValue(user.slug);
      return;
    }
    if (!isMentor || !user?.username) return;
    const derived = user.username
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);
    if (derived.length < 3) return;
    setSlugValue(derived);
    mentorAPI.updateSlug(derived)
      .then(res => {
        if (res?.ok || res?.slug) {
          setUser(prev => ({ ...prev, slug: res.slug || derived }));
        }
      })
      .catch(() => {});
  }, [user?.slug, user?.username, isMentor]);

  // Handle slug update
  const handleSlugUpdate = async () => {
    if (!slugValue.trim()) {
      setSlugError("Slug cannot be empty");
      return;
    }

    // Validate slug format: lowercase, alphanumeric and hyphens only, 3-100 chars
    const slugRegex = /^[a-z0-9-]{3,100}$/;
    if (!slugRegex.test(slugValue)) {
      setSlugError("Use lowercase letters, numbers, and hyphens only (3-100 characters)");
      return;
    }

    if (slugValue.startsWith('-') || slugValue.endsWith('-') || slugValue.includes('--')) {
      setSlugError("Slug cannot start/end with hyphen or have consecutive hyphens");
      return;
    }

    setSlugSaving(true);
    setSlugError("");
    try {
      const res = await mentorAPI.updateSlug(slugValue.trim());
      if (res.ok) {
        setUser(prev => ({ ...prev, slug: res.slug }));
        setSlugEditing(false);
      } else {
        setSlugError(res.error || "Failed to update slug");
      }
    } catch (err) {
      setSlugError(err.message || "Failed to update slug");
    } finally {
      setSlugSaving(false);
    }
  };

  const handleSlugCancel = () => {
    setSlugValue(user?.slug || "");
    setSlugEditing(false);
    setSlugError("");
  };

  const APP_BASE = import.meta.env.VITE_APP_URL || window.location.origin;
  const publicUrl = user?.slug ? `${APP_BASE}/${user.slug}` : "";

  // Load the platform service catalog once (mentors pick from it)
  useEffect(() => {
    servicesAPI.catalog().then(d => setServiceCatalog(d.services || [])).catch(() => setServiceCatalog([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    const edu = user.education?.[0] || {};
    setForm({
      name: user.username || "",
      phone: user.phone || "",
      college: edu.institutionName || edu.institution || "",
      branch: edu.field || "",
      year: edu.year || "",
      cgpa: edu.cgpa ? String(edu.cgpa) : "",
      bio: user.bio || "",
      goals: user.interests || [],
      skills: user.skills || [],
      expertise: user.expertise || [],
      topCompanies: user.topCompanies || [],
      specialTags: user.specialTags || [],
      city: user.city || "",
      linkedinProfile: user.linkedinProfile || "",
      price: user.price ? String(user.price) : "",
      yearsOfExperience: user.yearsOfExperience ? String(user.yearsOfExperience) : "",
      primaryDomain: user.primaryDomain || "",
      companyDomain: user.companyDomain || "",
      servicesOffered: user.servicesOffered || [],
    });
  }, [user]);

  // Inline validation (non-blocking hints)
  const cleanFormPhone = (form.phone || "").replace(/\D/g, "").slice(-10);
  const phoneError = editing && (
    !form.phone ? "Mobile number is required" :
    !/^[6-9]\d{9}$/.test(cleanFormPhone) ? "Enter a valid 10-digit Indian mobile number" : ""
  );
  const cgpaError = editing && form.cgpa && (isNaN(Number(form.cgpa)) || Number(form.cgpa) < 0 || Number(form.cgpa) > 10)
    ? "CGPA should be a number between 0 and 10" : "";
  const linkedinError = editing && form.linkedinProfile && !/linkedin\.com\//i.test(form.linkedinProfile)
    ? "Doesn't look like a LinkedIn URL" : "";

  // ── Services: directly selectable (no global edit mode) with their own Save ──
  // Toggling updates the form immediately; servicesDirty drives the Save button.
  const toggleService = (id) =>
    setForm(f => ({
      ...f,
      servicesOffered: f.servicesOffered.includes(id)
        ? f.servicesOffered.filter(x => x !== id)
        : [...f.servicesOffered, id],
    }));

  const servicesDirty =
    [...form.servicesOffered].sort().join(",") !== [...(user?.servicesOffered || [])].sort().join(",");

  const saveServices = async () => {
    setSavingServices(true);
    try {
      const res = await profileAPI.update({ servicesOffered: form.servicesOffered });
      setUser(res.user || res);
      setServicesSaved(true);
      setTimeout(() => setServicesSaved(false), 1800);
    } catch (e) { alert(e.message || "Could not save services"); }
    finally { setSavingServices(false); }
  };

  const handleSave = async () => {
    if (phoneError || cgpaError || linkedinError) return;
    setSaving(true);
    try {
      const cleanPhone = form.phone.replace(/\D/g, "").slice(-10);
      const base = { username: form.name, phone: cleanPhone, bio: form.bio, college: form.college, branch: form.branch, year: form.year, cgpa: form.cgpa };
      const payload = isMentor
        ? {
          ...base, expertise: form.expertise, topCompanies: form.topCompanies, specialTags: form.specialTags,
          city: form.city, linkedinProfile: form.linkedinProfile, price: Number(form.price) || 0, yearsOfExperience: Number(form.yearsOfExperience) || 0,
          primaryDomain: form.primaryDomain, companyDomain: form.companyDomain, servicesOffered: form.servicesOffered
        }
        : { ...base, goals: form.goals, skills: form.skills };
      const res = await profileAPI.update(payload);
      setUser(res.user || res);
      setEditing(false);
    } catch (e) { alert(e.message || "Save failed"); }
    finally { setSaving(false); }
  };

  // ── Import LinkedIn PDF → auto-fill the whole profile, save, open answer card ──
  // Mirrors the onboarding flow so existing mentors can refresh their profile in
  // one upload. Parsed values fill only empty fields (never overwrite edits);
  // tags are merged. After a successful save the answer-card section opens.
  const handleLinkedinImport = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setImportMsg("Please upload a PDF — on LinkedIn: Profile → More → Save to PDF."); return; }
    setImportMsg(""); setImporting(true);
    try {
      const res = await profileAPI.parseLinkedin(file);
      const d = res?.data || {};
      const pEdu = d.education?.[0] || {};
      const merged = {
        ...form,
        name:            form.name            || d.name || "",
        college:         form.college         || pEdu.institution || "",
        branch:          form.branch          || pEdu.field || "",
        year:            form.year            || pEdu.year || "",
        bio:             form.bio             || d.bio || "",
        city:            form.city            || d.city || "",
        linkedinProfile: form.linkedinProfile || d.linkedinProfile || "",
        topCompanies:    form.topCompanies.length ? form.topCompanies : (d.topCompanies || []),
        expertise:       form.expertise.length    ? form.expertise    : (d.expertise || []),
        specialTags:     Array.from(new Set([...form.specialTags, ...(d.specialTags || [])])),
        primaryDomain:   form.primaryDomain   || d.primaryDomain || "",
        companyDomain:   form.companyDomain   || d.companyDomain || "",
      };
      setForm(merged);
      const payload = {
        username: merged.name, bio: merged.bio, college: merged.college, branch: merged.branch,
        year: merged.year, cgpa: merged.cgpa, expertise: merged.expertise, topCompanies: merged.topCompanies,
        specialTags: merged.specialTags, city: merged.city, linkedinProfile: merged.linkedinProfile,
        price: Number(merged.price) || 0, yearsOfExperience: Number(merged.yearsOfExperience) || 0,
        primaryDomain: merged.primaryDomain, companyDomain: merged.companyDomain, servicesOffered: merged.servicesOffered,
      };
      const saved = await profileAPI.update(payload);
      setUser(saved.user || saved);
      // Open the answer-card section, same as the onboarding finish step.
      setShowAnswerCards(true);
      setAutoOpenCard(true);
    } catch (e) {
      setImportMsg(e.message || "Couldn't read that PDF — you can still edit your profile manually.");
    } finally {
      setImporting(false);
    }
  };

  const handleLinkedinUrlImport = async () => {
    if (!importUrl.trim()) { setImportMsg("Paste your LinkedIn profile URL first."); return; }
    setImportMsg(""); setImporting(true); setImportDone(false);
    try {
      const res = await mentorAPI.linkedinAutofill(importUrl.trim());
      const d = res?.data?.fields || res?.fields || {};
      const merged = {
        ...form,
        name:            form.name            || d.username || "",
        college:         form.college         || d.college  || "",
        branch:          form.branch          || d.branch   || "",
        year:            form.year            || d.year     || "",
        bio:             form.bio             || d.bio      || "",
        city:            form.city            || d.city     || "",
        linkedinProfile: form.linkedinProfile || d.linkedinProfile || importUrl.trim(),
        topCompanies:    form.topCompanies.length ? form.topCompanies : (d.topCompanies || []),
        expertise:       form.expertise.length    ? form.expertise    : (d.expertise   || []),
        primaryDomain:   form.primaryDomain   || d.primaryDomain || "",
        companyDomain:   form.companyDomain   || d.companyDomain || "",
        story:           form.story           || d.story    || "",
      };
      setForm(merged);
      const payload = {
        username: merged.name, bio: merged.bio, college: merged.college, branch: merged.branch,
        year: merged.year, city: merged.city, linkedinProfile: merged.linkedinProfile,
        expertise: merged.expertise, topCompanies: merged.topCompanies,
        primaryDomain: merged.primaryDomain, companyDomain: merged.companyDomain,
        servicesOffered: merged.servicesOffered, price: Number(merged.price) || 0,
        yearsOfExperience: Number(merged.yearsOfExperience) || 0,
      };
      await profileAPI.update(payload);
      setImportDone(true);
    } catch (e) {
      setImportMsg(e.message || "Couldn't fetch LinkedIn profile — check the URL and try again.");
    } finally { setImporting(false); }
  };

  const edu = user?.education?.[0] || {};

  // ── Completion checklist (weights sum to 100 per role) ──
  const has = (v) => Array.isArray(v) ? v.length > 0 : !!(typeof v === "string" ? v.trim() : v);
  const completionItems = useMemo(() => isMentor ? [
    { key: "photo", label: "Photo", pts: 8, done: has(user?.profilePicture) },
    { key: "bio", label: "Bio", pts: 10, done: has(form.bio) },
    { key: "college", label: "College", pts: 10, done: has(form.college) },
    { key: "branch", label: "Branch", pts: 8, done: has(form.branch) },
    { key: "year", label: "Passout year", pts: 6, done: has(form.year) },
    { key: "city", label: "City", pts: 6, done: has(form.city) },
    { key: "linkedin", label: "LinkedIn", pts: 8, done: has(form.linkedinProfile) },
    { key: "exp", label: "Experience", pts: 8, done: Number(form.yearsOfExperience) > 0 },
    { key: "domain", label: "Mentoring domain", pts: 6, done: has(form.primaryDomain) },
    { key: "expertise", label: "Expertise", pts: 10, done: has(form.expertise) },
    { key: "companies", label: "Companies", pts: 8, done: has(form.topCompanies) },
    { key: "tags", label: "Achievements", pts: 6, done: has(form.specialTags) },
    { key: "services", label: "Services", pts: 6, done: has(form.servicesOffered) },
  ] : [
    { key: "photo", label: "Photo", pts: 12, done: has(user?.profilePicture) },
    { key: "bio", label: "Bio", pts: 13, done: has(form.bio) },
    { key: "college", label: "College", pts: 13, done: has(form.college) },
    { key: "branch", label: "Branch", pts: 11, done: has(form.branch) },
    { key: "year", label: "Current year", pts: 8, done: has(form.year) },
    { key: "cgpa", label: "CGPA", pts: 8, done: has(form.cgpa) },
    { key: "goals", label: "Goals", pts: 18, done: has(form.goals) },
    { key: "skills", label: "Skills", pts: 17, done: has(form.skills) },
  ], [isMentor, form, user?.profilePicture]);

  const pct = Math.round(completionItems.reduce((s, it) => s + (it.done ? it.pts : 0), 0));
  const missing = completionItems.filter(it => !it.done);
  const startEdit = () => setEditing(true);

  // ── Loading skeleton (auth still resolving) ──
  if (!user) {
    return (
      <div style={{ padding: isMobileView ? "1.25rem" : "2rem", maxWidth: 1020, margin: "0 auto" }}>
        <PageStyles />
        <div className="pf-skel" style={{ height: 190, borderRadius: 18, marginBottom: 18 }} />
        <div className="pf-stats" style={{ marginBottom: 18 }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="pf-skel" style={{ height: 110, borderRadius: 16 }} />)}
        </div>
        <div className="pf-grid">
          <div className="pf-skel" style={{ height: 260, borderRadius: 16 }} />
          <div className="pf-skel" style={{ height: 260, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  const domainLabel = { internship: "Internships", placement: "Placements", both: "Internships & Placements" }[form.primaryDomain];

  const MENTOR_NAV = [
    { key: 'overview',     Icon: Activity,      label: 'Overview' },
    { key: 'services',     Icon: IndianRupee,   label: 'Services' },
    { key: 'availability', Icon: CalendarClock, label: 'Availability' },
    { key: 'basic',        Icon: UserRound,     label: 'Basic Information' },
    { key: 'education',    Icon: GraduationCap, label: 'Education' },
    { key: 'experience',   Icon: Briefcase,     label: 'Experience' },
    { key: 'expertise',    Icon: Zap,           label: 'Skills & Expertise' },
    { key: 'achievements', Icon: Trophy,        label: 'Achievements' },
    { key: 'preferences',  Icon: Compass,       label: 'Mentoring Prefs' },
    { key: 'social',       Icon: Link2,         label: 'Social Links' },
  ];
  const STUDENT_NAV = [
    { key: 'overview',  Icon: Activity,      label: 'Overview' },
    { key: 'basic',     Icon: UserRound,     label: 'Basic Information' },
    { key: 'education', Icon: GraduationCap, label: 'Education' },
    { key: 'goals',     Icon: Target,        label: 'Goals & Skills' },
  ];
  const navItems = isMentor ? MENTOR_NAV : STUDENT_NAV;

  // Maps completion chip keys → sidebar section keys
  const CHIP_TO_SECTION = {
    services: 'services', bio: 'basic', photo: 'basic', city: 'basic',
    college: 'education', branch: 'education', year: 'education', cgpa: 'education',
    exp: 'experience', companies: 'experience', linkedin: 'experience',
    expertise: 'expertise', tags: 'achievements', domain: 'preferences',
    goals: 'goals', skills: 'goals',
  };

  return (
    <div style={{ padding: isMobileView ? "1rem 0.75rem 3rem" : "1.5rem 2rem 3rem", maxWidth: 1140, margin: "0 auto" }}>
      <PageStyles />

      {showAnswerCards && (
        <AnswerCardManager
          onClose={() => { setShowAnswerCards(false); setAutoOpenCard(false); }}
          initialStory={form.bio || user?.bio || ""}
          autoOpenCard={autoOpenCard}
        />
      )}

      {/* ════════ HERO ════════ */}
      <header className="pf-anim" style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, overflow: "hidden", marginBottom: 18, boxShadow: "var(--shadow)" }}>
        {/* Gradient banner */}
        <div style={{ height: isMobileView ? 84 : 104, background: "linear-gradient(120deg, #7567C9 0%, #8E80DB 45%, #5A4CB0 100%)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 75% -20%, rgba(255,255,255,0.28), transparent 55%)" }} />
        </div>

        <div style={{ padding: isMobileView ? "0 1.1rem 1.2rem" : "0 1.75rem 1.5rem" }}>
          {/* Avatar + actions row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginTop: isMobileView ? -34 : -44 }}>
            <label style={{ position: "relative", cursor: "pointer", display: "inline-block", flexShrink: 0 }} title="Change photo">
              <div style={{ borderRadius: "50%", padding: 4, background: C.card, display: "inline-flex" }}>
                <Avatar src={user?.profilePicture} name={user?.username || user?.name || "You"} size={isMobileView ? 72 : 92} bg="7567c9" style={{ opacity: uploading ? 0.5 : 1 }} />
              </div>
              <input type="file" accept="image/*" onChange={onPickImage} style={{ display: "none" }} disabled={uploading} />
              <span style={{ position: "absolute", bottom: 6, right: 4, width: 26, height: 26, borderRadius: "50%", background: C.accent, border: `2.5px solid ${C.card}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                {uploading ? <Spin size={12} /> : <Camera size={12} />}
              </span>
            </label>

            <div className="pf-hero-actions">
              {!editing && <ShareProfile publicUrl={publicUrl} />}
              {isMentor && !editing && (
                <button onClick={() => setShowAnswerCards(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "8px 15px", color: C.textSub, fontSize: ".8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all .15s" }}>
                  <FileText size={13} /> Answer Card
                </button>
              )}
              {editing && (
                <button onClick={() => setEditing(false)} disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "8px 15px", color: C.textSub, fontSize: ".8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                  <X size={13} /> Cancel
                </button>
              )}
              <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 6, background: editing ? C.green : C.accent, border: "none", borderRadius: 10, padding: "8px 17px", color: "#fff", fontSize: ".8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, boxShadow: "0 3px 12px rgba(117,103,201,0.28)" }}>
                {saving ? <><Spin size={13} /> Saving…</> : editing ? <><Check size={13} /> Save changes</> : <><Pencil size={13} /> Edit Profile</>}
              </button>
            </div>
          </div>

          {/* Identity */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 14 }}>
            <div style={{ minWidth: 0, flex: "1 1 320px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: isMobileView ? "1.3rem" : "1.55rem", fontWeight: 700, color: C.text, letterSpacing: "-0.02em", wordBreak: "break-word" }}>
                  {user?.username || user?.name || "—"}
                </h1>
                {isMentor && (
                  <span style={{ background: C.accentSoft, border: `1px solid ${C.accent}55`, color: C.accentText, borderRadius: 999, padding: "3px 11px", fontSize: ".64rem", fontWeight: 700, letterSpacing: ".07em" }}>MENTOR</span>
                )}
                {user?.isVerified && (
                  <span title="Verified" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(61,190,130,0.12)", border: `1px solid ${C.green}55`, color: C.green, borderRadius: 999, padding: "3px 10px", fontSize: ".64rem", fontWeight: 700 }}>
                    <BadgeCheck size={11} /> VERIFIED
                  </span>
                )}
              </div>

              <div style={{ fontSize: ".86rem", color: C.textSub, marginTop: 7, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <GraduationCap size={14} style={{ color: C.textMuted, flexShrink: 0 }} />
                <span>{edu.institutionName || edu.institution || "Add your college"}{edu.field ? ` · ${edu.field}` : ""}{edu.year ? ` · ${edu.year}` : ""}</span>
              </div>

              <div style={{ fontSize: ".78rem", color: C.textMuted, marginTop: 6, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                {isMentor && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Briefcase size={12} /> {form.yearsOfExperience ? `${form.yearsOfExperience} yrs experience` : "Experience not set"}
                  </span>
                )}
                {isMentor && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <CalendarCheck size={12} /> {Number(form.price) > 0 ? `₹${form.price}/session` : "Free sessions"}
                  </span>
                )}
                {form.city && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={12} /> {form.city}
                  </span>
                )}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, display: "inline-block" }} /> Active now
                </span>
              </div>

              {/* Expertise tags in hero */}
              {(isMentor ? form.expertise : form.skills).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  {(isMentor ? form.expertise : form.skills).slice(0, 6).map((t, i) => (
                    <span key={i} style={{ background: C.active, border: `1px solid ${C.cardBorder}`, color: C.textSub, borderRadius: 999, padding: "3px 11px", fontSize: ".72rem", fontWeight: 500 }}>{t}</span>
                  ))}
                  {(isMentor ? form.expertise : form.skills).length > 6 && (
                    <span style={{ color: C.textMuted, fontSize: ".72rem", alignSelf: "center" }}>+{(isMentor ? form.expertise : form.skills).length - 6}</span>
                  )}
                </div>
              )}
            </div>

            {/* Completion ring */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <Ring pct={pct} size={isMobileView ? 64 : 76} />
              <div>
                <div style={{ fontSize: ".78rem", fontWeight: 600, color: C.text }}>Profile strength</div>
                <div style={{ fontSize: ".7rem", color: C.textMuted, marginTop: 2, maxWidth: 130, lineHeight: 1.45 }}>
                  {pct === 100 ? "Fully complete 🎉" : `${missing.length} item${missing.length === 1 ? "" : "s"} left`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ════════ MOBILE TABS (only when used standalone without app sidebar) ════════ */}
      {isMobileView && !sectionProp && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14, scrollbarWidth: "none" }}>
          {navItems.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveSection(key)}
              style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 999, border: activeSection === key ? "none" : `1px solid ${C.cardBorder}`, background: activeSection === key ? C.accent : C.card, color: activeSection === key ? "#fff" : C.textSub, fontSize: ".74rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ════════ CONTENT ════════ */}
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
        {/* RIGHT CONTENT PANEL */}
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* ── OVERVIEW ── */}
        {activeSection === 'overview' && (<>

      {/* ════════ IMPORT — LinkedIn URL or Resume PDF (hidden once 60%+) ════════ */}
      {isMentor && pct < 60 && (
        <div className="pf-card pf-anim pf-anim-1" style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, marginBottom: 18, overflow: "hidden" }}>
          {/* Tab header */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.cardBorder}` }}>
            {[
              { id: "url", icon: <Link2 size={13} />, label: "LinkedIn URL" },
              { id: "pdf", icon: <FileText size={13} />, label: "Resume PDF" },
            ].map(tab => (
              <button key={tab.id} type="button" onClick={() => { setImportTab(tab.id); setImportMsg(""); setImportDone(false); }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 12px", border: "none", borderBottom: importTab === tab.id ? `2px solid ${C.accent}` : "2px solid transparent", background: "transparent", color: importTab === tab.id ? C.accentText : C.textMuted, fontSize: ".78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "14px 16px" }}>
            {importTab === "url" ? (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={{ flex: 1, background: C.active, border: `1.5px solid ${importUrl.trim() ? C.accent : C.cardBorder}`, borderRadius: 9, padding: "9px 12px", color: C.text, fontSize: ".86rem", outline: "none", fontFamily: "inherit", transition: "border-color .15s" }}
                    type="url" placeholder="https://linkedin.com/in/yourname"
                    value={importUrl} onChange={e => { setImportUrl(e.target.value); setImportMsg(""); setImportDone(false); }}
                    onKeyDown={e => { if (e.key === "Enter") handleLinkedinUrlImport(); }}
                  />
                  <button onClick={handleLinkedinUrlImport} disabled={importing || !importUrl.trim()}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: importUrl.trim() ? C.accent : C.active, border: "none", borderRadius: 9, padding: "9px 16px", color: importUrl.trim() ? "#fff" : C.textMuted, fontSize: ".82rem", fontWeight: 700, cursor: importUrl.trim() && !importing ? "pointer" : "not-allowed", fontFamily: "inherit", flexShrink: 0, transition: "all .15s" }}>
                    {importing ? <><Spin size={13} /> Importing…</> : "Import"}
                  </button>
                </div>
                {importDone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, background: "rgba(61,190,130,0.08)", border: "1px solid #3DBE8244", borderRadius: 8, padding: "8px 12px" }}>
                    <Check size={13} color={C.green} /><span style={{ fontSize: ".78rem", color: C.green, fontWeight: 600 }}>Profile auto-filled from LinkedIn — review and save</span>
                  </div>
                )}
                {importMsg && <div style={{ fontSize: ".74rem", color: "#F87171", marginTop: 8 }}>{importMsg}</div>}
                <div style={{ fontSize: ".68rem", color: C.textMuted, marginTop: 7 }}>We extract name, college, companies, skills — you just review</div>
              </>
            ) : (
              <>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, border: `2px dashed ${C.cardBorder}`, borderRadius: 10, padding: "18px 16px", cursor: importing ? "default" : "pointer", background: C.active }}>
                  <input type="file" accept="application/pdf" hidden disabled={importing} onChange={e => { const f = e.target.files?.[0]; if (f) handleLinkedinImport(f); e.target.value = ""; }} />
                  {importing
                    ? <><Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: C.accentText }} /><span style={{ fontSize: ".82rem", color: C.accentText, fontWeight: 600 }}>Reading resume…</span></>
                    : importDone
                      ? <><Check size={20} color={C.green} /><span style={{ fontSize: ".82rem", color: C.green, fontWeight: 600 }}>Imported — review your fields above</span></>
                      : <><Upload size={20} color={C.textMuted} /><span style={{ fontSize: ".82rem", color: C.textSub, fontWeight: 600 }}>Click to upload your Resume PDF</span></>
                  }
                </label>
                {importMsg && <div style={{ fontSize: ".74rem", color: "#F87171", marginTop: 8 }}>{importMsg}</div>}
                <div style={{ fontSize: ".68rem", color: C.textMuted, marginTop: 7, textAlign: "center" }}>Any resume PDF works — LinkedIn: Profile → More → Save to PDF</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════ STATS ════════ */}
      <div className="pf-stats" style={{ marginBottom: 18 }}>
        {isMentor ? <>
          <StatCard Icon={Eye} label="Profile Views" value={user?.profileViews ?? 0} delay={1} />
          <StatCard Icon={MessageSquareText} label="Questions Answered" value={user?.totalAnswered ?? 0} delay={2} />
          <StatCard Icon={Activity} label="Response Rate" value={`${user?.responseRate ?? 0}%`} delay={3} />
          <StatCard Icon={Users} label="Students Helped" value={user?.successfulMatches ?? 0} delay={4} />
        </> : <>
          <StatCard Icon={TrendingUp} label="Profile Strength" value={`${pct}%`} delay={1} />
          <StatCard Icon={Target} label="Goals Set" value={form.goals.length} delay={2} />
          <StatCard Icon={Zap} label="Skills Added" value={form.skills.length} delay={3} />
          <StatCard Icon={Sparkles} label="Credits" value={user?.credits ?? 0} delay={4} />
        </>}
      </div>

      {/* ════════ COMPLETION CHECKLIST ════════ */}
      {pct < 100 && (
        <div className="pf-card pf-anim pf-anim-2" style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "1.2rem 1.4rem", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Sparkles size={15} style={{ color: C.accentText }} />
              <span style={{ fontSize: ".88rem", fontWeight: 600, color: C.text }}>Complete your profile</span>
            </div>
            <span style={{ fontSize: ".72rem", color: C.textMuted }}>
              {isMentor ? "Complete profiles get matched to 3× more students" : "A complete profile gets sharper mentor matches"}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, borderRadius: 999, background: C.active, overflow: "hidden", marginBottom: 14 }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: "linear-gradient(90deg, #7567C9, #8E80DB)", transition: "width .8s ease" }} />
          </div>

          {/* Checklist chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {completionItems.map(it => (
              it.done
                ? <span key={it.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(61,190,130,0.1)", border: `1px solid ${C.green}44`, borderRadius: 999, padding: "4px 12px", color: C.green, fontSize: ".72rem", fontWeight: 600 }}>
                  <Check size={11} /> {it.label}
                </span>
                : <button key={it.key} className="pf-chipbtn"
                  onClick={() => {
                    const sec = CHIP_TO_SECTION[it.key] || 'basic';
                    setActiveSection(sec);
                    if (sec !== 'services') startEdit();
                  }}
                  title={`Add ${it.label.toLowerCase()} (+${it.pts}%)`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.active, border: `1px dashed ${C.activeBorder}`, borderRadius: 999, padding: "4px 12px", color: C.textSub, fontSize: ".72rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  <Plus size={11} /> {it.label} <span style={{ color: C.accentText, fontWeight: 700 }}>+{it.pts}%</span>
                </button>
            ))}
          </div>
        </div>
      )}

        </>)}
        {/* end overview */}

        {/* ── SERVICES ── */}
        {activeSection === 'services' && isMentor && (
        <div id="services-section" className="pf-anim pf-anim-2" style={{ marginBottom: 18 }}>

          {/* 🔴 Red incomplete-setup reminder — shows until both services + availability are done */}
          {(form.servicesOffered.length === 0 || (user?.availability?.weekly?.length || 0) === 0) && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "rgba(248,113,113,0.08)", border: "1.5px solid rgba(248,113,113,0.45)", borderRadius: 14, padding: "13px 16px", marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: "1rem" }}>⚠️</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: ".84rem", fontWeight: 800, color: "#f87171", marginBottom: 4 }}>Students can't book you yet</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {form.servicesOffered.length === 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".76rem", color: "#fca5a5" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", flexShrink: 0 }} />
                      Turn on at least one service below (Text Q&A, Audio Call, or Video Call)
                    </div>
                  )}
                  {(user?.availability?.weekly?.length || 0) === 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".76rem", color: "#fca5a5" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", flexShrink: 0 }} />
                      Add your available hours using "Edit schedule" on the right
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Top earnings banner — light, soft surface */}
          <div style={{ borderRadius: "16px 16px 0 0", background: "linear-gradient(120deg, var(--c-accentSoft) 0%, rgba(61,190,130,0.06) 100%)", borderBottom: `1px solid ${C.cardBorder}`, padding: "18px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(117,103,201,0.3)" }}>
                  <IndianRupee size={20} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
                    Earn ₹49 – ₹299 per session
                  </div>
                  <div style={{ fontSize: ".75rem", color: C.textSub, marginTop: 2 }}>
                    {form.servicesOffered.length === 0
                      ? "Select your services & set availability — students can't book you yet"
                      : form.servicesOffered.length === 1
                        ? "1 service active · add your available hours to go live"
                        : `${form.servicesOffered.length} services active · ${(user?.availability?.weekly?.length || 0) === 0 ? "set your availability to go live" : "you're bookable by students"}`}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                {form.servicesOffered.length > 0 && (user?.availability?.weekly?.length || 0) > 0 ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(61,190,130,0.14)", border: `1px solid ${C.green}55`, borderRadius: 999, padding: "6px 14px", color: C.green, fontSize: ".76rem", fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, display: "inline-block" }} /> Live & Bookable
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.accentSoft, border: `1px solid ${C.accent}44`, borderRadius: 999, padding: "6px 14px", color: C.accentText, fontSize: ".76rem", fontWeight: 700 }}>
                    <Rocket size={12} /> Setup required
                  </span>
                )}
              </div>
            </div>
            {/* Quick earnings math */}
            <div style={{ position: "relative", display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              {[
                { label: "Text Q&A", price: "₹49", icon: "💬" },
                { label: "Audio Call", price: "₹99", icon: "🎙️" },
                { label: "Video Call", price: "₹299", icon: "📹" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "5px 12px" }}>
                  <span style={{ fontSize: ".82rem" }}>{s.icon}</span>
                  <span style={{ fontSize: ".72rem", color: C.textSub, fontWeight: 600 }}>{s.label} · {s.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Services + Availability side by side */}
          <div className="pf-mono-inner" style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: "20px 22px", boxShadow: "var(--shadow)", position: "relative" }}>

            {/* Left: Services */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: form.servicesOffered.length === 0 ? "rgba(248,113,113,0.15)" : "linear-gradient(135deg, rgba(117,103,201,0.22), rgba(117,103,201,0.08))", border: form.servicesOffered.length === 0 ? "1.5px solid rgba(248,113,113,0.5)" : "1px solid rgba(117,103,201,0.25)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                    <CalendarCheck size={14} style={{ color: form.servicesOffered.length === 0 ? "#f87171" : C.accentText }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".9rem", color: form.servicesOffered.length === 0 ? "#f87171" : C.text, display: "flex", alignItems: "center", gap: 7 }}>
                      Services you offer
                      {form.servicesOffered.length === 0 && <span style={{ fontSize: ".66rem", fontWeight: 700, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 999, padding: "2px 8px", color: "#f87171", letterSpacing: ".04em" }}>ACTION NEEDED</span>}
                    </div>
                    <div style={{ fontSize: ".68rem", color: C.textMuted, marginTop: 1 }}>Tap to turn a service on or off</div>
                  </div>
                </div>
              </div>
              {serviceCatalog === null ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[0, 1, 2].map(i => <div key={i} className="pf-skel" style={{ height: 52, borderRadius: 10 }} />)}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {serviceCatalog.map(s => {
                    const on = form.servicesOffered.includes(s.id);
                    return (
                      <div key={s.id} role="button" tabIndex={0} aria-pressed={on}
                        className={`pf-svc-row${on ? " on" : ""}`}
                        onClick={() => toggleService(s.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleService(s.id); } }}
                        style={{ display: "flex", alignItems: "center", gap: 12, background: on ? "rgba(117,103,201,0.16)" : C.active, border: `1.5px solid ${on ? C.accent : C.cardBorder}`, borderRadius: 12, padding: "11px 14px", cursor: "pointer", transition: "all .15s" }}>
                        <span style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${on ? C.accent : C.textMuted}`, background: on ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", transition: "all .15s" }}>
                          {on ? <Check size={12} /> : null}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", color: on ? C.text : C.textSub, fontSize: ".86rem", fontWeight: on ? 700 : 500 }}>{s.label}</span>
                          <span style={{ display: "block", color: C.textMuted, fontSize: ".7rem", marginTop: 1 }}>{s.description} · {s.durationMin} min</span>
                        </span>
                        <span style={{ background: on ? C.accentSoft : C.active, border: `1px solid ${on ? C.accent + "44" : C.cardBorder}`, borderRadius: 999, padding: "4px 11px", color: on ? C.accentText : C.textMuted, fontWeight: 700, fontSize: ".84rem", flexShrink: 0 }}>₹{s.price}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Dedicated Save for services — appears only when there are unsaved changes */}
              {servicesDirty ? (
                <button onClick={saveServices} disabled={savingServices}
                  style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.accent, border: "none", borderRadius: 11, padding: "11px 0", color: "#fff", fontSize: ".86rem", fontWeight: 700, cursor: savingServices ? "default" : "pointer", fontFamily: "inherit", opacity: savingServices ? 0.7 : 1, boxShadow: "0 4px 12px rgba(117,103,201,0.3)" }}>
                  {savingServices ? <><Spin size={14} /> Saving…</> : <><Check size={15} /> Save services</>}
                </button>
              ) : servicesSaved ? (
                <div style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "rgba(61,190,130,0.12)", border: `1px solid ${C.green}55`, borderRadius: 11, padding: "10px 0", color: C.green, fontSize: ".82rem", fontWeight: 700 }}>
                  <Check size={14} /> Services saved
                </div>
              ) : form.servicesOffered.length === 0 ? (
                <div style={{ marginTop: 12, width: "100%", textAlign: "center", background: C.accentSoft, border: `1.5px dashed ${C.accent}55`, borderRadius: 11, padding: "10px 0", color: C.accentText, fontSize: ".8rem", fontWeight: 700 }}>
                  <Plus size={13} style={{ verticalAlign: "-2px" }} /> Tap a service above to get booked
                </div>
              ) : null}
            </div>

          </div>
        </div>
        )} {/* end services */}

        {/* ── AVAILABILITY ── */}
        {activeSection === 'availability' && isMentor && (
          <div className="pf-card pf-anim" style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "20px 22px", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, rgba(61,190,130,0.2), rgba(61,190,130,0.07))", border: "1px solid rgba(61,190,130,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarClock size={15} style={{ color: C.green }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: ".9rem", color: C.text }}>Your Availability</div>
                <div style={{ fontSize: ".72rem", color: C.textMuted, marginTop: 1 }}>Set when students can book sessions with you</div>
              </div>
            </div>
            <AvailabilityEditor userId={user._id} />
          </div>
        )}

        {/* ── BASIC INFORMATION ── */}
        {activeSection === 'basic' && (
        <Section id="field-bio" Icon={UserRound} title="Basic Information" subtitle="Who you are on Atyant" onEdit={startEdit} editing={editing} delay={1}>
          <FieldRow label="DISPLAY NAME" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} editing={editing} placeholder="Your name" />
          <FieldRow label="MOBILE NUMBER" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} editing={editing} placeholder="9876543210" error={phoneError} />
          <div style={{ marginBottom: 0 }}>
            <label style={{ fontSize: ".66rem", fontWeight: 700, letterSpacing: ".09em", color: C.textMuted, display: "block", marginBottom: 6 }}>BIO</label>
            {editing
              ? <textarea className="pf-textarea" rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder={isMentor ? "One sharp line on what you cracked and how you help" : "Tell mentors a little about you"} aria-label="Bio" />
              : <div style={{ fontSize: ".88rem", color: form.bio ? C.textSub : C.textMuted, lineHeight: 1.65 }}>{form.bio || "No bio yet — a 2-line story makes your profile far more memorable."}</div>}
          </div>
        </Section>
        )} {/* end basic */}

        {/* ── EDUCATION ── */}
        {activeSection === 'education' && (
        <Section id="field-college" Icon={GraduationCap} title="Education" subtitle="Your academic background" onEdit={startEdit} editing={editing} delay={1}>
          <FieldRow label="COLLEGE" value={form.college} onChange={v => setForm(f => ({ ...f, college: v }))} editing={editing} placeholder="e.g. VNIT Nagpur" />
          <FieldRow label="BRANCH" value={form.branch} onChange={v => setForm(f => ({ ...f, branch: v }))} editing={editing} placeholder="e.g. Metallurgy" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldRow label={isMentor ? "PASSOUT YEAR" : "CURRENT YEAR"} value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))} editing={editing} placeholder={isMentor ? "2024" : "3rd"} />
            <FieldRow label="CGPA" value={form.cgpa} onChange={v => setForm(f => ({ ...f, cgpa: v }))} editing={editing} placeholder="8.2" error={cgpaError} />
          </div>
        </Section>
        )} {/* end education */}

        {/* ── EXPERIENCE (mentor) ── */}
        {activeSection === 'experience' && isMentor && (
          <Section id="field-exp" Icon={Briefcase} title="Professional Experience" subtitle="Where you've worked & for how long" onEdit={startEdit} editing={editing} delay={1}>
            <FieldRow label="YEARS OF EXPERIENCE" value={form.yearsOfExperience} onChange={v => setForm(f => ({ ...f, yearsOfExperience: v }))} editing={editing} placeholder="2" />
            <div>
              <label style={{ fontSize: ".66rem", fontWeight: 700, letterSpacing: ".09em", color: C.textMuted, display: "block", marginBottom: 8 }}>TOP COMPANIES</label>
              <ChipEditor items={form.topCompanies} editing={editing} onChange={v => setForm(f => ({ ...f, topCompanies: v }))}
                placeholder="Add a company, e.g. Amazon" emptyText="No companies yet — add where you worked or interned." />
            </div>
          </Section>
        )}

        {/* ── EXPERTISE (mentor) ── */}
        {activeSection === 'expertise' && isMentor && (
          <Section id="field-expertise" Icon={Zap} title="Skills & Expertise" subtitle="What you mentor students on" onEdit={startEdit} editing={editing} delay={1}>
            <ChipEditor items={form.expertise} editing={editing} onChange={v => setForm(f => ({ ...f, expertise: v }))}
              placeholder="Add an expertise, e.g. System Design" emptyText="No expertise added yet — this is what students get matched on." />
          </Section>
        )}

        {/* ── ACHIEVEMENTS (mentor) ── */}
        {activeSection === 'achievements' && isMentor && (
          <Section id="field-tags" Icon={Trophy} title="Achievements" subtitle="Tags that build instant credibility" onEdit={startEdit} editing={editing} delay={1}>
            <ChipEditor items={form.specialTags} editing={editing} onChange={v => setForm(f => ({ ...f, specialTags: v }))}
              placeholder="Add a tag, e.g. FAANG, PPO, GATE" emptyText="No achievements yet — FAANG, PPO, GATE, research… add what you cracked." />
          </Section>
        )}

        {/* ── MENTORING PREFERENCES (mentor) ── */}
        {activeSection === 'preferences' && isMentor && (
          <Section id="field-domain" Icon={Compass} title="Mentoring Preferences" subtitle="What & who you want to mentor" onEdit={startEdit} editing={editing} delay={1}>
            {editing ? <>
              <SelectRow label="MENTORING DOMAIN" value={form.primaryDomain} onChange={v => setForm(f => ({ ...f, primaryDomain: v }))} editing={editing}
                options={[{ value: "internship", label: "Internships" }, { value: "placement", label: "Placements" }, { value: "both", label: "Both" }]} />
              <SelectRow label="COMPANY DOMAIN" value={form.companyDomain} onChange={v => setForm(f => ({ ...f, companyDomain: v }))} editing={editing}
                options={[{ value: "Tech", label: "Tech" }, { value: "Data Analytics", label: "Data Analytics" }, { value: "Consulting", label: "Consulting" }, { value: "Product", label: "Product" }, { value: "Core Engineering", label: "Core Engineering" }]} />
            </> : <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: domainLabel ? 14 : 0 }}>
                <div>
                  <div style={{ fontSize: ".64rem", fontWeight: 700, letterSpacing: ".09em", color: C.textMuted, marginBottom: 8, textTransform: "uppercase" }}>MENTORING DOMAIN</div>
                  {form.primaryDomain
                    ? <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(117,103,201,0.12)", border: "1px solid rgba(117,103,201,0.35)", borderRadius: 10, padding: "8px 13px" }}>
                      <Target size={13} style={{ color: C.accentText, flexShrink: 0 }} />
                      <span style={{ fontSize: ".86rem", fontWeight: 600, color: C.accentText }}>{domainLabel}</span>
                    </div>
                    : <div style={{ fontSize: ".84rem", color: C.textMuted, fontStyle: "italic" }}>Not set</div>}
                </div>
                <div>
                  <div style={{ fontSize: ".64rem", fontWeight: 700, letterSpacing: ".09em", color: C.textMuted, marginBottom: 8, textTransform: "uppercase" }}>COMPANY DOMAIN</div>
                  {form.companyDomain
                    ? <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 10, padding: "8px 13px" }}>
                      <Briefcase size={13} style={{ color: "#60A5FA", flexShrink: 0 }} />
                      <span style={{ fontSize: ".86rem", fontWeight: 600, color: "#60A5FA" }}>{form.companyDomain}</span>
                    </div>
                    : <div style={{ fontSize: ".84rem", color: C.textMuted, fontStyle: "italic" }}>Not set</div>}
                </div>
              </div>
              {domainLabel && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.accentSoft, border: `1px solid ${C.accent}44`, borderRadius: 999, padding: "5px 13px", color: C.accentText, fontSize: ".76rem", fontWeight: 600 }}>
                  <Compass size={12} /> Mentors for {domainLabel}
                </div>
              )}
            </>}
          </Section>
        )}

        {/* ── SOCIAL LINKS (mentor) ── */}
        {activeSection === 'social' && isMentor && (<>
          <Section Icon={Link2} title="Social Links & Location" subtitle="Where students can verify you" onEdit={startEdit} editing={editing} delay={1}>
            {editing ? <>
              <FieldRow label="LINKEDIN" value={form.linkedinProfile} onChange={v => setForm(f => ({ ...f, linkedinProfile: v }))} editing={editing}
                placeholder="https://linkedin.com/in/you" error={linkedinError} />
              <FieldRow label="CITY" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} editing={editing} placeholder="Bengaluru" />
            </> : <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: ".64rem", fontWeight: 700, letterSpacing: ".09em", color: C.textMuted, marginBottom: 8, textTransform: "uppercase" }}>LINKEDIN</div>
                {form.linkedinProfile
                  ? <a href={form.linkedinProfile.startsWith("http") ? form.linkedinProfile : `https://${form.linkedinProfile}`} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(10,102,194,0.08)", border: "1px solid rgba(10,102,194,0.25)", borderRadius: 10, padding: "10px 13px", textDecoration: "none" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(10,102,194,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Link2 size={13} style={{ color: "#0A66C2" }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: ".82rem", fontWeight: 600, color: "#0A66C2" }}>Open LinkedIn Profile</div>
                      <div style={{ fontSize: ".7rem", color: C.textMuted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.linkedinProfile}</div>
                    </div>
                    <TrendingUp size={13} style={{ color: "#0A66C2", flexShrink: 0 }} />
                  </a>
                  : <div style={{ fontSize: ".84rem", color: C.textMuted, fontStyle: "italic" }}>Not set</div>}
              </div>
              <div>
                <div style={{ fontSize: ".64rem", fontWeight: 700, letterSpacing: ".09em", color: C.textMuted, marginBottom: 8, textTransform: "uppercase" }}>CITY</div>
                {form.city
                  ? <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(61,190,130,0.1)", border: "1px solid rgba(61,190,130,0.3)", borderRadius: 10, padding: "8px 13px" }}>
                    <MapPin size={13} style={{ color: C.green, flexShrink: 0 }} />
                    <span style={{ fontSize: ".86rem", fontWeight: 600, color: C.green }}>{form.city}</span>
                  </div>
                  : <div style={{ fontSize: ".84rem", color: C.textMuted, fontStyle: "italic" }}>Not set</div>}
              </div>
            </>}
          </Section>

          <Section Icon={Globe} title="Public Profile URL" subtitle="Shareable link for your mentor profile" delay={2}>
            {slugEditing ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: ".64rem", fontWeight: 700, letterSpacing: ".09em", color: C.textMuted, marginBottom: 8, textTransform: "uppercase" }}>CUSTOM SLUG</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "10px 13px", flex: 1 }}>
                      <span style={{ color: C.textMuted, fontSize: ".88rem", marginRight: 4 }}>{window.location.origin}/</span>
                      <input
                        type="text"
                        value={slugValue}
                        onChange={e => setSlugValue(e.target.value.toLowerCase())}
                        placeholder="your-name"
                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: ".88rem", fontFamily: "inherit" }}
                      />
                    </div>
                  </div>
                  {slugError && <div style={{ fontSize: ".7rem", color: "#F87171", marginTop: 4 }}>{slugError}</div>}
                  <div style={{ fontSize: ".72rem", color: C.textMuted, marginTop: 6 }}>
                    Use lowercase letters, numbers, and hyphens only (3-100 characters)
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleSlugCancel}
                    disabled={slugSaving}
                    style={{ background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "9px 18px", color: C.textSub, fontSize: ".82rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSlugUpdate}
                    disabled={slugSaving}
                    style={{ display: "flex", alignItems: "center", gap: 7, background: C.green, border: "none", borderRadius: 10, padding: "9px 22px", color: "#fff", fontSize: ".82rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
                  >
                    {slugSaving ? <><Spin size={13} /> Saving…</> : <><Check size={14} /> Save</>}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: ".64rem", fontWeight: 700, letterSpacing: ".09em", color: C.textMuted, marginBottom: 8, textTransform: "uppercase" }}>PUBLIC URL</div>
                  {publicUrl ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(117,103,201,0.08)", border: "1px solid rgba(117,103,201,0.25)", borderRadius: 10, padding: "10px 13px" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(117,103,201,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Globe size={13} style={{ color: C.accentText }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: ".82rem", fontWeight: 600, color: C.accentText }}>{publicUrl}</div>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(publicUrl)}
                        style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: 4, display: "flex" }}
                        title="Copy URL"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  ) : null}
                  {publicUrl && (
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        marginTop: 10, display: "inline-flex", alignItems: "center", gap: 7,
                        background: "rgba(10,102,194,0.10)", border: "1px solid rgba(10,102,194,0.25)",
                        borderRadius: 10, padding: "9px 16px",
                        color: "#0A66C2", fontSize: ".82rem", fontWeight: 600, textDecoration: "none",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Share on LinkedIn
                    </a>
                  )}
                  {!publicUrl && (
                    <div style={{ fontSize: ".84rem", color: C.textMuted, fontStyle: "italic" }}>Not set yet — set a slug above to get your link</div>
                  )}
                </div>
                {publicUrl && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: "transparent", border: `1px solid ${C.cardBorder}`,
                      borderRadius: 10, padding: "8px 15px",
                      color: C.textSub, fontSize: ".8rem", fontWeight: 500, textDecoration: "none",
                    }}
                  >
                    <Eye size={13} /> View your public profile
                  </a>
                )}
                <button
                  onClick={() => setSlugEditing(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "8px 15px", color: C.textSub, fontSize: ".8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                >
                  <Pencil size={13} /> Customize slug
                </button>
              </div>
            )}
          </Section>

          {(() => {
            const isVerified = user?.isVerified || pct >= 80;
            return (
              <Section Icon={ShieldCheck} title="Verification Status" subtitle="Trust signals students see" delay={3}>
                {/* Progress bar — only shown when not yet verified */}
                {!isVerified && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontSize: ".68rem", color: C.textMuted, fontWeight: 600 }}>Profile completion</span>
                      <span style={{ fontSize: ".68rem", fontWeight: 700, color: pct >= 60 ? C.accentText : C.textMuted }}>{pct}% / 80% needed</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: C.active, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(pct / 80 * 100, 100)}%`, borderRadius: 999, background: pct >= 60 ? "linear-gradient(90deg,#7567C9,#8E80DB)" : C.cardBorder, transition: "width .6s ease" }} />
                    </div>
                    <div style={{ fontSize: ".66rem", color: C.textMuted, marginTop: 5 }}>
                      {pct < 80 ? `${80 - pct}% more to unlock your verified badge` : "Unlocking…"}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: isVerified ? "rgba(61,190,130,0.08)" : C.active, border: `1px solid ${isVerified ? C.green + "44" : C.cardBorder}`, borderRadius: 12, padding: "13px 15px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: isVerified ? "rgba(61,190,130,0.15)" : C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isVerified ? <BadgeCheck size={18} style={{ color: C.green }} /> : <ShieldCheck size={18} style={{ color: C.accentText }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: ".85rem", fontWeight: 700, color: isVerified ? C.green : C.text }}>
                      {isVerified ? "✓ Verified mentor" : "Verification locked"}
                    </div>
                    <div style={{ fontSize: ".74rem", color: C.textMuted, marginTop: 2, lineHeight: 1.5 }}>
                      {isVerified
                        ? "Students see the verified badge on your profile — builds instant trust."
                        : "Reach 80% profile completion to unlock your verified badge."}
                    </div>
                  </div>
                </div>
              </Section>
            );
          })()}
        </>)}
        {/* end social */}

        {/* ── GOALS & SKILLS (student) ── */}
        {activeSection === 'goals' && !isMentor && (<>
          <Section Icon={Target} title="Current Goals" subtitle="What you're working towards" onEdit={startEdit} editing={editing} delay={1}>
            <ChipEditor items={form.goals} editing={editing} onChange={v => setForm(f => ({ ...f, goals: v }))} highlightFirst
              placeholder="Add a goal, e.g. AI/ML Internship" emptyText="No goals yet — your first goal powers your mentor matches." />
          </Section>
          <Section Icon={Zap} title="Skills" subtitle="What you already know" onEdit={startEdit} editing={editing} delay={2}>
            <ChipEditor items={form.skills} editing={editing} onChange={v => setForm(f => ({ ...f, skills: v }))}
              placeholder="Add a skill, e.g. Python" emptyText="No skills added yet — list what you've learned so far." />
          </Section>
        </>)}

        </div> {/* end content panel */}
      </div> {/* end sidebar+content row */}

      {/* Sticky save bar in edit mode (mobile-friendly) */}
      {editing && (
        <div style={{ position: "sticky", bottom: 14, marginTop: 22, display: "flex", justifyContent: "center", zIndex: 30, pointerEvents: "none" }}>
          <div style={{ display: "flex", gap: 10, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "10px 12px", boxShadow: "0 12px 32px rgba(0,0,0,0.25)", pointerEvents: "auto" }}>
            <button onClick={() => setEditing(false)} disabled={saving}
              style={{ background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "9px 18px", color: C.textSub, fontSize: ".82rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 7, background: C.green, border: "none", borderRadius: 10, padding: "9px 22px", color: "#fff", fontSize: ".82rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              {saving ? <><Spin size={13} /> Saving…</> : <><Check size={14} /> Save changes</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
