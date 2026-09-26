import { Crown } from "lucide-react";
import { activePlan, PLAN_NAME } from "../../lib/plan";

// Small plan pill for paying users — nothing for free or lapsed plans.
// Pro is amber (the premium colour used for Auto-apply); Clarity is the brand purple.
const LOOK = {
  pro:     { bg: "#B45309", fg: "#fff" },
  clarity: { bg: "#7567C9", fg: "#fff" },
};

export default function PlanBadge({ user, size = "sm", style }) {
  const plan = activePlan(user);
  if (!plan) return null;
  const { bg, fg } = LOOK[plan];
  const sm = size === "sm";
  return (
    <span title={`${PLAN_NAME[plan]} plan`}
      style={{
        display: "inline-flex", alignItems: "center", gap: sm ? 3 : 4, flexShrink: 0,
        fontSize: sm ? "0.56rem" : "0.66rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
        lineHeight: 1, color: fg, background: bg, borderRadius: 4, padding: sm ? "2px 4px" : "3px 6px",
        ...style,
      }}>
      <Crown size={sm ? 8 : 10} strokeWidth={2.5} /> {PLAN_NAME[plan]}
    </span>
  );
}
