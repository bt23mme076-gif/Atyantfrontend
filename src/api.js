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
  login:  (email, password)                   => api.post('/api/auth/login',  { email, password }),
  signup: (username, email, password, phone, role)  => api.post('/api/auth/signup', { username, email, password, phone, role }),
  me:     ()                                  => api.get('/api/profile/me'),
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
  // The mentor's own answer cards (what students see on the Clarity page).
  answerCards: ()           => api.get('/api/mentor/answer-cards'),
  // AI-draft a full card from one paragraph (returns a draft, does not save).
  generateAnswerCard: (story) => api.post('/api/mentor/answer-cards/generate', { story }),
  // Write a brand-new answer card from scratch — the server embeds it.
  createAnswerCard: (content) => api.post('/api/mentor/answer-cards', content),
  // Edit one card's content — the server re-embeds it for matching.
  updateAnswerCard: (id, content) => api.put(`/api/mentor/answer-cards/${id}`, content),
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
};

// Payments (Razorpay) — book a paid session + auto Meet link
export const paymentAPI = {
  // Returns { free, keyId, orderId, amount, currency, sessionId, mentorName, topic } | { free:true, session }
  createOrder: ({ mentorId, date, time, topic, durationMin, serviceId }) =>
    api.post('/api/payments/order', { mentorId, date, time, topic, durationMin, serviceId }),
  // Confirms the session server-side after Razorpay checkout succeeds
  verify: (payload) => api.post('/api/payments/verify', payload),
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
