import { useState, useEffect, useRef } from "react";
import { X, Loader2, Sparkles, FileText, Plus as PlusIcon, Trash2, Check, Pencil, Eye, EyeOff } from "lucide-react";
import { mentorAPI } from "../api";

// Theme palette — maps to CSS vars defined in index.css (light + dark).
const C = {
  bg:           "var(--c-bg)",
  card:         "var(--c-card)",
  cardHover:    "var(--c-cardHover)",
  cardBorder:   "var(--c-cardBorder)",
  active:       "var(--c-active)",
  activeBorder: "var(--c-activeBorder)",
  accent:       "#7567C9",
  accentSoft:   "var(--c-accentSoft)",
  accentText:   "var(--c-accentText)",
  text:         "var(--c-text)",
  textSub:      "var(--c-textSub)",
  textMuted:    "var(--c-textMuted)",
  green:        "#3DBE82",
};

function Spin({ size = 18 }) {
  return <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />;
}

// ─── Answer Card Manager ──────────────────────────────────────────────────────
// Modal where a mentor reviews and edits their own answer cards — the same cards
// students see on the Clarity page. Saving re-embeds the card on the server.
function AnswerCardEditor({ card, isNew, initialStory = "", reviewBanner = false, onConfirm, onClose, onSaved }) {
  const [c, setC] = useState(() => {
    const ac = card.answerContent || {};
    return {
      mainAnswer:        ac.mainAnswer || "",
      situation:         ac.situation || "",
      whatWorked:        ac.whatWorked || "",
      timeline:          ac.timeline || "",
      differentApproach: ac.differentApproach || "",
      keyMistakes:       Array.isArray(ac.keyMistakes) ? ac.keyMistakes : [],
      actionableSteps:   Array.isArray(ac.actionableSteps) ? ac.actionableSteps : [],
    };
  });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [previewMode, setPreview] = useState(false);
  const [story, setStory]       = useState(initialStory);  // free-text for AI draft (pre-filled)
  const [generating, setGenerating] = useState(false);
  const autoRan = useRef(false);

  const set = (k, v) => setC(prev => ({ ...prev, [k]: v }));

  // Core: one paragraph (or just the profile) → AI fills every section.
  const runGenerate = async (src) => {
    setGenerating(true); setError("");
    try {
      const res = await mentorAPI.generateAnswerCard((src || "").trim());
      const ac = res.answerContent || {};
      setC({
        mainAnswer:        ac.mainAnswer || "",
        situation:         ac.situation || "",
        whatWorked:        ac.whatWorked || "",
        timeline:          ac.timeline || "",
        differentApproach: ac.differentApproach || "",
        keyMistakes:       Array.isArray(ac.keyMistakes) ? ac.keyMistakes : [],
        actionableSteps:   Array.isArray(ac.actionableSteps) ? ac.actionableSteps : [],
      });
    } catch (e) {
      setError(e.message || "Couldn't auto-fill — just type the sections below.");
    } finally {
      setGenerating(false);
    }
  };

  // Manual button — needs a bit of text to work from.
  const generate = () => {
    if (story.trim().length < 20) { setError("Write a few sentences about your journey first (min ~20 chars)."); return; }
    runGenerate(story);
  };

  // 🔥 Auto-draft on open: a new card immediately gets filled from the mentor's
  // profile/story — so they review, not write from scratch.
  useEffect(() => {
    if (isNew && !autoRan.current) {
      autoRan.current = true;
      runGenerate(initialStory || "");   // empty → backend falls back to profile
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  const save = async () => {
    if (isNew && !c.mainAnswer.trim() && !c.situation.trim()) {
      setError("Add at least a headline answer or the situation.");
      return;
    }
    setSaving(true); setError("");
    try {
      if (isNew) {
        const res = await mentorAPI.createAnswerCard(c);
        onSaved(res.card);            // new card object from server
      } else {
        const res = await mentorAPI.updateAnswerCard(card.id, c);
        onSaved({ ...card, answerContent: res.answerContent || c });
      }
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const ta = { width:"100%", background:C.active, border:`1px solid ${C.accent}44`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:"0.86rem", outline:"none", fontFamily:"inherit", resize:"vertical", boxSizing:"border-box", lineHeight:1.5 };
  const lbl = { fontSize:"0.66rem", fontWeight:700, letterSpacing:"0.1em", color:C.textMuted, display:"block", marginBottom:5, marginTop:"1rem" };

  return (
    <div>
      {/* Preview toggle */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"0.75rem" }}>
        <button
          type="button"
          onClick={() => setPreview(p => !p)}
          style={{ display:"flex", alignItems:"center", gap:6, background: previewMode ? C.accent : C.active, border:`1px solid ${previewMode ? C.accent : C.cardBorder}`, borderRadius:8, padding:"6px 14px", color: previewMode ? "#fff" : C.accentText, fontSize:"0.78rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
        >
          {previewMode ? <EyeOff size={13}/> : <Eye size={13}/>}
          {previewMode ? "Back to edit" : "Preview as student"}
        </button>
      </div>

      {/* ── Student-facing preview ── */}
      {previewMode && (
        <div style={{ border:`1px solid ${C.cardBorder}`, borderRadius:14, overflow:"hidden", marginBottom:"1.25rem" }}>
          {/* Label */}
          <div style={{ background:`${C.accent}18`, borderBottom:`1px solid ${C.accent}30`, padding:"7px 14px", display:"flex", alignItems:"center", gap:6 }}>
            <Eye size={12} color={C.accentText}/>
            <span style={{ fontSize:"0.7rem", fontWeight:700, color:C.accentText, letterSpacing:"0.06em" }}>THIS IS WHAT STUDENTS SEE</span>
          </div>

          <div style={{ padding:"16px 14px", display:"flex", flexDirection:"column", gap:14 }}>

            {/* Headline answer */}
            {c.mainAnswer && (
              <div style={{ background:C.card, borderRadius:10, padding:"12px 14px", border:`1px solid ${C.cardBorder}` }}>
                <div style={{ fontSize:"0.66rem", fontWeight:700, letterSpacing:"0.1em", color:C.textMuted, marginBottom:6 }}>HEADLINE ANSWER</div>
                <p style={{ fontSize:"0.9rem", fontWeight:600, color:C.text, lineHeight:1.55, margin:0 }}>{c.mainAnswer}</p>
              </div>
            )}

            {/* Their journey / situation */}
            {c.situation && (
              <div>
                <div style={{ fontSize:"0.66rem", fontWeight:700, letterSpacing:"0.1em", color:C.textMuted, marginBottom:6 }}>THEIR JOURNEY</div>
                <p style={{ fontSize:"0.84rem", color:C.textSub, lineHeight:1.8, margin:0 }}>{c.situation}</p>
              </div>
            )}

            {/* What worked */}
            {c.whatWorked && (
              <div style={{ background:`#3DBE820D`, border:`1px solid #3DBE8230`, borderRadius:10, padding:"11px 14px", display:"flex", gap:10 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:"#3DBE8228", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                  <span style={{ color:"#3DBE82", fontSize:"0.65rem", fontWeight:700 }}>✓</span>
                </div>
                <div>
                  <div style={{ fontSize:"0.66rem", fontWeight:700, color:"#3DBE82", marginBottom:4 }}>WHAT WORKED</div>
                  <p style={{ fontSize:"0.84rem", color:C.textSub, lineHeight:1.6, margin:0 }}>{c.whatWorked}</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            {c.timeline && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:"0.66rem", fontWeight:700, color:C.textMuted }}>TIMELINE</span>
                <span style={{ background:C.active, borderRadius:999, padding:"3px 10px", fontSize:"0.78rem", color:C.textSub, border:`1px solid ${C.cardBorder}` }}>{c.timeline}</span>
              </div>
            )}

            {/* Action steps */}
            {c.actionableSteps?.length > 0 && (
              <div>
                <div style={{ fontSize:"0.66rem", fontWeight:700, letterSpacing:"0.1em", color:C.textMuted, marginBottom:8 }}>ACTION PLAN</div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {c.actionableSteps.map((s, i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span style={{ flexShrink:0, width:22, height:22, borderRadius:"50%", background:C.accentSoft, color:C.accentText, fontSize:"0.7rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</span>
                      <div>
                        {s.step && <div style={{ fontSize:"0.8rem", fontWeight:600, color:C.text, marginBottom:2 }}>{s.step}</div>}
                        <div style={{ fontSize:"0.8rem", color:C.textSub, lineHeight:1.5 }}>{s.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key mistakes */}
            {c.keyMistakes?.length > 0 && (
              <div>
                <div style={{ fontSize:"0.66rem", fontWeight:700, letterSpacing:"0.1em", color:C.textMuted, marginBottom:8 }}>MISTAKES TO AVOID</div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {c.keyMistakes.map((m, i) => (
                    <div key={i} style={{ display:"flex", gap:8, fontSize:"0.82rem", color:C.textSub }}>
                      <span style={{ color:"#f87171", flexShrink:0 }}>✕</span>{m}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What I'd do differently */}
            {c.differentApproach && (
              <div>
                <div style={{ fontSize:"0.66rem", fontWeight:700, letterSpacing:"0.1em", color:C.textMuted, marginBottom:6 }}>IF I DID IT TODAY</div>
                <p style={{ fontSize:"0.84rem", color:C.textSub, lineHeight:1.6, margin:0 }}>{c.differentApproach}</p>
              </div>
            )}

            {!c.mainAnswer && !c.situation && (
              <p style={{ fontSize:"0.82rem", color:C.textMuted, textAlign:"center", padding:"1rem 0" }}>Fill some sections in the editor — they'll appear here.</p>
            )}
          </div>
        </div>
      )}

      {/* Honest-intent note — reminds mentors this is real, matched & tracked */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:9, background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:10, padding:"11px 13px", marginBottom:"1.25rem" }}>
        <span style={{ fontSize:"1rem", lineHeight:1, marginTop:1 }}>✍️</span>
        <div style={{ fontSize:"0.8rem", color:C.textSub, lineHeight:1.6 }}>
          This is <strong style={{ color:C.text }}>your journey</strong> — students read it, connect with your background, and book a session with you. The more real it is, the more they trust you. <strong style={{ color:C.text }}>Your struggles, your path, your wins</strong> — that's what makes someone say "this senior gets me." We also use it to track how your guidance actually helps students over time. 💛
        </div>
      </div>

      {/* Heads-up banner — shown on the freshly AI-drafted card after onboarding */}
      {reviewBanner && (
        <div style={{ background:"rgba(61,190,130,0.1)", border:`1px solid ${C.green}55`, borderRadius:10, padding:"11px 13px", marginBottom:"1.25rem" }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
            <Sparkles size={15} style={{ color:C.green, flexShrink:0, marginTop:1 }} />
            <div style={{ fontSize:"0.8rem", color:C.text, lineHeight:1.5 }}>
              <strong>We've drafted your journey card — review before students see it.</strong>
              <span style={{ color:C.textMuted }}> Students will read this to decide if they want to book a session with you. Edit any section, or keep it as-is.</span>
            </div>
          </div>
          {onConfirm && (
            <button type="button" onClick={onConfirm}
              style={{ marginTop:9, marginLeft:24, display:"inline-flex", alignItems:"center", gap:6, background:C.green, border:`1px solid ${C.green}`, borderRadius:8, padding:"7px 14px", color:"#fff", fontSize:"0.8rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              <Check size={13} /> Looks good — keep it live
            </button>
          )}
        </div>
      )}

      {/* ✨ AI draft — write one paragraph, get the whole card filled in */}
      <div style={{ background:C.accentSoft, border:`1px solid ${C.accent}44`, borderRadius:12, padding:"1rem", marginBottom:"1.25rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
          <Sparkles size={14} style={{ color:C.accent }} />
          <span style={{ fontSize:"0.8rem", fontWeight:700, color:C.accentText }}>
            {generating ? "Drafting your card…" : "Auto-filled from your story"}
          </span>
        </div>
        <p style={{ fontSize:"0.76rem", color:C.textMuted, margin:"0 0 8px", lineHeight:1.5 }}>
          {generating
            ? "Writing your journey card — one sec."
            : "Your journey card is what students read before booking a session with you. Add more to your story below and regenerate, or just edit the sections directly and publish."}
        </p>
        <textarea rows={3} value={story} onChange={e => setStory(e.target.value)} style={ta}
          placeholder="e.g. I was a Chemical branch student with no CS background. I cold-mailed 40 startups, built 2 projects in DSA + ML, and converted an internship in 3 months. Biggest mistake was studying in patches…" />
        <button type="button" onClick={generate} disabled={generating}
          style={{ marginTop:8, display:"flex", alignItems:"center", gap:6, background:C.accent, border:`1px solid ${C.accent}`, borderRadius:8, padding:"8px 16px", color:"#fff", fontSize:"0.82rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", opacity: generating ? 0.7 : 1 }}>
          {generating ? <><Spin size={13}/> Generating…</> : <><Sparkles size={13}/> Regenerate from story</>}
        </button>
      </div>

      <div style={{ background:"#f871711a", border:"1px solid #f8717144", borderRadius:10, padding:"10px 13px", marginBottom:10 }}>
        <div style={{ fontSize:"0.72rem", fontWeight:800, color:"#f87171", letterSpacing:"0.08em", marginBottom:5 }}>
          ⚡ HEADLINE — what students see first · most important field
        </div>
        <div style={{ fontSize:"0.72rem", lineHeight:1.6 }}>
          <span style={{ color:C.textMuted }}>Write it as your transformation: </span>
          <span style={{ color:"#f87171", fontWeight:700 }}>"[Where you started] → [What you cracked]"</span><br/>
          <span style={{ color:"#f87171", opacity:0.8 }}>e.g. "Failed 3 campus drives, cracked Amazon off-campus in final year" · "Metallurgy → IIM research intern without CAT" · "Zero DSA to Microsoft in 8 months from NIT Raipur"</span>
        </div>
      </div>
      <textarea rows={2} value={c.mainAnswer} onChange={e => set("mainAnswer", e.target.value)} style={ta} placeholder='e.g. "Core branch, no coding background → cracked FAANG SDE off-campus in 6 months"' />

      <label style={lbl}>THE SITUATION</label>
      <textarea rows={3} value={c.situation} onChange={e => set("situation", e.target.value)} style={ta} placeholder="What was your situation?" />

      <label style={lbl}>WHAT WORKED</label>
      <textarea rows={2} value={c.whatWorked} onChange={e => set("whatWorked", e.target.value)} style={ta} placeholder="What actually moved the needle" />

      {/* Action plan — editable list of steps */}
      <label style={lbl}>ACTION PLAN</label>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {c.actionableSteps.map((s, i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
            <span style={{ flexShrink:0, width:22, height:22, marginTop:7, borderRadius:"50%", background:C.accentSoft, color:C.accentText, fontSize:"0.72rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</span>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
              <input value={s.step || ""} onChange={e => { const next=[...c.actionableSteps]; next[i]={...next[i], step:e.target.value}; set("actionableSteps", next); }}
                style={{ ...ta, padding:"6px 10px", fontSize:"0.8rem" }} placeholder={`Step ${i+1} title (optional)`} />
              <textarea rows={2} value={s.description || ""} onChange={e => { const next=[...c.actionableSteps]; next[i]={...next[i], description:e.target.value}; set("actionableSteps", next); }}
                style={{ ...ta, padding:"7px 10px", fontSize:"0.82rem" }} placeholder="What to do" />
            </div>
            <button type="button" onClick={() => set("actionableSteps", c.actionableSteps.filter((_,j)=>j!==i))}
              style={{ flexShrink:0, marginTop:6, background:"transparent", border:"none", color:C.textMuted, cursor:"pointer" }} title="Remove step">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => set("actionableSteps", [...c.actionableSteps, { step:"", description:"" }])}
          style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap:5, background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:8, padding:"6px 12px", color:C.textSub, fontSize:"0.78rem", cursor:"pointer", fontFamily:"inherit" }}>
          <PlusIcon size={13} /> Add step
        </button>
      </div>

      {/* Mistakes to avoid — editable list */}
      <label style={lbl}>MISTAKES TO AVOID</label>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {c.keyMistakes.map((m, i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ color:"#f87171", flexShrink:0 }}>✕</span>
            <input value={m} onChange={e => { const next=[...c.keyMistakes]; next[i]=e.target.value; set("keyMistakes", next); }}
              style={{ ...ta, padding:"6px 10px", fontSize:"0.82rem" }} placeholder="A mistake to avoid" />
            <button type="button" onClick={() => set("keyMistakes", c.keyMistakes.filter((_,j)=>j!==i))}
              style={{ flexShrink:0, background:"transparent", border:"none", color:C.textMuted, cursor:"pointer" }} title="Remove">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => set("keyMistakes", [...c.keyMistakes, ""])}
          style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap:5, background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:8, padding:"6px 12px", color:C.textSub, fontSize:"0.78rem", cursor:"pointer", fontFamily:"inherit" }}>
          <PlusIcon size={13} /> Add mistake
        </button>
      </div>

      <label style={lbl}>TIMELINE</label>
      <textarea rows={2} value={c.timeline} onChange={e => set("timeline", e.target.value)} style={ta} placeholder="How long it took" />

      <label style={lbl}>IF I DID IT TODAY</label>
      <textarea rows={2} value={c.differentApproach} onChange={e => set("differentApproach", e.target.value)} style={ta} placeholder="What you'd do differently now" />

      {error && <p style={{ color:"#f87171", fontSize:"0.8rem", marginTop:12 }}>{error}</p>}

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:"1.5rem" }}>
        <button onClick={onClose} disabled={saving}
          style={{ background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:9, padding:"9px 18px", color:C.textSub, fontSize:"0.84rem", cursor:"pointer", fontFamily:"inherit" }}>
          Cancel
        </button>
        <button onClick={save} disabled={saving}
          style={{ display:"flex", alignItems:"center", gap:6, background:C.accent, border:`1px solid ${C.accent}`, borderRadius:9, padding:"9px 18px", color:"#fff", fontSize:"0.84rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          {saving ? <><Spin size={13}/> Saving…</> : (isNew ? "Create & publish" : "Save & re-publish")}
        </button>
      </div>
    </div>
  );
}

export default function AnswerCardManager({ onClose, initialStory = "", autoOpenCard = false }) {
  const [cards, setCards]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [activeId, setActiveId] = useState(null);
  const [creating, setCreating] = useState(false);   // writing a brand-new card

  useEffect(() => {
    let cancelled = false;
    mentorAPI.answerCards()
      .then(d => {
        if (cancelled) return;
        const list = d.cards || [];
        setCards(list);
        // Arriving from onboarding → open the freshly-made card directly.
        if (autoOpenCard && list.length > 0) setActiveId(list[0].id);
        else if (autoOpenCard && list.length === 0) setCreating(true);
      })
      .catch(e => { if (!cancelled) setError(e.message || "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [autoOpenCard]);

  const active = cards.find(c => c.id === activeId);

  // Existing card edited → merge; new card created → prepend.
  const onSaved = (savedCard) => {
    setCards(prev => prev.some(c => c.id === savedCard.id)
      ? prev.map(c => c.id === savedCard.id ? { ...c, ...savedCard } : c)
      : [savedCard, ...prev]);
    setActiveId(null);
    setCreating(false);
  };

  return (
    <div onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:200, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"3vh 1rem", overflowY:"auto" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width:"100%", maxWidth:600, background:C.bg, border:`1px solid ${C.cardBorder}`, borderRadius:16, padding:"1.5rem", boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <FileText size={18} style={{ color:C.accent }} />
            <h3 style={{ margin:0, fontSize:"1.05rem", fontWeight:600, color:C.text }}>
              {creating ? "Write your answer card" : active ? "Edit answer card" : "Your answer cards"}
            </h3>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMuted, cursor:"pointer" }}><X size={18} /></button>
        </div>

        {loading && <div style={{ display:"flex", alignItems:"center", gap:8, color:C.textSub, fontSize:"0.86rem", padding:"1rem 0" }}><Spin size={15}/> Loading…</div>}
        {!loading && error && <p style={{ color:"#f87171", fontSize:"0.85rem" }}>{error}</p>}

        {/* List / empty state — hidden while editing or creating */}
        {!loading && !error && !active && !creating && (
          cards.length === 0
            ? <div style={{ padding:"0.5rem 0" }}>
                <p style={{ color:C.textMuted, fontSize:"0.86rem", lineHeight:1.6, marginTop:0 }}>
                  You don't have an answer card yet. Write one now — it's exactly what students see when they're matched to you.
                </p>
                <button onClick={() => setCreating(true)}
                  style={{ display:"flex", alignItems:"center", gap:7, background:C.accent, border:`1px solid ${C.accent}`, borderRadius:9, padding:"10px 18px", color:"#fff", fontSize:"0.86rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginTop:"0.5rem" }}>
                  <PlusIcon size={15} /> Write your answer card
                </button>
              </div>
            : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <p style={{ color:C.textMuted, fontSize:"0.8rem", margin:"0 0 0.25rem", lineHeight:1.6 }}>
                  This is what students see when they're matched to you. Edit anything — saving re-publishes it instantly.
                </p>
                {cards.map(card => (
                  <button key={card.id} onClick={() => setActiveId(card.id)}
                    style={{ textAlign:"left", background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:12, padding:"1rem", cursor:"pointer", fontFamily:"inherit" }}>
                    <div style={{ fontSize:"0.82rem", fontWeight:600, color:C.text, marginBottom:4, lineHeight:1.4 }}>
                      {card.answerContent?.mainAnswer || card.questionText || "Your journey"}
                    </div>
                    <div style={{ fontSize:"0.76rem", color:C.textMuted, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                      {card.answerContent?.situation || "Tap to add details"}
                    </div>
                    <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:5, fontSize:"0.74rem", color:C.accentText, fontWeight:600 }}>
                      <Pencil size={11} /> Edit
                    </div>
                  </button>
                ))}
                <button onClick={() => setCreating(true)}
                  style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap:6, background:C.active, border:`1px solid ${C.cardBorder}`, borderRadius:9, padding:"8px 14px", color:C.textSub, fontSize:"0.8rem", cursor:"pointer", fontFamily:"inherit", marginTop:4 }}>
                  <PlusIcon size={13} /> New answer card
                </button>
              </div>
        )}

        {!loading && active && !creating && (
          <AnswerCardEditor card={active} reviewBanner={autoOpenCard} onConfirm={onClose} onClose={() => setActiveId(null)} onSaved={onSaved} />
        )}

        {!loading && creating && (
          <AnswerCardEditor card={{ answerContent: {} }} isNew initialStory={initialStory} onClose={() => setCreating(false)} onSaved={onSaved} />
        )}
      </div>
    </div>
  );
}
