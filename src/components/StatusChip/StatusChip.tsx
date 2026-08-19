import { bem } from '@/css/bem.ts';
import type { DealStatus } from '@/api/index.ts';

import './StatusChip.css';

const [b] = bem('status-chip');

export interface StatusChipProps {
  tone: DealStatus | 'success';
  size?: 'sm' | 'lg';
  children: string;
}

export function StatusChip({ tone, size = 'sm', children }: StatusChipProps) {
  return <span className={b(tone, size)}>{children}</span>;
}
