import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import { Navbar } from './components/Navbar.jsx'
import { Home } from './pages/Home.jsx'
import { TheTeam } from './pages/TheTeam.jsx'
import { Updates } from './pages/Updates.jsx'
import { BotProfile } from './pages/BotProfile.jsx'
import { IntranetHome } from './pages/intranet/IntranetHome.jsx'
import { EpicsTimeline } from './pages/intranet/EpicsTimeline.jsx'
import { Status } from './pages/status/Status.jsx'
import './App.css'

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <span className="spinner" aria-label="Loading…" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/the-team" element={<TheTeam />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/bots/:name" element={<BotProfile />} />
            {/* Intranet routes */}
            <Route path="/intranet" element={<IntranetHome />} />
            <Route path="/intranet/bots/:name" element={<BotProfile intranet />} />
            <Route path="/intranet/epics" element={<EpicsTimeline />} />
            {/* Status */}
            <Route path="/status" element={<Status />} />
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
