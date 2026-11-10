// Labels and helpers shared by the Atyant Hire pages.

export const VERDICT = {
  strong_yes: { label: "Strong yes", tone: "green" },
  yes:        { label: "Yes",        tone: "green" },
  maybe:      { label: "Maybe",      tone: "amber" },
  no:         { label: "No",         tone: "red" },
};

export const APP_STATUS = {
  applied:     { label: "Preparing",   tone: "gray" },
  ready:       { label: "Not started", tone: "gray" },
  in_progress: { label: "Interviewing", tone: "purple" },
  evaluating:  { label: "Scoring",     tone: "purple" },
  completed:   { label: "Completed",   tone: "green" },
  failed:      { label: "Failed",      tone: "red" },
};

export const JOB_STATUS = {
  parsing: { label: "Reading JD", tone: "gray" },
  ready:   { label: "Draft",      tone: "amber" },
  live:    { label: "Live",       tone: "green" },
  paused:  { label: "Paused",     tone: "amber" },
  closed:  { label: "Closed",     tone: "gray" },
  failed:  { label: "Failed",     tone: "red" },
};

export function scoreTone(score) {
  if (score == null) return { background: "var(--c-active)", color: "var(--c-textMuted)" };
  if (score >= 70) return { background: "#16A34A1a", color: "#16A34A" };
  if (score >= 50) return { background: "#D977061a", color: "#D97706" };
  return { background: "#DC26261a", color: "#DC2626" };
}

export const timeAgo = (d) => {
  if (!d) return "";
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
