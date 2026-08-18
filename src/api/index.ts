// Swap point for the real API in v1: screens must import only from this file,
// never from `api/mock/*` directly, so replacing mocks with HTTP calls here
// does not touch screen code.
export { requestCode, verifyCode, MockAuthError } from '@/api/mock/auth.mock.ts';
export { getProfile, MockProfileError } from '@/api/mock/profile.mock.ts';
export type { Session, Profile, ClientType, VerificationStatus, RequestCodeError, VerifyCodeError } from '@/api/types.ts';
