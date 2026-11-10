// Visual building blocks for the Atyant Hire pages: animated backgrounds,
// reveal-on-scroll, counters, score ring, radar chart, voice orb, confetti.
// Everything respects prefers-reduced-motion (framer-motion via MotionConfig
// reducedMotion="user" in HirePage, CSS via the media query in hire.css).

import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { toneColor } from "./hireUtils";

const EASE = [0.22, 1, 0.36, 1];

// Stable pseudo-random in [0, 1) so render stays pure.
const rand = (i, salt = 1) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function Aurora({ grid = true, className = "" }) {
  return (
    <div className={`hr-aurora ${className}`} aria-hidden="true">
      <i /><i /><i />
      {grid && <span className="hr-gridbg" />}
    </div>
  );
}

// Drifting constellation that reaches toward the pointer. Paused off-screen and
// in background tabs; not rendered at all with reduced motion.
export function Particles({ max = 70 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return undefined;
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const pts = [];
    const mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0, raf = 0, visible = true;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const want = Math.round(Math.min(max, (w * h) / 13000));
      while (pts.length < want) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.6 + 0.5 });
      pts.length = want;
    };
    resize();

    const LINK = 120;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const rgb = document.documentElement.classList.contains("dark") ? "169,156,236" : "117,103,201";
      for (const p of pts) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140 && d2 > 1) { const f = (1 - Math.sqrt(d2) / 140) * 0.6; p.x += (dx / Math.sqrt(d2)) * f; p.y += (dy / Math.sqrt(d2)) * f; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.strokeStyle = `rgba(${rgb},${(1 - Math.sqrt(d2) / LINK) * 0.22})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < 170) {
          ctx.strokeStyle = `rgba(228,178,122,${(1 - md / 170) * 0.5})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = `rgba(${rgb},.6)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const run = () => { cancelAnimationFrame(raf); if (visible && !document.hidden) raf = requestAnimationFrame(tick); };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const onMove = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", run);
    run();
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", run);
    };
  }, [reduce, max]);

  if (reduce) return null;
  return <canvas ref={ref} className="hr-particles" aria-hidden="true" />;
}

export function Reveal({ children, delay = 0, y = 26, x = 0, scale = 1, className, style, as = "div", once = true }) {
  const M = motion[as];
  return (
    <M className={className} style={style}
      initial={{ opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}>
      {children}
    </M>
  );
}


const fmtIN = (n) => Math.round(n).toLocaleString("en-IN");

export function CountUp({ value, duration = 1.4, format = fmtIN, className, style, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!inView || typeof value !== "number") return undefined;
    if (reduce) { from.current = value; return undefined; }
    const controls = animate(from.current, value, { duration, delay, ease: EASE, onUpdate: setShown });
    from.current = value;
    return () => controls.stop();
  }, [inView, value, reduce, duration, delay]);

  return <span ref={ref} className={className} style={style}>{typeof value === "number" ? format(reduce ? value : shown) : value}</span>;
}


export function ScoreRing({ value, size = 120, stroke = 10, label = "out of 100", delay = 0, fontSize }) {
  const raw = useId();
  const id = `hrg${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  const end = toneColor(value);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", overflow: "visible" }} aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7567C9" />
            <stop offset="1" stopColor={value == null ? "#7567C9" : end} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-active)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, delay, ease: EASE }}
          style={{ filter: `drop-shadow(0 0 ${stroke * 0.6}px rgba(117,103,201,.45))` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        <span style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: fontSize || size * 0.3, letterSpacing: "-.04em", fontVariantNumeric: "tabular-nums" }}>
          {value == null ? "—" : <CountUp value={Math.round(value)} duration={1.6} delay={delay} />}
        </span>
        {label && <span style={{ fontSize: Math.max(10, size * 0.085), color: "var(--c-textMuted)", fontWeight: 600, marginTop: 4 }}>{label}</span>}
      </div>
    </div>
  );
}

// Hexagon-style radar for the six interview dimensions (0..100 each).
export function Radar({ data, size = 260 }) {
  const n = data.length;
  const padX = 84, padY = 26;
  const vbW = size + padX * 2, vbH = size + padY * 2;
  const cx = vbW / 2, cy = vbH / 2, R = size / 2 - 6;
  const at = (i, v) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v];
  };
  const poly = (v) => data.map((_, i) => at(i, v).join(",")).join(" ");
  const shape = data.map((d, i) => at(i, Math.max(0.04, (d.value || 0) / 100)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: "100%", maxWidth: vbW * 1.15, height: "auto", overflow: "visible", display: "block", margin: "0 auto" }} role="img"
      aria-label={data.map(d => `${d.label} ${d.value}`).join(", ")}>
      <defs>
        <linearGradient id="hr-radar-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7567C9" stopOpacity=".55" />
          <stop offset="1" stopColor="#E4B27A" stopOpacity=".4" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(v => <polygon key={v} points={poly(v)} fill="none" stroke="var(--c-cardBorder)" strokeWidth="1" />)}
      {data.map((_, i) => { const [x, y] = at(i, 1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--c-cardBorder)" strokeWidth="1" />; })}
      <motion.polygon points={shape} fill="url(#hr-radar-fill)" stroke="#7567C9" strokeWidth="2" strokeLinejoin="round"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.15 }} />
      {data.map((d, i) => {
        const [x, y] = at(i, Math.max(0.04, (d.value || 0) / 100));
        return (
          <motion.circle key={d.label} cx={x} cy={y} r="4" fill="#fff" stroke="#7567C9" strokeWidth="2"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.9 + i * 0.06 }} />
        );
      })}
      {data.map((d, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const [x, y] = at(i, 1);
        const lx = x + Math.cos(a) * 14, ly = y + Math.sin(a) * 14;
        const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        return (
          <text key={d.label} x={lx} y={ly + (Math.sin(a) > 0.5 ? 10 : Math.sin(a) < -0.5 ? -4 : 4)} textAnchor={anchor}
            style={{ fontSize: 12, fontWeight: 600, fill: "var(--c-textSub)", fontFamily: "var(--font-body)" }}>
            {d.label} <tspan style={{ fill: "var(--c-accentText)", fontWeight: 800 }}>{d.value}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

export function Waveform({ bars = 24, className = "", style }) {
  return (
    <span className={`hr-wave ${className}`} style={style} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => <i key={i} style={{ "--i": i, "--h": `${35 + Math.round(rand(i, 3) * 65)}%` }} />)}
    </span>
  );
}

export function VoiceOrb({ size = 120, idle = false }) {
  return (
    <div className={`hr-orb ${idle ? "idle" : ""}`} style={{ "--s": `${size}px` }} aria-hidden="true">
      <span className="hr-orb-ring" /><span className="hr-orb-ring r2" /><span className="hr-orb-ring r3" />
      <span className="hr-orb-halo" />
      <span className="hr-orb-core"><Waveform bars={5} className={idle ? "still" : ""} /></span>
    </div>
  );
}

export function GlowCard({ as: Tag = "div", className = "", children, ...rest }) {
  const onPointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return <Tag className={`hr-glowcard ${className}`} onPointerMove={onPointerMove} {...rest}>{children}</Tag>;
}

// 3D tilt toward the pointer (mouse/pen only).
export function Tilt({ children, max = 8, className, style }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), { stiffness: 140, damping: 18 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), { stiffness: 140, damping: 18 });
  const onPointerMove = (e) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => { x.set(0); y.set(0); };
  return (
    <motion.div className={className} onPointerMove={onPointerMove} onPointerLeave={reset}
      style={{ ...style, rotateX, rotateY, transformPerspective: 1200, transformStyle: "preserve-3d" }}>
      {children}
    </motion.div>
  );
}

const BRAND = ["#7567C9", "#A99CEC", "#E4B27A", "#5A4CB0", "#B8641A", "#C9BFFF"];

// One-shot particle burst; remount (change `key`) to fire again.
export function Burst({ count = 18, spread = 70 }) {
  return (
    <span className="hr-burst" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + rand(i, 7) * 0.4;
        const d = spread * (0.55 + rand(i, 9) * 0.6);
        return <i key={i} style={{ "--tx": `${Math.cos(a) * d}px`, "--ty": `${Math.sin(a) * d}px`, "--r": `${Math.round(rand(i, 2) * 540)}deg`, "--c": BRAND[i % BRAND.length] }} />;
      })}
    </span>
  );
}

export function Confetti({ count = 70 }) {
  return (
    <div className="hr-confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i key={i} style={{
          "--x": `${rand(i, 1) * 100}%`, "--w": `${6 + rand(i, 4) * 6}px`, "--c": BRAND[i % BRAND.length],
          "--t": `${2.4 + rand(i, 5) * 2}s`, "--dl": `${rand(i, 6) * 0.8}s`, "--dx": `${(rand(i, 8) - 0.5) * 220}px`, "--r": `${Math.round(rand(i, 2) * 900)}deg`,
        }} />
      ))}
    </div>
  );
}

export function Marquee({ items, duration = 38 }) {
  const all = [...items, ...items];
  return (
    <div className="hr-marquee" style={{ "--dur": `${duration}s` }}>
      <div className="hr-marquee-track">
        {all.map(({ Icon, label }, i) => (
          <span key={i} className="hr-marquee-item" aria-hidden={i >= items.length || undefined}>{Icon && <Icon size={16} />}{label}</span>
        ))}
      </div>
    </div>
  );
}

const AVA_GRADS = [
  "linear-gradient(135deg,#7567C9,#5A4CB0)", "linear-gradient(135deg,#A99CEC,#7567C9)", "linear-gradient(135deg,#E4B27A,#B8641A)",
  "linear-gradient(135deg,#5A4CB0,#2E2470)", "linear-gradient(135deg,#C9BFFF,#7567C9)", "linear-gradient(135deg,#B8641A,#7567C9)",
];
export function Avatar({ name = "?", size = 32 }) {
  const parts = String(name).trim().split(/\s+/);
  const initials = ((parts[0]?.[0] || "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return <span className="hr-ava" style={{ width: size, height: size, fontSize: size * 0.38, background: AVA_GRADS[h % AVA_GRADS.length] }}>{initials}</span>;
}
