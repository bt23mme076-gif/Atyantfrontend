import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import MeetPage from './pages/MeetPage.jsx'
import TPOPortal from './pages/TPOPortal.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import MentorTrackPage from './pages/MentorTrackPage'

const HireHome = lazy(() => import('./pages/hire/HireHome.jsx'))
const HireJobPage = lazy(() => import('./pages/hire/HireJobPage.jsx'))
const HireCandidatePage = lazy(() => import('./pages/hire/HireCandidatePage.jsx'))
const hire = (el) => <Suspense fallback={null}>{el}</Suspense>

const IS_TPO_SUBDOMAIN = window.location.hostname === 'vnit.atyant.in'

// This app owns atyant.in (the marketing site is proxied under /company). The
// meet is served at /?meet=<sessionId>, which keeps it on the atyant.in origin
// (where the auth token lives in localStorage). The /session/meet path route is
// kept for localhost and direct vercel.app access.
function RootOrMeet() {
  const [params] = useSearchParams()
  // Google sign-in always lands on /?token=…; send founders who started it from /hire back there.
  if (params.get('token') && sessionStorage.getItem('hire_intent')) {
    sessionStorage.removeItem('hire_intent')
    window.location.replace(`/hire?token=${encodeURIComponent(params.get('token'))}`)
    return null
  }
  const meetId = params.get('meet')
  if (meetId) return <MeetPage sessionId={meetId} />
  return <App />
}

// ── vnit.atyant.in → standalone TPO portal (own router) ───────
if (IS_TPO_SUBDOMAIN) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/*" element={<TPOPortal />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/session/meet/:sessionId" element={<MeetPage />} />
                <Route
                  path="/mentor/:mentorId/track"
                  element={<MentorTrackPage />}
                />
                <Route path="/hire" element={hire(<HireHome />)} />
                <Route path="/hire/jobs/:jobId" element={hire(<HireJobPage />)} />
                <Route path="/hire/i/:slug" element={hire(<HireCandidatePage />)} />
                <Route path="/*" element={<RootOrMeet />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}

