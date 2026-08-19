import { bem } from '@/css/bem.ts';
import { Badge } from '@/components/Badge/Badge.tsx';

import './SegmentedControl.css';

const [b, e] = bem('segmented-control');

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className={b()}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={e('item', { active: option.value === value })}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && <Badge variant="count">{option.count}</Badge>}
        </button>
      ))}
    </div>
  );
}
