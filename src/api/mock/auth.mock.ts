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

export async function signInSocial(_provider: SocialProvider, clientType: ClientType): Promise<Session> {
  await mockDelay();
  return { email: MOCK_USERS[clientType].email, clientType };
}

// ---------------------------------------------------------------------------
// Sign-in — api-integration.md §2.1 shape, mocked: OTP-issue returns
// `twoFA` straight from the fixture (no separate `getUser` lookup needed,
// matching what the real flow does now), confirm validates the code the
// same way `verifyCode` above always has.
// ---------------------------------------------------------------------------

let signInFailedAttempts = 0;

export async function signInRequestOtp(email: string, password: string, clientType: ClientType): Promise<{ transactionId: string; twoFA: boolean }> {
  await mockDelay();
  if (!isValidEmail(email) || !password.trim()) {
    throw new MockSignInError('EMAIL_INVALID');
  }
  signInFailedAttempts = 0;
  return { transactionId: `mock-tx-${Date.now()}`, twoFA: MOCK_USERS[clientType].authenticatorEnabled };
}

export interface SignInConfirmParams {
  transactionId: string;
  otp: string;
  twoFaCode?: string;
  email: string;
  clientType: ClientType;
}

export async function signInConfirmOtp(params: SignInConfirmParams): Promise<Session> {
  await mockDelay();
  if (signInFailedAttempts >= MAX_CONSECUTIVE_CODE_ATTEMPTS) {
    throw new MockVerifyCodeError('RATE_LIMIT');
  }
  const codeBad = params.otp === '000000' || (params.twoFaCode !== undefined && params.twoFaCode === '000000');
  if (codeBad) {
    signInFailedAttempts += 1;
    throw new MockVerifyCodeError(signInFailedAttempts >= MAX_CONSECUTIVE_CODE_ATTEMPTS ? 'RATE_LIMIT' : 'CODE_INVALID');
  }
  signInFailedAttempts = 0;
  return { email: params.email, clientType: params.clientType };
}

// ---------------------------------------------------------------------------
// Password recovery — §2.3 shape, mocked.
// ---------------------------------------------------------------------------

export async function recoveryRequestOtp(email: string, clientType: ClientType): Promise<{ transactionId: string; twoFA: boolean }> {
  await mockDelay();
  if (!isValidEmail(email)) {
    throw new MockSignInError('EMAIL_INVALID');
  }
  return { transactionId: `mock-recovery-${Date.now()}`, twoFA: MOCK_USERS[clientType].authenticatorEnabled };
}

export async function recoveryConfirmOtp(_transactionId: string, otp: string): Promise<{ transactionId: string; twoFA: boolean }> {
  await mockDelay();
  if (otp === '000000') {
    throw new MockVerifyCodeError('CODE_INVALID');
  }
  return { transactionId: `mock-recovery-confirmed-${Date.now()}`, twoFA: false };
}

export async function recoveryComplete(_transactionId: string, _password: string): Promise<void> {
  await mockDelay();
}
