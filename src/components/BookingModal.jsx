import { useState, useEffect } from "react";
import {
  X, ChevronLeft, ChevronRight, Check, Loader2,
  CalendarDays, Clock, Zap, Video, MessageSquare, Mic,
  FileText, ArrowRight, BadgeCheck,
} from "lucide-react";
import { api, availabilityAPI, paymentAPI } from "../api";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const C = {
  bg:          "var(--c-bg)",
  card:        "var(--c-card)",
  cardBorder:  "var(--c-cardBorder)",
  active:      "var(--c-active)",
  accent:      "#7567C9",
  accentSoft:  "var(--c-accentSoft)",
  accentText:  "var(--c-accentText)",
  text:        "var(--c-text)",
  textSub:     "var(--c-textSub)",
  textMuted:   "var(--c-textMuted)",
  green:       "#3DBE82",
  red:         "#F87171",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_HEADERS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const SERVICE_ICONS = { "text-qa": MessageSquare, "audio-call": Mic, "video-call": Video, "resume-review": FileText };

function Spin({ size = 16 }) {
  return <Loader2 size={size} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />;
}

const BookingStyles = () => (
  <style>{`
    @keyframes bkFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .bk-in { animation: bkFadeIn .25s ease-out both; }
    .bk-svc { transition: all .15s ease; cursor: pointer; }
    .bk-svc:hover { border-color:#7567C9 !important; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(117,103,201,0.18); }
    .bk-svc.selected { border-color:#7567C9 !important; background: rgba(117,103,201,0.18) !important; }
    .bk-day { transition: all .12s ease; }
    .bk-day:not(:disabled):hover { background: rgba(117,103,201,0.14) !important; color: var(--c-accentText) !important; }
    .bk-slot { transition: all .12s ease; cursor: pointer; }
    .bk-slot:hover:not(:disabled) { border-color:#7567C9 !important; color: var(--c-accentText) !important; background: var(--c-accentSoft) !important; }
    .bk-slot.selected { background:#7567C9 !important; border-color:#7567C9 !important; color:#fff !important; font-weight:700; }
    .bk-btn-primary { transition: opacity .15s, transform .15s; }
    .bk-btn-primary:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
  `}</style>
);

function StepBar({ step }) {
  const steps = ["Service", "Schedule", "Confirm"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, justifyContent: "center", marginBottom: "1.5rem" }}>
      {steps.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: i < step ? C.green : i === step ? C.accent : C.active,
              border: `2px solid ${i < step ? C.green : i === step ? C.accent : C.cardBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", color: i <= step ? "#fff" : C.textMuted,
              fontSize: ".72rem", fontWeight: 700, transition: "all .2s",
            }}>
              {i < step ? <Check size={13} /> : i + 1}
            </div>
            <span style={{ fontSize: ".62rem", fontWeight: 600, color: i === step ? C.accentText : C.textMuted, letterSpacing: ".04em" }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 48, height: 2, background: i < step ? C.green : C.cardBorder, margin: "0 6px", marginBottom: 20, transition: "background .2s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1 ─ Service Selector ──────────────────────────────────────────────
function ServiceStep({ services, selected, onSelect, onNext }) {
  return (
    <div className="bk-in">
      <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: C.text }}>Choose a service</h3>
      <p style={{ margin: "0 0 18px", fontSize: ".8rem", color: C.textMuted }}>What kind of session do you need?</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {services.map(svc => {
          const Icon = SERVICE_ICONS[svc.id] || CalendarDays;
          const on = selected?.id === svc.id;
          return (
            <div key={svc.id} className={`bk-svc${on ? " selected" : ""}`} onClick={() => onSelect(svc)}
              style={{ display: "flex", alignItems: "center", gap: 13, background: C.active, border: `1.5px solid ${on ? C.accent : C.cardBorder}`, borderRadius: 13, padding: "13px 15px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: on ? "rgba(117,103,201,0.18)" : C.card, border: `1px solid ${on ? C.accent + "44" : C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} style={{ color: on ? C.accentText : C.textMuted }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: ".88rem", color: C.text }}>{svc.label}</div>
                <div style={{ fontSize: ".72rem", color: C.textMuted, marginTop: 2 }}>{svc.description} · {svc.durationMin} min</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: ".95rem", color: on ? C.accentText : C.text }}>
                  {svc.price === 0 ? "Free" : `₹${svc.price}`}
                </span>
                {on && <Check size={13} style={{ color: C.accent, marginTop: 3 }} />}
              </div>
            </div>
          );
        })}
      </div>
      <button className="bk-btn-primary" onClick={onNext} disabled={!selected}
        style={{ marginTop: 20, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: selected ? C.accent : C.active, border: "none", borderRadius: 12, padding: "12px 20px", color: selected ? "#fff" : C.textMuted, fontWeight: 700, fontSize: ".88rem", cursor: selected ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
        Next — Pick a time <ArrowRight size={15} />
      </button>
    </div>
  );
}

// ─── Step 2 ─ Calendar + Time Slots ─────────────────────────────────────────
function ScheduleStep({ mentorId, service, availability, onDateSlot, onBack }) {
  const { user } = useAuth();
  const today = new Date();
  const [calYear, setCalYear]     = useState(today.getFullYear());
  const [calMonth, setCalMonth]   = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots]         = useState(null); // null=loading, []=[none], [...]
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [mySessions, setMySessions] = useState([]);
  const maxWeeks = availability?.maxWeeksAhead ?? 3;

  useEffect(() => {
    if (user) {
      api.get('/api/sessions/my')
        .then(r => {
          const list = Array.isArray(r) ? r : [...(r?.upcoming || []), ...(r?.past || [])];
          setMySessions(list);
        })
        .catch(() => {});
    }
  }, [user]);

  const hasBookingOnDate = (ds) => {
    return mySessions.some(s => {
      if (s.status === 'cancelled') return false;
      const sId = s.mentorId?._id || s.mentorId || '';
      const mId = mentorId?._id || mentorId || '';
      if (sId.toString() !== mId.toString()) return false;
      const sDateStr = new Date(s.scheduledAt).toLocaleDateString('sv-SE').slice(0, 10);
      return sDateStr === ds;
    });
  };

  const getBookingForSlot = (ds, hhmm) => {
    return mySessions.find(s => {
      if (s.status === 'cancelled') return false;
      const sId = s.mentorId?._id || s.mentorId || '';
      const mId = mentorId?._id || mentorId || '';
      if (sId.toString() !== mId.toString()) return false;
      const sDateStr = new Date(s.scheduledAt).toLocaleDateString('sv-SE').slice(0, 10);
      if (sDateStr !== ds) return false;
      
      const t = new Date(new Date(s.scheduledAt).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const sHhmm = `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
      return sHhmm === hhmm;
    });
  };

  useEffect(() => {
    if (!selectedDate) { setSlots(null); setBookedSlots([]); setSelectedSlot(null); return; }
    setSlots(null);
    setBookedSlots([]);
    setSelectedSlot(null);
    availabilityAPI.getSlots(mentorId, selectedDate)
      .then(d => {
        setSlots(d.slots || []);
        setBookedSlots(d.bookedSlots || []);
      })
      .catch(() => {
        setSlots([]);
        setBookedSlots([]);
      });
  }, [mentorId, selectedDate]);

  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() + maxWeeks * 7);

  const isAvailableDay = (dateStr) => {
    if (!availability) return false;
    const d = new Date(dateStr + "T12:00:00");
    if (d < new Date(today.toDateString()) || d > cutoffDate) return false;
    // Blocked dates (mentor marked unavailable) win over everything
    if ((availability.exceptions || []).includes(dateStr)) return false;
    // A date override (one-off slots) makes the day bookable even outside the weekly template
    const override = (availability.dateOverrides || []).find(o => o.date === dateStr);
    if (override) return !!override.slots?.length;
    const entry = (availability.weekly || []).find(w => w.day === d.getDay());
    return !!entry?.slots?.length;
  };

  // Build calendar grid
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const toDateStr = (d) => `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  // Don't go before today's month
  const canPrev = calYear > today.getFullYear() || calMonth > today.getMonth();

  const formatSlot = (s) => {
    const [h, m] = s.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2,'0')} ${period}`;
  };

  const formatDateLabel = (ds) => {
    if (!ds) return '';
    const d = new Date(ds + "T12:00:00");
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="bk-in space-y-4">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CalendarDays size={15} style={{ color: C.accentText }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: ".9rem", color: C.text }}>{service.label}</div>
          <div style={{ fontSize: ".7rem", color: C.textMuted }}>{service.durationMin} min · {service.price === 0 ? "Free" : `₹${service.price}`}</div>
        </div>
      </div>

      <div className="flex max-sm:flex-col border border-border rounded-xl overflow-hidden bg-background">
        {/* Left: DayPicker Calendar with Available highlight */}
        <div className="flex-1 flex justify-center p-3 bg-background">
          <Calendar
            mode="single"
            selected={selectedDate ? new Date(selectedDate + "T12:00:00") : undefined}
            onSelect={(d) => {
              if (d) {
                setSelectedDate(format(d, "yyyy-MM-dd"));
                setSelectedSlot(null);
              }
            }}
            className="p-0 bg-background"
            disabled={(d) => {
              const ds = format(d, "yyyy-MM-dd");
              return !isAvailableDay(ds);
            }}
            modifiers={{
              available: (d) => {
                const ds = format(d, "yyyy-MM-dd");
                return isAvailableDay(ds);
              },
              booked: (d) => {
                const ds = format(d, "yyyy-MM-dd");
                return hasBookingOnDate(ds);
              }
            }}
            modifiersClassNames={{
              available: "bg-violet-500/15 text-violet-600 dark:text-violet-300 font-bold border border-violet-500/40 rounded-lg hover:bg-violet-500/25",
              booked: "border-2 border-emerald-500 rounded-lg"
            }}
          />
        </div>

        {/* Right: Scrollable slots list */}
        <div className="relative w-full max-sm:h-48 sm:w-56 border-t sm:border-t-0 sm:border-s border-border bg-background">
          <ScrollArea className="h-48 sm:h-[260px]">
            <div className="space-y-2 py-3 px-2">
              <div className="flex h-5 shrink-0 items-center">
                <p className="text-xs font-semibold text-foreground">
                  {selectedDate ? format(new Date(selectedDate + "T12:00:00"), "EEEE, d") : "Select date"}
                </p>
              </div>

              {/* Loader */}
              {selectedDate && slots === null && (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <Loader2 className="animate-spin text-muted-foreground" size={16} />
                  <span className="text-[10px] text-muted-foreground">Loading...</span>
                </div>
              )}

              {/* No Slots */}
              {selectedDate && slots !== null && slots.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-6">No slots available</p>
              )}

              {/* Slots List */}
              {selectedDate && slots !== null && slots.length > 0 && (
                <div className="grid gap-1 px-1">
                  {slots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSel = selectedSlot === slot;
                    const myBooking = getBookingForSlot(selectedDate, slot);
                    return (
                      <Button
                        key={slot}
                        variant={isSel ? "default" : (myBooking ? "destructive" : "outline")}
                        size="sm"
                        className={cn(
                          "w-full text-xs font-semibold rounded-lg",
                          myBooking && !isSel && "bg-red-500/10 text-red-500 border-red-500/40 hover:bg-red-500/20"
                        )}
                        onClick={() => {
                          if (!myBooking && !isBooked) setSelectedSlot(isSel ? null : slot);
                        }}
                        disabled={isBooked && !myBooking}
                      >
                        {formatSlot(slot)} {myBooking ? "(Yours)" : (isBooked && "(Booked)")}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={onBack}
          style={{ flex: "0 0 auto", background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "11px 18px", color: C.textSub, fontWeight: 600, fontSize: ".82rem", cursor: "pointer", fontFamily: "inherit" }}>
          Back
        </button>
        <button className="bk-btn-primary" onClick={() => onDateSlot(selectedDate, selectedSlot)} disabled={!selectedDate || !selectedSlot}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: selectedDate && selectedSlot ? C.accent : C.active, border: "none", borderRadius: 12, padding: "11px 20px", color: selectedDate && selectedSlot ? "#fff" : C.textMuted, fontWeight: 700, fontSize: ".88rem", cursor: selectedDate && selectedSlot ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
          Review booking <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 ─ Confirm & Pay ──────────────────────────────────────────────────
function ConfirmStep({ service, date, slot, mentorName, mentorPic, booking, error, onBack, onConfirm }) {
  const formatSlot = (s) => {
    if (!s) return '';
    const [h, m] = s.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2,'0')} ${period}`;
  };
  const formatDate = (ds) => {
    if (!ds) return '';
    return new Date(ds + "T12:00:00").toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="bk-in">
      <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: C.text }}>Booking summary</h3>
      <p style={{ margin: "0 0 18px", fontSize: ".8rem", color: C.textMuted }}>Review your session details before confirming.</p>

      {/* Summary card */}
      <div style={{ background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "16px 17px", marginBottom: 18 }}>
        {/* Mentor row */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, paddingBottom: 14, borderBottom: `1px solid ${C.cardBorder}`, marginBottom: 14 }}>
          <Avatar src={mentorPic} name={mentorName} size={42} bg="7567c9" />
          <div>
            <div style={{ fontWeight: 700, fontSize: ".9rem", color: C.text }}>{mentorName}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <BadgeCheck size={12} style={{ color: C.green }} />
              <span style={{ fontSize: ".7rem", color: C.green, fontWeight: 600 }}>Mentor on Atyant</span>
            </div>
          </div>
        </div>
        {/* Details grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
          {[
            { label: "SERVICE",  value: service?.label },
            { label: "DURATION", value: `${service?.durationMin} min` },
            { label: "DATE",     value: formatDate(date), span: true },
            { label: "TIME",     value: formatSlot(slot) },
            { label: "PRICE",    value: service?.price === 0 ? "Free" : `₹${service?.price}` },
          ].map(r => (
            <div key={r.label} style={{ gridColumn: r.span ? "1 / -1" : undefined }}>
              <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".08em", color: C.textMuted, marginBottom: 3 }}>{r.label}</div>
              <div style={{ fontSize: ".86rem", fontWeight: 600, color: C.text }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Price banner */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(117,103,201,0.09)", border: `1px solid rgba(117,103,201,0.28)`, borderRadius: 12, padding: "12px 16px", marginBottom: 18 }}>
        <span style={{ fontSize: ".84rem", fontWeight: 600, color: C.text }}>Total payable</span>
        <span style={{ fontSize: "1.1rem", fontWeight: 700, color: service?.price === 0 ? C.green : C.accentText }}>
          {service?.price === 0 ? "Free" : `₹${service?.price}`}
        </span>
      </div>

      {error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: `1px solid rgba(248,113,113,0.35)`, borderRadius: 10, padding: "10px 13px", marginBottom: 14, fontSize: ".8rem", color: C.red }}>{error}</div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onBack} disabled={booking}
          style={{ flex: "0 0 auto", background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "11px 18px", color: C.textSub, fontWeight: 600, fontSize: ".82rem", cursor: "pointer", fontFamily: "inherit" }}>
          Back
        </button>
        <button className="bk-btn-primary" onClick={onConfirm} disabled={booking}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.accent, border: "none", borderRadius: 12, padding: "11px 20px", color: "#fff", fontWeight: 700, fontSize: ".88rem", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(117,103,201,0.32)" }}>
          {booking ? <><Spin size={14} /> Processing…</> : service?.price === 0 ? <><Check size={15} /> Book Session</> : <><Zap size={14} /> Pay & Confirm</>}
        </button>
      </div>
    </div>
  );
}

// ─── Success screen ──────────────────────────────────────────────────────────
function SuccessStep({ service, date, slot }) {
  const formatSlot = (s) => {
    const [h, m] = s.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2,'0')} ${period}`;
  };
  const formatDate = (ds) => new Date(ds + "T12:00:00").toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="bk-in" style={{ textAlign: "center", padding: "1rem 0" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(61,190,130,0.15)", border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
        <Check size={28} style={{ color: C.green }} />
      </div>
      <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 700, color: C.text }}>Session booked!</h3>
      <p style={{ margin: "0 0 20px", fontSize: ".84rem", color: C.textMuted, lineHeight: 1.6 }}>
        You're confirmed for <strong style={{ color: C.text }}>{service?.label}</strong> on{" "}
        <strong style={{ color: C.text }}>{formatDate(date)} at {formatSlot(slot)}</strong>.
        Your meeting link will be sent to your email.
      </p>
      <div style={{ background: "rgba(61,190,130,0.08)", border: `1px solid ${C.green}44`, borderRadius: 12, padding: "12px 16px", fontSize: ".8rem", color: C.textSub, lineHeight: 1.6 }}>
        Check your registered email for the calendar invite and meeting link.
      </div>
    </div>
  );
}

// ─── Main BookingModal ───────────────────────────────────────────────────────
export default function BookingModal({ mentorId, mentorName, mentorPic, services = [], preselectServiceId, onClose, onBooked }) {
  const [step, setStep]         = useState(0); // 0=svc, 1=schedule, 2=confirm, 3=success
  const [service, setService]   = useState(null);
  const [availability, setAvail] = useState(null);
  const [date, setDate]         = useState(null);
  const [slot, setSlot]         = useState(null);
  const [booking, setBooking]   = useState(false);
  const [error, setError]       = useState("");

  // Pre-select: an explicit serviceId (e.g. "Book Session" from the chat unlock
  // card → Text Q&A) jumps straight to scheduling; otherwise auto-pick the only
  // service when a mentor offers exactly one.
  useEffect(() => {
    if (preselectServiceId) {
      const match = services.find(s => s.id === preselectServiceId);
      if (match) { setService(match); setStep(1); return; }
    }
    if (services.length === 1) setService(services[0]);
  }, [services, preselectServiceId]);

  // Load mentor's weekly availability template
  useEffect(() => {
    availabilityAPI.getSchedule(mentorId)
      .then(d => setAvail(d.availability || { weekly: [] }))
      .catch(() => setAvail({ weekly: [] }));
  }, [mentorId]);

  const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  const handleConfirm = async () => {
    if (!service || !date || !slot) return;
    setBooking(true); setError('');
    try {
      // Send raw "YYYY-MM-DD" + "HH:MM" — backend anchors them to IST explicitly,
      // so the stored time no longer depends on the server's local timezone.
      const order = await paymentAPI.createOrder({
        mentorId, date, time: slot,
        topic: service.label, durationMin: service.durationMin, serviceId: service.id,
      });

      if (order.free) {
        setStep(3);
        onBooked?.(order.session);
      } else {
        await loadRazorpay();
        const rzp = new window.Razorpay({
          key: order.keyId, amount: order.amount, currency: order.currency,
          name: 'Atyant', description: `${service.label} with ${mentorName}`,
          order_id: order.orderId,
          handler: async (resp) => {
            try {
              await paymentAPI.verify({
                sessionId: order.sessionId,
                razorpay_order_id:  resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              });
              setStep(3); setBooking(false);
              onBooked?.();
            } catch (e) {
              setError('Payment verified but confirmation failed. Contact support.');
              setBooking(false);
            }
          },
          prefill: {}, theme: { color: '#7567C9' },
          modal: { ondismiss: () => setBooking(false) },
        });
        rzp.open();
      }
    } catch (e) {
      setError(e.message || 'Booking failed — please try again.');
      setBooking(false);
    }
  };

  return (
    <>
      <BookingStyles />
      {/* Overlay */}
      <div onClick={step < 3 ? onClose : undefined}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        {/* Modal card */}
        <div onClick={e => e.stopPropagation()}
          style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", position: "relative" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar src={mentorPic} name={mentorName} size={36} bg="7567c9" />
              <div>
                <div style={{ fontWeight: 700, fontSize: ".88rem", color: C.text }}>Book with {mentorName}</div>
                <div style={{ fontSize: ".68rem", color: C.textMuted, marginTop: 1 }}>Session booking</div>
              </div>
            </div>
            <button onClick={onClose}
              style={{ background: C.active, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "5px 6px", color: C.textMuted, cursor: "pointer", display: "flex" }}>
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 20px 24px" }}>
            {step < 3 && <StepBar step={step} />}
            {step === 0 && (
              <ServiceStep services={services} selected={service} onSelect={setService}
                onNext={() => setStep(1)} />
            )}
            {step === 1 && (
              <ScheduleStep mentorId={mentorId} service={service} availability={availability}
                onDateSlot={(d, s) => { setDate(d); setSlot(s); setStep(2); }}
                onBack={() => setStep(0)} />
            )}
            {step === 2 && (
              <ConfirmStep service={service} date={date} slot={slot}
                mentorName={mentorName} mentorPic={mentorPic}
                booking={booking} error={error}
                onBack={() => { setError(''); setStep(1); }}
                onConfirm={handleConfirm} />
            )}
            {step === 3 && (
              <>
                <SuccessStep service={service} date={date} slot={slot} />
                <button onClick={onClose}
                  style={{ marginTop: 20, width: "100%", background: C.accent, border: "none", borderRadius: 12, padding: "11px 20px", color: "#fff", fontWeight: 700, fontSize: ".88rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
