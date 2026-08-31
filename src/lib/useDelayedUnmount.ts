import { useEffect, useState } from 'react';

/**
 * Keeps a conditionally-rendered node mounted for `exitDurationMs` after
 * `open` goes false, so a closing animation has time to play instead of the
 * node vanishing on the same frame the state flips — used by `Modal` and
 * `PickerModal`, whose overlays otherwise animated in but not out.
 */
export function useDelayedUnmount(open: boolean, exitDurationMs: number): boolean {
  const [rendered, setRendered] = useState(open);

  useEffect(() => {
    if (open) {
      setRendered(true);
      return;
    }
    if (!rendered) {
      return;
    }
    const timer = setTimeout(() => setRendered(false), exitDurationMs);
    return () => clearTimeout(timer);
  }, [open, exitDurationMs, rendered]);

  return rendered;
}
