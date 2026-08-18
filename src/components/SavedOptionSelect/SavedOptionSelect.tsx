import { useId } from 'react';

import { bem } from '@/css/bem.ts';

import './SavedOptionSelect.css';

const [b, e] = bem('saved-option-select');

export const NEW_OPTION_VALUE = '__new__';

export interface SavedOptionSelectProps {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  newOptionLabel: string;
  manageLabel: string;
  onManage: () => void;
}

export function SavedOptionSelect({
  label,
  options,
  value,
  onChange,
  newOptionLabel,
  manageLabel,
  onManage,
}: SavedOptionSelectProps) {
  const id = useId();

  return (
    <div className={b()}>
      <label className={e('label')} htmlFor={id}>{label}</label>
      <select id={id} className={e('select')} value={value} onChange={(ev) => onChange(ev.target.value)}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
        <option value={NEW_OPTION_VALUE}>{newOptionLabel}</option>
      </select>
      <button type="button" className={e('manage')} onClick={onManage}>{manageLabel}</button>
    </div>
  );
}
