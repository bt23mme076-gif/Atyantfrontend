// Renders src/seo/guides.js to fully static HTML at dist/guides/<slug>/index.html
// plus a hub at dist/guides/index.html. No JS bundle: the content is in the HTML
// itself, so every crawler (and AI answer engine) sees it without rendering.
// Called from scripts/prerender.js, which adds the returned URLs to sitemap.xml.

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { SITE, DEFAULT_OG } from "../src/seo/routes.js";
import { GUIDES, GUIDES_UPDATED, GUIDES_HUB_UPDATED } from "../src/seo/guides.js";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const jsonLd = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")}</script>`;

const anchor = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const prettyDate = new Date(`${GUIDES_UPDATED}T00:00:00Z`).toLocaleDateString("en-IN", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
});

const ORG = { "@type": "Organization", name: "Atyant", url: `${SITE}/` };
const PUBLISHER = { ...ORG, logo: { "@type": "ImageObject", url: `${SITE}/logo.jpg` } };

const CSS = `
:root{--bg:hsl(240 15% 98%);--fg:hsl(250 33% 15%);--card:#fff;--muted:hsl(249 40% 95%);--muted-fg:hsl(252 10% 45%);--border:hsl(250 15% 90%);--primary:hsl(249 49% 60%);--primary-fg:#fff;--link:hsl(249 49% 50%)}
@media (prefers-color-scheme:dark){:root{--bg:hsl(247 19% 10%);--fg:hsl(255 24% 95%);--card:hsl(251 19% 15%);--muted:hsl(251 25% 20%);--muted-fg:hsl(252 11% 73%);--border:hsl(251 19% 28%);--link:hsl(249 70% 76%)}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.7 'Satoshi',-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--link)}
.wrap{max-width:760px;margin:0 auto;padding:0 16px}
.top{border-bottom:1px solid var(--border);background:var(--card)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;height:60px;max-width:960px}
.brand{font-weight:700;font-size:1.15rem;color:var(--fg);text-decoration:none}
.top nav{display:flex;gap:16px;align-items:center}
.top nav a{text-decoration:none;font-weight:500}
.btn{display:inline-block;background:var(--primary);color:var(--primary-fg)!important;padding:9px 16px;border-radius:10px;text-decoration:none;font-weight:600}
.crumbs{font-size:.85rem;color:var(--muted-fg);margin:28px 0 8px}
.crumbs a{color:var(--muted-fg)}
h1{font-size:clamp(1.7rem,4.5vw,2.4rem);line-height:1.2;margin:8px 0 10px;text-wrap:balance}
h2{font-size:1.35rem;line-height:1.3;margin:40px 0 10px;text-wrap:balance}
h3{font-size:1.05rem;margin:22px 0 4px}
.meta{color:var(--muted-fg);font-size:.88rem;margin:0 0 20px}
.lead{font-size:1.1rem;background:var(--muted);border-radius:12px;padding:18px 20px;margin:0}
.toc{border:1px solid var(--border);border-radius:12px;padding:14px 20px;margin:24px 0;background:var(--card)}
.toc strong{font-size:.85rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted-fg)}
.toc ol{margin:6px 0 0;padding-left:20px}
ul,ol{padding-left:22px}
li{margin:6px 0}
.stories{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.story{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 18px;font-size:.95rem}
.story p{margin:6px 0}
.story .path{font-weight:600;line-height:1.4}
.story .when{color:var(--muted-fg);font-size:.85rem}
.cta{background:var(--muted);border-radius:16px;padding:24px;margin:44px 0;text-align:center}
.cta h2{margin-top:0}
.related ul{list-style:none;padding:0}
.related li{border-top:1px solid var(--border);padding:12px 0}
.related li p{margin:2px 0 0;color:var(--muted-fg);font-size:.92rem}
.cards{list-style:none;padding:0;display:grid;gap:14px}
.cards li{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin:0}
.cards h3{font-size:1.15rem;line-height:1.35;margin:0 0 4px}
.cards p{margin:8px 0 0}
.cards .facts{margin:0;color:var(--muted-fg);font-size:.85rem}
.cards .inside{font-size:.88rem;display:flex;flex-wrap:wrap;gap:4px 14px}
.cards .inside span{color:var(--muted-fg)}
.lead p{margin:0}
.lead p+p{margin-top:12px}
.qs{list-style:none;padding:0;margin:12px 0 0;border:1px solid var(--border);border-radius:12px;background:var(--card)}
.qs li{margin:0;border-top:1px solid var(--border)}
.qs li:first-child{border-top:0}
.qs a{display:block;padding:11px 18px;text-decoration:none}
.qs a:hover{text-decoration:underline}
.foot{border-top:1px solid var(--border);margin-top:56px;padding:24px 16px 40px;font-size:.88rem;color:var(--muted-fg)}
.foot nav{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:8px}
`;

function page({ title, description, url, ogType, schema, body }) {
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${url}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<link rel="icon" type="image/jpeg" href="/logo.jpg" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${DEFAULT_OG}" />
<meta property="og:type" content="${ogType}" />
<meta property="og:site_name" content="Atyant" />
<meta property="og:locale" content="en_IN" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${DEFAULT_OG}" />
<link rel="preconnect" href="https://api.fontshare.com" crossorigin />
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap" rel="stylesheet" />
<style>${CSS}</style>
${schema.map(jsonLd).join("\n")}
</head>
<body>
<header class="top"><div class="wrap"><a class="brand" href="/">Atyant</a><nav><a href="/guides">Guides</a><a class="btn" href="/">Ask a senior</a></nav></div></header>
<main class="wrap">
${body}
</main>
<footer class="wrap foot">
<p>Atyant, India's first Human + AI career execution platform: placement and internship guidance for every engineering student, from seniors who came from the same background. Stories on these pages are anonymised from real Atyant AnswerCards.</p>
<nav><a href="/">Ask Atyant</a><a href="/guides">Career guides</a><a href="/jobs">Jobs for freshers</a><a href="/mock-interview">AI mock interview</a><a href="/mentor-onboard">Become a mentor</a></nav>
</footer>
</body>
</html>
`;
}

const breadcrumb = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
});

function renderGuide(g) {
  const url = `${SITE}/guides/${g.slug}`;
  const bySlug = Object.fromEntries(GUIDES.map((x) => [x.slug, x]));

  const sections = g.sections
    .map((s) => {
      const paras = (s.paras || []).map((p) => `<p>${esc(p)}</p>`).join("\n");
      const list = s.list ? `<ul>${s.list.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>` : "";
      return `<section id="${anchor(s.h2)}"><h2>${esc(s.h2)}</h2>\n${paras}\n${list}</section>`;
    })
    .join("\n");

  const stories = g.stories
    .map(
      (st) => `<div class="story">
<p class="path">${esc(st.from)} → ${esc(st.to)}</p>
<p class="when">${esc(st.when)}</p>
<p><strong>What worked:</strong> ${esc(st.did)}</p>
<p><strong>What they would change:</strong> ${esc(st.regret)}</p>
</div>`,
    )
    .join("\n");

  const toc = [...g.sections.map((s) => s.h2), "Real journeys from Atyant seniors", "Frequently asked questions"]
    .map((h) => `<li><a href="#${anchor(h)}">${esc(h)}</a></li>`)
    .join("");

  const faqs = g.faqs.map((f) => `<h3>${esc(f.q)}</h3>\n<p>${esc(f.a)}</p>`).join("\n");

  const related = g.related
    .map((slug) => bySlug[slug])
    .filter(Boolean)
    .map((r) => `<li><a href="/guides/${r.slug}">${esc(r.h1)}</a><p>${esc(r.description)}</p></li>`)
    .join("");

  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/guides">Guides</a> › <span>${esc(g.h1)}</span></nav>
<article>
<h1>${esc(g.h1)}</h1>
<p class="meta">Updated ${prettyDate} · Based on ${g.stories.length} real senior journeys</p>
<p class="lead">${esc(g.intro)}</p>
<nav class="toc" aria-label="On this page"><strong>On this page</strong><ol>${toc}</ol></nav>
${sections}
<section id="${anchor("Real journeys from Atyant seniors")}"><h2>Real journeys from Atyant seniors</h2>
<div class="stories">
${stories}
</div></section>
<aside class="cta"><h2>Your situation is not exactly theirs. Ask the senior whose is.</h2>
<p>Type your exact question and Atyant matches you to a senior from your branch and a college like yours who took the path you want.</p>
<a class="btn" href="/">Ask your question</a></aside>
<section id="${anchor("Frequently asked questions")}"><h2>Frequently asked questions</h2>
${faqs}
</section>
<section class="related"><h2>Related guides</h2><ul>${related}</ul></section>
</article>`;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.h1,
      description: g.description,
      image: DEFAULT_OG,
      datePublished: GUIDES_UPDATED,
      dateModified: GUIDES_UPDATED,
      inLanguage: "en-IN",
      author: ORG,
      publisher: PUBLISHER,
      mainEntityOfPage: url,
    },
    breadcrumb([["Home", `${SITE}/`], ["Guides", `${SITE}/guides`], [g.h1, url]]),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: g.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return page({ title: g.title, description: g.description, url, ogType: "article", schema, body });
}

// Questions students type into Google, each linked to the section that answers it.
// [question, guide slug, exact h2 of the answering section (null = top of guide)]
const HUB_QUESTIONS = [
  ["I'm in Mechanical or Civil. Can I still become a data analyst?", "non-cs-branch-to-data-analytics-and-consulting", "Can a Mechanical or Civil student become a data analyst?"],
  ["How long does it take to switch from a core branch to analytics?", "non-cs-branch-to-data-analytics-and-consulting", "How long the switch takes"],
  ["Core or IT: which one should I go for?", "core-branch-jobs-and-psu-placements", "Core or IT: how to decide"],
  ["How do PSU and government-company placements work?", "core-branch-jobs-and-psu-placements", "PSU and government-company placements"],
  ["I've applied to 100 internships and nobody replies. What am I doing wrong?", "how-to-get-off-campus-internship", "Why 100+ applications get no replies"],
  ["How do I write a cold email that actually gets a reply?", "how-to-get-off-campus-internship", "Cold emails and follow-ups that get answered"],
  ["Can I get into Amazon or Google from a non-IIT college?", "faang-sde-from-non-iit-college", null],
  ["Can I prepare for GATE and placements at the same time?", "gate-vs-placement-vs-mba", "Can you prepare for GATE and placements together?"],
  ["When should I start GATE preparation?", "gate-vs-placement-vs-mba", "When to start GATE preparation"],
  ["DSA or development: which should I do first?", "dsa-vs-development-what-to-focus-on", "DSA or development first?"],
];

const HUB_FAQS = [
  {
    q: "Are the stories in these guides from real students?",
    a: "Yes. Every journey comes from an answer a senior wrote for juniors on Atyant. We take out names and keep the branch, college, company and timeline, because those are what you need to judge whether their path fits yours.",
  },
  {
    q: "My college isn't VNIT. Does any of this apply to me?",
    a: "Most of it does. The things that worked for these seniors, like learning one skill at a time, building two or three projects you can explain, asking alumni for referrals and applying off-campus, don't depend on one placement cell. If your situation is very specific, ask on Atyant and you'll be matched with a senior from a college closer to yours.",
  },
  {
    q: "Which guide should I read first?",
    a: "The one that matches the decision in front of you right now. In first or second year, start with DSA vs development. In third year, read GATE vs placement vs MBA. If you're in a non-CS branch, read the analytics guide and the core jobs guide side by side before you pick a direction.",
  },
  {
    q: "Do I need to sign up to read the guides?",
    a: "No. Every guide is free to read without an account. You only need to sign up if you want to ask a senior your own question.",
  },
];

// "Civil, VNIT Nagpur (working in structural design)" -> "Civil"
const branchOf = (from) => from.split(",")[0].trim();
const uniq = (xs) => [...new Set(xs)];

function renderHub() {
  const url = `${SITE}/guides`;
  const bySlug = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));
  const title = "Placement & Internship Guides for B.Tech Students | Atyant";
  const description =
    "Off-campus internships, core and PSU jobs, GATE vs placement, non-CS to data analytics, Amazon from a non-IIT college. Real paths from seniors, not theory.";
  const h1 = "Placement and internship guides for engineering students";
  const updated = new Date(`${GUIDES_HUB_UPDATED}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
  // The same senior can appear in two guides; count each journey once.
  const journeys = uniq(GUIDES.flatMap((g) => g.stories.map((s) => `${s.from}|${s.to}`))).length;

  const questions = HUB_QUESTIONS.map(([q, slug, h2]) => {
    const g = bySlug[slug];
    if (!g) throw new Error(`HUB_QUESTIONS: unknown guide ${slug}`);
    if (h2 && !g.sections.some((s) => s.h2 === h2)) throw new Error(`HUB_QUESTIONS: no section "${h2}" in ${slug}`);
    return `<li><a href="/guides/${slug}${h2 ? `#${anchor(h2)}` : ""}">${esc(q)}</a></li>`;
  }).join("\n");

  const cards = GUIDES.map((g) => {
    const branches = uniq(g.stories.map((s) => branchOf(s.from))).filter((b) => b !== "Engineering");
    const inside = g.sections
      .slice(0, 4)
      .map((s) => `<a href="/guides/${g.slug}#${anchor(s.h2)}">${esc(s.h2)}</a>`)
      .join("");
    return `<li><h3><a href="/guides/${g.slug}">${esc(g.h1)}</a></h3>
<p class="facts">${g.stories.length} senior journeys · ${esc(branches.join(", "))}</p>
<p>${esc(g.hub || g.description)}</p>
<p class="inside"><span>Inside:</span>${inside}</p></li>`;
  }).join("\n");

  const faqs = HUB_FAQS.map((f) => `<h3>${esc(f.q)}</h3>\n<p>${esc(f.a)}</p>`).join("\n");

  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>Guides</span></nav>
<h1>${esc(h1)}</h1>
<p class="meta">Updated ${updated} · ${GUIDES.length} guides · ${journeys} real senior journeys, names removed</p>
<div class="lead">
<p>Most placement advice online assumes you're in CSE at a top college, with recruiters queuing up on campus. If that isn't you, these guides are.</p>
<p>Each one is built from answers seniors wrote for juniors on Atyant: what they actually did, how long it took, and what they'd do differently. A Civil graduate who learned SQL and joined ZS Associates. An Electrical student who cleared GATE and joined Maruti Suzuki. CSE seniors from VNIT Nagpur who got into Amazon without an IIT on their resume.</p>
</div>
<section id="start-with-your-question"><h2>Start with your question</h2>
<p>Pick the one closest to what's on your mind. Each link opens the part of the guide that answers it.</p>
<ul class="qs">
${questions}
</ul></section>
<section id="all-guides"><h2>All placement and internship guides</h2>
<ul class="cards">
${cards}
</ul></section>
<section id="how-these-guides-are-written"><h2>How these guides are written</h2>
<p>We start with the questions juniors ask again and again, on r/Btechtards, r/developersIndia and r/GATEtard, and in our own inbox. Then we go through what seniors have written on Atyant and keep only the answers that end in a real outcome: a company, a role, a timeline. Names come out. Branch, college and result stay in.</p>
<p>Where a senior's experience and popular forum advice disagree, the guide says so instead of quietly picking a side. Most seniors so far are from VNIT Nagpur, with others from NIT Raipur, NIT Srinagar, REC Kannauj, RGPV Bhopal and IIT Bombay. As more seniors share their paths, the guides get updated.</p>
</section>
<section id="frequently-asked-questions"><h2>Frequently asked questions</h2>
${faqs}
</section>
<aside class="cta"><h2>Didn't find your exact situation?</h2>
<p>Ask it the way you'd ask a senior in the hostel corridor. Atyant matches you with someone from your branch who has been through it.</p>
<a class="btn" href="/">Ask a senior</a></aside>`;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: h1,
      headline: h1,
      description,
      url,
      inLanguage: "en-IN",
      dateModified: GUIDES_HUB_UPDATED,
      about: ["Campus placements", "Internships", "GATE", "Engineering careers in India"],
      audience: { "@type": "EducationalAudience", educationalRole: "student" },
      publisher: PUBLISHER,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: GUIDES.map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE}/guides/${g.slug}`,
          name: g.h1,
        })),
      },
    },
    breadcrumb([["Home", `${SITE}/`], ["Guides", url]]),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HUB_FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return page({ title, description, url, ogType: "website", schema, body });
}

// Writes every guide page and returns their paths for the sitemap.
export function renderGuides(dist) {
  const out = (path, html) => {
    const dir = join(dist, path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
  };
  out("guides", renderHub());
  for (const g of GUIDES) out(join("guides", g.slug), renderGuide(g));
  return ["/guides", ...GUIDES.map((g) => `/guides/${g.slug}`)];
}

export { GUIDES_UPDATED, GUIDES_HUB_UPDATED };
