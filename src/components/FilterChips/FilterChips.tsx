import { bem } from '@/css/bem.ts';

import './FilterChips.css';

const [b, e] = bem('filter-chips');

export interface FilterChipsOption<T extends string> {
  value: T;
  label: string;
}

export interface FilterChipsProps<T extends string> {
  options: FilterChipsOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
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
        </button>
      ))}
    </div>
  );
}
