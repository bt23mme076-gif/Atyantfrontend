import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Play, RotateCw, Volume2, VolumeX, Menu } from "lucide-react";
import { eventsAPI } from "../api";

const seen = (key) => { try { return localStorage.getItem(key) === "1"; } catch { return false; } };
const markSeen = (key) => { try { localStorage.setItem(key, "1"); } catch { /* ignore */ } };
const fmt = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

const SPEEDS = [1, 1.5, 2];
const IDLE_MS = 2500;

const iconBtn = { width: 36, height: 36, borderRadius: 10, border: "none", background: "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 };

// YC-style founder video: a muted looping circle in the corner that expands into
// a player with question chips, each playing its own clip. Shown once per browser.
export default function VideoBubble({ config, onAsk }) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(() => !seen(config.storageKey));
  const [expanded, setExpanded] = useState(false);
  const [clip, setClip] = useState(null); // null = intro, else chapter id
  const [ended, setEnded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [take, setTake] = useState(0); // bumps on every chip click so re-picking a clip replays it
  const [time, setTime] = useState({ t: 0, d: 0 });
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [idle, setIdle] = useState(false); // hides the control bar while playing untouched
  const [asking, setAsking] = useState(false); // "T" reply: type a question for Ask Atyant
  const [question, setQuestion] = useState("");
  const playerRef = useRef(null);
  const loopRef = useRef(null);
  const idleTimer = useRef(null);

  // Clips not uploaded yet → hide. Checks error state too, since the load error
  // can fire before React's onError listener is attached.
  useEffect(() => {
    const v = loopRef.current;
    if (!v) return;
    const hide = () => setVisible(false);
    if (v.error) hide();
    v.addEventListener("error", hide);
    return () => v.removeEventListener("error", hide);
  }, [visible, expanded]);

  const current = clip ? config.chapters.find(c => c.id === clip) : null;
  const src = current ? current.src : config.intro;

  const open = () => {
    setExpanded(true);
    setClip(null);
    setTake(n => n + 1);
    setEnded(false);
    markSeen(config.storageKey);
    eventsAPI.track("jobs_video_open", {});
  };

  const close = () => {
    setVisible(false);
    setExpanded(false);
    markSeen(config.storageKey);
    eventsAPI.track("jobs_video_close", { clip: clip || "intro", expanded });
  };

  const play = (id) => {
    setClip(id);
    setTake(n => n + 1);
    setEnded(false);
    setMenuOpen(false);
    eventsAPI.track("jobs_video_chapter", { chapter: id || "intro" });
  };

  const togglePause = () => {
    const v = playerRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPaused(false); setEnded(false); } else { v.pause(); setPaused(true); }
  };

  const restart = () => {
    const v = playerRef.current;
    if (!v) return;
    v.currentTime = 0;
    setEnded(false);
    v.play().catch(() => {});
    setPaused(false);
  };

  const seek = (e) => {
    const v = playerRef.current;
    if (!v || !v.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) * v.duration;
    setEnded(false);
  };

  const startAsking = () => {
    playerRef.current?.pause();
    setPaused(true);
    setMenuOpen(false);
    setAsking(true);
    eventsAPI.track("jobs_video_ask_open", { clip: clip || "intro" });
  };

  const submitQuestion = (e) => {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;
    eventsAPI.track("jobs_video_ask_submit", { clip: clip || "intro" });
    setVisible(false);
    setExpanded(false);
    markSeen(config.storageKey);
    onAsk(text);
  };

  const cycleSpeed = () => setSpeed(s => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]);

  const wake = () => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  };
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  // New clip → start it with sound (opening was a click, so autoplay is allowed).
  useEffect(() => {
    if (!expanded) return;
    const v = playerRef.current;
    if (!v) return;
    v.currentTime = 0;
    setTime({ t: 0, d: 0 });
    setPaused(false);
    v.play().catch(() => setPaused(true));
    wake();
  }, [expanded, take]);

  // Speed and mute carry across clips.
  useEffect(() => {
    const v = playerRef.current;
    if (!v) return;
    v.playbackRate = speed;
    v.muted = muted;
  }, [speed, muted, take, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => {
      if (e.key === "Escape") { if (asking) setAsking(false); else close(); }
      if (e.key === " " && !asking) { e.preventDefault(); togglePause(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!visible) return null;

  const closeBtn = (onClick, size, pos) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label="Close video"
      style={{ position: "absolute", ...pos, zIndex: 3, width: size, height: size, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.85)", background: "rgba(20,20,24,0.85)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
    >
      <X size={size * 0.55} />
    </button>
  );

  const showControls = !idle || paused || ended || menuOpen;
  const pct = time.d ? (time.t / time.d) * 100 : 0;

  return createPortal(
    <AnimatePresence>
      {!expanded ? (
        <motion.div
          key="bubble"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.6 }}
          style={{ position: "fixed", right: 20, bottom: "calc(20px + env(safe-area-inset-bottom))", zIndex: 900, width: "min(132px, 28vw)", aspectRatio: "1" }}
        >
          <motion.button
            onClick={open}
            aria-label="Play welcome video from the founder"
            whileHover={reduce ? undefined : { scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            style={{ width: "100%", height: "100%", padding: 0, borderRadius: "50%", overflow: "hidden", border: "3px solid #7567C9", boxShadow: "0 10px 30px rgba(0,0,0,0.35)", cursor: "pointer", background: "#111", display: "block" }}
          >
            <video
              ref={loopRef}
              src={config.loop}
              autoPlay={!reduce}
              muted
              loop
              playsInline
              preload="metadata"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </motion.button>
          {closeBtn(close, 26, { top: 0, right: 0 })}
        </motion.div>
      ) : (
        <motion.div
          key="player"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <motion.div
            initial={{ scale: reduce ? 1 : 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Welcome video"
            style={{ position: "relative", width: "100%", maxWidth: 800 }}
          >
            {closeBtn(close, 34, { top: -14, right: -14 })}

            <div
              onMouseMove={wake}
              onTouchStart={wake}
              style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", maxHeight: "85vh", borderRadius: 18, overflow: "hidden", background: "#000", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", cursor: showControls ? "default" : "none" }}
            >
              <video
                ref={playerRef}
                key={take}
                src={src}
                playsInline
                onClick={togglePause}
                onLoadedMetadata={(e) => setTime({ t: 0, d: e.currentTarget.duration })}
                onTimeUpdate={(e) => setTime({ t: e.currentTarget.currentTime, d: e.currentTarget.duration })}
                onEnded={() => setEnded(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
              />

              {/* ── Top control bar: replay · progress · time · mute · speed · chapters ── */}
              <motion.div
                animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -8 }}
                transition={{ duration: 0.2 }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "14px 16px 30px", background: "linear-gradient(rgba(0,0,0,0.55), transparent)", display: "flex", alignItems: "center", gap: 10, pointerEvents: showControls ? "auto" : "none" }}
              >
                <button onClick={restart} aria-label="Replay" style={iconBtn}><RotateCw size={20} /></button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    onClick={seek}
                    role="slider"
                    aria-label="Seek"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(time.d) || 0}
                    aria-valuenow={Math.round(time.t)}
                    style={{ height: 14, display: "flex", alignItems: "center", cursor: "pointer" }}
                  >
                    <div style={{ position: "relative", width: "100%", height: 4, borderRadius: 4, background: "rgba(255,255,255,0.3)" }}>
                      <div style={{ position: "absolute", inset: 0, width: `${pct}%`, borderRadius: 4, background: "#fff" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.72rem", color: "rgba(255,255,255,0.85)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                    {fmt(time.t)} / {fmt(time.d)}
                  </div>
                </div>

                <button onClick={() => setMuted(m => !m)} aria-label={muted ? "Unmute" : "Mute"} style={iconBtn}>
                  {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button onClick={cycleSpeed} aria-label={`Playback speed ${speed}x`}
                  style={{ ...iconBtn, width: 46, background: "rgba(255,255,255,0.18)", fontSize: "0.8rem", fontWeight: 700 }}>
                  {speed}x
                </button>
                <div style={{ position: "relative" }}>
                  <button onClick={() => setMenuOpen(o => !o)} aria-label="All questions" aria-expanded={menuOpen} style={iconBtn}>
                    <Menu size={20} />
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        style={{ position: "absolute", top: 42, right: 0, minWidth: 220, padding: 6, borderRadius: 12, background: "rgba(20,20,24,0.92)", backdropFilter: "blur(8px)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                      >
                        {[{ id: null, label: "Intro" }, ...config.chapters].map((c, i) => (
                          <button
                            key={c.id || "intro"}
                            onClick={() => play(c.id)}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, border: "none", background: clip === c.id ? "rgba(255,255,255,0.14)" : "transparent", color: "#fff", fontSize: "0.84rem", textAlign: "left", cursor: "pointer" }}
                          >
                            <span style={{ width: 20, fontSize: "0.72rem", fontWeight: 700, opacity: 0.7 }}>{i === 0 ? "▶" : String.fromCharCode(64 + i)}</span>
                            {c.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* ── Reply rail: "T" asks Atyant in text ── */}
              {onAsk && !asking && (
                <motion.button
                  onClick={startAsking}
                  aria-label="Ask a question in text"
                  title="Ask a question"
                  whileHover={reduce ? undefined : { scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ position: "absolute", right: 16, top: "calc(50% - 25px)", width: 50, height: 50, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.88)", color: "#7567C9", fontFamily: "Georgia, serif", fontSize: "1.45rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.3)", zIndex: 2 }}
                >
                  T
                </motion.button>
              )}

              <AnimatePresence>
                {asking && (
                  <motion.form
                    onSubmit={submitQuestion}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ position: "absolute", inset: 0, zIndex: 4, background: "rgba(10,10,14,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                  >
                    <motion.div
                      initial={{ y: 12 }}
                      animate={{ y: 0 }}
                      style={{ width: "100%", maxWidth: 460, background: "var(--c-card, #fff)", color: "var(--c-text, #111)", borderRadius: 16, padding: 18, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "0.98rem" }}>Ask your question</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--c-textSub, #555)", marginTop: 4, lineHeight: 1.45 }}>
                        Ask Atyant about jobs, prep or your next step — answers come from seniors who've been where you are.
                      </div>
                      <textarea
                        autoFocus
                        value={question}
                        onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submitQuestion(e); }}
                        placeholder="e.g. Which roles should I apply to with a Mechanical degree?"
                        rows={3}
                        style={{ width: "100%", boxSizing: "border-box", marginTop: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--c-cardBorder, #ddd)", background: "var(--c-bg, #fafafa)", color: "inherit", fontFamily: "inherit", fontSize: "0.88rem", lineHeight: 1.45, resize: "none", outline: "none" }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                        <button type="button" onClick={() => setAsking(false)}
                          style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid var(--c-cardBorder, #ddd)", background: "transparent", color: "inherit", fontSize: "0.84rem", cursor: "pointer" }}>
                          Back to video
                        </button>
                        <button type="submit" disabled={!question.trim()}
                          style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#7567C9", color: "#fff", fontSize: "0.84rem", fontWeight: 600, cursor: question.trim() ? "pointer" : "not-allowed", opacity: question.trim() ? 1 : 0.55 }}>
                          Ask Atyant →
                        </button>
                      </div>
                    </motion.div>
                  </motion.form>
                )}
              </AnimatePresence>

              {paused && !ended && !asking && (
                <button onClick={togglePause} aria-label="Play"
                  style={{ position: "absolute", inset: 0, margin: "auto", width: 64, height: 64, borderRadius: "50%", border: "none", background: "rgba(20,20,24,0.7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Play size={28} />
                </button>
              )}

              {/* Chips: visible on the intro, and again once any answer finishes. */}
              {(!clip || ended) && (
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "40px 14px 14px", background: "linear-gradient(transparent, rgba(0,0,0,0.55))", display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {config.chapters.map((c, i) => (
                    <motion.button
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      onClick={() => play(c.id)}
                      style={{ flex: "1 1 180px", maxWidth: 250, display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "10px 14px", borderRadius: 999, border: clip === c.id ? "1px solid #fff" : "1px solid rgba(255,255,255,0.18)", background: "rgba(20,20,24,0.72)", backdropFilter: "blur(6px)", color: "#fff", fontSize: "0.88rem", fontWeight: 600, lineHeight: 1.25, cursor: "pointer" }}
                    >
                      <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "#fff", color: "#111", fontSize: "0.72rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {c.label}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
