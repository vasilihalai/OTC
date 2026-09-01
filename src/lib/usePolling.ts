import { useEffect, useRef } from 'react';

/**
 * api-integration.md §7.7 — no WebSocket/SSE for OTC, poll instead. Stops
 * doing any work while the tab is hidden (`document.hidden` guards each
 * tick rather than tearing the interval down and rebuilding it), and fires
 * once immediately on resume rather than waiting out a full interval — a
 * client who just tabbed back in wants the truth now, not up to
 * `intervalMs` later. `enabled` covers both "is this screen even open" and,
 * for deal detail, "is the deal still in a non-terminal status."
 */
export function usePolling(callback: () => void, intervalMs: number, enabled: boolean): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    function onVisibilityChange() {
      if (!document.hidden) {
        callbackRef.current();
      }
    }
    const interval = setInterval(() => {
      if (!document.hidden) {
        callbackRef.current();
      }
    }, intervalMs);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
