// ─── Atyant API Client ───────────────────────────────────────────────────────
// All calls go through here. Token is read from localStorage on every request.

const BASE = import.meta.env.VITE_API_URL ?? '';

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
};

// Sessions
export const sessionAPI = {
  my:       ()                                  => api.get('/api/sessions/my'),
  book:     (date, time, mentorId, topic)       => api.post('/api/sessions/book', { date, time, mentorId, topic }),
  cancel:   (id)                                => api.patch(`/api/sessions/${id}/cancel`),
};

// Saved Answers
export const savedAnswerAPI = {
  list:   (search)  => api.get(`/api/saved-answers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  save:   (payload) => api.post('/api/saved-answers', payload),
  remove: (id)      => api.delete(`/api/saved-answers/${id}`),
};

// Roadmap
export const roadmapAPI = {
  get:      ()         => api.get('/api/roadmap/me'),
  generate: (payload)  => api.post('/api/roadmap/generate', payload),
  setStep:  (idx, status) => api.patch(`/api/roadmap/step/${idx}/status`, { status }),
};
