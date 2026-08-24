import type { ClientType } from '@/api/types.ts';
import { getRealSessionConfig } from '@/api/real/config.ts';

/**
 * Telegram-binding session contract — miniapp-auth-integration-spec.md §7.
 * One function per method of that spec's OpenAPI block, implemented against
 * `{baseUrl}/session/*` directly (§7: "Контракт... одинаков для обоих
 * путей — фронт пишется один раз", so this is written against the contract
 * itself, not a specific backend path). `baseUrl`/`clientId` are resolved
 * per ClientType — see `real/config.ts` for why.
 */

export type SessionErrorCode =
  | 'INVALID_INIT_DATA'
  | 'BINDING_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_OTP'
  | 'BINDING_CONFLICT'
  | 'MINI_APP_UNAVAILABLE'
  | 'UNKNOWN';

export class SessionError extends Error {
  constructor(
    public readonly code: SessionErrorCode,
    public readonly status: number,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export interface SessionResult {
  accessToken: string;
  expiresIn: number;
  isNewBinding: boolean;
}

export interface LoginResult {
  loginTransactionId: string;
  twoFA: boolean;
}

/** Sent on every call, for server-side trace correlation — §8 front task 9. */
function requestId(): string {
  return crypto.randomUUID();
}

async function postSession<T>(
  clientType: ClientType,
  path: string,
  body: unknown,
  inferErrorCode: (status: number, bodyCode?: string) => SessionErrorCode,
  bearer?: string,
): Promise<T> {
  const { baseUrl } = getRealSessionConfig(clientType);

  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId(),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Response error-body shape isn't confirmed yet (spec §9 З2) — read a
    // `code` field defensively if present, otherwise infer from HTTP status
    // and which endpoint this is, per §7's own response table.
    let bodyCode: string | undefined;
    let message: string | undefined;
    try {
      const errBody = (await res.json()) as { code?: string; message?: string };
      bodyCode = errBody.code;
      message = errBody.message;
    } catch {
      // Non-JSON error body — fall back to status-based inference below.
    }
    throw new SessionError(inferErrorCode(res.status, bodyCode), res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

function codeOr(bodyCode: string | undefined, fallback: SessionErrorCode): SessionErrorCode {
  const known: SessionErrorCode[] = [
    'INVALID_INIT_DATA', 'BINDING_REQUIRED', 'INVALID_CREDENTIALS',
    'INVALID_OTP', 'BINDING_CONFLICT', 'MINI_APP_UNAVAILABLE',
  ];
  return known.includes(bodyCode as SessionErrorCode) ? (bodyCode as SessionErrorCode) : fallback;
}

/** Called on every launch. Silent success = already bound; 409 = show login. */
export function start(clientType: ClientType, initData: string): Promise<SessionResult> {
  return postSession<SessionResult>(clientType, '/session/start', { initData }, (status, bodyCode) => {
    if (status === 409) return codeOr(bodyCode, 'BINDING_REQUIRED');
    if (status === 503) return codeOr(bodyCode, 'MINI_APP_UNAVAILABLE');
    return codeOr(bodyCode, 'INVALID_INIT_DATA');
  });
}

/** Step 1 of first-time binding — only ever called after BINDING_REQUIRED. */
export function login(clientType: ClientType, email: string, password: string): Promise<LoginResult> {
  return postSession<LoginResult>(clientType, '/session/login', { email, password }, (status, bodyCode) =>
    codeOr(bodyCode, status === 401 ? 'INVALID_CREDENTIALS' : 'UNKNOWN'));
}

export interface ConfirmParams {
  loginTransactionId: string;
  otp: string;
  /** Only when step 1's response had `twoFA: true`. */
  twoFaCode?: string;
  /** Must be freshly re-read immediately before this call — see `telegram/initData.ts`. */
  initData: string;
}

/** Step 2 — creates the Telegram↔account binding and issues the session. */
export function confirm(clientType: ClientType, params: ConfirmParams): Promise<SessionResult> {
  return postSession<SessionResult>(clientType, '/session/login/confirm', params, (status, bodyCode) => {
    if (status === 409) return codeOr(bodyCode, 'BINDING_CONFLICT');
    // §7 documents 400 as either INVALID_OTP or INVALID_INIT_DATA for this
    // endpoint without distinguishing further — default to the more common
    // case (a mistyped code) when the body doesn't say which.
    return codeOr(bodyCode, 'INVALID_OTP');
  });
}

export function logout(clientType: ClientType, accessToken: string): Promise<void> {
  return postSession<void>(clientType, '/session/logout', undefined, () => 'UNKNOWN', accessToken);
}
