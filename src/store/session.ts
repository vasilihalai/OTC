import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getUser } from '@/api/index.ts';
import type { Session } from '@/api/types.ts';

interface SessionStore {
  session: Session | null;
  setSession: (session: Session) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    { name: 'xruby-session' },
  ),
);

/** Bounces to /login if there's no active session (e.g. direct navigation, sign-out, reload). */
export function useRequireSession(): Session | null {
  const session = useSessionStore((s) => s.session);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
    }
  }, [session, navigate]);

  return session;
}

/** Redirects to `/otc-unavailable` when the account's OTC access isn't granted. */
export function useRequireOtcAccess(): void {
  const session = useSessionStore((s) => s.session);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      return;
    }
    let cancelled = false;
    void getUser(session.clientType).then((user) => {
      if (!cancelled && user.otcAccess !== 'GRANTED') {
        navigate('/otc-unavailable', { replace: true, state: { otcAccess: user.otcAccess } });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session, navigate]);
}
