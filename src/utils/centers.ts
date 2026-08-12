/** Shared production-center labels (RU). */
export const CENTER_LABELS: Record<string, string> = {
  COLD: 'Холодный цех',
  KITCHEN: 'Китайский / горячий',
  BAR: 'Бар',
  GRILL: 'Мангал',
  DESSERT: 'Десерты',
  OTHER: 'Предчек',
};

export const ALL_CENTERS = [
  'COLD',
  'KITCHEN',
  'BAR',
  'GRILL',
  'DESSERT',
  'OTHER',
] as const;

export function centerLabel(center?: string | null): string {
  if (!center) return '—';
  return CENTER_LABELS[center] || center;
}
