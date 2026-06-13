import { subscriptionAPI } from "../api";

// Lazily inject the Razorpay Checkout script (once).
export function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * Purchase a subscription plan (Clarity or Pro)
 * 
 * @param {object}   p
 * @param {string}   p.plan            'clarity' | 'pro'
 * @param {string}   p.billing         'monthly' | 'yearly'
 * @param {object}   [p.prefill]       { name, email, contact }
 * @param {function} p.onSuccess       (subscription) => void
 * @param {function} [p.onError]       (message)   => void
 * @param {function} [p.onClose]       ()          => void  (user dismissed the modal)
 */
export async function purchaseSubscription({
  plan, billing, prefill = {}, onSuccess = () => {}, onError = () => {}, onClose = () => {},
}) {
  if (!plan || !billing) return onError("Plan and billing cycle are required.");

  let order;
  try {
    order = await subscriptionAPI.create(plan, billing);
  } catch (e) {
    return onError(e?.message || "Could not start checkout.");
  }

  if (!order?.orderId) return onError(order?.error || "Could not create the order.");

  const ok = await loadRazorpay();
  if (!ok) return onError("Could not load the payment gateway. Check your connection.");

  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,        // paise
    currency: order.currency,
    name: "Atyant",
    description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${billing})`,
    order_id: order.orderId,
    prefill,
    theme: { color: "#7567C9" },
    handler: async (resp) => {
      try {
        const result = await subscriptionAPI.verify({
          plan,
          billing,
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
        });
        if (result?.ok) onSuccess(result.subscription);
        else onError(result?.error || "Payment verification failed. If you were charged, contact support.");
      } catch (e) {
        onError(e?.message || "Payment verification failed. If you were charged, contact support.");
      }
    },
    modal: { ondismiss: () => onClose() },
  });
  rzp.open();
}
