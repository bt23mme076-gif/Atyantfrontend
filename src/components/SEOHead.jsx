// SEOHead — per-view document metadata for the Atyant SPA.
//
// React 19 hoists <title>, <meta>, <link> and <script> rendered anywhere in the
// tree into <head>, so we do NOT need react-helmet-async (which fights React 19's
// peer deps and is unmaintained). Render <SEOHead /> inside any view and the head
// updates on navigation. When the view unmounts React restores the previous tags.
//
// The static homepage tags live in index.html as the default. This component
// overrides them for in-app views and, critically, sets noindex on app/auth
// surfaces that must never be indexed.

const SITE = "https://atyant.in";
const DEFAULT_OG = `${SITE}/og-default.jpg`;

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

  return (
    <>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={robots} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Atyant" />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

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
// App-shell / auth / booking views are marked index:false so they never leak
// into search. Public marketing-ish views get real titles + canonicals.
export const VIEW_SEO = {
  ask: {
    title: "Ask Atyant — Career Clarity from Verified Seniors",
    description:
      "Type your exact confusion about internships, placements, MS or a career switch and get a verified answer from a senior who walked your path.",
    canonical: "/atyantEngine",
    index: true,
  },
  clarity: {
    title: "Your Career Clarity — Matched Verified Answers | Atyant",
    description:
      "Verified AnswerCards matched to your college, branch and goal by seniors who actually did it. Read the path, then talk to the senior.",
    canonical: "/atyantEngine",
    index: true,
  },
  "mentor-onboard": {
    title: "Become a Verified Senior on Atyant",
    description:
      "Share your verified college-to-company path, publish AnswerCards and take paid 1:1 sessions with juniors from your branch.",
    canonical: "/atyantEngine/mentor-onboard",
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
