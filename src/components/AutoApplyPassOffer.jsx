import { useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { buyAutoApplyPass, PASS_FALLBACK } from "../lib/autoApplyAccess";

// "₹99 ₹49 · 30 days" offer + checkout button, shown once the free auto-applies are used up.
export default function AutoApplyPassOffer({ pass = PASS_FALLBACK, onPurchased, compact = false }) {
  const { user, refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { price, listPrice, days } = { ...PASS_FALLBACK, ...pass };

  const buy = () => {
    setBusy(true);
    setError("");
    buyAutoApplyPass({
      user,
      onSuccess: async () => {
        await refreshUser?.();
        await onPurchased?.();
        setBusy(false);
      },
      onError: (msg) => { setError(msg); setBusy(false); },
      onClose: () => setBusy(false),
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        {listPrice > price && <span style={{ fontSize: compact ? ".82rem" : ".9rem", color: "var(--c-textMuted)", textDecoration: "line-through" }}>₹{listPrice}</span>}
        <span style={{ fontSize: compact ? "1.05rem" : "1.25rem", fontWeight: 800, color: "var(--c-text)" }}>₹{price}</span>
        <span style={{ fontSize: ".78rem", color: "var(--c-textSub)" }}>for {days} days</span>
        {listPrice > price && (
          <span style={{ fontSize: ".66rem", fontWeight: 700, color: "#fff", background: "#1F9D63", borderRadius: 4, padding: "2px 6px" }}>
            {Math.round((1 - price / listPrice) * 100)}% OFF
          </span>
        )}
      </div>
      <button onClick={buy} disabled={busy} className="jb-btn"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".84rem", fontWeight: 700, color: "#fff", background: "#B45309", border: "none", borderRadius: 8, padding: "9px 16px", cursor: busy ? "default" : "pointer", fontFamily: "inherit" }}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />} Get Auto-Apply pass
      </button>
      {error && <div style={{ flexBasis: "100%", fontSize: ".76rem", color: "#B91C1C" }}>{error}</div>}
    </div>
  );
}
