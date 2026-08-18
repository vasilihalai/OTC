import type { RequestCodeError, Session, VerifyCodeError } from '@/api/types.ts';
import { isValidEmail } from '@/lib/validate.ts';
import { MAX_CONSECUTIVE_CODE_ATTEMPTS, mockDelay } from '@/api/mock/fixtures.ts';

export class MockAuthError extends Error {
  constructor(public readonly code: RequestCodeError | VerifyCodeError) {
    super(code);
  }
}

// Consecutive failed verifyCode attempts since the last successful requestCode call.
let failedAttempts = 0;

export async function requestCode(email: string): Promise<void> {
  await mockDelay();
  if (!isValidEmail(email)) {
    throw new MockAuthError('EMAIL_INVALID');
  }
  failedAttempts = 0;
}

export async function verifyCode(email: string, code: string): Promise<Session> {
  await mockDelay();

  if (failedAttempts >= MAX_CONSECUTIVE_CODE_ATTEMPTS) {
    throw new MockAuthError('RATE_LIMIT');
  }

  // Any email + any non-empty code is accepted by this mock.
  if (!code.trim()) {
    failedAttempts += 1;
    throw new MockAuthError('CODE_INVALID');
  }

  failedAttempts = 0;
  return { email, token: `mock-token-${Date.now()}` };
}
