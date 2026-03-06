import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
import { Navbar } from './components/Navbar.jsx'
import { HQRoom } from './pages/HQRoom.jsx'
import { TheTeam } from './pages/TheTeam.jsx'
import { Updates } from './pages/Updates.jsx'
import { BotProfile } from './pages/BotProfile.jsx'
import { IntranetHome } from './pages/intranet/IntranetHome.jsx'
import { EpicsTimeline } from './pages/intranet/EpicsTimeline.jsx'
import { Status } from './pages/status/Status.jsx'
import { StandupPage } from './pages/standup/StandupPage.jsx'
import './App.css'

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <span className="spinner" aria-label="Loading…" />
    </div>
  )
}

/**
 * Conditionally renders the global Navbar.
 * Hidden on the homepage — the HQRoom has its own embedded nav
 * (logo + tagline live inside the room per WEB-10 spec).
 */
function ConditionalNavbar() {
  const { pathname } = useLocation()
  if (pathname === '/') return null
  return <Navbar />
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <ConditionalNavbar />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* WEB-10: Full-page 2D HQ landscape — no external navbar,
                logo sign + tagline live inside the room */}
            <Route path="/" element={<HQRoom />} />
            <Route path="/the-team" element={<TheTeam />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/bots/:name" element={<BotProfile />} />
            {/* Intranet routes */}
            <Route path="/intranet" element={<IntranetHome />} />
            <Route path="/intranet/bots/:name" element={<BotProfile intranet />} />
            <Route path="/intranet/epics" element={<EpicsTimeline />} />
            {/* Status */}
            <Route path="/status" element={<Status />} />
            {/* Standup */}
            <Route path="/standup" element={<StandupPage />} />
            <Route path="/intranet/standup" element={<StandupPage />} />
            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <main style={{ padding: '4rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        404 — page not found
      </p>
    </main>
  )
}
