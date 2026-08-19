import { useEffect, useRef, useState } from 'react';

import { bem } from '@/css/bem.ts';

import './HelpTip.css';

const [b, e] = bem('help-tip');

export function HelpTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(ev: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div className={b()} ref={rootRef}>
      <button type="button" className={e('trigger')} aria-label="Help" onClick={() => setOpen((v) => !v)}>
        ?
      </button>
      {open && <div className={e('popover')}>{text}</div>}
    </div>
  );
}
