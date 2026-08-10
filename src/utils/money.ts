/** Format integer tiyns as tenge display: 250000 → "2 500 ₸" */
export function formatMoney(tiyns: number): string {
  const tenge = Math.trunc(tiyns) / 100;
  const [intPart, fracPart] = tenge.toFixed(2).split('.');
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
