import { lazy, Suspense, useState, useEffect } from 'react';
import './ExcalidrawViewer.css';

// Lazy-load Excalidraw (~2MB) only when needed
const ExcalidrawLib = lazy(() =>
  import('@excalidraw/excalidraw').then((mod) => ({
    default: mod.Excalidraw,
  }))
);

const DESIGN_BOT_BASE =
  'https://raw.githubusercontent.com/Bot-Fleet-Inc/design-bot/main/design-system/excalidraw';

const DIAGRAM_FILES = {
  orgchart:        `${DESIGN_BOT_BASE}/bfi-orgchart.excalidraw`,
  architecture:    `${DESIGN_BOT_BASE}/bfi-architecture.excalidraw`,
  'bot-states':    `${DESIGN_BOT_BASE}/bfi-bot-states.excalidraw`,
  'system-context':`${DESIGN_BOT_BASE}/bfi-system-context.excalidraw`,
};

export function ExcalidrawViewer({ diagramKey, height = 400 }) {
  const [scene, setScene] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const url = DIAGRAM_FILES[diagramKey];
    if (!url) {
      setFetchError(`Unknown diagram: ${diagramKey}`);
      return;
    }

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setScene(data))
      .catch((err) => setFetchError(err.message));
  }, [diagramKey]);

  if (fetchError) {
    return (
      <div className="excalidraw-viewer excalidraw-viewer--error">
        <span style={{ fontSize: 12, color: 'var(--color-design)' }}>
          Diagram unavailable: {fetchError}
        </span>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="excalidraw-viewer excalidraw-viewer--loading" style={{ height }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div className="excalidraw-viewer" style={{ height }}>
      <Suspense fallback={<div className="excalidraw-viewer--loading" style={{ height }}><span className="spinner" /></div>}>
        <ExcalidrawLib
          initialData={{
            elements: scene.elements ?? [],
            appState: {
              viewBackgroundColor: '#0D1117',
              theme: 'dark',
              ...(scene.appState ?? {}),
            },
          }}
          viewModeEnabled={true}
          zenModeEnabled={false}
          gridModeEnabled={false}
        />
      </Suspense>
    </div>
  );
}
