import type { ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './Callout.css';

const [b] = bem('callout');

export interface CalloutProps {
  variant: 'neutral' | 'warning' | 'danger';
  children: ReactNode;
}

export function Callout({ variant, children }: CalloutProps) {
  return <div className={b(variant)}>{children}</div>;
}
