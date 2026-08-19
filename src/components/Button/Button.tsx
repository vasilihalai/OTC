import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { bem } from '@/css/bem.ts';
import { classNames } from '@/css/classnames.ts';

import './Button.css';

const [b, e] = bem('button');

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'link' | 'footer-link';
  /** 36-high, radius 18, `button-sm` label — used only by the profile certificate button. */
  size?: 'regular' | 'compact';
  /** Recolors the `link` variant to `--accent`, for danger-style links (Отклонить, Отменить заявку). */
  danger?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'regular', danger, loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={classNames(b(variant, { loading, danger: !!danger, compact: size === 'compact' }), className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className={e('spinner')} aria-hidden="true"/>
      ) : (
        <>
          {icon && <span className={e('icon')}>{icon}</span>}
          <span className={e('label')}>{children}</span>
          {variant === 'footer-link' && <span className={e('chevron')} aria-hidden="true">›</span>}
        </>
      )}
    </button>
  );
}
