// Mirrors the backend's hasActivePlan (middleware/subscriptionMiddleware.js) so the
// UI can show an upgrade prompt up front. The server enforces it either way.
const PLAN_LEVEL = { free: 0, clarity: 1, pro: 2 };

export function hasActivePlan(user, requiredPlan = "clarity") {
  if (!user) return false;
  if ((PLAN_LEVEL[user.subscriptionPlan] || 0) < (PLAN_LEVEL[requiredPlan] || 0)) return false;
  const expired = user.subscriptionExpiry && new Date() > new Date(user.subscriptionExpiry);
  if (expired) return false;
  // Cancelling stops renewal, not access — a cancelled plan works until its paid-up expiry.
  if (user.subscriptionStatus === "active") return true;
  return user.subscriptionStatus === "cancelled" && !!user.subscriptionExpiry;
}

// Auto-apply: any active Clarity or Pro plan.
export const canAutoApply = (user) => hasActivePlan(user, "clarity");

// "clarity" | "pro" while that plan is usable, otherwise null.
export function activePlan(user) {
  if (hasActivePlan(user, "pro")) return "pro";
  if (hasActivePlan(user, "clarity")) return "clarity";
  return null;
}

export const PLAN_NAME = { clarity: "Clarity", pro: "Pro" };

// "27 Oct 2026", or null when there's no expiry on record.
export function planExpiryText(user) {
  if (!user?.subscriptionExpiry) return null;
  return new Date(user.subscriptionExpiry).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
