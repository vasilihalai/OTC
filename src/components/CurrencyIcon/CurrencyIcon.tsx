const CURRENCY_STYLE: Record<string, { bg: string; symbol: string }> = {
  BTC: { bg: '#F7931A', symbol: '₿' },
  USDT: { bg: '#26A17B', symbol: '₮' },
  USDC: { bg: '#2775CA', symbol: '$' },
  RUB: { bg: '#3E9BFF', symbol: '₽' },
};

/** Kyrgyzstan flag: red field, 40-ray gold sun with a stylised tunduk. */
function KgsFlagIcon() {
  const rays = Array.from({ length: 20 }, (_, i) => i * 18);
  return (
    <svg width="100%" height="100%" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#E8112D"/>
      <g stroke="#FFC72C" strokeWidth="1.1">
        {rays.map((angle) => (
          <line
            key={angle}
            x1="20"
            y1="20"
            x2={20 + 13 * Math.cos((angle * Math.PI) / 180)}
            y2={20 + 13 * Math.sin((angle * Math.PI) / 180)}
          />
        ))}
      </g>
      <circle cx="20" cy="20" r="6" fill="#E8112D" stroke="#FFC72C" strokeWidth="1.4"/>
    </svg>
  );
}

/** United States flag: red/white stripes with a blue star canton. */
function UsdFlagIcon() {
  const stripeHeight = 40 / 7;
  return (
    <svg width="100%" height="100%" viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <clipPath id="usd-flag-clip">
          <circle cx="20" cy="20" r="20"/>
        </clipPath>
      </defs>
      <g clipPath="url(#usd-flag-clip)">
        <rect width="40" height="40" fill="#fff"/>
        {[0, 2, 4, 6].map((i) => (
          <rect key={i} y={i * stripeHeight} width="40" height={stripeHeight} fill="#B22234"/>
        ))}
        <rect width="20" height="18" fill="#3C3B6E"/>
      </g>
    </svg>
  );
}

export interface CurrencyIconProps {
  ticker: string;
  size?: number;
}

/** Placeholder brand-ish icon per ticker (mocked — swap for real assets later). */
export function CurrencyIcon({ ticker, size = 40 }: CurrencyIconProps) {
  const wrapStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden' as const,
    flexShrink: 0,
  };

  if (ticker === 'KGS') {
    return <div aria-hidden="true" style={wrapStyle}><KgsFlagIcon/></div>;
  }
  if (ticker === 'USD') {
    return <div aria-hidden="true" style={wrapStyle}><UsdFlagIcon/></div>;
  }

  const style = CURRENCY_STYLE[ticker] ?? { bg: '#2A2C31', symbol: ticker.slice(0, 1) };

  return (
    <div
      aria-hidden="true"
      style={{
        ...wrapStyle,
        background: style.bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
        fontWeight: 700,
      }}
    >
      {style.symbol}
    </div>
  );
}
