import { type InputHTMLAttributes, useId } from 'react';

import { bem } from '@/css/bem.ts';
import { classNames } from '@/css/classnames.ts';

import './TextField.css';

const [b, e] = bem('text-field');

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
}

export function TextField({ label, error, className, ...rest }: TextFieldProps) {
  const id = useId();

  return (
    <div className={classNames(b({ invalid: !!error }), className)}>
      <label className={e('label')} htmlFor={id}>{label}</label>
      <input id={id} className={e('input')} autoComplete="off" {...rest} />
      {error && <span className={e('error')}>{error}</span>}
    </div>
  );
}
