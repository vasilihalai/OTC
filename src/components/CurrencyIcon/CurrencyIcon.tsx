const CURRENCY_STYLE: Record<string, { bg: string; symbol: string }> = {
  BTC: { bg: '#F7931A', symbol: '₿' },
  USDT: { bg: '#26A17B', symbol: '₮' },
  USDC: { bg: '#2775CA', symbol: '$' },
  KGS: { bg: '#E5232E', symbol: 'с' },
  RUB: { bg: '#3E9BFF', symbol: '₽' },
  USD: { bg: '#34C77B', symbol: '$' },
};

export interface CurrencyIconProps {
  ticker: string;
  size?: number;
}

/** Placeholder brand-ish icon per ticker (mocked — swap for real assets later). */
export function CurrencyIcon({ ticker, size = 40 }: CurrencyIconProps) {
  const style = CURRENCY_STYLE[ticker] ?? { bg: '#2A2C31', symbol: ticker.slice(0, 1) };

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: style.bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {style.symbol}
    </div>
  );
}
