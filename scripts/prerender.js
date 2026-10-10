// Post-build step (runs after `vite build`). The SPA is client-rendered, so on
// its own every URL serves the same index.html: same title, same canonical, an
// empty <div id="root">. For each public route this writes an HTML file with
// that route's title / description / canonical / OG tags and crawlable copy
// inside #root (createRoot replaces it once the app boots), then writes
// sitemap.xml from the same route list.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_ROUTES, SITE } from "../src/seo/routes.js";
import { renderGuides, GUIDES_UPDATED } from "./render-guides.js";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

// Served from the marketing site (proxied in vercel.json) but self-canonical and
// indexable, so it belongs in this domain's sitemap.
const EXTERNAL_PATHS = ["/company", "/achievements"];

// Photos on marketing pages, as image-sitemap entries so they can rank in
// Google Images. Keep in sync with the atyant repo's
// frontend/src/data/achievementPhotos.js.
const EXTERNAL_IMAGES = {
  "/achievements": [
    "atyant-hult-prize-2026-iit-bombay-stage.jpg",
    "atyant-founder-hult-prize-india-nationals-2026.jpg",
    "atyant-hult-prize-pitch-how-atyant-works.jpg",
    "atyant-pitch-wars-right-answer-right-person-right-time.jpg",
    "atyant-pitch-wars-ai-human-engine-presentation.jpg",
    "atyant-pitch-wars-cofounder-pitch.jpg",
    "atyant-founders-vnit-nagpur.jpg",
    "atyant-team-student-community.jpg",
    "atyant-student-career-guidance-session.jpg",
    "atyant-demo-vnit-nagpur-director.jpg",
    "atyant-vnit-ecell-pitch-market-opportunity.jpg",
    "atyant-campus-visit-manit.jpg",
    "atyant-campus-outreach-pce.jpg",
    "atyant-recognition-ghrce.jpg",
    "atyant-student-internship-iim-mumbai.jpg",
    "atyant-student-outcomes-iim-ahmedabad-iit-mandi.jpg",
    "atyant-online-mentor-session.jpg",
  ].map((f) => `${SITE}/achievements/${f}`),
};

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Replace exactly one match, so a changed index.html fails the build instead
// of silently shipping the homepage tags on every route.
function replaceOnce(html, pattern, replacement, label) {
  const matches = html.match(new RegExp(pattern.source, "g")) || [];
  if (matches.length !== 1) {
    throw new Error(`prerender: expected 1 ${label} in dist/index.html, found ${matches.length}`);
  }
  return html.replace(pattern, replacement);
}

const metaTag = (attr, key) =>
  new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`);

function renderRoute(template, route) {
  const url = `${SITE}${route.path}`;
  const title = esc(route.title);
  const desc = esc(route.description);
  let html = template;

  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, "<title>");
  html = replaceOnce(html, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`, "canonical");
  html = replaceOnce(html, metaTag("name", "description"), `<meta name="description" content="${desc}" />`, "description");
  html = replaceOnce(html, metaTag("property", "og:title"), `<meta property="og:title" content="${title}" />`, "og:title");
  html = replaceOnce(html, metaTag("property", "og:description"), `<meta property="og:description" content="${desc}" />`, "og:description");
  html = replaceOnce(html, metaTag("property", "og:url"), `<meta property="og:url" content="${url}" />`, "og:url");
  html = replaceOnce(html, metaTag("name", "twitter:title"), `<meta name="twitter:title" content="${title}" />`, "twitter:title");
  html = replaceOnce(html, metaTag("name", "twitter:description"), `<meta name="twitter:description" content="${desc}" />`, "twitter:description");

  if (route.path !== "/") {
    html = html.replace(/\s*<!--[^>]*data-home-only[\s\S]*?-->/g, "");
    html = html.replace(/\s*<script type="application\/ld\+json" data-home-only>[\s\S]*?<\/script>/g, "");
  }

  const nav = PUBLIC_ROUTES.filter((r) => r.path !== route.path)
    .map((r) => `<a href="${r.path}">${esc(r.h1)}</a>`)
    .concat(`<a href="/guides">Placement guides from seniors like you</a>`)
    .join(" · ");
  const body =
    `<main style="max-width:720px;margin:0 auto;padding:48px 16px;color:inherit">` +
    `<h1>${esc(route.h1)}</h1><p>${esc(route.intro)}</p><nav>${nav}</nav></main>`;
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`, "#root");

  return html;
}

const template = readFileSync(join(DIST, "index.html"), "utf8");

for (const route of PUBLIC_ROUTES) {
  const file = route.path === "/" ? join(DIST, "index.html") : join(DIST, route.path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, renderRoute(template, route));
}

const guidePaths = renderGuides(DIST);

const buildDate = new Date().toISOString().slice(0, 10);
const urls = [
  ...[...PUBLIC_ROUTES.map((r) => r.path), ...EXTERNAL_PATHS].map((p) => [p, buildDate]),
  ...guidePaths.map((p) => [p, GUIDES_UPDATED]),
]
  .map(([p, lastmod]) => {
    const images = (EXTERNAL_IMAGES[p] || [])
      .map((src) => `\n    <image:image><image:loc>${src}</image:loc></image:image>`)
      .join("");
    return `  <url>\n    <loc>${SITE}${p}</loc>\n    <lastmod>${lastmod}</lastmod>${images}\n  </url>`;
  })
  .join("\n");
writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`,
);

console.log(`prerender: ${PUBLIC_ROUTES.length} routes, ${guidePaths.length} guide pages, sitemap.xml`);
