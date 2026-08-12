/** Format integer tiyns as tenge display: 250000 → "2 500 ₸" */
export function formatMoney(tiyns: number | null | undefined): string {
  const n = Number(tiyns);
  if (!Number.isFinite(n)) {
    return '0 ₸';
  }
  const tenge = Math.trunc(n) / 100;
  const [intPart, fracPart = '00'] = tenge.toFixed(2).split('.');
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (fracPart === '00') {
    return `${withSpaces} ₸`;
  }
  return `${withSpaces},${fracPart} ₸`;
}

export function tengeToTiyns(tenge: number): number {
  return Math.round(tenge * 100);
}

export function tiynsToTenge(tiyns: number): number {
  return Math.trunc(tiyns) / 100;
}

/** Remaining to pay after prepaid deposit. */
export function orderDueTiyns(order: {
  totalTiyns?: number;
  prepaidTiyns?: number;
}): number {
  return Math.max(0, Math.trunc(order.totalTiyns || 0) - Math.trunc(order.prepaidTiyns || 0));
}

