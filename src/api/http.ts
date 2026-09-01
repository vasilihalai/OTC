import { useSessionStore } from '@/store/session.ts';
import { useToastStore } from '@/store/toast.ts';
import { ensureFreshAccessToken, refreshTokens } from '@/api/real/http/tokenStore.ts';
import { ApiError, toApiError } from '@/api/real/http/apiError.ts';
import { serviceUrl, type Service } from '@/api/real/http/servicePaths.ts';
import { getFreshInitData } from '@/telegram/initData.ts';

export { ApiError };

function requestId(): string {
  return crypto.randomUUID();
}

// api-integration.md §2.4 — initData is sent exactly once, on the first
// authenticated request after a successful sign-in, so the backend can bind
// telegram_id to the account for push. Never on every request. Call this
// right after `setSession()`; the next `apiFetch` call picks it up and
// clears the flag regardless of whether the header was actually attachable.
let pendingInitDataBind = false;
export function markInitDataBindPending(): void {
  pendingInitDataBind = true;
}

/**
 * Thin fetch wrapper for the real exchange API: resolves `path` against the
 * given `service`'s base URL + prefix (`servicePaths.ts`, §1.1 — defaults to
 * `financial` since most of this codebase's not-yet-migrated real/* callers
 * predate the four-service split and don't pass one explicitly; harmless for
 * those, since they're still on old placeholder paths anyway), bearer auth
 * from `tokenStore`, `x-request-id` on every call (§1.2 — required on
 * essentially every operation; the single most likely cause of a blanket 400
 * if forgotten), and JSON in/out. Error bodies are normalised into `ApiError`
 * by `toApiError` — screens never see a raw fetch/Response.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}, isRetry = false, service: Service = 'financial'): Promise<T> {
  const token = await ensureFreshAccessToken();
  const reqId = requestId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-request-id': reqId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (import.meta.env.VITE_APP_VERSION) {
    headers['x-client-version'] = import.meta.env.VITE_APP_VERSION;
  }
  if (pendingInitDataBind) {
    pendingInitDataBind = false;
    const initData = getFreshInitData();
    if (initData) {
      headers['x-telegram-init-data'] = initData;
    }
  }

  const res = await fetch(serviceUrl(service, path), {
    ...init,
    headers: { ...headers, ...init.headers },
  });

  // Logged alongside the response so a failed request can be traced by
  // support from the request id shown in the generic error toast (§1.2/§1.5).
  console.info(`[api] ${init.method ?? 'GET'} ${service}${path} -> ${res.status} (${reqId})`);

  if (res.status === 401 && !isRetry) {
    // A stale/expired access token — force a real refresh (not the
    // expiry-aware `ensureFreshAccessToken`, which would just hand back the
    // same token if our local clock still thinks it's valid) and retry once.
    // §1.4: "reactively on the first 401 ... serialise refreshes" —
    // `refreshTokens()` itself dedupes parallel callers onto one promise.
    try {
      await refreshTokens();
    } catch {
      useSessionStore.getState().clearSession();
      useToastStore.getState().show('Сессия истекла, войдите снова');
      throw new ApiError(401, 'SESSION_EXPIRED', 'Session expired', reqId);
    }
    return apiFetch<T>(path, init, true, service);
  }

  if (!res.ok) {
    throw await toApiError(res, reqId);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
