import { bem } from '@/css/bem.ts';

import './StatusChip.css';

const [b] = bem('status-chip');

export interface StatusChipProps {
  tone: 'success' | 'info' | 'amber' | 'danger' | 'violet' | 'neutral' | 'badge';
  children: string;
}

export function StatusChip({ tone, children }: StatusChipProps) {
  return <span className={b(tone)}>{children}</span>;
}
