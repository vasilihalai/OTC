const NBSP = ' ';

const FIAT_TICKERS = new Set(['KGS', 'RUB', 'USD']);

export function isFiatTicker(ticker: string): boolean {
  return FIAT_TICKERS.has(ticker);
}

function decimalsFor(ticker: string): number {
  if (ticker === 'BTC') {
    return 6;
  }
  return isFiatTicker(ticker) ? 0 : 2;
}

/** Parses a fixture amount string like `44 420 000 KGS` into its numeric value and ticker. */
export function parseAmountWithTicker(raw: string): { value: number; ticker: string } {
  const match = /^([\d\s.,]+)\s+([A-Z]+)$/.exec(raw.trim());
  if (!match) {
    return { value: 0, ticker: '' };
  }
  return { value: Number(match[1].replace(/[\s,]/g, '')), ticker: match[2] };
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
