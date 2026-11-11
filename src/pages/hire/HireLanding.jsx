// Signed-out /hire: the founder-facing showcase and sign-up.

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, BadgeCheck, Camera, Check, CheckCircle2, Clock, FileText, Globe, MessageSquareQuote, MonitorX,
  Moon, Play, Quote, Send, ShieldCheck, Smartphone, Sparkles, Target, Zap, Briefcase, GraduationCap, Users,
} from "lucide-react";
import { FaWhatsapp, FaLinkedin } from "react-icons/fa6";
import { HireAuth } from "./HireShared";
import HireWalkthrough from "./HireWalkthrough";
import {
  Aurora, Avatar, CountUp, GlowCard, Marquee, Particles, Radar, Reveal, ScoreRing, Tilt, VoiceOrb, Waveform,
} from "./HireFx";
import { rise, stagger } from "./hireMotion";

const EASE = [0.22, 1, 0.36, 1];

// ── Hero visual: floating report, live call and shortlist cards ────────────

function HeroStack() {
  const skills = [["Node.js", 92, "Strong"], ["PostgreSQL", 86, "Strong"], ["System design", 68, "Adequate"]];
  return (
    <Tilt className="hr-stack" max={7}>
      <div className="hr-stack-inner">
        {/* Live interview card (back) */}
        <motion.div className="hr-float hr-bob d2 hr-f-live" style={{ z: -40 }}
          initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: EASE }}>
          <div className="hr-call" style={{ padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div className="hr-row" style={{ width: "100%", gap: 8 }}>
              <span className="hr-rec">LIVE</span><span className="hr-sp" />
              <span style={{ fontSize: ".72rem", color: "#B9B2D4", fontVariantNumeric: "tabular-nums" }}>06:12</span>
            </div>
            <VoiceOrb size={92} />
            <Waveform bars={16} style={{ height: 18 }} />
            <span style={{ fontSize: ".72rem", color: "#B9B2D4" }}>AI interviewer · Q3 of 9</span>
          </div>
        </motion.div>

        {/* Candidate report (main) */}
        <motion.div className="hr-float main hr-bob hr-f-report" style={{ z: 40 }}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9, ease: EASE }}>
          <div className="hr-row" style={{ gap: 10, marginBottom: 12 }}>
            <Avatar name="Priya Sharma" size={34} />
            <div className="hr-col" style={{ gap: 0, minWidth: 0 }}>
              <b style={{ fontSize: ".9rem" }}>Priya Sharma</b>
              <span className="hr-muted" style={{ fontSize: ".72rem" }}>Backend Engineering Intern</span>
            </div>
            <span className="hr-sp" />
            <span className="hr-pill gray" style={{ fontSize: ".62rem" }}>Sample</span>
          </div>
          <div className="hr-row" style={{ gap: 14, alignItems: "center" }}>
            <ScoreRing value={91} size={96} stroke={9} label="score" delay={0.6} />
            <div className="hr-col" style={{ gap: 6, flex: 1, minWidth: 0 }}>
              <span className="hr-pill green" style={{ alignSelf: "flex-start" }}><BadgeCheck size={12} /> Strong yes</span>
              <span className="hr-pill purple" style={{ alignSelf: "flex-start" }}>Top 3% of 312</span>
            </div>
          </div>
          <div className="hr-col" style={{ gap: 8, marginTop: 14 }}>
            {skills.map(([s, v, l], i) => (
              <div key={s} className="hr-col" style={{ gap: 4 }}>
                <div className="hr-row" style={{ fontSize: ".76rem" }}><span style={{ flex: 1 }}>{s}</span><b style={{ color: "var(--c-accentText)" }}>{l}</b></div>
                <div className="hr-bar" style={{ height: 6 }}>
                  <motion.i initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ delay: 0.9 + i * 0.15, duration: 1.2, ease: EASE }} />
                </div>
              </div>
            ))}
          </div>
          <div className="hr-quote" style={{ fontSize: ".76rem", marginTop: 12 }}>“I logged p95 per route first, then added a composite index.”</div>
        </motion.div>

        {/* Shortlist (front) */}
        <motion.div className="hr-float hr-bob d1 hr-f-list" style={{ z: 80 }}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.9, ease: EASE }}>
          <div className="hr-row" style={{ marginBottom: 8 }}><b style={{ fontSize: ".8rem" }}>Ranked shortlist</b><span className="hr-sp" /><span className="hr-muted" style={{ fontSize: ".7rem" }}>live</span></div>
          {[["Priya Sharma", 91], ["Arjun Mehta", 84], ["Sneha Iyer", 78]].map(([n, s], i) => (
            <motion.div key={n} className="hr-row" style={{ gap: 8, padding: "6px 0", borderTop: i ? "1px solid var(--c-cardBorder)" : "none" }}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 + i * 0.15 }}>
              <span className={`hr-rank r${i + 1}`} style={{ width: 22, height: 22, fontSize: ".7rem", borderRadius: 7 }}>{i + 1}</span>
              <Avatar name={n} size={22} />
              <span style={{ flex: 1, fontSize: ".8rem", fontWeight: 600 }}>{n}</span>
              <b style={{ fontSize: ".82rem", color: "#16A34A", fontVariantNumeric: "tabular-nums" }}>{s}</b>
            </motion.div>
          ))}
        </motion.div>

        {/* Floating tags */}
        <motion.span className="hr-tag hr-bob d3 hr-f-tag1" style={{ z: 100 }}
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3, type: "spring" }}>
          <FaLinkedin style={{ color: "#0A66C2" }} /> +124 applicants
        </motion.span>
        <motion.span className="hr-tag green hr-bob d1 hr-f-tag2" style={{ z: 120 }}
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5, type: "spring" }}>
          <CheckCircle2 size={15} /> Resume claim held up
        </motion.span>
        <motion.span className="hr-tag warm hr-bob d2 hr-f-tag3" style={{ z: 110 }}
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.7, type: "spring" }}>
          <Moon size={15} /> Interviewed at 1:40 AM
        </motion.span>
      </div>
    </Tilt>
  );
}

function Hero({ onStart }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [wide] = useState(() => window.matchMedia?.("(min-width: 1001px)").matches);
  const words = ["300 applicants.", "One link."];
  return (
    <section ref={ref} style={{ position: "relative" }}>
      <Aurora />
      <Particles />
      <motion.div className="hr-hero" style={wide ? { y, opacity: fade } : undefined}>
        <motion.div className="hr-hero-copy" variants={stagger(0.1, 0.1)} initial="hidden" animate="show">
          <motion.div variants={rise}>
            <a href="#how" className="hr-announce"><b>New</b> AI screening interviews for startups <ArrowRight size={14} /></a>
          </motion.div>
          <h1 className="hr-h1">
            {words.map(w => (
              <motion.span key={w} variants={rise} style={{ display: "inline-block", marginRight: ".25em" }}>{w}</motion.span>
            ))}
            <motion.span variants={rise} style={{ display: "inline-block" }}><em className="hr-grad-text">A ranked shortlist</em></motion.span>{" "}
            <motion.span variants={rise} style={{ display: "inline-block" }}>by tomorrow.</motion.span>
          </h1>
          <motion.p variants={rise} className="hr-sub" style={{ maxWidth: 560 }}>
            Share one interview link. Every applicant takes a 15-minute AI voice interview built from your JD and their resume.
            You get a ranked list with evidence for every score, and spend your time only on the top few.
          </motion.p>
          <motion.div variants={rise} className="hr-hero-cta">
            <button className="hr-btn primary lg glow" onClick={() => onStart("signup")}>Start hiring free <ArrowRight size={17} className="hr-arrow" /></button>
            <a className="hr-btn lg ghost" href="#how"><Play size={15} /> See it work</a>
          </motion.div>
          <motion.div variants={rise} className="hr-hero-trust">
            <span className="hr-chip glass"><Check size={13} /> Free, no card</span>
            <span className="hr-chip glass"><Sparkles size={13} /> Unlimited interviews</span>
            <span className="hr-chip glass"><ShieldCheck size={13} /> Evidence behind every score</span>
          </motion.div>
        </motion.div>
        <HeroStack />
      </motion.div>
    </section>
  );
}

// ── Applicant sieve ─────────────────────────────────────────────────────────

const TOP = new Set([3, 26, 36, 58, 61, 84, 94, 117]);

function Sieve() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [sift, setSift] = useState(false);
  useEffect(() => {
    if (!inView) return undefined;
    const t = setTimeout(() => setSift(true), 1500);
    return () => clearTimeout(t);
  }, [inView]);
  return (
    <div ref={ref} className="hr-card glass" style={{ padding: 0, overflow: "hidden" }}>
      <div className={`hr-sieve ${inView ? "in" : ""} ${sift ? "sift" : ""}`}>
        {Array.from({ length: 120 }, (_, i) => (
          <i key={i} className={TOP.has(i) ? `top ${i === 36 || i === 84 ? "gold" : ""}` : ""} style={{ "--d": `${(i % 15) * 22 + Math.floor(i / 15) * 30}ms` }} />
        ))}
      </div>
      <div className="hr-row" style={{ justifyContent: "space-between", padding: "14px 22px", borderTop: "1px solid var(--c-cardBorder)", flexWrap: "wrap", gap: 8 }}>
        <span className="hr-muted" style={{ fontWeight: 600 }}>{sift ? "Everyone interviewed. Ranked by what they said." : "Applicants coming in…"}</span>
        <motion.span className="hr-pill purple" animate={{ opacity: sift ? 1 : 0.4 }}><Target size={12} /> Top 8 worth a call</motion.span>
      </div>
    </div>
  );
}

function Problem() {
  return (
    <section className="hr-section">
      <div className="hr-grid c2" style={{ gap: 48, alignItems: "center" }}>
        <Reveal className="hr-col" style={{ gap: 18 }}>
          <span className="hr-eyebrow"><Users size={14} /> The problem</span>
          <h2 className="hr-h2">One opening. Hundreds of resumes. <em className="hr-grad-text">Who do you call first?</em></h2>
          <p className="hr-sub">
            Resumes all look the same, and phone screens eat your week. Atyant interviews every applicant for you, anytime,
            and ranks them by what they actually said, not by keywords.
          </p>
          <div className="hr-grid" style={{ gap: 10, marginTop: 8, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {[[15, "min", "per interview"], [0, "₹", "per interview"], [1, "min", "to get your link"]].map(([v, unit, l], i) => (
              <GlowCard key={l} className="hr-card" style={{ padding: 16 }}>
                <div className="hr-stat">
                  <b>{unit === "₹" && "₹"}<CountUp value={v} delay={i * 0.15} />{unit === "min" && <span style={{ fontSize: ".9rem", color: "var(--c-textMuted)", fontWeight: 700, letterSpacing: 0 }}> min</span>}</b>
                  <span>{l}</span>
                </div>
              </GlowCard>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.15}><Sieve /></Reveal>
      </div>
    </section>
  );
}

// ── Report showcase ─────────────────────────────────────────────────────────

const REPORT_POINTS = [
  [Target, "Score out of 100 and a hire verdict"],
  [Zap, "Fit on each skill from your JD"],
  [ShieldCheck, "Which resume claims held up under questioning"],
  [Quote, "Strengths and concerns, each with a quote"],
  [MonitorX, "Red flags and tab-switch count"],
  [MessageSquareQuote, "Questions to ask in your next round"],
];

function ReportShowcase() {
  const dims = [
    { label: "Technical", value: 88 }, { label: "Resume", value: 82 }, { label: "Behavioral", value: 74 },
    { label: "Problem solving", value: 86 }, { label: "Communication", value: 79 }, { label: "Confidence", value: 71 },
  ];
  return (
    <section className="hr-section" style={{ position: "relative" }}>
      <div className="hr-sec-head">
        <Reveal><span className="hr-eyebrow"><Sparkles size={14} /> The report</span></Reveal>
        <Reveal delay={0.05}><h2 className="hr-h2">Every score comes with <em className="hr-grad-text">receipts.</em></h2></Reveal>
        <Reveal delay={0.1}><p className="hr-sub">Each strength and concern links to a quote from the candidate's answer, so you can check it yourself.</p></Reveal>
      </div>
      <div className="hr-grid c2" style={{ gap: 28, alignItems: "center" }}>
        <Reveal scale={0.96}>
          <div className="hr-card hr-gborder pad-lg hr-col" style={{ gap: 18 }}>
            <div className="hr-row wrap" style={{ gap: 16 }}>
              <ScoreRing value={86} size={112} stroke={10} />
              <div className="hr-col" style={{ gap: 6, flex: 1, minWidth: 180 }}>
                <div className="hr-row" style={{ gap: 8 }}><Avatar name="Arjun Mehta" size={30} /><b>Arjun Mehta</b></div>
                <div className="hr-row wrap" style={{ gap: 6 }}><span className="hr-pill green">Strong yes</span><span className="hr-pill purple">Top 6%</span><span className="hr-pill gray">Sample</span></div>
                <span className="hr-muted">Reached 100% of questions · 15 min · 0 tab switches</span>
              </div>
            </div>
            <Radar data={dims} size={250} />
            <div className="hr-col" style={{ gap: 8 }}>
              {[["Built a payments service handling 10k requests a minute", "Held up", "green"], ["Led a team of four on the college fest app", "Shaky", "amber"]].map(([c, o, t], i) => (
                <motion.div key={c} className="hr-row" style={{ alignItems: "flex-start", fontSize: ".85rem" }}
                  initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.15 }}>
                  <span style={{ flex: 1, color: "var(--c-textSub)" }}>{c}</span><span className={`hr-pill ${t}`}>{o}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
        <motion.div className="hr-col" style={{ gap: 12 }} variants={stagger(0.09)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
          {REPORT_POINTS.map(([Icon, t]) => (
            <motion.div key={t} variants={rise}>
              <GlowCard className="hr-card hr-row" style={{ gap: 14, padding: 16 }}>
                <span className="hr-icon-badge"><Icon size={18} /></span>
                <b style={{ fontSize: ".95rem" }}>{t}</b>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Feature bento ───────────────────────────────────────────────────────────

function Bento() {
  return (
    <section className="hr-section">
      <div className="hr-sec-head">
        <Reveal><span className="hr-eyebrow"><Zap size={14} /> Built for small teams</span></Reveal>
        <Reveal delay={0.05}><h2 className="hr-h2">A screening round that runs <em className="hr-grad-text">while you build.</em></h2></Reveal>
      </div>
      <motion.div className="hr-bento" variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
        <motion.div variants={rise} className="w4">
          <GlowCard className="hr-card hr-tile" style={{ height: "100%" }}>
            <span className="hr-icon-badge solid"><FileText size={18} /></span>
            <b style={{ fontSize: "1.05rem" }}>Questions from your JD and their resume</b>
            <p>Every interview is different. We test the skills in your JD and dig into each candidate's own projects.</p>
            <div className="hr-tile-vis" style={{ gap: 6, flexWrap: "wrap", alignContent: "flex-end" }}>
              {["React", "Node.js", "SQL", "System design", "Ownership", "Their payments project", "Their internship at a fintech"].map((s, i) => (
                <motion.span key={s} className={`hr-skill ${i > 4 ? "soft" : ""}`} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.07 }}>{s}</motion.span>
              ))}
            </div>
          </GlowCard>
        </motion.div>
        <motion.div variants={rise}>
          <GlowCard className="hr-card hr-tile" style={{ height: "100%" }}>
            <span className="hr-icon-badge"><ShieldCheck size={18} /></span>
            <b style={{ fontSize: "1.05rem" }}>Resume claims, tested live</b>
            <p>Bold claims get follow-up questions. You see which held up.</p>
            <div className="hr-tile-vis" style={{ flexDirection: "column", alignItems: "stretch", gap: 6, justifyContent: "flex-end" }}>
              {[["“Cut latency 40%”", "Held up", "green"], ["“Led a team of 6”", "Shaky", "amber"], ["“Expert in Kubernetes”", "Couldn't defend", "red"]].map(([c, o, t]) => (
                <div key={c} className="hr-row" style={{ fontSize: ".8rem", gap: 6 }}><span style={{ flex: 1, color: "var(--c-textSub)" }}>{c}</span><span className={`hr-pill ${t}`}>{o}</span></div>
              ))}
            </div>
          </GlowCard>
        </motion.div>
        <motion.div variants={rise}>
          <GlowCard className="hr-card hr-tile" style={{ height: "100%" }}>
            <span className="hr-icon-badge warm"><MessageSquareQuote size={18} /></span>
            <b style={{ fontSize: "1.05rem" }}>Your must-ask questions</b>
            <p>Add up to 3 questions. Every candidate answers them, word for word.</p>
            <div className="hr-tile-vis"><div className="hr-turn-c" style={{ fontSize: ".82rem" }}>Why an early-stage startup over a big company?</div></div>
          </GlowCard>
        </motion.div>
        <motion.div variants={rise}>
          <GlowCard className="hr-card hr-tile" style={{ height: "100%" }}>
            <span className="hr-icon-badge"><Camera size={18} /></span>
            <b style={{ fontSize: "1.05rem" }}>Integrity signals</b>
            <p>Camera status and every tab or app switch are recorded and shown in the report.</p>
            <div className="hr-tile-vis" style={{ gap: 8, flexWrap: "wrap" }}>
              <span className="hr-pill green"><span className="hr-dot pulse" />Camera on</span>
              <span className="hr-pill amber"><MonitorX size={12} /> 2 tab switches</span>
            </div>
          </GlowCard>
        </motion.div>
        <motion.div variants={rise}>
          <GlowCard className="hr-card hr-tile" style={{ height: "100%" }}>
            <span className="hr-icon-badge solid"><Smartphone size={18} /></span>
            <b style={{ fontSize: "1.05rem" }}>Runs around the clock, on any phone</b>
            <p>Candidates interview when it suits them, from a phone or laptop. No scheduling. You wake up to ranked results.</p>
            <div className="hr-tile-vis" style={{ gap: 10, alignItems: "center" }}>
              <VoiceOrb size={64} />
              <Waveform bars={18} style={{ height: 30, flex: 1 }} />
              <span className="hr-chip"><Clock size={13} /> 24/7</span>
            </div>
          </GlowCard>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Pricing ─────────────────────────────────────────────────────────────────

function Pricing({ onStart }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <section id="pricing" className="hr-section" style={{ scrollMarginTop: 70 }}>
      <div className="hr-sec-head">
        <Reveal><span className="hr-eyebrow"><Sparkles size={14} /> Pricing</span></Reveal>
        <Reveal delay={0.05}><h2 className="hr-h2">Free. <em className="hr-grad-text">Every interview, every role.</em></h2></Reveal>
      </div>
      <div ref={ref} className="hr-grid c2" style={{ gap: 24, alignItems: "stretch" }}>
        <Reveal>
          <div className="hr-card hr-gborder pad-lg hr-col" style={{ gap: 16, height: "100%", boxSizing: "border-box" }}>
            <div className="hr-row wrap" style={{ alignItems: "baseline", gap: 10 }}>
              <span className="hr-price">₹<CountUp value={0} duration={1.2} /></span>
              <span className="hr-muted" style={{ fontSize: ".95rem" }}>per interview. No card, no credits, no plan.</span>
            </div>
            <div className="hr-col" style={{ gap: 10 }}>
              {["Unlimited interviews on every role", "Unlimited roles and share links",
                "Ranked report with evidence for every candidate", "WhatsApp alert when a candidate finishes"].map((t, i) => (
                <motion.div key={t} className="hr-row" style={{ fontSize: ".95rem" }} initial={{ opacity: 0, x: -10 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.2 + i * 0.1 }}>
                  <span className="hr-icon-badge solid" style={{ width: 24, height: 24, borderRadius: 7 }}><Check size={13} /></span>{t}
                </motion.div>
              ))}
            </div>
            <div className="hr-sp" />
            <button className="hr-btn primary lg block" onClick={() => onStart("signup")}>Start hiring free <ArrowRight size={16} className="hr-arrow" /></button>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="hr-card pad-lg hr-col" style={{ gap: 18, height: "100%", boxSizing: "border-box" }}>
            <b style={{ fontSize: "1.05rem" }}>Why it's free</b>
            <p className="hr-muted" style={{ margin: 0, lineHeight: 1.6 }}>
              Thousands of students prepare for placements on Atyant every week. Your role gives them a real interview to prepare for,
              and gives you candidates who have already practised. You bring the role, we bring the interviewer.
            </p>
            <div className="hr-ev" style={{ background: "var(--c-active)" }}>
              <div className="hr-row"><Quote size={15} style={{ color: "var(--c-accentText)" }} /><b>Screen 100 applicants overnight, for nothing.</b></div>
              <div className="hr-muted" style={{ marginTop: 6, lineHeight: 1.5 }}>No calendar back-and-forth, and a report with evidence for every one of them.</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

const CHANNELS = [
  { Icon: FaLinkedin, label: "LinkedIn" }, { Icon: FaWhatsapp, label: "WhatsApp groups" }, { Icon: Briefcase, label: "Internshala" },
  { Icon: Globe, label: "Your careers page" }, { Icon: GraduationCap, label: "College placement cells" }, { Icon: Users, label: "Discord and Slack communities" },
  { Icon: Send, label: "Founder posts" }, { Icon: Sparkles, label: "Referrals" },
];

export default function HireLanding({ auth, onStart }) {
  return (
    <>
      <Hero onStart={onStart} />

      <section className="hr-section tight">
        <Reveal><p className="hr-muted" style={{ textAlign: "center", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", margin: "0 0 16px" }}>Share your link anywhere</p></Reveal>
        <Marquee items={CHANNELS} />
      </section>

      <Problem />

      <section id="how" className="hr-section" style={{ scrollMarginTop: 70 }}>
        <div className="hr-sec-head">
          <Reveal><span className="hr-eyebrow"><Play size={14} /> How it works</span></Reveal>
          <Reveal delay={0.05}><h2 className="hr-h2">From JD to shortlist in <em className="hr-grad-text">four steps.</em></h2></Reveal>
          <Reveal delay={0.1}><p className="hr-sub">Set it up in a minute. Candidates take it whenever they like. You only open your laptop for the best ones.</p></Reveal>
        </div>
        <Reveal y={40}><HireWalkthrough /></Reveal>
      </section>

      <ReportShowcase />
      <Bento />
      <Pricing onStart={onStart} />

      <section id="hire-start" className="hr-section" style={{ scrollMarginTop: 70, paddingTop: 40 }}>
        <Reveal y={40}>
          <div className="hr-cta-band">
            <Aurora />
            <div className="hr-col" style={{ gap: 18, position: "relative", zIndex: 1 }}>
              <span className="hr-eyebrow"><Sparkles size={14} /> Get started</span>
              <h2 className="hr-h2" style={{ color: "#F1EFF7" }}>Your next great hire is <em className="hr-grad-text">already in your inbox.</em></h2>
              <p className="hr-sub">Create a role, share the link today, and wake up to a ranked shortlist.</p>
              <div className="hr-cta-list">
                <div><CheckCircle2 size={18} /> Free, unlimited interviews, no card</div>
                <div><CheckCircle2 size={18} /> Your link is ready in about a minute</div>
                <div><CheckCircle2 size={18} /> WhatsApp alerts when candidates finish</div>
              </div>
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <HireAuth key={auth.n} initialMode={auth.mode} initialError={auth.error} dark />
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="hr-foot">
        <span className="hr-logo" style={{ width: 24, height: 24, fontSize: 13, borderRadius: 7 }}>A</span>
        <b style={{ fontSize: ".88rem" }}>Atyant Hire</b>
        <span className="hr-muted">AI screening interviews for startups</span>
        <span className="hr-sp" />
        <a href="/">Atyant</a>
        <a href="/company">About</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </footer>
    </>
  );
}
