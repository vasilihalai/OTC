// Swap point for the real API: screens must import only from this file,
// never from `api/mock/*` directly, so replacing mocks with HTTP calls here
// does not touch screen code.
export {
  sendVerificationCode,
  verifyCode,
  completeSignIn,
  signInSocial,
  resetPassword,
  MockSignInError,
  MockVerifyCodeError,
} from '@/api/mock/auth.mock.ts';
export { getUser, getStats, getDeals, getAssets } from '@/api/mock/data.mock.ts';
export type {
  Session,
  User,
  Stats,
  Deal,
  DealStatus,
  DealDirection,
  Asset,
  AssetGroup,
  ClientType,
  VerificationStatus,
  SocialProvider,
  SignInError,
  VerifyCodeError,
} from '@/api/types.ts';
