// First-visit welcome video on Find Jobs (see components/VideoBubble.jsx).
// Drop the recorded clips in public/videos/jobs/ with these names. Until the
// loop clip exists, the bubble doesn't render at all.
export const JOBS_WELCOME_VIDEO = {
  storageKey: "atyant_jobs_video_seen_v1",
  loop: "/videos/jobs/loop.mp4",   // 3–4s muted wave, plays in the circle
  intro: "/videos/jobs/intro.mp4", // plays when the bubble is opened
  chapters: [
    { id: "a", label: "How does matching work?", src: "/videos/jobs/matching.mp4" },
    { id: "b", label: "How do I stand out?", src: "/videos/jobs/stand-out.mp4" },
    { id: "c", label: "What is Auto-apply?", src: "/videos/jobs/auto-apply.mp4" },
  ],
};
