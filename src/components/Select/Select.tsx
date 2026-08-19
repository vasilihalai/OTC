import type { ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './Select.css';

const [b, e] = bem('select');

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  label: string;
  options: SelectOption<T>[];
  value: T;
  onChange?: (value: T) => void;
  readOnly?: boolean;
  showClear?: boolean;
  renderValue?: (option: SelectOption<T>) => ReactNode;
}

export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  readOnly,
  showClear,
  renderValue,
}: SelectProps<T>) {
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className={b()}>
      <span className={e('label')}>{label}</span>
      {readOnly ? (
        <div className={e('box', { readonly: true })}>
          <span className={e('value')}>{renderValue ? renderValue(selected) : selected?.label}</span>
          {showClear && <span className={e('clear')} aria-hidden="true">✕</span>}
        </div>
      ) : (
        <div className={e('box')}>
          {showClear && <span className={e('clear')} aria-hidden="true">✕</span>}
          <select
            className={e('native', { withClear: !!showClear })}
            value={value}
            onChange={(ev) => onChange?.(ev.target.value as T)}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
