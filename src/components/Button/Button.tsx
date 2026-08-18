import type { ButtonHTMLAttributes } from 'react';

import { bem } from '@/css/bem.ts';
import { classNames } from '@/css/classnames.ts';

import './Button.css';

const [b] = bem('button');

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return <button className={classNames(b(variant), className)} {...rest} />;
}
