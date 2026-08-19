import { bem } from '@/css/bem.ts';

import './TableRow.css';

const [b, e] = bem('table-row');

function ActionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
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
      <div className={e('info')}>
        <div className={e('ticker')}>{ticker}</div>
        <div className={e('name')}>{name}</div>
      </div>
      <div className={e('amount')}>{amount}</div>
      <button type="button" className={e('action')} aria-label={actionLabel} onClick={onAction}>
        <ActionIcon/>
      </button>
    </div>
  );
}
