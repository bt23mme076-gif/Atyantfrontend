import { paymentAPI } from "../api";

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
 * The ONE real checkout used everywhere money is collected (booking page AND the
 * inline Clarity sheet). Money lands in the company Razorpay account; the server
 * verifies the signature, confirms the session, and records the mentor's payout
 * share. Price is fixed server-side from `serviceId` — never trusted from the client.
 *
 * @param {object}   p
 * @param {string}   p.mentorId        real User _id of the mentor
 * @param {string}   p.date            e.g. "May 26, 2026"
 * @param {string}   p.time            e.g. "9:00 AM"
 * @param {string}   [p.serviceId]     platform service id (drives the price)
 * @param {string}   [p.topic]
 * @param {number}   [p.durationMin]
 * @param {object}   [p.prefill]       { name, email, contact }
 * @param {function} p.onSuccess       (sessionId) => void
 * @param {function} [p.onError]       (message)   => void
 * @param {function} [p.onClose]       ()          => void  (user dismissed the modal)
 */
export async function payForSession({
  mentorId, date, time, serviceId, topic, durationMin,
  prefill = {}, onSuccess, onError = () => {}, onClose = () => {},
}) {
  if (!mentorId) return onError("Missing mentor — please reopen and try again.");
  if (!date || !time) return onError("Pick a date and time first.");

  let order;
  try {
    order = await paymentAPI.createOrder({ mentorId, date, time, topic, durationMin, serviceId });
  } catch (e) {
    return onError(e?.message || "Could not start checkout.");
  }

  // Free service → already confirmed server-side, no Razorpay needed.
  if (order?.free) return onSuccess(order?.session?._id || "");
  if (!order?.orderId) return onError(order?.error || "Could not create the order.");

  const ok = await loadRazorpay();
  if (!ok) return onError("Could not load the payment gateway. Check your connection.");

  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,        // paise
    currency: order.currency,
    name: "Atyant",
    description: `Session with ${order.mentorName}`,
    order_id: order.orderId,
    prefill,
    theme: { color: "#7567C9" },
    handler: async (resp) => {
      try {
        const result = await paymentAPI.verify({
          sessionId: order.sessionId,
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
        });
        if (result?.ok) onSuccess(order.sessionId);
        else onError(result?.error || "Payment verification failed. If you were charged, contact support.");
      } catch (e) {
        onError(e?.message || "Payment verification failed. If you were charged, contact support.");
      }
    },
    modal: { ondismiss: () => onClose() },
  });
  rzp.open();
}
