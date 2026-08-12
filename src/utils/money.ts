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

/** Line total for cart rows (API uses lineTotalTiyns). */
export function itemLineTotalTiyns(item: {
  lineTotalTiyns?: number;
  totalTiyns?: number;
  priceSnapshot?: number;
  quantity?: number;
}): number {
  if (Number.isFinite(item.lineTotalTiyns)) return Number(item.lineTotalTiyns);
  if (Number.isFinite(item.totalTiyns)) return Number(item.totalTiyns);
  const unit = Number(item.priceSnapshot) || 0;
  const qty = Number(item.quantity) || 0;
  return unit * qty;
}
