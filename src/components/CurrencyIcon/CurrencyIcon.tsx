import type { ReactNode } from 'react';

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

/** United States flag: red/white stripes, blue canton with a 3x3 star grid. */
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
        {[4, 9.5, 15].map((x) =>
          [3.5, 8.7, 13.9].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="#fff"/>
          )),
        )}
      </g>
    </svg>
  );
}

/** Tether: green field, the "T"-through-a-ring mark. */
function UsdtCoinIcon() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#26A17B"/>
      <rect x="13.5" y="11.5" width="13" height="3.4" rx="0.6" fill="#fff"/>
      <rect x="18.3" y="11.5" width="3.4" height="19" rx="0.6" fill="#fff"/>
      <ellipse cx="20" cy="20.6" rx="9.6" ry="2.7" fill="none" stroke="#fff" strokeWidth="1.7"/>
    </svg>
  );
}

/** USD Coin: blue field, a circular double-arrow with a $ mark. */
function UsdcCoinIcon() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#2775CA"/>
      <path d="M15.5 12.8a10 10 0 0 0 0 14.4" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M24.5 12.8a10 10 0 0 1 0 14.4" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <text x="20" y="25.5" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">$</text>
    </svg>
  );
}

/** Ethereum: indigo field, the stacked-diamond mark. */
function EthCoinIcon() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#627EEA"/>
      <polygon points="20,9 20,17.9 27.8,21.6" fill="#fff" fillOpacity="0.6"/>
      <polygon points="20,9 12.2,21.6 20,17.9" fill="#fff"/>
      <polygon points="20,23.2 20,31 27.8,23.1" fill="#fff" fillOpacity="0.6"/>
      <polygon points="20,31 20,23.2 12.2,23.1" fill="#fff"/>
      <polygon points="20,21.6 27.8,17.4 20,13.4" fill="#fff" fillOpacity="0.2"/>
      <polygon points="12.2,17.4 20,21.6 20,13.4" fill="#fff" fillOpacity="0.6"/>
    </svg>
  );
}

/** Bitcoin: orange field, the double-barred ₿ mark. */
function BtcCoinIcon() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#F7931A"/>
      <text x="20" y="26.5" textAnchor="middle" fontSize="19" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">₿</text>
    </svg>
  );
}

/** Russian ruble: sky-blue field, the ₽ mark. */
function RubCoinIcon() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#5AC8FA"/>
      <text x="20" y="26" textAnchor="middle" fontSize="17" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">₽</text>
    </svg>
  );
}

/** Solid-color circle with a plain text symbol — the fallback for any other ticker. */
function SymbolCoinIcon({ symbol }: { symbol: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#2A2C31"/>
      <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">{symbol}</text>
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  KGS: <KgsFlagIcon/>,
  USD: <UsdFlagIcon/>,
  USDT: <UsdtCoinIcon/>,
  USDC: <UsdcCoinIcon/>,
  ETH: <EthCoinIcon/>,
  BTC: <BtcCoinIcon/>,
  RUB: <RubCoinIcon/>,
};

export interface CurrencyIconProps {
  ticker: string;
  size?: number;
}

/** Flat brand-ish icon per ticker (mocked — swap for real assets later). */
export function CurrencyIcon({ ticker, size = 40 }: CurrencyIconProps) {
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}
    >
      {ICONS[ticker] ?? <SymbolCoinIcon symbol={ticker.slice(0, 1)}/>}
    </div>
  );
}
