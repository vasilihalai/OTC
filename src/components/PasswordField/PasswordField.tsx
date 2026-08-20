import { useId, useState } from 'react';

import { classNames } from '@/css/classnames.ts';
import { bem } from '@/css/bem.ts';
import type { TextFieldProps } from '@/components/TextField/TextField.tsx';
import { EyeIcon, EyeOffIcon } from '@/components/PasswordField/icons.tsx';

import './PasswordField.css';

const [b, e] = bem('password-field');

export function PasswordField({ label, error, className, value, ...rest }: Omit<TextFieldProps, 'type'>) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  // Only the native masked dots need the smaller font — an empty field
  // shows the placeholder, which must stay at the same size as every other
  // field's placeholder (e.g. Email's "Введите почту").
  const masked = !visible && !!value;

  return (
    <div className={classNames(b({ invalid: !!error }), className)}>
      <label className={e('label')} htmlFor={id}>
        {label}
      </label>
      <div className={e('box')}>
        <input
          id={id}
          className={e('input', { masked })}
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
