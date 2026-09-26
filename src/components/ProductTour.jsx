import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// First-visit guided walkthrough. Each step points at an element tagged with
// `data-tour="<target>"`; steps whose target isn't on the page (e.g. mentor-only
// items for students) are dropped when the tour starts. Steps with no target
// render as a centered card.

const TOUR_STORAGE_KEY = "atyant_tour_done_v1";

// Kept to 7 steps at most: only the features people come here for.
// Mock interview and Find jobs point at the cards under the search box on the home page.
const TOUR_STEPS = [
  { title: "Welcome to Atyant", body: "A quick 30-second look at the main things you can do here. You can skip anytime." },
  { target: "new-chat", sidebar: true, title: "New chat", body: "Start a fresh conversation whenever you have a new question about careers, placements or prep." },
  { target: "nav-ask", sidebar: true, title: "Ask Atyant", body: "Ask anything about careers, placements or prep. Answers come from real seniors who've been where you are." },
  { target: "nav-clarity", sidebar: true, title: "Clarity results", body: "Your full answer, plus seniors who match your branch, CGPA and goals, whom you can talk to one-on-one." },
  { target: "home-mock", placement: "top", title: "Mock interview", body: "Practice a live video interview built from your resume and the job description, with feedback on every answer." },
  { target: "home-jobs", placement: "top", title: "Find jobs", body: "Internships and fresher roles matched to your profile and skills." },
  { target: "nav-track", sidebar: true, title: "Mentor dashboard", body: "Your sessions, earnings and the students you're helping." },
  { title: "You're all set", body: "Start by asking your first question. You can replay this tour from the ? button at the top." },
];

const PAD = 6;          // spotlight padding around the target
const GAP = 14;         // space between spotlight and tooltip
const MARGIN = 12;      // min distance from viewport edge

const findTarget = (t) => (t ? document.querySelector(`[data-tour="${t}"]`) : null);

// Mount only while the tour is running — the step list is resolved against the DOM on mount.
export default function ProductTour({ onClose, onStepChange }) {
  const [steps] = useState(() => TOUR_STEPS.filter(s => !s.target || findTarget(s.target)));
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  const tipRef = useRef(null);

  const step = steps[index];

  useEffect(() => {
    if (step) onStepChange?.(step);
  }, [step, onStepChange]);

  // Track the target's rect every frame — cheap, and survives sidebar slide-in,
  // scroll, resize and layout shifts without wiring up a dozen observers.
  useEffect(() => {
    if (!step) return;
    let raf;
    const el = findTarget(step.target);
    if (el) el.scrollIntoView({ block: "nearest", inline: "nearest" });
    const tick = () => {
      const node = findTarget(step.target);
      if (node) {
        const r = node.getBoundingClientRect();
        setRect(prev => (prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height)
          ? prev : { top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(prev => (prev === null ? prev : null));
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [step]);

  // Place the tooltip: right → bottom → top → left of the spotlight, clamped to the viewport.
  useLayoutEffect(() => {
    const tip = tipRef.current;
    if (!tip) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    if (!rect) {
      setPos({ top: (vh - th) / 2, left: (vw - tw) / 2 });
      return;
    }
    const s = { top: rect.top - PAD, left: rect.left - PAD, right: rect.left + rect.width + PAD, bottom: rect.top + rect.height + PAD };
    const cy = clamp(rect.top + rect.height / 2 - th / 2, MARGIN, vh - th - MARGIN);
    const cx = clamp(rect.left + rect.width / 2 - tw / 2, MARGIN, vw - tw - MARGIN);
    const fits = {
      right: s.right + GAP + tw + MARGIN <= vw && { top: cy, left: s.right + GAP },
      bottom: s.bottom + GAP + th + MARGIN <= vh && { top: s.bottom + GAP, left: cx },
      top: s.top - GAP - th >= MARGIN && { top: s.top - GAP - th, left: cx },
      left: s.left - GAP - tw >= MARGIN && { top: cy, left: s.left - GAP - tw },
    };
    // A step can ask for a side first (e.g. "top" for the home cards); otherwise right → bottom → top → left.
    const order = [step?.placement, "right", "bottom", "top", "left"].filter(Boolean);
    const p = order.map(k => fits[k]).find(Boolean) || { top: vh - th - MARGIN, left: cx };
    setPos(p);
  }, [rect, step]);

  const finish = useCallback(() => {
    try { localStorage.setItem(TOUR_STORAGE_KEY, "1"); } catch { /* ignore */ }
    onClose?.();
  }, [onClose]);
  const next = useCallback(() => {
    if (index >= steps.length - 1) finish(); else setIndex(i => i + 1);
  }, [index, steps.length, finish]);
  const back = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, finish]);

  if (!step) return null;

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="atyant-tour-title"
      style={{ position: "fixed", inset: 0, zIndex: 10000, fontFamily: "var(--font-body)" }}>
      {/* Click shield — the page is inert while the tour runs */}
      <div style={{ position: "absolute", inset: 0, background: rect ? "transparent" : "rgba(8,6,20,0.62)" }} />

      {/* Spotlight: a hole punched by a giant box-shadow */}
      {rect && (
        <div style={{
          position: "fixed",
          top: rect.top - PAD, left: rect.left - PAD,
          width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          borderRadius: 12,
          boxShadow: "0 0 0 9999px rgba(8,6,20,0.62), 0 0 0 2px #7567C9",
          background: "rgba(255,255,255,0.04)",
          pointerEvents: "none",
          transition: "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease",
        }} />
      )}

      {/* Tooltip card */}
      <div ref={tipRef} key={index}
        style={{
          position: "fixed", top: pos.top, left: pos.left,
          width: "min(320px, calc(100vw - 24px))", boxSizing: "border-box",
          background: "var(--c-card)", color: "var(--c-text)",
          border: "1px solid var(--c-cardBorder)", borderRadius: 12,
          padding: "18px 18px 14px",
          boxShadow: "0 24px 60px -12px rgba(0,0,0,0.5)",
          animation: "atyantTourIn 0.22s ease",
        }}>
        <button onClick={finish} aria-label="Close tour"
          style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", color: "var(--c-textMuted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
          <X size={16} />
        </button>

        <div id="atyant-tour-title" style={{ fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.3, paddingRight: 24, marginBottom: 8 }}>{step.title}</div>
        <div style={{ fontSize: "0.88rem", lineHeight: 1.55, color: "var(--c-textSub)" }}>{step.body}</div>

        {/* Progress bar */}
        <div style={{ height: 3, borderRadius: 3, background: "var(--c-active)", marginTop: 16, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((index + 1) / steps.length) * 100}%`, background: "#7567C9", transition: "width 0.3s ease" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
          <span style={{ fontSize: "0.78rem", color: "var(--c-textMuted)" }}>{index + 1} of {steps.length}</span>
          <div style={{ display: "flex", gap: 8 }}>
            {isFirst ? (
              <button onClick={finish} style={btn(false)}>Skip</button>
            ) : (
              <button onClick={back} style={btn(false)}>Back</button>
            )}
            <button onClick={next} autoFocus style={btn(true)}>
              {isFirst ? "Start tour" : isLast ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes atyantTourIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }`}</style>
    </div>
  );
}

ProductTour.storageKey = TOUR_STORAGE_KEY;

const btn = (primary) => ({
  padding: "7px 14px",
  borderRadius: 8,
  border: primary ? "1px solid #7567C9" : "1px solid var(--c-cardBorder)",
  background: primary ? "#7567C9" : "transparent",
  color: primary ? "#fff" : "var(--c-text)",
  fontSize: "0.82rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
});
