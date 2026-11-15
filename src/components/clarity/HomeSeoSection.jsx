import { useEffect, useState } from "react";

// Below-the-fold content for the homepage. The landing view above is an app
// screen (an input and a few buttons), so on its own the page gave search
// engines about 130 words and two links. This adds what Atyant is, how it
// works, real <a> links to every public page and guide, and the FAQ as visible
// text (index.html already declares the same questions as FAQPage JSON-LD;
// keep the two in sync).

const C = {
  card: "var(--c-card)",
  cardBorder: "var(--c-cardBorder)",
  text: "var(--c-text)",
  textSub: "var(--c-textSub)",
  accentText: "var(--c-accentText)",
};

const STEPS = [
  ["Ask your exact question", "Placements, internships, higher studies or a career switch. Add your college, branch and year so the answer fits your situation."],
  ["Get matched with seniors like you", "AI finds seniors who came from the same kind of college, branch and resources and still cracked that goal, and shows you what actually worked for them."],
  ["Act on it", "Practise with an AI mock interview built from the job description, browse internships and fresher jobs, or book an optional 1:1 session with a matched senior."],
];

const FAQ = [
  ["What is Atyant?", "Atyant is India's first Human + AI career execution platform for engineering students. You ask your exact question about placements, internships, higher studies or a career switch. AI matches you with a senior who came from the same kind of college, branch and resources as you and still cracked that goal, so you get what actually worked for them, plus tools like AI mock interviews to act on it."],
  ["How is Atyant different from other career guidance?", "Most career advice comes from people who never faced your situation, so it stays generic. Atyant matches you with a senior from the same background: your college or one like it, your branch, the same limited resources. Their guidance is what actually worked for someone in your position."],
  ["How is Atyant different from a mentor marketplace?", "Mentor marketplaces list mentors by company and job title. Atyant organises everything around background match: AI finds seniors who faced the same problem with the same college, branch and resources, and you read what actually worked for them before you ever book a session."],
  ["How much does a 1:1 session cost on Atyant?", "Reading seniors' answers is free. Optional 1:1 sessions with a matched senior are priced between Rs 49 and Rs 599."],
  ["Which colleges and branches does Atyant cover?", "Any engineering college across India: IITs, NITs, IIITs, BITS, private and state colleges and more. Seniors come from CSE, ECE, Mechanical, Metallurgy, Civil and more, and moved into software, data, product and core roles."],
];

const h2 = { fontSize: "1.15rem", fontWeight: 700, color: C.text, margin: "0 0 0.9rem", fontFamily: "var(--font-display, inherit)" };
const card = { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "14px 16px" };
const link = { color: C.accentText, textDecoration: "none", fontWeight: 600 };

export default function HomeSeoSection({ onGoToJobs, onGoToMockInterview, onGoToMentorOnboard }) {
  // The guide list comes from the same data the static /guides pages are built
  // from. Loaded on its own chunk so the guide text stays out of the main bundle.
  const [guides, setGuides] = useState([]);
  useEffect(() => {
    let cancelled = false;
    import("../../seo/guides.js").then((m) => {
      if (!cancelled) setGuides(m.GUIDES.map((g) => ({ slug: g.slug, h1: g.h1, description: g.description })));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // In-app views: keep them crawlable links, but switch view without a reload.
  const spa = (fn) => (e) => {
    if (!fn || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    fn();
  };

  return (
    <section aria-label="About Atyant" style={{ width: "100%", maxWidth: 760, margin: "3.5rem auto 1rem", textAlign: "left", fontSize: "0.92rem", lineHeight: 1.6, color: C.textSub }}>
      <h2 style={h2}>How Atyant works</h2>
      <ol style={{ listStyle: "none", padding: 0, margin: "0 0 2.2rem", display: "grid", gap: 10 }}>
        {STEPS.map(([title, text], i) => (
          <li key={title} style={card}>
            <strong style={{ color: C.text }}>{i + 1}. {title}</strong>
            <div>{text}</div>
          </li>
        ))}
      </ol>

      <h2 style={h2}>What you can do on Atyant</h2>
      <ul style={{ padding: 0, margin: "0 0 2.2rem", listStyle: "none", display: "grid", gap: 8 }}>
        <li><a style={link} href="/mock-interview" onClick={spa(onGoToMockInterview)}>AI mock interview</a>: paste a job description and your resume, answer out loud, get a score and feedback on every answer.</li>
        <li><a style={link} href="/jobs" onClick={spa(onGoToJobs)}>Jobs for freshers</a>: internships and fresher openings you can filter by city, work mode and date.</li>
        <li><a style={link} href="/guides">Placement guides from seniors</a>: what seniors from colleges like yours actually did.</li>
        <li><a style={link} href="/internships">IIT and IIM research internships</a>: professor emails and cold email templates.</li>
        <li><a style={link} href="/career-guides">Career tracks</a>: analytics, software, product and AI/ML roadmaps.</li>
        <li><a style={link} href="/mentor-onboard" onClick={spa(onGoToMentorOnboard)}>Become a mentor</a>: guide juniors from a college and branch like yours.</li>
        <li><a style={link} href="/company">About Atyant</a> · <a style={link} href="/achievements">Achievements</a></li>
      </ul>

      {guides.length > 0 && (
        <>
          <h2 style={h2}>Placement and internship guides</h2>
          <ul style={{ padding: 0, margin: "0 0 2.2rem", listStyle: "none", display: "grid", gap: 10 }}>
            {guides.map((g) => (
              <li key={g.slug} style={card}>
                <a style={link} href={`/guides/${g.slug}`}>{g.h1}</a>
                <div>{g.description}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 style={h2}>Frequently asked questions</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {FAQ.map(([q, a]) => (
          <div key={q} style={card}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{q}</h3>
            <p style={{ margin: 0 }}>{a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
