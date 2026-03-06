/**
 * FleetDiagram — fleet hierarchy diagram
 * Tries R2 SVG first; falls back to inline SVG if unavailable.
 * WEB feat/#22
 */
import { useState, useEffect } from 'react'
import './FleetDiagram.css'

const R2_SVG_URL =
  'https://pub-9d8a85e5e17847949d36335948eeaee0.r2.dev/diagrams/fleet-diagram.svg'

// Inline fallback SVG — simple fleet hierarchy
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" style="font-family:monospace;background:#161b22">
  <!-- Jørgen -->
  <rect x="230" y="16" width="140" height="44" rx="4" fill="#21262d" stroke="#58A6FF" stroke-width="1.5"/>
  <text x="300" y="34" text-anchor="middle" fill="#58A6FF" font-size="11" font-weight="bold">JØ</text>
  <text x="300" y="50" text-anchor="middle" fill="#8b949e" font-size="9">Jørgen · CEO</text>
  <!-- line down -->
  <line x1="300" y1="60" x2="300" y2="90" stroke="#30363d" stroke-width="1.5"/>
  <!-- leadership row connector -->
  <line x1="130" y1="90" x2="470" y2="90" stroke="#30363d" stroke-width="1.5"/>
  <!-- Dispatch -->
  <line x1="130" y1="90" x2="130" y2="110" stroke="#30363d" stroke-width="1.5"/>
  <rect x="60" y="110" width="140" height="44" rx="4" fill="#21262d" stroke="#58A6FF" stroke-width="1.5"/>
  <text x="130" y="128" text-anchor="middle" fill="#58A6FF" font-size="10" font-weight="bold">📋 Dispatch</text>
  <text x="130" y="144" text-anchor="middle" fill="#8b949e" font-size="9">Operations</text>
  <!-- Audit -->
  <line x1="470" y1="90" x2="470" y2="110" stroke="#30363d" stroke-width="1.5"/>
  <rect x="400" y="110" width="140" height="44" rx="4" fill="#21262d" stroke="#3FB950" stroke-width="1.5" stroke-dasharray="4 2"/>
  <text x="470" y="128" text-anchor="middle" fill="#3FB950" font-size="10" font-weight="bold">🔍 Audit</text>
  <text x="470" y="144" text-anchor="middle" fill="#8b949e" font-size="9">QA · Planned</text>
  <!-- line from Audit down -->
  <line x1="470" y1="154" x2="470" y2="200" stroke="#30363d" stroke-width="1.5"/>
  <!-- specialist row connector -->
  <line x1="330" y1="200" x2="610" y2="200" stroke="#30363d" stroke-width="1.5"/>
  <!-- Design -->
  <line x1="330" y1="200" x2="330" y2="220" stroke="#30363d" stroke-width="1.5"/>
  <rect x="260" y="220" width="140" height="44" rx="4" fill="#21262d" stroke="#F78166" stroke-width="1.5"/>
  <text x="330" y="238" text-anchor="middle" fill="#F78166" font-size="10" font-weight="bold">🎨 Design</text>
  <text x="330" y="254" text-anchor="middle" fill="#8b949e" font-size="9">Brand &amp; UI</text>
  <!-- Coding -->
  <line x1="610" y1="200" x2="610" y2="220" stroke="#30363d" stroke-width="1.5"/>
  <rect x="540" y="220" width="140" height="44" rx="4" fill="#21262d" stroke="#E3B341" stroke-width="1.5"/>
  <text x="610" y="238" text-anchor="middle" fill="#E3B341" font-size="10" font-weight="bold">💻 Coding</text>
  <text x="610" y="254" text-anchor="middle" fill="#8b949e" font-size="9">Development</text>
</svg>`

export function FleetDiagram({ height = 320 }) {
  const [svgContent, setSvgContent] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    fetch(R2_SVG_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => {
        setSvgContent(text)
        setLoading(false)
      })
      .catch(() => {
        setSvgContent(FALLBACK_SVG)
        setUsingFallback(true)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="fleet-diagram fleet-diagram--loading" style={{ height }}>
        <span className="spinner" aria-label="Loading diagram…" />
      </div>
    )
  }

  return (
    <div className="fleet-diagram" style={{ height }}>
      {usingFallback && (
        <p className="fleet-diagram__notice">
          Fleet diagram belastes fra R2 når design-bot leverer SVG — viser fallback.
        </p>
      )}
      <div
        className="fleet-diagram__svg"
        // SVG is static, no user input — dangerouslySetInnerHTML is safe here
        dangerouslySetInnerHTML={{ __html: svgContent }}
        role="img"
        aria-label="Bot Fleet org chart diagram"
      />
    </div>
  )
}
