// Feedback / review setup shared by the FeedbackModal and the places that open it.
// Tags must match the backend's REVIEW_TAGS (models/Review.js) — unknown tags are dropped there.

export const FEEDBACK_PRESETS = {
  platform: {
    title: "Share your feedback",
    subtitle: "How is Atyant working for you so far?",
    placeholder: "What do you like? What should we build or fix next?",
    tags: ["Easy to use", "Found useful answers", "Mock interviews", "Jobs", "Mentor sessions", "Confusing to use", "Slow", "Missing a feature"],
  },
  mock_interview: {
    title: "How was this interview?",
    subtitle: "Your rating helps us make the questions and the report better.",
    placeholder: "Did the questions feel like the real thing? Anything that felt off?",
    tags: ["Questions felt real", "Good follow-ups", "Useful report", "Matched the JD", "Too hard", "Too easy", "Audio/video issues"],
  },
  session: {
    title: "How was your session?",
    subtitle: "Your rating goes on the mentor's profile and helps other students choose.",
    placeholder: "What did you take away? What could have been better?",
    tags: ["Helpful advice", "Understood my situation", "Started on time", "Would book again", "Too short", "Audio/video issues"],
  },
};

export const RATING_WORDS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
export const FEEDBACK_MAX = 1000;

// "Don't auto-ask again" memory, per interview/session and for platform feedback.
// Stored in the browser only; the server still refuses duplicates either way.
const key = (kind, id) => `atyant_fb_${kind}${id ? `_${id}` : ""}`;

export function wasAsked(kind, id) {
  try { return !!localStorage.getItem(key(kind, id)); } catch { return true; }   // storage blocked → never nag
}

export function markAsked(kind, id) {
  try { localStorage.setItem(key(kind, id), String(Date.now())); } catch { /* ignore */ }
}

// Platform prompt: at most once every 30 days.
export function platformAskedRecently(days = 30) {
  try {
    const at = Number(localStorage.getItem(key("platform")) || 0);
    return at > 0 && Date.now() - at < days * 864e5;
  } catch { return true; }
}
