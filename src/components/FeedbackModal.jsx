import { useEffect, useRef, useState } from "react";
import { Star, X, Check, Loader2 } from "lucide-react";
import { FEEDBACK_PRESETS, RATING_WORDS, FEEDBACK_MAX } from "../lib/feedback";

// One feedback dialog for every kind of review (platform, mock interview, session).
// The caller does the saving: onSubmit({ rating, tags, comment }) → Promise; throw to show an error.
// onClose(submitted) fires on Cancel / ✕ / Escape / backdrop, and after the thank-you.
export default function FeedbackModal({ kind, initialRating = 0, subtitle, onSubmit, onClose }) {
  const preset = FEEDBACK_PRESETS[kind];
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const firstStarRef = useRef(null);

  useEffect(() => { firstStarRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !saving) onClose?.(done); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, done, onClose]);

  // After "Thanks", close on its own.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => onClose?.(true), 1600);
    return () => clearTimeout(t);
  }, [done, onClose]);

  const toggleTag = (t) => setTags(cur => (cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t]));

  const submit = async () => {
    if (!rating || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit({ rating, tags, comment: comment.trim() });
      setDone(true);
    } catch (err) {
      setError(err?.message || "Couldn't save your feedback. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const shown = hover || rating;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="fb-title"
      style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={() => !saving && onClose?.(done)} style={{ position: "absolute", inset: 0, background: "rgba(10,8,20,.55)" }} />

      <div style={{ position: "relative", width: "min(480px, 100%)", maxHeight: "calc(100dvh - 32px)", overflowY: "auto", background: "var(--c-card)", color: "var(--c-text)", border: "1px solid var(--c-cardBorder)", borderRadius: 16, padding: "22px 22px 18px", boxShadow: "0 24px 60px -16px rgba(0,0,0,.45)", fontFamily: "var(--font-body)" }}>
        <button onClick={() => onClose?.(done)} disabled={saving} aria-label="Close"
          style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 8, background: "transparent", color: "var(--c-textMuted)", cursor: "pointer" }}>
          <X size={18} />
        </button>

        {done ? (
          <div style={{ textAlign: "center", padding: "22px 6px 10px" }}>
            <span style={{ width: 52, height: 52, borderRadius: "50%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: "#3DBE8222", color: "#3DBE82" }}>
              <Check size={26} strokeWidth={3} />
            </span>
            <div id="fb-title" style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: 14 }}>Thanks for the feedback</div>
            <div style={{ fontSize: ".86rem", color: "var(--c-textSub)", marginTop: 6 }}>We read every one of these.</div>
          </div>
        ) : (
          <>
            <h2 id="fb-title" style={{ margin: 0, paddingRight: 34, fontSize: "1.2rem", fontWeight: 700, lineHeight: 1.3 }}>{preset.title}</h2>
            <p style={{ margin: "6px 0 0", fontSize: ".86rem", color: "var(--c-textSub)", lineHeight: 1.5 }}>{subtitle || preset.subtitle}</p>

            {/* Stars */}
            <div style={{ marginTop: 18, padding: "18px 12px 14px", borderRadius: 12, background: "var(--c-active)", border: "1px solid var(--c-cardBorder)", textAlign: "center" }}>
              <div role="radiogroup" aria-label="Rating" style={{ display: "flex", justifyContent: "center", gap: 10 }} onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map(n => {
                  const on = n <= shown;
                  return (
                    <button key={n} ref={n === 1 ? firstStarRef : undefined} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}, ${RATING_WORDS[n]}`}
                      onClick={() => setRating(n)} onMouseEnter={() => setHover(n)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setRating(r => Math.min(5, (r || 0) + 1)); }
                        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setRating(r => Math.max(1, (r || 1) - 1)); }
                      }}
                      style={{ padding: 2, border: "none", background: "none", cursor: "pointer", lineHeight: 0, transform: on ? "scale(1.08)" : "none", transition: "transform .12s ease" }}>
                      <Star size={34} strokeWidth={1.6} fill={on ? "#F59E0B" : "none"} color={on ? "#F59E0B" : "var(--c-textMuted)"} />
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, fontSize: ".84rem", fontWeight: 600, color: shown ? "var(--c-text)" : "var(--c-textMuted)", minHeight: "1.3em" }}>
                {shown ? RATING_WORDS[shown] : "Tap a star to rate"}
              </div>
            </div>

            {/* Quick tags — appear once there's a rating */}
            {rating > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: ".84rem", fontWeight: 700, marginBottom: 8 }}>{rating >= 4 ? "What went well?" : "What could be better?"} <span style={{ fontWeight: 500, color: "var(--c-textMuted)" }}>(pick any)</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {preset.tags.map(t => {
                    const on = tags.includes(t);
                    return (
                      <button key={t} type="button" onClick={() => toggleTag(t)} aria-pressed={on}
                        style={{ fontFamily: "inherit", fontSize: ".8rem", fontWeight: on ? 600 : 500, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? "#7567C9" : "var(--c-cardBorder)"}`, background: on ? "var(--c-accentSoft)" : "var(--c-card)", color: on ? "var(--c-accentText)" : "var(--c-textSub)" }}>
                        {on && <Check size={12} strokeWidth={3} style={{ verticalAlign: -1, marginRight: 4 }} />}{t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comment */}
            <div style={{ marginTop: 16 }}>
              <label htmlFor="fb-comment" style={{ display: "block", fontSize: ".84rem", fontWeight: 700, marginBottom: 8 }}>
                Tell us more <span style={{ fontWeight: 500, color: "var(--c-textMuted)" }}>(optional)</span>
              </label>
              <textarea id="fb-comment" value={comment} onChange={e => setComment(e.target.value.slice(0, FEEDBACK_MAX))} rows={4} placeholder={preset.placeholder}
                style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--c-cardBorder)", background: "var(--c-card)", color: "var(--c-text)", fontSize: ".88rem", lineHeight: 1.5, fontFamily: "inherit", outline: "none" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#7567C9"; }} onBlur={e => { e.currentTarget.style.borderColor = "var(--c-cardBorder)"; }} />
              <div style={{ textAlign: "right", fontSize: ".74rem", color: "var(--c-textMuted)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{comment.length}/{FEEDBACK_MAX}</div>
            </div>

            {error && <div role="alert" style={{ marginTop: 8, fontSize: ".82rem", color: "#F87171" }}>{error}</div>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button type="button" onClick={() => onClose?.(false)} disabled={saving}
                style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid var(--c-cardBorder)", background: "var(--c-card)", color: "var(--c-text)", fontSize: ".86rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Not now
              </button>
              <button type="button" onClick={submit} disabled={!rating || saving}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 9, border: "none", background: "#7567C9", color: "#fff", fontSize: ".86rem", fontWeight: 700, cursor: rating && !saving ? "pointer" : "not-allowed", opacity: rating ? 1 : 0.55, fontFamily: "inherit" }}>
                {saving && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />} Submit feedback
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
