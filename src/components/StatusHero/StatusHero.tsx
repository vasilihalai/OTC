import type { ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './StatusHero.css';

const [b, e] = bem('status-hero');

export type StatusHeroIcon = 'spinner' | 'check' | 'cross' | 'hourglass';
export type StatusHeroTone = 'success' | 'danger' | 'running' | 'stale' | 'pending';

function SpinnerIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={e('spin')} aria-hidden="true">
      <circle cx="20" cy="20" r="16" stroke="var(--border)" strokeWidth="3"/>
      <path d="M20 4a16 16 0 0 1 16 16" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

/** Shared "medallion" backing for the terminal-state icons: a light metallic disc, not a flat status-color fill. */
function Medallion({ gradientId, children }: { gradientId: string; children: ReactNode }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#75787E"/>
          <stop offset="100%" stopColor="#35373C"/>
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="16" fill={`url(#${gradientId})`}/>
      <circle cx="20" cy="20" r="15.25" fill="none" stroke="#8A8D93" strokeWidth="0.5" strokeOpacity="0.5"/>
      {children}
    </svg>
  );
}

function CheckIcon() {
  return (
    <Medallion gradientId="status-hero-medal-check">
      <path d="M13.5 20.5l4.5 4.5L27 15" stroke="var(--status-done-text)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </Medallion>
  );
}

function CrossIcon() {
  return (
    <Medallion gradientId="status-hero-medal-cross">
      <path d="M15 15l10 10M25 15L15 25" stroke="var(--status-declined-text)" strokeWidth="2.6" strokeLinecap="round"/>
    </Medallion>
  );
}

function HourglassIcon() {
  return (
    <Medallion gradientId="status-hero-medal-hourglass">
      <path
        d="M14.5 13h11M14.5 27h11M15.3 13c0 3.6 2.4 5.6 4.8 7.2-2.4 1.6-4.8 3.6-4.8 7.2M24.7 13c0 3.6-2.4 5.6-4.8 7.2 2.4 1.6 4.8 3.6 4.8 7.2"
        stroke="var(--status-rate-stale-text)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Medallion>
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
