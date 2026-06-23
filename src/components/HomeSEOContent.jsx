// HomeSEOContent — crawlable, semantic homepage content for SEO.
//
// The clarity-engine chat fills the first viewport. This section sits below it
// (normal body-flow) so Googlebot indexes real text — H1, how-it-works, FAQ —
// instead of an empty input box. It's the only on-page SEO lever a single-URL
// app has, so the copy targets head terms: career clarity, engineering students,
// internships, placements, career switch, higher studies.
//
// Theme-aware via the app's CSS variables (clean light by default, correct in
// dark). Accent is the brand purple (#7567C9). College-agnostic — no single
// college is favored.

const FAQS = [
  {
    q: "What is Atyant?",
    a: "Atyant is a career clarity engine for Indian engineering students. You type your exact confusion about internships, placements, higher studies or a career switch, and get a verified answer from a senior who went from your college and branch to the path you want.",
  },
  {
    q: "How is Atyant different from a mentor marketplace or a chatbot?",
    a: "It is neither. Every answer is a verified AnswerCard from a senior with the same college, branch and destination. AI matches your exact question to the person who actually walked that path — not generic advice, not a random listing of mentors.",
  },
  {
    q: "How much does it cost?",
    a: "Reading verified answers is free. Optional 1:1 sessions with a matched senior are priced between Rs 49 and Rs 599.",
  },
  {
    q: "Which colleges and branches does Atyant cover?",
    a: "NITs, IITs, IIITs, BITS and engineering colleges across India — with seniors from CSE, ECE, Mechanical, Metallurgy, Civil, Chemical and more who moved into software, data, product, core and higher studies.",
  },
];

const STEPS = [
  {
    n: "1",
    t: "Type your confusion in plain words",
    d: "“I’m in 2nd year, non-CS branch, how do I get a software internship?” No forms, no filters — just your real situation.",
  },
  {
    n: "2",
    t: "Get matched to a verified senior’s path",
    d: "AI matches your intent to a verified AnswerCard from a senior with the same college, branch and target company. Real steps, real timeline.",
  },
  {
    n: "3",
    t: "Read the path, then talk to the senior",
    d: "Read the verified answer for free. If you want more, book a 1:1 session with the exact senior who did it — from Rs 49.",
  },
];

const wrap = {
  background: "var(--c-bg)",
  color: "var(--c-text)",
  fontFamily: "'Satoshi',-apple-system,sans-serif",
  padding: "64px 20px 88px",
  borderTop: "1px solid var(--c-cardBorder)",
};
const inner = { maxWidth: 880, margin: "0 auto" };
const accent = "#7567C9";

export default function HomeSEOContent() {
  return (
    <section style={wrap} aria-label="About Atyant">
      <div style={inner}>
        <h1 style={{ fontSize: "1.9rem", lineHeight: 1.25, fontWeight: 700, margin: "0 0 14px", letterSpacing: "-0.02em" }}>
          Career clarity for Indian engineering students — from seniors who
          actually walked your path
        </h1>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--c-textSub)", margin: "0 0 16px", maxWidth: 720 }}>
          Stuck on internships, placements, a career switch or higher studies?
          Atyant matches your exact confusion — your college, your branch, your
          goal — to a <strong>verified answer</strong> from a senior who did it.
          Not scattered Quora opinions. Not a chatbot. Real, journey-tracked
          paths from people one step ahead of you.
        </p>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--c-textSub)", margin: "0 0 8px", maxWidth: 720 }}>
          Built for students at NITs, IITs, IIITs, BITS and engineering colleges
          across India — from CSE and ECE to Mechanical, Metallurgy and Civil —
          chasing software, data, product, core roles, MS, MBA or GATE.
        </p>

        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "48px 0 22px", letterSpacing: "-0.01em" }}>
          How Atyant works
        </h2>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {STEPS.map((s) => (
            <div
              key={s.n}
              style={{
                background: "var(--c-card)",
                border: "1px solid var(--c-cardBorder)",
                borderRadius: 14,
                padding: "20px 18px",
              }}
            >
              <div
                style={{
                  width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center",
                  background: "var(--c-accentSoft)", color: accent, fontWeight: 700, fontSize: "0.95rem", marginBottom: 12,
                }}
              >
                {s.n}
              </div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 6px" }}>{s.t}</h3>
              <p style={{ fontSize: "0.92rem", lineHeight: 1.55, color: "var(--c-textMuted)", margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "52px 0 18px", letterSpacing: "-0.01em" }}>
          Frequently asked questions
        </h2>
        <dl style={{ margin: 0 }}>
          {FAQS.map((f) => (
            <div
              key={f.q}
              style={{ padding: "18px 0", borderBottom: "1px solid var(--c-cardBorder)" }}
            >
              <dt style={{ fontSize: "1.02rem", fontWeight: 600, margin: "0 0 8px" }}>{f.q}</dt>
              <dd style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.6, color: "var(--c-textSub)" }}>{f.a}</dd>
            </div>
          ))}
        </dl>

        <p style={{ marginTop: 40, fontSize: "0.95rem", color: "var(--c-textMuted)" }}>
          Ready to stop guessing?{" "}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{ color: accent, fontWeight: 600, textDecoration: "none" }}
          >
            Ask Atyant your question →
          </a>
        </p>
      </div>
    </section>
  );
}
