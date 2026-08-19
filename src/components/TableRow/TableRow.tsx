import { bem } from '@/css/bem.ts';
import { CurrencyIcon } from '@/components/CurrencyIcon/CurrencyIcon.tsx';

import './TableRow.css';

const [b, e] = bem('table-row');

function ActionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5 13L13 5M13 5H7.5M13 5V10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export interface TableRowProps {
  ticker: string;
  name: string;
  amount: string;
  onAction: () => void;
  actionLabel: string;
}

export function TableRow({ ticker, name, amount, onAction, actionLabel }: TableRowProps) {
  return (
    <div className={b()}>
      <div className={e('info-cell')}>
        <CurrencyIcon ticker={ticker}/>
        <div className={e('info')}>
          <div className={e('ticker')}>{ticker}</div>
          <div className={e('name')}>{name}</div>
        </div>
      </div>
      <div className={e('amount-cell')}>{amount}</div>
      <div className={e('action-cell')}>
        <button type="button" className={e('action')} aria-label={actionLabel} onClick={onAction}>
          <span className={e('action-circle')}><ActionIcon/></span>
        </button>
      </div>
    </div>
  );
}
