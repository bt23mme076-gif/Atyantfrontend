// First-visit welcome video on Find Jobs (see components/VideoBubble.jsx).
// Clips live in public/videos/jobs/. If the
// loop clip is missing, the bubble hides itself.
export const JOBS_WELCOME_VIDEO = {
  storageKey: "atyant_jobs_video_dismissed", // sessionStorage: bubble ✕ hides it for this session only
  ratio: 9 / 16, // clips are portrait; the player also reads it from the video itself
  loop: "/videos/jobs/loop.mp4",   // 3–4s muted wave, plays in the circle
  intro: "/videos/jobs/intro.mp4", // plays when the bubble is opened
  chapters: [
    { id: "a", label: "How does matching work?", src: "/videos/jobs/matching.mp4" },
    { id: "b", label: "How do I stand out?", src: "/videos/jobs/stand-out.mp4" },
    { id: "c", label: "What is Auto-apply?", src: "/videos/jobs/auto-apply.mp4" },
  ],
};
