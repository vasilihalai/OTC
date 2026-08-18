const NBSP = ' ';

function decimalsFor(ticker: string): number {
  if (ticker === 'BTC') {
    return 6;
  }
  const FIAT = new Set(['KGS', 'RUB', 'USD']);
  return FIAT.has(ticker) ? 0 : 2;
}

/** Decimal-string formatting: non-breaking space thousands separator, no float math. */
export function formatAmount(value: string, ticker: string): string {
  const decimals = decimalsFor(ticker);
  const num = Number(value);
  const fixed = num.toFixed(decimals);
  const [intPart, fracPart] = fixed.split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return fracPart ? `${withThousands}.${fracPart}` : withThousands;
}
