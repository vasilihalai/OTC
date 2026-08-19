import type { PropsWithChildren, ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './Modal.css';

const [, e] = bem('modal');

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, footer, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={e('scrim')} onClick={onClose}>
      <div className={e('card')} onClick={(ev) => ev.stopPropagation()}>
        <div className={e('top')}>
          <span className={e('title')}>{title}</span>
          <button type="button" className={e('close')} aria-label="Close" onClick={onClose}>
            <CloseIcon/>
          </button>
        </div>
        <div className={e('body')}>{children}</div>
        {footer && <div className={e('bottom')}>{footer}</div>}
      </div>
    </div>
  );
}
