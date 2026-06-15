import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import MeetPage from './pages/MeetPage.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// The marketing site (atyant.in) only proxies "/" and "/product-assets/*" to
// this product app — a real path like /session/meet/<id> falls through to the
// marketing site. So the meet is served at the already-proxied root with a
// ?meet=<sessionId> query param, which keeps it on the atyant.in origin (where
// the auth token lives in localStorage). The /session/meet path route is kept
// for localhost and direct vercel.app access.
function RootOrMeet() {
  const [params] = useSearchParams()
  const meetId = params.get('meet')
  if (meetId) return <MeetPage sessionId={meetId} />
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/session/meet/:sessionId" element={<MeetPage />} />
              <Route path="/*" element={<RootOrMeet />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

