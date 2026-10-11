import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, UserPlus, Copy, Check, Gift, Globe, ExternalLink } from "lucide-react";
import { inviteAPI, eventsAPI } from "../../api";

// Live "what we're doing" lines while the web search runs (~3–8s).
function searchSteps(college, target) {
  return [
    "Searching LinkedIn across the web…",
    college ? `Looking for ${college} alumni…` : "Looking for alumni of your college…",
    target ? `Filtering for ${target}…` : "Filtering for your target role…",
    "Checking each profile is from your college…",
    "Ranking the most relevant seniors…",
  ];
}

function SearchingAnimation({ college, target }) {
  const reduce = useReducedMotion();
  const steps = searchSteps(college, target);
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI(n => Math.min(n + 1, steps.length - 1)), 1600);
    return () => clearInterval(t);
  }, [steps.length]);

  return (
    <div style={{ marginTop: 12 }}>
      <style>{`@keyframes inviteShimmer { 0% { background-position: -200px 0 } 100% { background-position: 200px 0 } }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
          {!reduce && [0, 1].map(k => (
            <motion.span
              key={k}
              style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #7567C9" }}
              initial={{ scale: 0.6, opacity: 0.7 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, delay: k * 0.8, ease: "easeOut" }}
            />
          ))}
          <motion.div
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#7567C9" }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Globe size={18} />
          </motion.div>
        </div>
        <div style={{ position: "relative", height: 20, flex: 1, overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ fontSize: "0.8rem", color: "var(--c-text)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {steps[i]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
        {[0, 1, 2].map(k => (
          <div key={k} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0" }}>
            <div style={{ ...shimmer, width: 32, height: 32, borderRadius: "50%" }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...shimmer, height: 10, width: `${55 - k * 10}%`, borderRadius: 6 }} />
              <div style={{ ...shimmer, height: 8, width: `${80 - k * 12}%`, borderRadius: 6, marginTop: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const shimmer = {
  background: "linear-gradient(90deg, var(--c-active) 0px, var(--c-cardBorder) 60px, var(--c-active) 120px)",
  backgroundSize: "400px 100%",
  animation: "inviteShimmer 1.3s linear infinite",
};

// Shown when no senior from the student's college is in our pool: finds seniors
// from that college on the public web and lets the student invite one. The
// student sends the message themselves.
export default function InviteSeniors({ sessionId, onNeedAuth, signedIn, college, target }) {
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [seniors, setSeniors] = useState([]);
  const [invited, setInvited] = useState({}); // linkedinUrl -> { message, link }
  const [copied, setCopied] = useState(null); // `${linkedinUrl}:${variant}` currently on the clipboard
  const [variant, setVariant] = useState({}); // linkedinUrl -> "message" | "note"
  const [error, setError] = useState("");

  const search = async () => {
    if (!signedIn) { onNeedAuth?.(); return; }
    setState("loading");
    try {
      const res = await inviteAPI.seniors(sessionId);
      setSeniors(res.seniors || []);
      setState("done");
    } catch (e) {
      setError(e.message || "Could not search right now");
      setState("error");
    }
  };

  const invite = async (s) => {
    try {
      const res = await inviteAPI.create({ sessionId, senior: s });
      setInvited(prev => ({ ...prev, [s.linkedinUrl]: res }));
      eventsAPI.track("invite_sent_click", { code: res.code });
      // Copy now, but don't jump to LinkedIn yet — the student needs to see the
      // message is on their clipboard and what to do with it first.
      copy(s.linkedinUrl, "message", res.message);
    } catch (e) {
      setError(e.message || "Could not create invite");
    }
  };

  const copy = async (url, kind, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(`${url}:${kind}`); } catch { setCopied(null); }
  };

  // Switching the tab also copies it, so the clipboard always matches what's on screen.
  const pick = (url, kind, inv) => {
    setVariant(prev => ({ ...prev, [url]: kind }));
    copy(url, kind, kind === "note" ? inv.note : inv.message);
  };

  const card = { border: "1px solid var(--c-cardBorder)", background: "var(--c-card)", borderRadius: 12, padding: "12px 14px" };
  const btn = { background: "#7567C9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 };

  return (
    <div style={{ marginTop: 14, maxWidth: 520, width: "100%" }}>
      <div style={{ ...card, background: "var(--c-accentSoft)" }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--c-text)" }}>
          No senior from {college || "your college"} on Atyant yet — bring one in
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--c-textSub)", marginTop: 4, lineHeight: 1.5 }}>
          We'll search LinkedIn for seniors from your college on your target path. Invite one — when they join and answer, you earn a reward.
        </div>
        {(state === "idle" || state === "error") && (
          <button onClick={search} style={{ ...btn, marginTop: 10 }}>
            <Search size={14} /> Find seniors to invite
          </button>
        )}
        {state === "loading" && <SearchingAnimation college={college} target={target} />}
        {state === "error" && <div style={{ color: "#F87171", fontSize: "0.78rem", marginTop: 8 }}>{error}</div>}
      </div>

      {state === "done" && seniors.length === 0 && (
        <div style={{ ...card, marginTop: 8, fontSize: "0.82rem", color: "var(--c-textSub)" }}>
          Couldn't find public profiles of seniors from {college || "your college"} on this path yet.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {seniors.map((s, idx) => {
          const inv = invited[s.linkedinUrl];
          const kind = inv?.note && variant[s.linkedinUrl] === "note" ? "note" : "message";
          const text = kind === "note" ? inv?.note : inv?.message;
          const isCopied = copied === `${s.linkedinUrl}:${kind}`;
          return (
            <motion.div
              key={s.linkedinUrl}
              style={card}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.07 }}
            >
              <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--c-text)" }}>{s.name}</div>
              {s.headline && <div style={{ fontSize: "0.78rem", color: "var(--c-textSub)", marginTop: 2 }}>{s.headline}</div>}
              {s.matchedOn?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                  {s.matchedOn.map(r => (
                    <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: "#34D399", background: "#34D39914", borderRadius: 999, padding: "2px 8px" }}>
                      <Check size={9} /> {r}
                    </span>
                  ))}
                </div>
              )}
              {!inv ? (
                <button onClick={() => invite(s)} style={{ ...btn, marginTop: 10 }}>
                  <UserPlus size={14} /> Invite
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.25 }}
                  style={{ marginTop: 10, overflow: "hidden" }}
                >
                  {inv.note && (
                    <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--c-active)", borderRadius: 9, marginBottom: 8 }}>
                      {[["message", "Message (DM)"], ["note", "Connection note"]].map(([k, label]) => (
                        <button
                          key={k}
                          onClick={() => pick(s.linkedinUrl, k, inv)}
                          style={{ flex: 1, border: "none", borderRadius: 7, padding: "6px 8px", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer", background: kind === k ? "var(--c-card)" : "transparent", color: kind === k ? "var(--c-text)" : "var(--c-textMuted)" }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {isCopied ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 600, color: "#34D399", background: "#34D39914", borderRadius: 8, padding: "7px 10px" }}>
                      <Check size={14} /> {kind === "note" ? "Short note" : "Invite message"} copied to your clipboard
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--c-text)" }}>
                      Copy the {kind === "note" ? "note" : "message"} below first
                    </div>
                  )}

                  <div style={{ fontSize: "0.78rem", color: "var(--c-textSub)", background: "var(--c-active)", borderRadius: 8, padding: 10, lineHeight: 1.5, marginTop: 8 }}>
                    {text}
                    {kind === "note" && (
                      <div style={{ fontSize: "0.68rem", color: "var(--c-textMuted)", marginTop: 6, textAlign: "right" }}>{text.length}/200</div>
                    )}
                  </div>

                  <ol style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: "0.75rem", color: "var(--c-textSub)", lineHeight: 1.7 }}>
                    <li>Open {s.name.split(" ")[0]}'s LinkedIn</li>
                    {kind === "note"
                      ? <li>Click <b>Connect → Add a note</b></li>
                      : <li>Click <b>Message</b> — not connected? Switch to <b>Connection note</b></li>}
                    <li>Paste with <b>Ctrl+V</b> and send</li>
                  </ol>

                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <button onClick={() => window.open(inv.linkedinUrl, "_blank", "noopener")} style={btn}>
                      <ExternalLink size={14} /> Open LinkedIn
                    </button>
                    <button onClick={() => copy(s.linkedinUrl, kind, text)} style={{ ...btn, background: "var(--c-active)", color: "var(--c-text)" }}>
                      {isCopied ? <Check size={14} /> : <Copy size={14} />} {isCopied ? "Copied" : `Copy ${kind === "note" ? "note" : "message"}`}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
      {state === "done" && seniors.length > 0 && (
        <div style={{ fontSize: "0.72rem", color: "var(--c-textMuted)", marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
          <Gift size={12} /> Reward is added to your account once the senior joins and is listed.
        </div>
      )}
    </div>
  );
}
