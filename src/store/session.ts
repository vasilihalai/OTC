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
