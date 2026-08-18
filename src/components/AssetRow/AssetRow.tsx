import { bem } from '@/css/bem.ts';
import { CurrencyIcon } from '@/components/CurrencyIcon/CurrencyIcon.tsx';

import './AssetRow.css';

const [b, e] = bem('asset-row');

function WithdrawIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export interface AssetRowProps {
  ticker: string;
  name: string;
  amount: string;
  onWithdraw: () => void;
}

export function AssetRow({ ticker, name, amount, onWithdraw }: AssetRowProps) {
  return (
    <div className={b()}>
      <CurrencyIcon ticker={ticker}/>
      <div className={e('info')}>
        <div className={e('ticker')}>{ticker}</div>
        <div className={e('name')}>{name}</div>
      </div>
      <div className={e('amount')}>{amount}</div>
      <button type="button" className={e('withdraw')} aria-label={`Withdraw ${ticker}`} onClick={onWithdraw}>
        <WithdrawIcon/>
      </button>
    </div>
  );
}
