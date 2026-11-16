// Shared, plain-JS site data (no JSX) so both the React app and the Node build
// scripts (scripts/prerender.js, scripts/render-guides.js) read the same copy.
// The static HTML Google fetches first is built from this, so every public page
// is reachable through plain <a href> links before any JavaScript runs.

// Pages served by the marketing site (proxied in vercel.json). Keep in sync
// with EXTERNAL_PATHS in scripts/prerender.js.
export const MARKETING_LINKS = [
  { path: "/internships", label: "IIT and IIM research internships", blurb: "professor emails and cold email templates." },
  { path: "/career-guides", label: "Career tracks", blurb: "analytics, software, product and AI/ML roadmaps." },
  { path: "/resume-store", label: "Resume templates", blurb: "ATS-friendly resume templates you can edit in Canva." },
  { path: "/webinar", label: "Live webinars", blurb: "sessions with seniors who cracked internships from non-IIT colleges." },
  { path: "/company", label: "About Atyant", blurb: "the team, the story and how Atyant works." },
  { path: "/achievements", label: "Achievements", blurb: "Hult Prize 2026, Pitch Wars and other milestones." },
];

export const HOME_STEPS = [
  ["Ask your exact question", "Placements, internships, higher studies or a career switch. Add your college, branch and year so the answer fits your situation."],
  ["Get matched with seniors like you", "AI finds seniors who came from the same kind of college, branch and resources and still cracked that goal, and shows you what actually worked for them."],
  ["Act on it", "Practise with an AI mock interview built from the job description, browse internships and fresher jobs, or book an optional 1:1 session with a matched senior."],
];

// index.html declares the same questions as FAQPage JSON-LD; keep the two in sync.
export const HOME_FAQ = [
  ["What is Atyant?", "Atyant is India's first Human + AI career execution platform for engineering students. You ask your exact question about placements, internships, higher studies or a career switch. AI matches you with a senior who came from the same kind of college, branch and resources as you and still cracked that goal, so you get what actually worked for them, plus tools like AI mock interviews to act on it."],
  ["How is Atyant different from other career guidance?", "Most career advice comes from people who never faced your situation, so it stays generic. Atyant matches you with a senior from the same background: your college or one like it, your branch, the same limited resources. Their guidance is what actually worked for someone in your position."],
  ["How is Atyant different from a mentor marketplace?", "Mentor marketplaces list mentors by company and job title. Atyant organises everything around background match: AI finds seniors who faced the same problem with the same college, branch and resources, and you read what actually worked for them before you ever book a session."],
  ["How much does a 1:1 session cost on Atyant?", "Reading seniors' answers is free. Optional 1:1 sessions with a matched senior are priced between Rs 49 and Rs 599."],
  ["Which colleges and branches does Atyant cover?", "Any engineering college across India: IITs, NITs, IIITs, BITS, private and state colleges and more. Seniors come from CSE, ECE, Mechanical, Metallurgy, Civil and more, and moved into software, data, product and core roles."],
];
