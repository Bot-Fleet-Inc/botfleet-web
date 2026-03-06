/**
 * ExcalidrawViewer — embed an Excalidraw diagram from design-bot repo
 * Fetches .excalidraw JSON from GitHub raw CDN and renders read-only.
 * WEB feat/#14
 */
import { useState, useEffect, lazy, Suspense } from 'react'
import './ExcalidrawViewer.css'

const ExcalidrawComponent = lazy(() =>
  import('@excalidraw/excalidraw').then(m => ({ default: m.Excalidraw }))
)

const EXCALIDRAW_BASE =
  'https://raw.githubusercontent.com/Bot-Fleet-Inc/design-bot/main/design-system/excalidraw'

// Diagram registry — maps slug → filename in design-bot repo
export const DIAGRAMS = {
  orgchart:       'bfi-orgchart.excalidraw',
  'bot-states':   'bfi-bot-states.excalidraw',
  architecture:   'bfi-architecture.excalidraw',
  'system-context': 'bfi-system-context.excalidraw',
  workflow:       'bfi-workflow-design.excalidraw',
}

function useExcalidrawData(slug) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (!slug) return
    const filename = DIAGRAMS[slug]
    if (!filename) { setError(`Unknown diagram: ${slug}`); setLoading(false); return }

    const url = `${EXCALIDRAW_BASE}/${filename}`

    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(json => { setData(json); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [slug])

  return { data, loading, error }
}

export function ExcalidrawViewer({
  slug,
  height = 400,
  title,
  className = '',
}) {
  const { data, loading, error } = useExcalidrawData(slug)

  if (loading) {
    return (
      <div className={`excalidraw-viewer excalidraw-viewer--loading ${className}`} style={{ height }}>
        <span className="spinner" aria-label="Loading diagram…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`excalidraw-viewer excalidraw-viewer--error ${className}`} style={{ height }}>
        <p className="excalidraw-viewer__error">Could not load diagram: {error}</p>
      </div>
    )
  }

  return (
    <div className={`excalidraw-viewer ${className}`} style={{ height }}>
      {title && <p className="excalidraw-viewer__title">{title}</p>}
      <div className="excalidraw-viewer__canvas">
        <Suspense fallback={<span className="spinner" />}>
          <ExcalidrawComponent
            initialData={{
              elements:  data?.elements  ?? [],
              appState:  {
                ...(data?.appState ?? {}),
                viewModeEnabled:    true,
                zenModeEnabled:     true,
                gridModeEnabled:    false,
                theme:              'dark',
              },
              files: data?.files ?? {},
            }}
            viewModeEnabled
            zenModeEnabled
          />
        </Suspense>
      </div>
    </div>
  )
}
