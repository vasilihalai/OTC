import { classNames } from '@/css/classnames.ts';

import './Spinner.css';

export interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <span
      className={classNames('spinner', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
