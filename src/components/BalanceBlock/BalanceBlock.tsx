import { useRef } from 'react';

import { KeyValueRow } from '@/components/KeyValueRow/KeyValueRow.tsx';
import { bem } from '@/css/bem.ts';
import { ru } from '@/i18n/ru.ts';

import './BalanceBlock.css';

const [b, e] = bem('balance-block');

const LONG_PRESS_MS = 600;

function TransferIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 8h10m0 0l-3.5-3.5M17 8l-3.5 3.5M17 16H7m0 0l3.5-3.5M7 16l3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export interface BalanceBlockProps {
  balance: string;
  ticker: string;
  dealAmount: string;
  shortfall?: string;
  onTransfer: () => void;
  onLongPressBalance?: () => void;
}

export function BalanceBlock({ balance, ticker, dealAmount, shortfall, onTransfer, onLongPressBalance }: BalanceBlockProps) {
  const timer = useRef<ReturnType<typeof setTimeout>>();

  function startPress() {
    if (!onLongPressBalance) {
      return;
    }
    timer.current = setTimeout(onLongPressBalance, LONG_PRESS_MS);
  }

  function cancelPress() {
    clearTimeout(timer.current);
  }

  return (
    <div className={b()}>
      <div className={e('header')}>
        <span className={e('label')}>{ru.dealDetail.balanceLabel}</span>
        <button type="button" className={e('transfer')} aria-label={ru.dealDetail.transferAction} onClick={onTransfer}>
          <TransferIcon/>
        </button>
      </div>
      <div
        className={e('amount')}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
      >
        {balance}
        <span className={e('ticker')}>{ticker}</span>
      </div>
      <KeyValueRow label={ru.dealDetail.dealAmountLabel} value={dealAmount}/>
      {shortfall && <KeyValueRow label={ru.dealDetail.shortfallLabel} value={shortfall}/>}
    </div>
  );
}
