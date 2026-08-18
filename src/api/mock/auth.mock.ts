import type { ClientType, Session, SignInError, SocialProvider, VerifyCodeError } from '@/api/types.ts';
import { isValidEmail } from '@/lib/validate.ts';
import { MOCK_USERS, mockDelay } from '@/api/mock/fixtures.ts';

export const MAX_CONSECUTIVE_CODE_ATTEMPTS = 3;

export class MockSignInError extends Error {
  constructor(public readonly code: SignInError) {
    super(code);
  }
}

export class MockVerifyCodeError extends Error {
  constructor(public readonly code: VerifyCodeError) {
    super(code);
  }
}

// Consecutive failed verifyCode attempts since the last successful send.
let failedAttempts = 0;

/**
 * Shared by sign-in (after the password step) and password recovery.
 * `password` is unused by the mock (any non-empty value is accepted) — kept
 * in the signature so the real implementation, which does need it, is a
 * drop-in swap with no screen changes.
 */
export async function sendVerificationCode(email: string, _password?: string): Promise<void> {
  await mockDelay();
  if (!isValidEmail(email)) {
    throw new MockSignInError('EMAIL_INVALID');
  }
  failedAttempts = 0;
}

/** Any 6 digits succeed except '000000'; 3 consecutive failures rate-limit. */
export async function verifyCode(code: string): Promise<void> {
  await mockDelay();

  if (failedAttempts >= MAX_CONSECUTIVE_CODE_ATTEMPTS) {
    throw new MockVerifyCodeError('RATE_LIMIT');
  }

  if (code === '000000') {
    failedAttempts += 1;
    if (failedAttempts >= MAX_CONSECUTIVE_CODE_ATTEMPTS) {
      throw new MockVerifyCodeError('RATE_LIMIT');
    }
    throw new MockVerifyCodeError('CODE_INVALID');
  }

  failedAttempts = 0;
}

export function completeSignIn(email: string, clientType: ClientType): Session {
  return { email, clientType, token: `mock-token-${Date.now()}` };
}

export async function signInSocial(_provider: SocialProvider, clientType: ClientType): Promise<Session> {
  await mockDelay();
  return completeSignIn(MOCK_USERS[clientType].email, clientType);
}

export async function resetPassword(_email: string, _password: string): Promise<void> {
  await mockDelay();
}
