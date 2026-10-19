import { useCallback, useEffect, useState } from "react";
import { jobsAPI } from "../api";
import { purchaseSubscription } from "./subscriptionCheckout";
import { canAutoApply } from "./plan";

// First-paint fallback; the usage endpoint returns the live values.
export const PASS_FALLBACK = { price: 49, listPrice: 99, days: 30 };
export const FREE_TRIAL_APPLIES = 5;

/**
 * The student's auto-apply allowance, from the server (only it can count the
 * free trial): { mode: "plan" | "pass" | "trial" | "none", limit, used,
 * remaining, resetsAt, passExpiry?, pass: { price, listPrice, days } }.
 * `allowed` falls back to the plan check until the request returns.
 */
export function useAutoApplyAccess(user) {
  const [access, setAccess] = useState(null);
  const userId = user?._id;

  const refresh = useCallback(() => {
    if (!userId) return Promise.resolve();
    return jobsAPI.autoApplyUsage().then(setAccess).catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    jobsAPI.autoApplyUsage().then((a) => { if (live) setAccess(a); }).catch(() => {});
    return () => { live = false; };
  }, [userId]);

  const current = userId ? access : null;
  const allowed = current ? current.mode !== "none" : canAutoApply(user);
  return { access: current, allowed, refresh };
}

// Opens Razorpay for the ₹49 Auto-Apply pass. Price and duration come from the server-side order.
export function buyAutoApplyPass({ user, onSuccess, onError, onClose }) {
  return purchaseSubscription({
    plan: "autoapply",
    billing: "monthly",
    prefill: { name: user?.name || user?.username || "", email: user?.email || "" },
    onSuccess,
    onError,
    onClose,
  });
}
