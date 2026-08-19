import { Modal } from '@/components/Modal/Modal.tsx';
import { bem } from '@/css/bem.ts';

import './PickerModal.css';

const [b, e] = bem('picker-modal');

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

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
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className={b()}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={e('row', { selected: option.value === value })}
            onClick={() => { onSelect(option.value); onClose(); }}
          >
            <span className={e('label')}>{option.label}</span>
            {option.value === value && <CheckIcon/>}
          </button>
        ))}
      </div>
    </Modal>
  );
}
