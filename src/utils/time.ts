/** Format timestamps for staff UI. */

export function formatDateTime(iso?: string | Date | null): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' || iso instanceof Date ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatElapsed(iso?: string | Date | null, now = Date.now()): string {
  if (!iso) return '';
  const d = typeof iso === 'string' || iso instanceof Date ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  const mins = Math.max(0, Math.floor((now - d.getTime()) / 60_000));
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}
