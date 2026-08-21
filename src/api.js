// ─── Atyant API Client ───────────────────────────────────────────────────────
// All calls go through here. Token is read from localStorage on every request.

// Strip any trailing slash so `${BASE}/api/...` never produces a double slash
// (a trailing slash in the Vercel VITE_API_URL env caused requests like
// `https://api.product.atyant.in//api/...`).
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

// Base URL for raw fetch / socket.io (used by the chat page).
export const API_URL = BASE;

function getToken() {
  return localStorage.getItem('atyant_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || data.error || 'Request failed');
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
}

// Shared SSE reader used by both requestStream (JSON body) and
// requestFormStream (multipart body) below — everything past "make the fetch
// call" (parsing frames, timeout, abort wiring) is identical either way.
async function streamRequest(path, fetchInit, onProgress, signal, timeoutMs) {
  // Own AbortController so a timeout can cancel the fetch even if the caller
  // never aborts — a hung connection would otherwise leave the UI "thinking"
  // forever, the exact failure mode this streaming path exists to avoid.
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', forwardAbort);
  }
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);

  try {
    const res = await fetch(`${BASE}${path}`, { ...fetchInit, signal: controller.signal });

    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.message || data.error || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;
      buf += decoder.decode(value, { stream: true });

      let sep;
      while ((sep = buf.indexOf('\n\n')) !== -1) {
        const frame = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        const line = frame.split('\n').find(l => l.startsWith('data: '));
        if (!line) continue;

        const event = JSON.parse(line.slice(6));
        if (event.type === 'progress' || event.type === 'token') { onProgress?.(event); continue; }
        if (event.type === 'error') {
          const err = new Error(event.error || 'Request failed');
          err.status = event.status;
          throw err;
        }
        if (event.type === 'done') return event;
      }
    }
    throw new Error('Stream ended without a response');
  } catch (err) {
    // Distinguish "we gave up waiting" (timeout — a real, user-facing failure)
    // from "the caller cancelled us" (unmount abort — silent, not an error the
    // user needs to see). Both surface as AbortError from fetch otherwise.
    if (timedOut && err.name === 'AbortError') {
      const timeoutErr = new Error('That took too long. Try again?');
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', forwardAbort);
  }
}

// JSON-body SSE request — used by the Atyant chat endpoint so the "thinking"
// UI can reflect real backend state instead of a guess.
function requestStream(path, body, onProgress, signal, timeoutMs = 45000) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return streamRequest(path, { method: 'POST', headers, credentials: 'include', body: JSON.stringify(body) }, onProgress, signal, timeoutMs);
}

// Multipart SSE request — for the résumé-upload endpoint. Longer default
// timeout: PDF/vision extraction is real extra work on top of the normal turn.
function requestFormStream(path, formData, onProgress, signal, timeoutMs = 60000) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // No Content-Type here — the browser sets multipart/form-data with the boundary.
  return streamRequest(path, { method: 'POST', headers, credentials: 'include', body: formData }, onProgress, signal, timeoutMs);
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  patch:  (path, body) => request('PATCH',  path, body),
  delete: (path)       => request('DELETE', path),
};

// ─── Named helpers ───────────────────────────────────────────────────────────

// Auth
export const authAPI = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),

  // ── OTP-based signup (2-step) ──────────────────────────────────────────
  // Step 1: send OTP to email
  signupInitiate: (username, email, password, phone, role) =>
    api.post('/api/auth/signup-initiate', { username, email, password, phone, role }),

  // Step 2: verify OTP → get JWT
  signupVerify: (email, otp) =>
    api.post('/api/auth/signup-verify', { email, otp }),

  // Resend OTP during signup
  signupResendOtp: (email) =>
    api.post('/api/auth/signup-resend-otp', { email }),

  // Legacy signup kept for Google-authed paths (not used for email/password)
  signup: (username, email, password, phone, role) =>
    api.post('/api/auth/signup', {
      username,
      email,
      password,
      phone,
      role
    }),

  me: () => api.get('/api/profile/me'),

  // Set the logged-in user's mobile (mandatory step after Google sign-up).
  setPhone: (phone) => api.put('/api/profile/phone', { phone }),

  forgotPassword: (email) =>
    api.post('/api/auth/forgot-password', { email }),

  verifyResetCode: (email, code) =>
    api.post('/api/auth/verify-reset-code', { email, code }),

  resetPassword: (email, code, newPassword) =>
  api.post('/api/auth/reset-password', {
    email,
    code,
    newPassword
  })
};

// Profile
export const profileAPI = {
  get:    ()      => api.get('/api/profile/me'),
  update: (data)  => api.put('/api/profile/me', data),
  // Fire-and-forget: count a profile view from answer cards / match results
  trackView: (mentorId) => api.post(`/api/profile/${mentorId}/view`, {}),
  // Upload a profile picture (multipart) — returns { profilePicture }.
  uploadPicture: async (file) => uploadFile('/api/profile/upload-picture', 'profilePicture', file),
  // Parse a LinkedIn/résumé PDF → { success, data:{ name, bio, topCompanies, expertise, education, ... } }
  parseLinkedin: async (file) => uploadFile('/api/profile/parse-linkedin', 'resumePdf', file),
  // Upload resume PDF permanently → { resumeUrl }
  uploadResume: async (file) => uploadFile('/api/profile/upload-resume', 'resumePdf', file),
  // Remove stored resume
  deleteResume: () => api.delete('/api/profile/upload-resume'),
  // Parse a résumé PDF → { success, data:{ skills, projects, education, workExperience, yearsOfExperience, preferredRoles } }
  // Job-matching shaped, distinct from parseLinkedin's mentor-shaped output. Review-before-save — call update() after.
  extractSkills: async (file) => uploadFile('/api/profile/extract-skills', 'resumePdf', file),
};

// Shared multipart uploader (FormData — no JSON Content-Type so the browser sets the boundary).
async function uploadFile(path, field, file) {
  const form = new FormData();
  form.append(field, file);
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Upload failed');
  return data;
}

// Mentor onboarding
export const mentorAPI = {
  onboard: (payload) => api.post('/api/mentor/onboard', payload),
  linkedinAutofill: (linkedinUrl) => api.post('/api/mentor/linkedin-autofill', { linkedinUrl }),
  // The mentor's own answer cards (what students see on the Clarity page).
  answerCards: ()           => api.get('/api/mentor/answer-cards'),
  // AI-draft a full card from one paragraph (returns a draft, does not save).
  generateAnswerCard: (story) => api.post('/api/mentor/answer-cards/generate', { story }),
  // Write a brand-new answer card from scratch — the server embeds it.
  createAnswerCard: (content) => api.post('/api/mentor/answer-cards', content),
  // Edit one card's content — the server re-embeds it for matching.
  updateAnswerCard: (id, content) => api.put(`/api/mentor/answer-cards/${id}`, content),
  // Update mentor's public profile slug
  updateSlug: (slug) => api.put('/api/mentor/slug', { slug }),
};

// Clarity (AI mentor matching)
export const clarityAPI = {
  match: (payload) => api.post('/api/clarity/match', payload),
  communityCount: (college) =>
    api.get(`/api/clarity/community-count?college=${encodeURIComponent(college || '')}`),
};

// Atyant AI chat — 2-phase intake + execution engine
export const aiAPI = {
  atyantChat: (message, sessionId) => api.post('/api/ai/atyant-chat', { message, sessionId }),
  // Same endpoint, but reads it as a live progress stream — resolves with the
  // same shape as atyantChat once the `done` event arrives.
  atyantChatStream: (message, sessionId, onProgress, signal) =>
    requestStream('/api/ai/atyant-chat', { message, sessionId }, onProgress, signal),
  // Upload a résumé (PDF or a photo) — same progress-stream shape as atyantChatStream.
  atyantResumeStream: (file, sessionId, onProgress, signal, message) => {
    const form = new FormData();
    form.append('resume', file);
    form.append('sessionId', sessionId);
    if (message) form.append('message', message);
    return requestFormStream('/api/ai/atyant-chat/resume', form, onProgress, signal);
  },
  // Restore an existing conversation (messages + context) so chat survives refresh.
  getSession: (sessionId) => api.get(`/api/ai/atyant-chat/${sessionId}`),
  // Thumbs up/down on a bot reply — value: 'up' | 'down' | null (null = un-vote).
  chatFeedback: (sessionId, message, value) =>
    api.post(`/api/ai/atyant-chat/${sessionId}/feedback`, { message, value }),
};

// Sessions
export const sessionAPI = {
  my:       ()                                  => api.get('/api/sessions/my'),
  book:     (date, time, mentorId, topic)       => api.post('/api/sessions/book', { date, time, mentorId, topic }),
  cancel:   (id)                                => api.patch(`/api/sessions/${id}/cancel`),
  review:   (id, rating, comment)               => api.post(`/api/sessions/${id}/review`, { rating, comment }),
  insight:  (id)                                => api.get(`/api/sessions/${id}/transcript`),
};

// LiveKit meet
export const livekitAPI = {
  resume: (sessionId) => api.get(`/api/livekit/session/${sessionId}/resume`),
};

// Payments (Razorpay) — book a paid session + auto Meet link
export const paymentAPI = {
  // Returns { free, keyId, orderId, amount, currency, sessionId, mentorName, topic } | { free:true, session }
  createOrder: ({ mentorId, date, time, topic, durationMin, serviceId }) =>
    api.post('/api/payments/order', { mentorId, date, time, topic, durationMin, serviceId }),
  // Confirms the session server-side after Razorpay checkout succeeds
  verify: (payload) => api.post('/api/payments/verify', payload),
};

// Subscriptions (Razorpay) — Clarity/Pro plan purchases
export const subscriptionAPI = {
  // Returns { keyId, orderId, amount, currency, plan, billing }
  create: (plan, billing) => api.post('/api/subscriptions/create', { plan, billing }),
  // Verifies subscription payment and activates plan
  verify: (payload) => api.post('/api/subscriptions/verify', payload),
  // Returns current subscription status
  status: () => api.get('/api/subscriptions/status'),
  // Cancels active subscription
  cancel: () => api.post('/api/subscriptions/cancel'),
};

// Platform service catalog (labels + fixed prices set by Atyant)
export const servicesAPI = {
  catalog: () => api.get('/api/profile/services-catalog'),
};

// Saved Answers
export const savedAnswerAPI = {
  list:   (search)  => api.get(`/api/saved-answers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  save:   (payload) => api.post('/api/saved-answers', payload),
  remove: (id)      => api.delete(`/api/saved-answers/${id}`),
};

// Mentor availability & booking
export const availabilityAPI = {
  // Mentor saves their weekly schedule
  save: (data) => api.put('/api/mentor/availability', data),
  // Public: get a mentor's weekly availability template (for calendar rendering)
  getSchedule: (mentorId) => api.get(`/api/mentor/${mentorId}/availability`),
  // Public: get available time slots for a mentor on a specific date (YYYY-MM-DD)
  getSlots: (mentorId, date) => api.get(`/api/mentor/${mentorId}/slots?date=${date}`),
};

// Roadmap
export const roadmapAPI = {
  get:      ()         => api.get('/api/roadmap/me'),
  generate: (payload)  => api.post('/api/roadmap/generate', payload),
  setStep:  (idx, status) => api.patch(`/api/roadmap/step/${idx}/status`, { status }),
};

// Jobs — Greenhouse/Lever aggregation, matching, auto-apply
export const jobsAPI = {
  // Plain filtered job list — no resume/skills required. { jobs, total, page, limit }.
  list: ({ q, location, company, source, remote, page, limit } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (location) params.set('location', location);
    if (company) params.set('company', company);
    if (source) params.set('source', source);
    if (remote) params.set('remote', 'true');
    if (page !== undefined) params.set('page', page);
    if (limit !== undefined) params.set('limit', limit);
    const qs = params.toString();
    return api.get(`/api/jobs${qs ? `?${qs}` : ''}`);
  },
  // Distinct companies with open postings, for the filter dropdown — { companies: [{company, count}] }.
  companies: () => api.get('/api/jobs/companies'),
  // Open jobs scored against the current user's profile — { matches, total, page, limit }.
  matches: ({ minScore, page, limit } = {}) => {
    const params = new URLSearchParams();
    if (minScore !== undefined) params.set('minScore', minScore);
    if (page !== undefined) params.set('page', page);
    if (limit !== undefined) params.set('limit', limit);
    const qs = params.toString();
    return api.get(`/api/jobs/matches${qs ? `?${qs}` : ''}`);
  },
  // Generate a tailored cover letter for one job — { coverLetter }.
  coverLetter: (jobId) => api.post(`/api/jobs/${jobId}/cover-letter`, {}),
  // Self-report a manual (assisted) application after the student applies on the real site.
  markApplied: (jobId) => api.post(`/api/jobs/${jobId}/mark-applied`, {}),
  // Runs the real Playwright auto-apply engine on one job immediately (requires autoApply.enabled).
  autoApplyNow: (jobId) => api.post(`/api/jobs/${jobId}/auto-apply-now`, {}),
  // Saved answer bank for application questions that blocked auto-apply — { answers }.
  getApplicationAnswers: () => api.get('/api/jobs/application-answers'),
  // Save one or more { questionText, answerText } pairs. Same answer reused across every job asking a similar question.
  saveApplicationAnswers: (answers) => api.post('/api/jobs/application-answers', { answers }),
  // Opted-in student's own application audit trail (auto-apply + manual results).
  applications: () => api.get('/api/jobs/applications'),
  // Update auto-apply settings. Pass { enabled: true, confirm: true, ... } to
  // turn it on (confirm is the explicit consent flag — required by the
  // backend); omit `enabled` entirely to update minMatchScore/excludedCompanies/
  // phone without re-triggering the consent check; { enabled: false } to
  // disable instantly, no confirm needed.
  updateAutoApplySettings: (payload) => api.put('/api/jobs/auto-apply/settings', payload),
};

// TPO (Training & Placement) — VNIT dashboard
// Backend contract:
//   GET  /api/tpo/students  → { students: [{ _id, name, email, branch, year, cgpa, targetCompany }] }
//   GET  /api/tpo/mentors   → { mentors:  [{ _id, name, currentRole, currentCompany }] }
//   POST /api/tpo/sessions/book → { session: { _id, scheduledAt, studentId, mentorId, topic } }
//   GET  /api/tpo/sessions/:id/insight → { session, insight }
export const tpoAPI = {
  students:       ()   => api.get('/api/tpo/students'),
  mentors:        ()   => api.get('/api/tpo/mentors'),
  bookSession:    (p)  => api.post('/api/tpo/sessions/book', p),
  sessions:       ()   => api.get('/api/tpo/sessions'),
  sessionInsight: (id) => api.get(`/api/tpo/sessions/${id}/insight`),
};
