import { bem } from '@/css/bem.ts';

import './AssetRow.css';

const [b, e] = bem('asset-row');

export interface AssetRowProps {
  ticker: string;
  name: string;
  amount: string;
  onWithdraw: () => void;
}

export function AssetRow({ ticker, name, amount, onWithdraw }: AssetRowProps) {
  return (
    <div className={b()}>
      <div className={e('icon')} aria-hidden="true">{ticker.slice(0, 1)}</div>
      <div className={e('info')}>
        <div className={e('ticker')}>{ticker}</div>
        <div className={e('name')}>{name}</div>
      </div>
      <div className={e('amount')}>{amount}</div>
      <button type="button" className={e('withdraw')} aria-label={`Withdraw ${ticker}`} onClick={onWithdraw}>
        ↓
      </button>
    </div>
  );
}
