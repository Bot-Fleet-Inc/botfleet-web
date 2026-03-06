import { useTranslation } from 'react-i18next';

const STATUS_MAP = {
  active:       'online',
  online:       'online',
  Provisioning: 'busy',
  'in-progress':'busy',
  inactive:     'offline',
  offline:      'offline',
  planned:      'unknown',
};

function resolveClass(status) {
  const key = STATUS_MAP[status] ?? 'unknown';
  return `status-dot status-dot--${key}`;
}

export function StatusDot({ status }) {
  return <span className={resolveClass(status)} aria-hidden="true" />;
}

export function StatusBadge({ status, className = '' }) {
  const { t } = useTranslation();

  const labelMap = {
    active:        t('status.online'),
    online:        t('status.online'),
    Provisioning:  t('status.inProgress'),
    'in-progress': t('status.busy'),
    inactive:      t('status.offline'),
    offline:       t('status.offline'),
    planned:       t('status.planned'),
  };

  const label = labelMap[status] ?? t('status.unknown');

  return (
    <span className={`bot-status-badge ${className}`} aria-label={label}>
      <StatusDot status={status} />
      {label}
    </span>
  );
}
