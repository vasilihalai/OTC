import type { ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './WarningPanel.css';

const [b, e] = bem('warning-panel');

export interface WarningPanelProps {
  body: ReactNode;
}

export function WarningPanel({ body }: WarningPanelProps) {
  return (
    <div className={b()}>
      <p className={e('body')}>{body}</p>
    </div>
  );
}
