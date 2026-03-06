import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { BotSprite } from '../../components/BotSprite.jsx';
import { StatusBadge } from '../../components/StatusDot.jsx';
import { ExcalidrawViewer } from '../../components/excalidraw/ExcalidrawViewer.jsx';
import { useFleet, STATIC_FLEET } from '../../hooks/useFleet.js';
import './IntranetBotProfile.css';

// Diagram keys per bot
const BOT_DIAGRAMS = {
  'dispatch-bot': 'system-context',
  'design-bot':   'bot-states',
  'coding-bot':   'architecture',
  'archi-bot':    'orgchart',
  'infra-bot':    'system-context',
};

// Skills per bot (static — until skillset API is available)
const BOT_SKILLS = {
  'dispatch-bot': ['Issue routing', 'Task assignment', 'PM', 'GitHub Actions', 'Standup coordination'],
  'design-bot':   ['Brand identity', 'UI spec', 'Excalidraw', 'CSS design tokens', 'Copy writing'],
  'coding-bot':   ['React', 'Cloudflare Workers', 'GitHub GraphQL', 'CI/CD', 'PR review'],
  'archi-bot':    ['ArchiMate', 'Excalidraw', 'System design', 'Enterprise architecture'],
  'infra-bot':    ['Proxmox', 'Cloudflare', 'Networking', 'VM provisioning', 'OpenClaw'],
};

export function IntranetBotProfile() {
  const { name } = useParams();
  const { t } = useTranslation();
  const { bots, loading } = useFleet();
  const displayBots = loading ? STATIC_FLEET : bots;
  const bot = displayBots.find((b) => b.name === name);
  const colorKey = name?.replace('-bot', '') ?? 'coding';
  const pitchKey = colorKey;
  const diagramKey = BOT_DIAGRAMS[name];
  const skills = BOT_SKILLS[name] ?? [];

  // Fetch full bot profile from Worker (includes SOUL mission)
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!name) return;
    fetch(`/api/bots/${name}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setProfile(data.bot))
      .catch(() => null);
  }, [name]);

  const pitch = t(`bots.${pitchKey}.pitch`, { defaultValue: bot?.role ?? '' });

  if (!bot && !loading) {
    return (
      <main className="intranet-profile">
        <p>Bot not found: {name}</p>
        <Link to="/intranet" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          ← Fleet overview
        </Link>
      </main>
    );
  }

  if (loading && !bot) {
    return <main className="intranet-profile intranet-profile--loading"><span className="spinner" /></main>;
  }

  const currentBot = profile ?? bot;

  return (
    <main className="intranet-profile" data-bot={colorKey}>
      <Link to="/intranet" className="intranet-profile__back">← Fleet overview</Link>

      {/* ── Header ── */}
      <header className="intranet-profile__header">
        <BotSprite
          botName={name}
          alt={currentBot?.displayName ?? name}
          width={160}
          height={200}
          className="intranet-profile__sprite"
        />
        <div className="intranet-profile__meta">
          <h1 className="intranet-profile__name">{currentBot?.displayName}</h1>
          <StatusBadge
            status={currentBot?.status ?? 'unknown'}
            className="intranet-profile__status"
          />
          <p className="intranet-profile__role">{currentBot?.role}</p>
          <blockquote className="intranet-profile__pitch">{pitch}</blockquote>
        </div>
      </header>

      {/* ── Mandate / Mission ── */}
      {currentBot?.mission && (
        <section className="intranet-profile__section">
          <h2 className="intranet-profile__section-title">Mission</h2>
          <p className="intranet-profile__text">{currentBot.mission}</p>
        </section>
      )}

      {/* ── Skills ── */}
      {skills.length > 0 && (
        <section className="intranet-profile__section">
          <h2 className="intranet-profile__section-title">Skills</h2>
          <div className="intranet-profile__skills">
            {skills.map((skill) => (
              <span key={skill} className={`intranet-profile__skill badge badge--${colorKey}`}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Current Epic ── */}
      {currentBot?.currentEpic && (
        <section className="intranet-profile__section">
          <h2 className="intranet-profile__section-title">{t('team.currentEpic')}</h2>
          <a
            href={currentBot.currentEpic.url}
            className="intranet-profile__epic-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {currentBot.currentEpic.title} ↗
          </a>
        </section>
      )}

      {/* ── Active Issues ── */}
      {(currentBot?.currentIssues?.length > 0 || currentBot?.issues?.length > 0) && (
        <section className="intranet-profile__section">
          <h2 className="intranet-profile__section-title">Active Issues</h2>
          <ul className="intranet-profile__issues">
            {(currentBot.issues ?? currentBot.currentIssues ?? []).map((issue) => (
              <li key={issue.number} className="intranet-profile__issue">
                <a href={issue.url} target="_blank" rel="noopener noreferrer">
                  #{issue.number} — {issue.title}
                </a>
                <div className="intranet-profile__issue-meta">
                  <span className="intranet-profile__issue-repo">{issue.repo}</span>
                  {issue.labels?.map((l) => (
                    <span
                      key={l.name}
                      className="intranet-profile__label"
                      style={{ color: `#${l.color}`, borderColor: `#${l.color}` }}
                    >
                      {l.name}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Architecture Diagram ── */}
      {diagramKey && (
        <section className="intranet-profile__section">
          <h2 className="intranet-profile__section-title">Architecture Diagram</h2>
          <ExcalidrawViewer diagramKey={diagramKey} height={400} />
        </section>
      )}

      {/* ── Links ── */}
      {currentBot?.githubUser && (
        <section className="intranet-profile__section">
          <h2 className="intranet-profile__section-title">Links</h2>
          <a
            href={`https://github.com/${currentBot.githubUser}`}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('team.github')}
          </a>
          <a
            href={`https://github.com/Bot-Fleet-Inc/${name}`}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: '0.75rem' }}
          >
            Bot Repo ↗
          </a>
        </section>
      )}
    </main>
  );
}
