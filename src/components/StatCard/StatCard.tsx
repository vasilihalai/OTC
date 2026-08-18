import { bem } from '@/css/bem.ts';

import './StatCard.css';

const [b, e] = bem('stat-card');

export interface StatCardProps {
  value: string;
  unit?: string;
  label: string;
}

export function StatCard({ value, unit, label }: StatCardProps) {
  return (
    <div className={b()}>
      <div className={e('value')}>
        {value}
        {unit && <span className={e('unit')}> {unit}</span>}
      </div>
      <div className={e('label')}>{label}</div>
    </div>
  );
}
