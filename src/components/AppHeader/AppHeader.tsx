import { bem } from '@/css/bem.ts';
import { isRealTelegram } from '@/telegram/environment.ts';
import { ru } from '@/i18n/ru.ts';

import './AppHeader.css';

const [b, e] = bem('app-header');

const FORCE_IN_APP = import.meta.env.VITE_FORCE_INAPP_HEADER === 'true';

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
        <span className={e('pill')}>
          <span className={e('mark')} aria-hidden="true"/>
          XRuby
        </span>
      </div>
    );
  }

  return (
    <div className={b()}>
      <button type="button" className={e('pill')} onClick={onBack}>
        <span className={e('icon')} aria-hidden="true">{variant === 'close' ? '✕' : '‹'}</span>
        {variant === 'close' ? ru.header.close : ru.header.back}
      </button>
    </div>
  );
}
