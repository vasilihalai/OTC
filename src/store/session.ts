import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getUser, SessionError, sessionStart } from '@/api/index.ts';
import type { ClientType, Session } from '@/api/types.ts';
import type { SessionErrorCode } from '@/api/real/session.ts';
import { getFreshInitData } from '@/telegram/initData.ts';

/**
 * Real-mode-only bootstrap status, driven by `sessionStart` in index.tsx —
 * miniapp-auth-integration-spec.md §6. `'checking'` is the brief window
 * before that first call resolves; mock mode never sets this at all, so
 * screens gating on it should treat `undefined` the same as `'authenticated'`.
 */
export type AuthStatus = 'checking' | 'authenticated' | 'binding-required' | 'error';

interface SessionStore {
  session: Session | null;
  setSession: (session: Session) => void;
  clearSession: () => void;
  authStatus?: AuthStatus;
  authError?: SessionErrorCode;
  setAuthStatus: (status: AuthStatus, error?: SessionErrorCode) => void;
  /** Non-sensitive hint only — which side last bound successfully on this
      device, so the next cold launch's silent sessionStart knows which
      backend to try first. Never holds a token. */
  lastClientType: ClientType | null;
  setLastClientType: (clientType: ClientType) => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
      authStatus: undefined,
      authError: undefined,
      setAuthStatus: (authStatus, authError) => set({ authStatus, authError }),
      lastClientType: null,
      setLastClientType: (lastClientType) => set({ lastClientType }),
    }),
    {
      name: 'xruby-session',
      // authStatus/authError are per-boot only — persisting them would let a
      // stale 'error'/'checking' value from a previous launch leak into a
      // fresh one before sessionStart has even run again.
      partialize: (state) => ({ session: state.session, lastClientType: state.lastClientType }),
    },
  ),
);

/**
 * Real-mode boot: called once from index.tsx, ahead of the first render.
 * miniapp-auth-integration-spec.md §6.1/§6.2 — silently establishes a
 * session when a binding already exists, on whichever side (`lastClientType`
 * hint, defaulting to business/UL — today's `/login` default) is tried
 * first; on BINDING_REQUIRED there, silently tries the *other* side once
 * before giving up, so a device already bound on one side never sees a
 * login screen just because the other side's route happened to load first.
 * Only a real BINDING_REQUIRED on both leaves the login screen to show
 * (existing Entry/useRequireSession redirect already handles that — this
 * function only ever sets store state, never navigates).
 */
export async function bootRealSession(): Promise<void> {
  const store = useSessionStore.getState();
  store.setAuthStatus('checking');

  const initData = getFreshInitData();
  if (!initData) {
    store.setAuthStatus('error', 'INVALID_INIT_DATA');
    return;
  }

  const primary: ClientType = store.lastClientType ?? 'UL';
  const secondary: ClientType = primary === 'UL' ? 'FL' : 'UL';

  async function tryStart(clientType: ClientType): Promise<'ok' | 'binding-required' | 'error'> {
    try {
      const result = await sessionStart(clientType, initData!);
      const user = await getUser(clientType).catch(() => undefined);
      store.setSession({ email: user?.email ?? '', clientType, token: result.accessToken });
      store.setLastClientType(clientType);
      store.setAuthStatus('authenticated');
      return 'ok';
    } catch (err) {
      if (err instanceof SessionError) {
        if (err.code === 'BINDING_REQUIRED') {
          return 'binding-required';
        }
        store.setAuthStatus('error', err.code);
        return 'error';
      }
      store.setAuthStatus('error', 'UNKNOWN');
      return 'error';
    }
  }

  const primaryResult = await tryStart(primary);
  if (primaryResult !== 'binding-required') {
    return;
  }
  const secondaryResult = await tryStart(secondary);
  if (secondaryResult === 'binding-required') {
    store.setAuthStatus('binding-required');
  }
}

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
