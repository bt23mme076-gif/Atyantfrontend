import { useEffect, useState } from "react";
import { HOME_STEPS, HOME_FAQ, MARKETING_LINKS } from "../../seo/site.js";

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

const STEPS = HOME_STEPS;
const FAQ = HOME_FAQ;

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
        <li><a style={link} href="/mentor-onboard" onClick={spa(onGoToMentorOnboard)}>Become a mentor</a>: guide juniors from a college and branch like yours.</li>
        {MARKETING_LINKS.map((l) => (
          <li key={l.path}><a style={link} href={l.path}>{l.label}</a>: {l.blurb}</li>
        ))}
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
