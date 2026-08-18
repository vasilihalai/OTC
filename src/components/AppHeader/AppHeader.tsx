import { bem } from '@/css/bem.ts';
import { isRealTelegram } from '@/telegram/environment.ts';
import { ru } from '@/i18n/ru.ts';

import './AppHeader.css';

const [b, e] = bem('app-header');

const FORCE_IN_APP = import.meta.env.VITE_FORCE_INAPP_HEADER === 'true';

function ChevronIcon() {
  return (
    <svg width="11" height="18" viewBox="0 0 11 18" fill="none">
      <path d="M9.5 1.5L1.5 9L9.5 16.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export interface AppHeaderProps {
  variant: 'close' | 'back' | 'home' | 'none';
  onBack: () => void;
}

export function AppHeader({ variant, onBack }: AppHeaderProps) {
  if (variant === 'none') {
    return null;
  }
  if (isRealTelegram && !FORCE_IN_APP) {
    return null;
  }

  if (variant === 'home') {
    return (
      <div className={b()}>
        <span className={e('brand')}>
          <span className={e('mark')} aria-hidden="true"/>
          XRuby
        </span>
      </div>
    );
  }

  return (
    <div className={b()}>
      <button
        type="button"
        className={e('nav-button')}
        aria-label={variant === 'close' ? ru.header.close : ru.header.back}
        onClick={onBack}
      >
        {variant === 'close' ? <CloseIcon/> : <ChevronIcon/>}
      </button>
    </div>
  );
}
