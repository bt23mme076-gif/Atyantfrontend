import { useState } from "react";
import { Search, UserPlus, Copy, Check, Gift } from "lucide-react";
import { inviteAPI, eventsAPI } from "../../api";

// Shown when no mentor in our pool matches: finds seniors on the public web and
// lets the student invite one. The student sends the message themselves.
export default function InviteSeniors({ sessionId, onNeedAuth, signedIn }) {
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [seniors, setSeniors] = useState([]);
  const [invited, setInvited] = useState({}); // linkedinUrl -> { message, link }
  const [copied, setCopied] = useState(null);
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
      try { await navigator.clipboard.writeText(res.message); setCopied(s.linkedinUrl); } catch { /* manual copy below */ }
      window.open(res.linkedinUrl, "_blank", "noopener");
    } catch (e) {
      setError(e.message || "Could not create invite");
    }
  };

  const copy = async (url, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(url); } catch { /* ignore */ }
  };

  const card = { border: "1px solid var(--c-cardBorder)", background: "var(--c-card)", borderRadius: 12, padding: "12px 14px" };
  const btn = { background: "#7567C9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 };

  return (
    <div style={{ marginTop: 14, maxWidth: 520, width: "100%" }}>
      <div style={{ ...card, background: "var(--c-accentSoft)" }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--c-text)" }}>
          No senior from our network yet — bring one in
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--c-textSub)", marginTop: 4, lineHeight: 1.5 }}>
          We'll find seniors on LinkedIn from your college and target company. Invite one — when they join and answer, you earn a reward.
        </div>
        {state !== "done" && (
          <button onClick={search} disabled={state === "loading"} style={{ ...btn, marginTop: 10, opacity: state === "loading" ? 0.7 : 1 }}>
            <Search size={14} /> {state === "loading" ? "Searching…" : "Find seniors to invite"}
          </button>
        )}
        {state === "error" && <div style={{ color: "#F87171", fontSize: "0.78rem", marginTop: 8 }}>{error}</div>}
      </div>

      {state === "done" && seniors.length === 0 && (
        <div style={{ ...card, marginTop: 8, fontSize: "0.82rem", color: "var(--c-textSub)" }}>
          Couldn't find public profiles for this combination yet. Try again after adding your college and a target company in chat.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {seniors.map((s) => {
          const inv = invited[s.linkedinUrl];
          return (
            <div key={s.linkedinUrl} style={card}>
              <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--c-text)" }}>{s.name}</div>
              {s.headline && <div style={{ fontSize: "0.78rem", color: "var(--c-textSub)", marginTop: 2 }}>{s.headline}</div>}
              {!inv ? (
                <button onClick={() => invite(s)} style={{ ...btn, marginTop: 10 }}>
                  <UserPlus size={14} /> Invite
                </button>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--c-textMuted)", marginBottom: 6 }}>
                    LinkedIn opened — paste this message (copied) in a connection request or DM:
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--c-textSub)", background: "var(--c-active)", borderRadius: 8, padding: 10, lineHeight: 1.5 }}>
                    {inv.message}
                  </div>
                  <button onClick={() => copy(s.linkedinUrl, inv.message)} style={{ ...btn, marginTop: 8, background: "var(--c-active)", color: "var(--c-text)" }}>
                    {copied === s.linkedinUrl ? <Check size={14} /> : <Copy size={14} />} {copied === s.linkedinUrl ? "Copied" : "Copy message"}
                  </button>
                </div>
              )}
            </div>
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
