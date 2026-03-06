import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BotCard } from '../../components/BotCard.jsx';
import { ExcalidrawViewer } from '../../components/excalidraw/ExcalidrawViewer.jsx';
import { useFleet, STATIC_FLEET } from '../../hooks/useFleet.js';
import { useEpics } from '../../hooks/useEpics.js';
import './Intranet.css';

export function Intranet() {
  const { t } = useTranslation();
  const { bots, loading: botsLoading } = useFleet();
  const { epics, loading: epicsLoading } = useEpics();
  const displayBots = botsLoading ? STATIC_FLEET : bots;

  const openEpics = epics.filter((e) => e.state === 'OPEN');

  return (
    <main className="intranet">
      <header className="intranet__header">
        <div className="intranet__badge">🔒 Intranet</div>
        <h1 className="intranet__title">Bot Fleet Inc — Fleet Operations</h1>
        <p className="intranet__subtitle">
          Live fleet status · active epics · operational overview
        </p>
      </header>

      {/* ── Fleet Overview ── */}
      <section className="intranet__section" aria-label="Fleet overview">
        <h2 className="intranet__section-title">Fleet Status</h2>

        <div className="intranet__fleet-grid">
          {displayBots.map((bot) => (
            <BotCard key={bot.name} bot={bot} />
          ))}
        </div>

        {botsLoading && (
          <div className="intranet__loading">
            <span className="spinner" />
            Loading live fleet data…
          </div>
        )}
      </section>

      {/* ── Fleet Diagram ── */}
      <section className="intranet__section" aria-label="Fleet architecture diagram">
        <h2 className="intranet__section-title">Fleet Architecture</h2>
        <ExcalidrawViewer diagramKey="orgchart" height={480} />
        <p className="intranet__diagram-caption">
          Org chart diagram — sourced from Bot-Fleet-Inc/design-bot. Click to pan/zoom.
        </p>
      </section>

      {/* ── Active Epics summary ── */}
      <section className="intranet__section" aria-label="Active epics">
        <div className="intranet__section-header">
          <h2 className="intranet__section-title">Active Epics</h2>
          <Link to="/intranet/epics" className="intranet__see-all">
            View all epics →
          </Link>
        </div>

        {epicsLoading ? (
          <div className="intranet__loading"><span className="spinner" /> Loading epics…</div>
        ) : openEpics.length === 0 ? (
          <p className="intranet__empty">No open epics.</p>
        ) : (
          <div className="intranet__epics-list">
            {openEpics.slice(0, 5).map((epic) => (
              <div key={epic.number} className="intranet__epic-row">
                <span className="intranet__epic-number">#{epic.number}</span>
                <a
                  href={epic.url}
                  className="intranet__epic-title"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {epic.title}
                </a>
                <div className="intranet__epic-assignees">
                  {epic.assignees?.map((a) => (
                    <img
                      key={a.login}
                      src={a.avatarUrl}
                      alt={a.login}
                      className="intranet__avatar"
                      title={a.login}
                      width={20}
                      height={20}
                    />
                  ))}
                </div>
                <span className={`intranet__epic-status intranet__epic-status--${epic.state.toLowerCase()}`}>
                  {epic.state}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Quick links ── */}
      <section className="intranet__section" aria-label="Quick links">
        <h2 className="intranet__section-title">Quick Links</h2>
        <div className="intranet__links">
          <a href="https://github.com/Bot-Fleet-Inc/bot-fleet-continuum/issues"
            className="intranet__link-card" target="_blank" rel="noopener noreferrer">
            <span>📋</span> Issue Board
          </a>
          <a href="https://github.com/orgs/Bot-Fleet-Inc/projects"
            className="intranet__link-card" target="_blank" rel="noopener noreferrer">
            <span>🗂️</span> Project Board
          </a>
          <Link to="/intranet/epics" className="intranet__link-card">
            <span>🗺️</span> Epics Timeline
          </Link>
          <a href="https://status.bot-fleet.org"
            className="intranet__link-card" target="_blank" rel="noopener noreferrer">
            <span>🟢</span> Fleet Status
          </a>
        </div>
      </section>
    </main>
  );
}
