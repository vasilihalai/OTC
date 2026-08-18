import type { ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './KeyValueRow.css';

const [b, e] = bem('key-value-row');

export interface KeyValueRowProps {
  label: string;
  value?: ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

export function KeyValueRow({ label, value, loading, onClick }: KeyValueRowProps) {
  const clickable = !!onClick;

  return (
    <div
      className={b({ clickable })}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <span className={e('label')}>{label}</span>
      {loading ? <span className={e('skeleton')}/> : <span className={e('value')}>{value}</span>}
    </div>
  );
}
