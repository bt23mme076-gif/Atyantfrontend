import { useEffect, useState } from "react";
import { inviteAPI } from "../../api";

// What an invited senior sees first: the junior's actual question.
export default function InviteLanding({ code, signedIn, onJoin, onDismiss }) {
  const [info, setInfo] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    inviteAPI.landing(code).then(setInfo).catch(() => setFailed(true));
  }, [code]);

  if (failed) { onDismiss(); return null; }
  if (!info) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--c-card)", color: "var(--c-text)", border: "1px solid var(--c-cardBorder)", borderRadius: 16, padding: 24, maxWidth: 440, width: "100%" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#7567C9", letterSpacing: "0.04em", textTransform: "uppercase" }}>Atyant</div>
        <h2 style={{ fontSize: "1.2rem", margin: "8px 0 10px" }}>
          {info.inviterName} from your background has a question for you, {info.seniorName.split(" ")[0]}
        </h2>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--c-textSub)", background: "var(--c-active)", borderRadius: 10, padding: 12, margin: 0 }}>
          “{info.question}”
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--c-textMuted)", margin: "12px 0 16px" }}>
          Takes about 2 minutes. Your answer helps a junior from your own college and branch.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onJoin} style={{ flex: 1, background: "#7567C9", color: "#fff", border: "none", borderRadius: 10, padding: "11px 14px", fontWeight: 700, cursor: "pointer" }}>
            {signedIn ? "Answer as a mentor" : "Sign in to answer"}
          </button>
          <button onClick={onDismiss} style={{ background: "transparent", color: "var(--c-textSub)", border: "1px solid var(--c-cardBorder)", borderRadius: 10, padding: "11px 14px", cursor: "pointer" }}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
