import { authBasicFetch, formBody } from '@/api/real/http/authClient.ts';

/**
 * Token lifecycle per api-integration.md §1.4: access token in memory +
 * `sessionStorage` (survives a WebView reload, not a fresh tab/relaunch),
 * refresh token in `localStorage` (survives both). Proactive refresh fires
 * at `expires_in - 60s`; a reactive refresh on the first 401 and the
 * proactive timer both funnel through the same `refreshTokens()`, so
 * parallel triggers share one in-flight request instead of firing N.
 */

const ACCESS_KEY = 'xruby-access-token';
const EXPIRES_KEY = 'xruby-token-expires-at';
const REFRESH_KEY = 'xruby-refresh-token';

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms. */
  expiresAt: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

function toTokenSet(res: TokenResponse): TokenSet {
  return {
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    expiresAt: Date.now() + res.expires_in * 1000,
  };
}

let current: TokenSet | null = null;
let proactiveTimer: ReturnType<typeof setTimeout> | undefined;
let refreshPromise: Promise<TokenSet> | null = null;

function scheduleProactiveRefresh(): void {
  if (proactiveTimer) {
    clearTimeout(proactiveTimer);
  }
  if (!current) {
    return;
  }
  const delay = Math.max(0, current.expiresAt - Date.now() - 60_000);
  proactiveTimer = setTimeout(() => void refreshTokens().catch(() => {}), delay);
}

/** Call once at boot (real mode only) to restore whatever survived a relaunch. */
export function hydrateTokensFromStorage(): TokenSet | null {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) {
    return null;
  }
  const accessToken = sessionStorage.getItem(ACCESS_KEY) ?? '';
  const expiresAt = Number(sessionStorage.getItem(EXPIRES_KEY) ?? '0');
  current = { accessToken, refreshToken, expiresAt };
  if (accessToken && expiresAt > Date.now()) {
    scheduleProactiveRefresh();
  }
  return current;
}

export function saveTokens(res: TokenResponse): TokenSet {
  const tokens = toTokenSet(res);
  current = tokens;
  sessionStorage.setItem(ACCESS_KEY, tokens.accessToken);
  sessionStorage.setItem(EXPIRES_KEY, String(tokens.expiresAt));
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  scheduleProactiveRefresh();
  return tokens;
}

export function clearTokens(): void {
  current = null;
  if (proactiveTimer) {
    clearTimeout(proactiveTimer);
  }
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken(): string | null {
  return current?.accessToken || null;
}

export function hasSession(): boolean {
  return !!current?.refreshToken;
}

/** Serialised — a proactive timer firing at the same moment as a reactive 401 share this one promise. */
export async function refreshTokens(): Promise<TokenSet> {
  if (refreshPromise) {
    return refreshPromise;
  }
  if (!current?.refreshToken) {
    throw new Error('No refresh token to refresh with');
  }
  refreshPromise = (async () => {
    const res = await authBasicFetch<TokenResponse>(
      '/oauth2/token',
      formBody({ grant_type: 'refresh_token', refresh_token: current.refreshToken }),
      'application/x-www-form-urlencoded',
    );
    return saveTokens(res);
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/** Ensures the access token is valid for at least the next minute, refreshing first if not. Returns `null` if there's nothing to refresh with. */
export async function ensureFreshAccessToken(): Promise<string | null> {
  if (!current) {
    return null;
  }
  if (current.accessToken && current.expiresAt - Date.now() > 60_000) {
    return current.accessToken;
  }
  try {
    const refreshed = await refreshTokens();
    return refreshed.accessToken;
  } catch {
    return null;
  }
}

/**
 * `POST /oauth2/revoke` then clear locally regardless of whether the call
 * succeeded — api-integration.md §1.4: "a user who taps 'Выход' must end up
 * signed out regardless."
 */
export async function revokeAndClearTokens(): Promise<void> {
  const refreshToken = current?.refreshToken;
  try {
    if (refreshToken) {
      await authBasicFetch<void>(
        '/oauth2/revoke',
        formBody({ token: refreshToken, token_type_hint: 'refresh_token' }),
        'application/x-www-form-urlencoded',
      );
    }
  } catch {
    // Ignored — see doc comment above.
  } finally {
    clearTokens();
  }
}

export { toTokenSet };
export type { TokenResponse };
