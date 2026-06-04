import { useState } from "react";
import { ShieldCheck } from "lucide-react";

// Design tokens
const T = {
  green: "#3DBE82",
  card: "var(--c-card)",
  cardBorder: "var(--c-cardBorder)",
  textMuted: "var(--c-textMuted)",
  textSub: "var(--c-textSub)",
};

export default function VerifiedBadge({ verifiedVia = "Offer Letter + LinkedIn" }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-default select-none"
        style={{
          background: `${T.green}18`,
          border: `1px solid ${T.green}40`,
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <ShieldCheck size={12} style={{ color: T.green }} />
        <span className="text-xs font-medium" style={{ color: T.green, fontFamily: "Inter, sans-serif" }}>
          Verified outcome
        </span>
      </div>

      {show && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap px-3 py-2 rounded-lg text-xs shadow-xl"
          style={{
            background: T.card,
            border: `1px solid ${T.cardBorder}`,
            color: T.textSub,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <span style={{ color: T.green, fontWeight: 600 }}>✓ Verified via </span>
          {verifiedVia}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `5px solid ${T.cardBorder}`,
            }}
          />
        </div>
      )}
    </div>
  );
}
