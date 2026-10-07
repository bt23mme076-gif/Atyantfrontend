import { StrictMode } from 'react'
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

const IS_TPO_SUBDOMAIN = window.location.hostname === 'vnit.atyant.in'

// This app owns atyant.in (the marketing site is proxied under /company). The
// meet is served at /?meet=<sessionId>, which keeps it on the atyant.in origin
// (where the auth token lives in localStorage). The /session/meet path route is
// kept for localhost and direct vercel.app access.
function RootOrMeet() {
  const [params] = useSearchParams()
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
                <Route path="/*" element={<RootOrMeet />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}

