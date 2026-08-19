import type { ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './WarningPanel.css';

const [b, e] = bem('warning-panel');

function WarningIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l10 18H2L12 3Z" stroke="var(--status-awaiting-funds-text)" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M12 10v4.5M12 17.2v.1" stroke="var(--status-awaiting-funds-text)" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

export interface WarningPanelProps {
  title: string;
  body: ReactNode;
}

export function WarningPanel({ title, body }: WarningPanelProps) {
  return (
    <div className={b()}>
      <WarningIcon/>
      <div className={e('text')}>
        <p className={e('title')}>{title}</p>
        <p className={e('body')}>{body}</p>
      </div>
    </div>
  );
}
