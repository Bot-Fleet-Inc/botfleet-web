import { useTranslation } from 'react-i18next';

// Normalise any status string → canonical key
const STATUS_MAP = {
  active:        'online',
  online:        'online',
  idle:          'online',
  working:       'busy',
  'in-progress': 'busy',
  Provisioning:  'busy',
  loading:       'busy',
  inactive:      'offline',
  offline:       'offline',
  planned:       'unknown',
  unknown:       'unknown',
};

export function resolveStatus(status) {
  return STATUS_MAP[status] ?? 'unknown';
}

export function StatusDot({ status }) {
  const key = resolveStatus(status);
  return <span className={`status-dot status-dot--${key}`} aria-hidden="true" />;
}

export function StatusBadge({ status, className = '' }) {
  const { t } = useTranslation();
  const key = resolveStatus(status);

  const labelMap = {
    online:  t('status.online'),
    busy:    t('status.busy'),
    offline: t('status.offline'),
    unknown: t('status.unknown'),
  };

  const label = labelMap[key] ?? t('status.unknown');

  return (
    <span
      className={`bot-status-badge bot-status-badge--${key} ${className}`}
      aria-label={label}
      data-status={key}
    >
      <StatusDot status={status} />
      {label}
    </span>
  );
}
