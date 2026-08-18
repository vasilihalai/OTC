import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
