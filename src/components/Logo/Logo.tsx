import { bem } from '@/css/bem.ts';

import './Logo.css';

const [b, e] = bem('logo');

export function Logo() {
  return (
    <span className={b()}>
      <span className={e('mark')} aria-hidden="true">X</span>
      <span className={e('word')}>RUBY</span>
    </span>
  );
}
