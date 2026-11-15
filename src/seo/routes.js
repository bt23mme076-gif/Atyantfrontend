// Public, indexable views of the SPA. Each one gets a real URL, its own
// prerendered HTML file with route-specific head tags (scripts/prerender.js)
// and a sitemap entry. Plain JS (no JSX) so the Node build script can import it.
//
// Adding a route here also needs a matching rewrite in vercel.json.

export const SITE = "https://atyant.in";
export const DEFAULT_OG = `${SITE}/og-default.jpg`;

export const PUBLIC_ROUTES = [
  {
    page: "ask",
    path: "/",
    title: "Atyant - India's First Human + AI Career Execution Platform",
    description:
      "India's first Human + AI career execution platform. Placement and internship guidance from seniors of your college and branch who already did it.",
    h1: "Placement and internship guidance from seniors who started where you are",
    intro:
      "Atyant is India's first Human + AI career execution platform. Any engineering college, any branch: ask your exact placement or internship question and get guidance from a senior who came from your kind of college, your branch and the same resources, and still made it. What actually worked for them, not generic advice.",
  },
  {
    page: "jobs",
    path: "/jobs",
    title: "Fresher Jobs in India - Filter, Apply & Prepare | Atyant",
    description:
      "Browse fresh job openings for college students and freshers in India. Filter by city, work mode and date posted, draft a cover letter, and practise a mock interview for any role.",
    h1: "Jobs for freshers",
    intro:
      "Fresh openings for college students and freshers. Filter by city, work mode and date posted, draft a cover letter, and practise a mock interview for the role before you apply.",
  },
  {
    page: "mock-interview",
    path: "/mock-interview",
    title: "AI Mock Interview for Any Job Description | Atyant",
    description:
      "Practise the interview before the real one. Paste the job description and your resume: an AI interviewer asks what that company would ask, digs into your projects and pushes back when an answer is thin.",
    h1: "Practice the interview before the real one",
    intro:
      "An AI interviewer asks what this company would ask, digs into your projects, and pushes back when an answer is thin. Paste the job description and your resume to start.",
    // Rendered as visible Q&A and as FAQPage JSON-LD by scripts/prerender.js.
    faq: [
      [
        "How does the Atyant AI mock interview work?",
        "You paste the full job description and upload your resume as a PDF. The AI reads both, plans questions that mix what the job description asks for with your own projects, and then runs a live video round: camera on, answers out loud, no pausing.",
      ],
      [
        "Is the mock interview specific to the company and role?",
        "Yes. The questions are built from the job description you paste and the company name you add, so a mock for a data analyst role is different from one for a software engineer role.",
      ],
      [
        "What feedback do I get after the mock interview?",
        "A score out of 100 with a breakdown for each skill, feedback on every answer that quotes what you actually said, stronger sample answers, and a list of what to prepare before the real interview.",
      ],
      [
        "Does the AI interviewer ask follow-up questions?",
        "Yes. Thin answers get follow-ups, the way a real interviewer would push, so it helps to say why you picked a tool or approach and to give real numbers.",
      ],
      [
        "Who is the AI mock interview for?",
        "College students and freshers in India preparing for campus placements, off-campus drives and internship interviews, in any engineering branch.",
      ],
    ],
  },
  {
    page: "mentor-onboard",
    path: "/mentor-onboard",
    title: "Mentor Juniors from a College Like Yours | Atyant",
    description:
      "Cracked a placement or internship? Guide juniors from a college and branch like yours, share the real path you took and take paid 1:1 sessions.",
    h1: "Become an Atyant mentor",
    intro:
      "Help juniors from a background like yours. Share the real path you took from your college to your company, publish AnswerCards and take paid 1:1 sessions.",
  },
];

export const PAGE_TO_PATH = Object.fromEntries(PUBLIC_ROUTES.map((r) => [r.page, r.path]));
export const PATH_TO_PAGE = Object.fromEntries(PUBLIC_ROUTES.map((r) => [r.path, r.page]));

// "/jobs/" and "/jobs" are the same view.
export const pageForPath = (pathname) =>
  PATH_TO_PAGE[pathname.replace(/\/+$/, "") || "/"];
