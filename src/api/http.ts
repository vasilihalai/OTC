import { useSessionStore } from '@/store/session.ts';
import { start as sessionStart } from '@/api/real/session.ts';
import { getFreshInitData } from '@/telegram/initData.ts';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

// A stale/expired Mini App access token surfaces as a 401 from any real
// endpoint. Since there's no refresh token (miniapp-auth-integration-spec.md
// §5/§7 — the Session schema is explicit that only an access token is ever
// issued), recovery is a silent sessionStart() replay, never a redirect
// to /login — a binding already exists at this point, so it's expected to
// succeed unnoticed. One in-flight retry is shared across concurrent 401s
// (queued behind the same promise) instead of each firing its own.
let reauth: Promise<void> | null = null;

async function silentReauth(): Promise<void> {
  reauth ??= (async () => {
    const { session, setSession, clearSession } = useSessionStore.getState();
    const initData = session && getFreshInitData();
    if (!session || !initData) {
      clearSession();
      throw new ApiError(401, 'SESSION_EXPIRED', 'No session to silently refresh');
    }
    try {
      const result = await sessionStart(session.clientType, initData);
      setSession({ ...session, token: result.accessToken });
    } catch (err) {
      // Binding no longer exists (revoked, Mini App disabled, etc.) — fall
      // back to clearing the session so the next protected screen's
      // useRequireSession redirects to /login like any other logged-out
      // state, rather than looping silently forever.
      clearSession();
      throw err;
    }
  })();
  try {
    await reauth;
  } finally {
    reauth = null;
  }
}

/**
 * Thin fetch wrapper for the real exchange API: base URL, bearer auth from the
 * current session, and JSON in/out. Error bodies are assumed to look like
 * `{ code: string, message: string }` — reconcile against Swagger once available.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const token = useSessionStore.getState().session?.token;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && !isRetry) {
    await silentReauth();
    return apiFetch<T>(path, init, true);
  }

  if (!res.ok) {
    let code = 'UNKNOWN';
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { code?: string; message?: string };
      code = body.code ?? code;
      message = body.message ?? message;
    } catch {
      // Non-JSON error body — fall back to the generic message above.
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
