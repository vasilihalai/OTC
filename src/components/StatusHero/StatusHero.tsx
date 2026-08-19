import type { ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './StatusHero.css';

const [b, e] = bem('status-hero');

export type StatusHeroIcon = 'spinner' | 'check' | 'cross' | 'hourglass';
export type StatusHeroTone = 'success' | 'danger' | 'running' | 'stale' | 'pending';

function SpinnerIcon() {
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" className={e('spin')} aria-hidden="true">
      <circle cx="25" cy="25" r="20" stroke="var(--border)" strokeWidth="4"/>
      <path d="M25 5a20 20 0 0 1 20 20" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
      <circle cx="25" cy="25" r="20" fill="var(--status-done-fill)"/>
      <path d="M17 25.5l6 6L34 18" stroke="var(--status-done-text)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
      <circle cx="25" cy="25" r="20" fill="var(--status-declined-fill)"/>
      <path d="M19 19l12 12M31 19L19 31" stroke="var(--status-declined-text)" strokeWidth="3.2" strokeLinecap="round"/>
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
      <circle cx="25" cy="25" r="20" fill="var(--status-rate-stale-fill)"/>
      <path
        d="M18 16h14M18 34h14M19 16c0 4.5 3 7 6 9-3 2-6 4.5-6 9M31 16c0 4.5-3 7-6 9 3 2 6 4.5 6 9"
        stroke="var(--status-rate-stale-text)"
        strokeWidth="1.8"
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
