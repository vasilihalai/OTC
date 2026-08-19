import type { CSSProperties, PropsWithChildren } from 'react';

import { bem } from '@/css/bem.ts';
import { classNames } from '@/css/classnames.ts';

import './Panel.css';

const [b] = bem('panel');

export interface PanelProps extends PropsWithChildren {
  /** Frame token the panel sits on — §2.1: full-bleed panels fill `--bg-page`. */
  fill?: 'page' | 'raised' | 'surface';
  /** CSS radius shorthand — rounded only on the edge(s) facing a seam or screen edge, per §2.3. */
  radius?: string;
  /** CSS padding shorthand — the 16 (or 20/16/32/16 on withdrawals) lives here, never as a margin. */
  padding?: string;
  className?: string;
}

/**
 * A full-bleed section per §2.3: width 100%, no side margin ever — the
 * inset lives in `padding`, not in a margin on this element or its parent.
 */
export function Panel({ fill = 'page', radius = '16px', padding = '16px', className, children }: PanelProps) {
  const style: CSSProperties = {
    background: `var(--bg-${fill})`,
    borderRadius: radius,
    padding,
  };
  return (
    <section className={classNames(b(), className)} style={style}>
      {children}
    </section>
  );
}
