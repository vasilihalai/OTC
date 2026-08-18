import type { ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './Row.css';

const [b, e] = bem('row');

export interface RowProps {
  label: string;
  value?: ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

export function Row({ label, value, loading, onClick }: RowProps) {
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
