import { useId, useState } from 'react';

import { classNames } from '@/css/classnames.ts';
import { bem } from '@/css/bem.ts';
import type { TextFieldProps } from '@/components/TextField/TextField.tsx';
import { EyeIcon, EyeOffIcon } from '@/components/PasswordField/icons.tsx';

import './PasswordField.css';

const [b, e] = bem('password-field');

export type PasswordFieldProps = Omit<TextFieldProps, 'type'>;

export function PasswordField({ label, error, className, value, ...rest }: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className={classNames(b({ invalid: !!error }), className)}>
      <label className={e('label')} htmlFor={id}>{label}</label>
      <div className={e('box')}>
        <input
          id={id}
          className={e('input', { masked: !visible })}
          type={visible ? 'text' : 'password'}
          autoComplete="off"
          value={value}
          {...rest}
        />
        <button
          type="button"
          className={e('toggle')}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon/> : <EyeIcon/>}
        </button>
      </div>
      {error && <span className={e('error')}>{error}</span>}
    </div>
  );
}
