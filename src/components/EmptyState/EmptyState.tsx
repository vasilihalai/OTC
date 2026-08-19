import { bem } from '@/css/bem.ts';

import './EmptyState.css';

const [b, e] = bem('empty-state');

function TrayIcon() {
  return (
    <svg width="70" height="60" viewBox="0 0 70 60" fill="none" aria-hidden="true">
      <path
        d="M8 34l7.5-22a4 4 0 0 1 3.8-2.7h31.4a4 4 0 0 1 3.8 2.7L62 34"
        stroke="var(--border-strong)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 34h15.2a2 2 0 0 1 1.9 1.4L27 40h16l1.9-4.6a2 2 0 0 1 1.9-1.4H62v14a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V34Z"
        fill="var(--bg-raised)"
        stroke="var(--border-strong)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface EmptyStateProps {
  caption: string;
}

export function EmptyState({ caption }: EmptyStateProps) {
  return (
    <div className={b()}>
      <TrayIcon/>
      <p className={e('caption')}>{caption}</p>
    </div>
  );
}
