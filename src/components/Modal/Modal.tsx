import type { PropsWithChildren } from 'react';

import { bem } from '@/css/bem.ts';

import './Modal.css';

const [, e] = bem('modal');

export interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={e('scrim')} onClick={onClose}>
      <div className={e('card')} onClick={(ev) => ev.stopPropagation()}>
        <div className={e('header')}>
          <span className={e('title')}>{title}</span>
          <button type="button" className={e('close')} aria-label="Close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
