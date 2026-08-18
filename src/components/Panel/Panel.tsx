import type { PropsWithChildren, ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './Panel.css';

const [b, e] = bem('panel');

export interface PanelProps extends PropsWithChildren {
  heading?: string;
  headingAction?: ReactNode;
  surface?: 'panel' | 'card';
}

export function Panel({ heading, headingAction, surface = 'panel', children }: PanelProps) {
  return (
    <section className={b(surface)}>
      {heading && (
        <div className={e('header')}>
          <h2 className={e('heading')}>{heading}</h2>
          {headingAction}
        </div>
      )}
      {children}
    </section>
  );
}
