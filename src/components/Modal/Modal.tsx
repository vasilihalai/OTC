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
  /** Card width in px — defaults to 400 (capped by `max-width: calc(100% - 32px)`). Per-instance so narrowing one modal doesn't narrow every modal. */
  width?: number;
  /** `bare` is a plain 20px glyph with no button chrome, per the transfer-modal Figma frame — everything else keeps the round `--bg-raised` button. */
  closeVariant?: 'round' | 'bare';
}

export function Modal({ open, title, onClose, footer, children, width = 400, closeVariant = 'round' }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={e('scrim')} onClick={onClose}>
      <div className={e('card')} style={{ width }} onClick={(ev) => ev.stopPropagation()}>
        <div className={e('top')}>
          <span className={e('title')}>{title}</span>
          <button type="button" className={e('close', { bare: closeVariant === 'bare' })} aria-label="Close" onClick={onClose}>
            <CloseIcon/>
          </button>
        </div>
        <div className={e('body')}>{children}</div>
        {footer && <div className={e('bottom')}>{footer}</div>}
      </div>
    </div>
  );
}
