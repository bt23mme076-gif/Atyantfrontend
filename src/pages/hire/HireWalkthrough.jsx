// Auto-playing product demo for the /hire landing: JD → share link → AI
// interview → ranked shortlist. Each step's progress bar is a CSS animation;
// when it ends the next scene plays. Hover or scrolling away pauses it, and
// with reduced motion the steps only change on click.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Briefcase, Check, Copy, FileText, Globe, Link2, ListOrdered, Mic, MousePointer2 } from "lucide-react";
import { FaLinkedin, FaWhatsapp } from "react-icons/fa6";
import { Avatar, CountUp, ScoreRing, VoiceOrb, Waveform } from "./HireFx";
import { useTypewriter } from "./hireMotion";
import { toneColor } from "./hireUtils";

const EASE = [0.22, 1, 0.36, 1];

const STEPS = [
  { Icon: FileText, t: "Paste your JD", d: "We pull out the skills to test. Add up to 3 questions every candidate must answer.", ms: 6200, url: "atyant.in/hire" },
  { Icon: Link2, t: "Share one link", d: "LinkedIn, WhatsApp groups, Internshala, your careers page. Anyone can apply.", ms: 5600, url: "atyant.in/hire/jobs/backend-intern" },
  { Icon: Mic, t: "AI interviews everyone", d: "A 15-minute voice interview on their resume and your JD, from any phone or laptop.", ms: 6400, url: "atyant.in/hire/i/backend-intern-7k2q" },
  { Icon: ListOrdered, t: "Get a ranked shortlist", d: "Scores, a hire verdict and quotes from every answer. Call only the best.", ms: 6800, url: "atyant.in/hire/jobs/backend-intern" },
];

const JD = "We're hiring a Backend Engineering Intern to build APIs in Node.js and PostgreSQL, design reliable services, and own features end to end. You know REST, SQL and Git, and you can debug production issues calmly.";
const SKILLS = ["Node.js", "PostgreSQL", "REST APIs", "System design", "Debugging", "Ownership"];

function SceneJD() {
  const typed = useTypewriter(JD, 13, 250);
  const done = typed.length === JD.length;
  return (
    <div className="hr-scene">
      <div className="hr-doc" style={{ flex: 1.3, minWidth: 0 }}>
        <div className="hr-row" style={{ gap: 8, marginBottom: 10 }}>
          <span className="hr-icon-badge" style={{ width: 30, height: 30, borderRadius: 9 }}><FileText size={15} /></span>
          <b style={{ fontSize: ".86rem" }}>Backend Engineering Intern</b>
          <span className="hr-sp" />
          <span className="hr-pill purple">JD</span>
        </div>
        <div className="hr-doc-text">{typed}{!done && <span className="hr-caret" />}</div>
        {!done && <span className="hr-scan" />}
      </div>
      <div className="hr-col" style={{ flex: 1, minWidth: 0, gap: 12 }}>
        <div className="hr-doc" style={{ background: "var(--c-card)" }}>
          <div className="hr-row" style={{ gap: 6, marginBottom: 10 }}>
            <span className="hr-eyebrow" style={{ fontSize: ".66rem" }}>Skills we'll test</span>
            <span className="hr-sp" />
            <motion.span className="hr-pill green" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.4 }}>
              <Check size={11} /> 6 found
            </motion.span>
          </div>
          <div className="hr-row wrap" style={{ gap: 6 }}>
            {SKILLS.map((s, i) => (
              <motion.span key={s} className="hr-skill" initial={{ opacity: 0, y: 10, scale: 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.32, type: "spring", stiffness: 420, damping: 20 }}>{s}</motion.span>
            ))}
          </div>
        </div>
        <motion.div className="hr-doc" style={{ background: "var(--c-card)" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.6, ease: EASE, duration: 0.6 }}>
          <span className="hr-eyebrow" style={{ fontSize: ".66rem" }}>Your must-ask question</span>
          <div className="hr-turn-c" style={{ marginTop: 8, fontSize: ".84rem" }}>Why do you want to work at an early-stage startup?</div>
        </motion.div>
      </div>
    </div>
  );
}

const CHANNELS = [
  { Icon: FaLinkedin, label: "LinkedIn", n: 124, color: "#0A66C2" },
  { Icon: FaWhatsapp, label: "WhatsApp groups", n: 87, color: "#25D366" },
  { Icon: Briefcase, label: "Internshala", n: 64, color: "#7567C9" },
  { Icon: Globe, label: "Careers page", n: 37, color: "#B8641A" },
];

function SceneShare() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="hr-scene" style={{ flexDirection: "column" }}>
      <div className="hr-col" style={{ gap: 8 }}>
        <div className="hr-row" style={{ gap: 8 }}>
          <span className="hr-pill green" style={{ paddingLeft: 8 }}><span className="hr-dot pulse" />Live</span>
          <b style={{ fontSize: ".9rem" }}>Your interview link</b>
        </div>
        <div className="hr-linkbox" style={{ position: "relative" }}>
          <code>atyant.in/hire/i/backend-intern-7k2q</code>
          <motion.span className="hr-btn sm primary" style={{ pointerEvents: "none" }}
            animate={copied ? { scale: [1, 0.92, 1.05, 1] } : {}} transition={{ duration: 0.4 }}>
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
          </motion.span>
          <motion.span style={{ position: "absolute", color: "var(--c-text)", pointerEvents: "none" }}
            initial={{ right: 160, top: 60, opacity: 0 }} animate={{ right: 30, top: 18, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, delay: 0.3, ease: EASE, times: [0, 0.2, 0.85, 1] }}
            onAnimationComplete={() => setCopied(true)}>
            <MousePointer2 size={20} fill="currentColor" />
          </motion.span>
        </div>
      </div>
      <div className="hr-grid c2" style={{ gap: 10 }}>
        {CHANNELS.map(({ Icon, label, n, color }, i) => (
          <motion.div key={label} className="hr-doc" style={{ background: "var(--c-card)", display: "flex", alignItems: "center", gap: 10, padding: 12 }}
            initial={{ opacity: 0, y: 20, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.4 + i * 0.22, ease: EASE, duration: 0.6 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: `${color}1f`, color }}><Icon size={17} /></span>
            <div className="hr-col" style={{ gap: 0, flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: ".84rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</b>
              <span className="hr-muted" style={{ fontSize: ".74rem" }}>applicants</span>
            </div>
            <b style={{ fontFamily: "var(--font-body)", fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-.03em" }}>+<CountUp value={n} duration={2.4} delay={1.6 + i * 0.22} /></b>
          </motion.div>
        ))}
      </div>
      <motion.div className="hr-row" style={{ justifyContent: "center", gap: 12, marginTop: "auto" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
        <div className="hr-row" style={{ gap: 0 }}>
          {["Priya Sharma", "Arjun Mehta", "Sneha Iyer", "Rahul Verma", "Karan Singh"].map((n, i) => (
            <motion.span key={n} style={{ marginLeft: i ? -8 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--c-card)", display: "inline-flex" }}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2 + i * 0.12, type: "spring", stiffness: 500, damping: 18 }}>
              <Avatar name={n} size={30} />
            </motion.span>
          ))}
        </div>
        <span style={{ fontSize: ".95rem" }}><b style={{ fontFamily: "var(--font-body)", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-.03em" }}><CountUp value={312} duration={3} delay={1.6} /></b> <span className="hr-muted">applied overnight</span></span>
      </motion.div>
    </div>
  );
}

const QUESTION = "You wrote that you cut API latency by 40%. Walk me through how you measured that, and what you changed first.";

function SceneInterview() {
  const typed = useTypewriter(QUESTION, 26, 500);
  return (
    <div className="hr-scene">
      <div className="hr-call" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 18, gap: 16, minWidth: 0 }}>
        <div className="hr-row" style={{ position: "absolute", top: 14, left: 16, gap: 10 }}>
          <span className="hr-rec">LIVE</span>
          <span style={{ fontSize: ".76rem", color: "#B9B2D4", fontVariantNumeric: "tabular-nums" }}>07:42 / 15:00</span>
        </div>
        <div className="hr-call-self">
          <div className="hr-col" style={{ alignItems: "center", gap: 6 }}>
            <Avatar name="Priya Sharma" size={30} />
            <Waveform bars={9} className="warm" style={{ height: 14 }} />
          </div>
        </div>
        <VoiceOrb size={150} />
        <div className="hr-col" style={{ alignItems: "center", gap: 4 }}>
          <b style={{ fontSize: ".9rem" }}>AI interviewer</b>
          <span style={{ fontSize: ".76rem", color: "#B9B2D4" }}>Speaking · question 4 of 9</span>
        </div>
        <div className="hr-call-cap" style={{ maxWidth: 520, minHeight: 48 }}>
          <b>Interviewer</b>{typed}<span className="hr-caret" style={{ background: "#C9BFFF" }} />
        </div>
      </div>
      <div className="hr-col hide-sm" style={{ width: 190, gap: 10, flexShrink: 0 }}>
        {[
          ["Resume claim", "Testing “40% faster APIs”", "purple"],
          ["Skill", "PostgreSQL · indexing", "purple"],
          ["Integrity", "0 tab switches", "green"],
          ["Camera", "On", "green"],
        ].map(([k, v, tone], i) => (
          <motion.div key={k} className="hr-doc" style={{ background: "var(--c-card)", padding: 12 }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.25, ease: EASE, duration: 0.6 }}>
            <span className="hr-eyebrow" style={{ fontSize: ".62rem" }}>{k}</span>
            <div style={{ marginTop: 6 }}><span className={`hr-pill ${tone}`}>{v}</span></div>
          </motion.div>
        ))}
        <motion.div className="hr-doc" style={{ background: "var(--c-card)", padding: 12 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
          <b style={{ fontFamily: "var(--font-body)", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.03em" }}><CountUp value={14} duration={1.5} delay={1.8} /></b>
          <div className="hr-muted" style={{ fontSize: ".74rem" }}>interviews running right now</div>
        </motion.div>
      </div>
    </div>
  );
}

const BOARD = [
  { name: "Priya Sharma", score: 91, v: "Strong yes", tone: "green" },
  { name: "Arjun Mehta", score: 84, v: "Yes", tone: "green" },
  { name: "Sneha Iyer", score: 78, v: "Yes", tone: "green" },
  { name: "Rahul Verma", score: 63, v: "Maybe", tone: "amber" },
  { name: "Karan Singh", score: 41, v: "No", tone: "red" },
];

function SceneRanked() {
  return (
    <div className="hr-scene">
      <div className="hr-col" style={{ flex: 1.25, gap: 8, minWidth: 0 }}>
        <div className="hr-row" style={{ gap: 8, marginBottom: 2 }}>
          <b style={{ fontSize: ".9rem" }}>Ranked shortlist</b>
          <span className="hr-sp" />
          <span className="hr-muted" style={{ fontSize: ".74rem" }}>312 applied · 268 interviewed</span>
        </div>
        {BOARD.map((c, i) => (
          <motion.div key={c.name} className={`hr-board-row ${i === 0 ? "lead" : ""}`}
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.16, ease: EASE, duration: 0.6 }}>
            <span className={`hr-rank ${i < 3 ? `r${i + 1}` : ""}`}>{i + 1}</span>
            <Avatar name={c.name} size={28} />
            <b style={{ fontSize: ".84rem", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</b>
            <span className="hr-minibar hide-sm" style={{ width: 52, height: 6, borderRadius: 3, background: "var(--c-active)", overflow: "hidden", display: "inline-block" }}>
              <motion.i style={{ display: "block", height: "100%", borderRadius: 3, background: `linear-gradient(90deg,#7567C9,${toneColor(c.score)})` }}
                initial={{ width: 0 }} animate={{ width: `${c.score}%` }} transition={{ delay: 0.6 + i * 0.16, duration: 1, ease: EASE }} />
            </span>
            <b style={{ fontVariantNumeric: "tabular-nums", minWidth: 24, textAlign: "right", color: toneColor(c.score) }}><CountUp value={c.score} duration={1.2} delay={0.5 + i * 0.16} /></b>
            <span className={`hr-pill ${c.tone}`} style={{ minWidth: 0 }}>{c.v}</span>
          </motion.div>
        ))}
      </div>
      <motion.div className="hr-doc hr-col" style={{ flex: 1, background: "var(--c-card)", gap: 12, minWidth: 0 }}
        initial={{ opacity: 0, y: 24, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 1.4, ease: EASE, duration: 0.8 }}>
        <div className="hr-row" style={{ gap: 12 }}>
          <ScoreRing value={91} size={86} stroke={8} label="" delay={1.6} />
          <div className="hr-col" style={{ gap: 6, minWidth: 0 }}>
            <b style={{ fontSize: ".92rem" }}>Priya Sharma</b>
            <div className="hr-row wrap" style={{ gap: 4 }}><span className="hr-pill green">Strong yes</span><span className="hr-pill purple">Top 3%</span></div>
          </div>
        </div>
        <div className="hr-ev green hide-sm" style={{ padding: "10px 12px" }}>
          <b style={{ fontSize: ".8rem" }}>Measured before optimising</b>
          <div className="hr-quote" style={{ fontSize: ".78rem" }}>“I logged p95 per route with pg_stat_statements, then added a composite index on the orders lookup.”</div>
        </div>
        <div className="hr-row wrap" style={{ gap: 6 }}>
          <span className="hr-pill green"><Check size={11} /> 3 resume claims held up</span>
          <span className="hr-pill gray">0 tab switches</span>
        </div>
      </motion.div>
    </div>
  );
}

const SCENES = [SceneJD, SceneShare, SceneInterview, SceneRanked];

export default function HireWalkthrough() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [hover, setHover] = useState(false);
  const Scene = SCENES[step];
  const tabsRef = useRef(null);

  // On narrow screens the steps scroll sideways; keep the playing one in view.
  useEffect(() => {
    const list = tabsRef.current;
    const tab = list?.children[step];
    if (list && tab && list.scrollWidth > list.clientWidth) list.scrollTo({ left: tab.offsetLeft - list.offsetLeft - 8, behavior: "smooth" });
  }, [step]);

  return (
    <div ref={ref} className={`hr-walk ${!inView || hover ? "paused" : ""} ${reduce ? "manual" : ""}`}>
      <div ref={tabsRef} className="hr-walk-steps" role="tablist" aria-label="How Atyant Hire works">
        {STEPS.map(({ Icon, t, d, ms }, i) => (
          <button key={t} role="tab" aria-selected={step === i} className={`hr-walk-step ${step === i ? "on" : ""}`} onClick={() => setStep(i)}>
            <span className="hr-icon-badge"><Icon size={18} /></span>
            <span className="hr-col" style={{ gap: 0, minWidth: 0 }}>
              <span className="hr-muted" style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".06em" }}>STEP {i + 1}</span>
              <b style={{ fontSize: ".95rem" }}>{t}</b>
              <p>{d}</p>
            </span>
            <span className="hr-walk-prog" style={{ "--dur": `${ms}ms` }}>
              <i key={`${i}-${step}`} onAnimationEnd={() => setStep((i + 1) % STEPS.length)} />
            </span>
          </button>
        ))}
      </div>
      <div className="hr-screen" onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)} onPointerLeave={() => setHover(false)}>
        <div className="hr-screen-bar">
          <span className="dots"><i /><i /><i /></span>
          <span className="hr-screen-url">{STEPS[step].url}</span>
          <span className="hr-pill gray hide-sm" style={{ fontSize: ".66rem" }}>Sample data</span>
        </div>
        <div className="hr-screen-body">
          <AnimatePresence mode="wait">
            <motion.div key={step} style={{ position: "absolute", inset: 0 }}
              initial={{ opacity: 0, y: 18, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: EASE }}>
              <Scene />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
