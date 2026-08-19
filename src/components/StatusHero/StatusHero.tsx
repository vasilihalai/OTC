import type { ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './StatusHero.css';

const [b, e] = bem('status-hero');

export type StatusHeroIcon = 'spinner' | 'check' | 'cross' | 'hourglass';
export type StatusHeroTone = 'success' | 'danger' | 'running' | 'stale';

function SpinnerIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className={e('spin')} aria-hidden="true">
      <circle cx="28" cy="28" r="22" stroke="var(--border)" strokeWidth="4"/>
      <path d="M28 6a22 22 0 0 1 22 22" stroke="var(--brand-red)" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <circle cx="28" cy="28" r="22" fill="var(--st-success-fill)"/>
      <path d="M19 28.5l6.5 6.5L38 21" stroke="var(--st-success)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <circle cx="28" cy="28" r="22" fill="var(--st-danger-fill)"/>
      <path d="M21 21l14 14M35 21L21 35" stroke="var(--st-danger)" strokeWidth="3.4" strokeLinecap="round"/>
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <circle cx="28" cy="28" r="22" fill="var(--st-neutral-fill)"/>
      <path
        d="M20 18h16M20 38h16M21 18c0 5 3.5 8 7 10-3.5 2-7 5-7 10M35 18c0 5-3.5 8-7 10 3.5 2 7 5 7 10"
        stroke="var(--st-neutral)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS: Record<StatusHeroIcon, () => ReactNode> = {
  spinner: SpinnerIcon,
  check: CheckIcon,
  cross: CrossIcon,
  hourglass: HourglassIcon,
};

export interface StatusHeroProps {
  icon: StatusHeroIcon;
  tone: StatusHeroTone;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function StatusHero({ icon, tone, title, subtitle, action }: StatusHeroProps) {
  const Icon = ICONS[icon];
  return (
    <div className={b(tone)}>
      <Icon/>
      <h3 className={e('title')}>{title}</h3>
      {subtitle && <p className={e('subtitle')}>{subtitle}</p>}
      {action && <div className={e('action')}>{action}</div>}
    </div>
  );
}
