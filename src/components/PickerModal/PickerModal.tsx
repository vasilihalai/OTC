import { bem } from '@/css/bem.ts';

import './PickerModal.css';

const [b, e] = bem('picker-sheet');

export interface PickerModalOption<T extends string> {
  value: T;
  label: string;
}

export interface PickerModalProps<T extends string> {
  open: boolean;
  title: string;
  options: PickerModalOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function PickerModal<T extends string>({ open, title, options, value, onSelect, onClose }: PickerModalProps<T>) {
  if (!open) {
    return null;
  }

  return (
    <div className={e('scrim')} onClick={onClose}>
      <div className={b()} onClick={(ev) => ev.stopPropagation()}>
        <div className={e('handle')}/>
        <span className={e('title')}>{title}</span>
        <div className={e('list')}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={e('row', { selected: option.value === value })}
              onClick={() => { onSelect(option.value); onClose(); }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
