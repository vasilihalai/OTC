import type { ClientType, Session, SocialProvider } from '@/api/types.ts';
import { authBasicFetch, formBody } from '@/api/real/http/authClient.ts';
import { publicPost } from '@/api/real/http/publicClient.ts';
import { saveTokens } from '@/api/real/http/tokenStore.ts';
import { openExternalLink } from '@/telegram/adapter.ts';
import { apiFetch } from '@/api/http.ts';

/**
 * Real auth — api-integration.md §2. `accountType` is the personal/business
 * split now: a body field sent to one gateway, not (as an earlier round had
 * it) two separate backends/OAuth clients — that whole two-backend `config.ts`
 * is gone along with the Telegram-binding session flow it supported.
 */
function accountType(clientType: ClientType): 'BUSINESS' | 'INDIVIDUAL' {
  return clientType === 'UL' ? 'BUSINESS' : 'INDIVIDUAL';
}

// ---------------------------------------------------------------------------
// Sign-in — §2.1. Two calls: issue OTP, then exchange it for tokens.
// ---------------------------------------------------------------------------

export interface OtpIssueResult {
  transactionId: string;
  twoFA: boolean;
}

export async function signInRequestOtp(email: string, password: string, clientType: ClientType): Promise<OtpIssueResult> {
  const res = await authBasicFetch<{ success: boolean; timestamp: string; transactionId: string; twoFA: boolean }>(
    '/oauth2/otp',
    JSON.stringify({
      grant_type: 'email_password',
      target: email,
      password,
      accountType: accountType(clientType),
    }),
    'application/json',
  );
  return { transactionId: res.transactionId, twoFA: res.twoFA };
}

export interface OtpConfirmParams {
  transactionId: string;
  otp: string;
  /** Only when step 1 returned `twoFA: true`. */
  twoFaCode?: string;
  /** Not sent to the backend — the token response carries neither; folded into the returned `Session` so the mock/real pair share one call shape. */
  email: string;
  clientType: ClientType;
}

/**
 * Saves the resulting tokens into `tokenStore` and returns the UI-facing
 * `Session` built from the caller-supplied `email`/`clientType`.
 *
 * The `scope` value and how `twoFaCode` is actually meant to travel
 * alongside `otp` are both undocumented (question B2) — sent here as a
 * same-call form field, matching how the previous Telegram-binding flow's
 * `/login/confirm` combined both in one request. Isolated to this one
 * function so correcting it once the backend answers is a one-place change.
 */
export async function signInConfirmOtp(params: OtpConfirmParams): Promise<Session> {
  const res = await authBasicFetch<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }>(
    '/oauth2/token',
    formBody({
      grant_type: 'email_password',
      scope: '', // question B2 — scope value for this grant isn't documented
      otp: params.otp,
      transactionId: params.transactionId,
      ...(params.twoFaCode ? { twoFaCode: params.twoFaCode } : {}),
    }),
    'application/x-www-form-urlencoded',
  );
  saveTokens(res);
  return { email: params.email, clientType: params.clientType };
}

// ---------------------------------------------------------------------------
// Google / Apple — §2.2. Best-effort for MVP (question B3): the redirect
// back into the mini app isn't reliably capturable on every Telegram
// client, so this only ever opens the provider's page — completion is
// handled opportunistically at boot (see `index.tsx`) if the app happens to
// relaunch with `code`/`state` in the URL.
// ---------------------------------------------------------------------------

export async function startSocialSignIn(provider: SocialProvider, clientType: ClientType): Promise<void> {
  // `ct` rides along in the redirect URL so that *if* the relaunch is
  // captured (see `index.tsx`), the exchange response's `email` can be
  // paired back up with which account type this was for — the exchange
  // response itself carries no account-type field.
  const redirectUrl = new URL(window.location.href);
  redirectUrl.searchParams.set('ct', clientType);
  const res = await publicPost<{ authorizationUrl: string }>('auth', '/public/oauth/init', {
    provider: provider.toUpperCase(),
    accountType: accountType(clientType),
    language: 'RU',
    redirectUrl: redirectUrl.toString(),
  });
  openExternalLink(res.authorizationUrl);
}

export interface OAuthExchangeResult {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
  isRegistration: boolean;
  twoFA: boolean;
}

/** Camelcase envelope — different from `/oauth2/token`'s snake_case (§2.2's own note). Normalised into `tokenStore` here, at the boundary. */
export async function exchangeSocialCode(code: string, state: string): Promise<OAuthExchangeResult> {
  const res = await publicPost<{
    accessToken: string; refreshToken: string; transactionId: string; email: string;
    tokenType: string; expiresIn: number; isRegistration: boolean; twoFA: boolean;
  }>('auth', '/public/oauth/exchange', { code, state });

  saveTokens({
    access_token: res.accessToken,
    refresh_token: res.refreshToken,
    token_type: res.tokenType,
    expires_in: res.expiresIn,
  });

  return {
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    tokenType: res.tokenType,
    expiresIn: res.expiresIn,
    email: res.email,
    isRegistration: res.isRegistration,
    twoFA: res.twoFA,
  };
}

// ---------------------------------------------------------------------------
// Password recovery — §2.3. Three calls, each carrying the transactionId
// the previous one returned (step 2 issues a *new* one — don't reuse step 1's).
// ---------------------------------------------------------------------------

export async function recoveryRequestOtp(email: string, clientType: ClientType): Promise<OtpIssueResult> {
  return publicPost<OtpIssueResult>('userAccount', '/public/restore-password/generate-otp', {
    grant_type: 'email_password',
    target: email,
    accountType: accountType(clientType),
  });
}

export async function recoveryConfirmOtp(transactionId: string, otp: string): Promise<OtpIssueResult> {
  return publicPost<OtpIssueResult>('userAccount', '/public/restore-password/confirm-otp', { transactionId, otp });
}

export async function recoveryComplete(transactionId: string, password: string): Promise<void> {
  await publicPost<void>('userAccount', '/public/restore-password/complete', { transactionId, password });
}

// ---------------------------------------------------------------------------
// Sign-out — §1.4. Revoke, then clear locally regardless of whether the
// revoke call succeeded. `tokenStore.revokeAndClearTokens` does both;
// re-exported here so callers only ever import auth actions from one place.
// ---------------------------------------------------------------------------

export { revokeAndClearTokens as signOut } from '@/api/real/http/tokenStore.ts';

// ---------------------------------------------------------------------------
// Generic code verification — used only by the withdrawal-confirmation 2FA
// step (`TwoFactorGate`/`VerificationModal`/`AuthenticatorModal`, shared with
// sign-in until this round). Sign-in and password recovery moved to their
// own dedicated, spec-accurate functions above; withdrawal confirmation's
// real contract is §5.3's `/operations/issue-otp/{id}` + `/confirm/{id}`,
// tied to a withdrawal quote's own transactionId — genuinely different from
// this, and out of scope for the Auth step. Left pointing at the old assumed
// (unconfirmed) endpoints for now; replace when the Withdrawals step wires
// §5 for real.
// ---------------------------------------------------------------------------

export async function sendVerificationCode(email: string, password?: string): Promise<void> {
  await apiFetch<void>('/auth/send-code', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function verifyCode(code: string): Promise<void> {
  await apiFetch<void>('/auth/verify-code', { method: 'POST', body: JSON.stringify({ code }) });
}
