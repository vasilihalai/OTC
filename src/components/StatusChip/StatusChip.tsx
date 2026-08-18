import { bem } from '@/css/bem.ts';

import './StatusChip.css';

const [b] = bem('status-chip');

export interface StatusChipProps {
  tone: 'success' | 'info' | 'neutral';
  children: string;
}

export function StatusChip({ tone, children }: StatusChipProps) {
  return <span className={b(tone)}>{children}</span>;
}
