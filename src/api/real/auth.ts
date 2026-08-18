import type { ClientType, Session, SocialProvider } from '@/api/types.ts';
import { apiFetch } from '@/api/http.ts';

/**
 * Real auth endpoints — assumed contracts (mini-app-v1.md §10.1: no Swagger
 * yet), reconcile once available. Signatures mirror the mock's shape exactly
 * so SignIn/VerificationModal/PasswordRecovery never change when this is
 * swapped in via VITE_USE_REAL_API.
 */

export async function sendVerificationCode(email: string, password?: string): Promise<void> {
  await apiFetch<void>('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

interface VerifyCodeResponse {
  token: string;
}

// completeSignIn() runs synchronously right after verifyCode() resolves
// (matching the mock's two-step shape), but the token only exists once the
// server responds — this bridges the two without changing either signature.
let pendingToken: string | null = null;

export async function verifyCode(code: string): Promise<void> {
  const data = await apiFetch<VerifyCodeResponse>('/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  pendingToken = data.token;
}

export function completeSignIn(email: string, clientType: ClientType): Session {
  const token = pendingToken ?? '';
  pendingToken = null;
  return { email, clientType, token };
}

export async function signInSocial(provider: SocialProvider, clientType: ClientType): Promise<Session> {
  return apiFetch<Session>('/auth/social', {
    method: 'POST',
    body: JSON.stringify({ provider, clientType }),
  });
}

export async function resetPassword(email: string, password: string): Promise<void> {
  await apiFetch<void>('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
