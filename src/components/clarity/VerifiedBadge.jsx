import { useState } from "react";
import { ShieldCheck } from "lucide-react";

export default function VerifiedBadge({ verifiedVia = "Offer Letter + LinkedIn" }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-default select-none"
        style={{
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <ShieldCheck size={13} style={{ color: "#10B981" }} />
        <span className="text-xs font-medium" style={{ color: "#10B981", fontFamily: "Inter, sans-serif" }}>
          Verified outcome
        </span>
      </div>

      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap px-3 py-2 rounded-lg text-xs shadow-lg"
          style={{
            background: "#1a1a1a",
            border: "1px solid #262626",
            color: "#A8A29E",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <span style={{ color: "#10B981", fontWeight: 600 }}>✓ Verified via </span>
          {verifiedVia}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #262626",
            }}
          />
        </div>
      )}
    </div>
  );
}
