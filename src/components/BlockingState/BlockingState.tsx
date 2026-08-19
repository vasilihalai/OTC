import type { ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './BlockingState.css';

const [b, e] = bem('blocking-state');

function ShieldIcon() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
      <circle cx="44" cy="44" r="44" fill="var(--st-amber-fill)"/>
      <path
        d="M44 22l16 6v11c0 12-7 20-16 25-9-5-16-13-16-25V28l16-6Z"
        stroke="var(--st-amber)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M38 44l4.5 4.5L50 40" stroke="var(--st-amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export interface BlockingStateProps {
  logo: ReactNode;
  title: string;
  body: string;
  action: ReactNode;
  caption?: string;
}

export function BlockingState({ logo, title, body, action, caption }: BlockingStateProps) {
  return (
    <div className={b()}>
      <div className={e('logo')}>{logo}</div>
      <div className={e('content')}>
        <ShieldIcon/>
        <h1 className={e('title')}>{title}</h1>
        <p className={e('body')}>{body}</p>
        <div className={e('action')}>{action}</div>
        {caption && <p className={e('caption')}>{caption}</p>}
      </div>
    </div>
  );
}
