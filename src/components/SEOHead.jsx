// SEOHead — per-view document metadata for the Atyant SPA.
//
// The static tags live in index.html (and in the per-route HTML files written by
// scripts/prerender.js). This component updates those same tags in place on
// navigation, rather than rendering new ones: React 19 hoisting would append a
// second <title>, canonical and robots tag next to the static ones, and
// conflicting duplicates make Google ignore the canonical. It also sets noindex
// on app/auth surfaces that must never be indexed.

import { useEffect } from "react";
import { SITE, DEFAULT_OG, PUBLIC_ROUTES } from "../seo/routes";

// Find <tag keyAttr="key"> in <head>, creating it if missing, and set valueAttr.
function setHeadTag(tag, keyAttr, key, valueAttr, value) {
  if (value == null) return;
  let el = document.head.querySelector(`${tag}[${keyAttr}="${key}"]`);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(keyAttr, key);
    document.head.appendChild(el);
  }
  el.setAttribute(valueAttr, value);
}

export default function SEOHead({
  title,
  description,
  canonical,                 // path like "/clarity" or full URL
  ogImage = DEFAULT_OG,
  ogType = "website",
  index = true,              // false => noindex,nofollow
  schema,                    // object or array of JSON-LD objects
}) {
  const canonicalUrl = canonical
    ? (canonical.startsWith("http") ? canonical : `${SITE}${canonical}`)
    : undefined;

  const robots = index
    ? "index,follow,max-image-preview:large"
    : "noindex,nofollow";

  const schemaList = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  useEffect(() => {
    if (title) document.title = title;
    setHeadTag("meta", "name", "description", "content", description);
    setHeadTag("meta", "name", "robots", "content", robots);
    setHeadTag("link", "rel", "canonical", "href", canonicalUrl);

    setHeadTag("meta", "property", "og:title", "content", title);
    setHeadTag("meta", "property", "og:description", "content", description);
    setHeadTag("meta", "property", "og:image", "content", ogImage);
    setHeadTag("meta", "property", "og:url", "content", canonicalUrl);
    setHeadTag("meta", "property", "og:type", "content", ogType);

    setHeadTag("meta", "name", "twitter:title", "content", title);
    setHeadTag("meta", "name", "twitter:description", "content", description);
    setHeadTag("meta", "name", "twitter:image", "content", ogImage);
  }, [title, description, robots, canonicalUrl, ogImage, ogType]);

  return (
    <>
      {schemaList.map((s, i) => (
        // eslint-disable-next-line react/no-danger
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // JSON.stringify does not escape < or > — a string containing
            // </script> in user-supplied schema data would break out of the
            // tag. Unicode-escape the three dangerous characters to be safe.
            __html: JSON.stringify(s)
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e")
              .replace(/&/g, "\\u0026"),
          }}
        />
      ))}
    </>
  );
}

// Per-view metadata for the state-routed SPA. Keyed by `activePage` in App.jsx.
// Public views (src/seo/routes.js) get real titles + self canonicals.
// App-shell / auth / booking views are marked index:false so they never leak
// into search.
export const VIEW_SEO = {
  ...Object.fromEntries(
    PUBLIC_ROUTES.map(({ page, path, title, description }) => [
      page,
      { title, description, canonical: path, index: true },
    ]),
  ),
  clarity: {
    title: "Seniors Who Cracked It from a College Like Yours | Atyant",
    description:
      "Real journeys from seniors matched to your college, branch and goal, who came from the same background. Read what worked, then talk to the senior.",
    canonical: "/",
    index: true,
  },
  // Private surfaces — never index.
  chat:     { title: "Chat | Atyant", index: false },
  book:     { title: "Book a Session | Atyant", index: false },
  sessions: { title: "My Sessions | Atyant", index: false },
  roadmap:  { title: "My Roadmap | Atyant", index: false },
  saved:    { title: "Saved Answers | Atyant", index: false },
  profile:  { title: "My Profile | Atyant", index: false },
  upgrade:  { title: "Upgrade | Atyant", index: false },
};
