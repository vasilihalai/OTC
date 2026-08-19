import type { ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './SummaryCard.css';

const [b, e] = bem('summary-card');

export interface SummaryRow {
  key: string;
  label: string;
  value: ReactNode;
  /** Second line under the value, rendered in 600 weight (e.g. a contract-address tail). */
  tail?: ReactNode;
}

export interface SummaryCardProps {
  rows: SummaryRow[];
  totalLabel: string;
  totalValue: ReactNode;
  caption?: string;
}

export function SummaryCard({ rows, totalLabel, totalValue, caption }: SummaryCardProps) {
  return (
    <div className={b()}>
      {rows.map((row) => (
        <div key={row.key} className={e('row')}>
          <span className={e('label')}>{row.label}</span>
          <span className={e('value-group')}>
            <span className={e('value')}>{row.value}</span>
            {row.tail && <span className={e('tail')}>{row.tail}</span>}
          </span>
        </div>
      ))}
      <div className={e('row', 'total')}>
        <span className={e('label', 'total')}>{totalLabel}</span>
        <span className={e('value', 'total')}>{totalValue}</span>
      </div>
      {caption && <p className={e('caption')}>{caption}</p>}
    </div>
  );
}
