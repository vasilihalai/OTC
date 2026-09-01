// Swap point for the real API: screens must import only from this file,
// never from `api/mock/*` or `api/real/*` directly, so flipping
// VITE_USE_REAL_API does not touch a single screen file.
//
// Deals and the home "widgets" (stats) stay mocked regardless of the flag —
// they always resolve to `api/mock/data.mock.ts`.
import * as mockAuth from '@/api/mock/auth.mock.ts';
import * as realAuth from '@/api/real/auth.ts';
import * as mockData from '@/api/mock/data.mock.ts';
import * as mockActions from '@/api/mock/actions.mock.ts';
import * as realProfile from '@/api/real/profile.ts';
import * as realBalances from '@/api/real/balances.ts';
import * as mockWithdrawals from '@/api/mock/withdrawals.mock.ts';
import * as realWithdrawals from '@/api/real/withdrawals.ts';
import * as realTransfers from '@/api/real/transfers.ts';

export const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

// Generic OTP verification — withdrawal-confirmation 2FA only now (see
// real/auth.ts's own comment). Sign-in and password recovery each have
// their own dedicated pair below, matching api-integration.md §2's three
// genuinely different contracts.
export const sendVerificationCode = USE_REAL_API ? realAuth.sendVerificationCode : mockAuth.sendVerificationCode;
export const verifyCode = USE_REAL_API ? realAuth.verifyCode : mockAuth.verifyCode;
export const MockSignInError = mockAuth.MockSignInError;
export const MockVerifyCodeError = mockAuth.MockVerifyCodeError;

// Sign-in — api-integration.md §2.1. Same two-step OTP shape in both modes
// now, so screens no longer branch on USE_REAL_API for this.
export const signInRequestOtp = USE_REAL_API ? realAuth.signInRequestOtp : mockAuth.signInRequestOtp;
export const signInConfirmOtp = USE_REAL_API ? realAuth.signInConfirmOtp : mockAuth.signInConfirmOtp;

// Google / Apple — §2.2. Mock stays an instant fake session; real opens an
// external browser and completes (if at all) on relaunch — genuinely
// different flows, so SignIn.tsx still branches on USE_REAL_API here only.
export const signInSocial = mockAuth.signInSocial;
export const startSocialSignIn = realAuth.startSocialSignIn;
export const exchangeSocialCode = realAuth.exchangeSocialCode;

// Password recovery — §2.3.
export const recoveryRequestOtp = USE_REAL_API ? realAuth.recoveryRequestOtp : mockAuth.recoveryRequestOtp;
export const recoveryConfirmOtp = USE_REAL_API ? realAuth.recoveryConfirmOtp : mockAuth.recoveryConfirmOtp;
export const recoveryComplete = USE_REAL_API ? realAuth.recoveryComplete : mockAuth.recoveryComplete;

// Sign-out — §1.4. Mock just clears local state (no server call, no tokens
// to revoke); real revokes then clears regardless of the call's outcome.
export async function signOut(): Promise<void> {
  if (USE_REAL_API) {
    await realAuth.signOut();
  }
}

export const getUser = USE_REAL_API ? realProfile.getUser : mockData.getUser;
export const getAssets = USE_REAL_API ? realBalances.getAssets : mockData.getAssets;

export const getWithdrawFiatOptions = USE_REAL_API
  ? realWithdrawals.getWithdrawFiatOptions
  : mockData.getWithdrawFiatOptions;
export const getWithdrawCryptoOptions = USE_REAL_API
  ? realWithdrawals.getWithdrawCryptoOptions
  : mockData.getWithdrawCryptoOptions;
export const submitCryptoWithdrawal = USE_REAL_API
  ? realWithdrawals.submitCryptoWithdrawal
  : mockWithdrawals.submitCryptoWithdrawal;
export const submitFiatWithdrawal = USE_REAL_API
  ? realWithdrawals.submitFiatWithdrawal
  : mockWithdrawals.submitFiatWithdrawal;

export const getStats = USE_REAL_API ? realProfile.getStats : mockData.getStats;
export const getAccounts = USE_REAL_API ? realBalances.getAccounts : mockData.getAccounts;
export const getRequisites = USE_REAL_API ? realWithdrawals.getRequisites : mockData.getRequisites;
export const getSavedRequisites = USE_REAL_API ? realWithdrawals.getSavedRequisites : mockData.getSavedRequisites;
export const transfer = USE_REAL_API ? realTransfers.transfer : mockActions.transfer;

// Always mocked — deals (list, detail, and every status-changing action on
// them) are one cohesive unit built entirely on the in-memory deal store;
// swapping only some of these would leave the rest reading stale mock data.
export const getDeals = mockData.getDeals;
export const getDealById = mockData.getDealById;
export const confirmDeal = mockActions.confirmDeal;
export const declineDeal = mockActions.declineDeal;
export const requestNewRate = mockActions.requestNewRate;
export const expireQuote = mockActions.expireQuote;
export const setDepositBalanceForTesting = mockActions.setDepositBalanceForTesting;

export { ApiError } from '@/api/http.ts';
export { mapApiError } from '@/api/real/errorMap.ts';

export type { CryptoWithdrawalPayload, FiatWithdrawalPayload } from '@/api/mock/withdrawals.mock.ts';
export type { ConfirmDealPatch } from '@/api/mock/actions.mock.ts';
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
  SecurityLevel,
  OtcAccessReason,
  SocialProvider,
  SignInError,
  VerifyCodeError,
  CryptoNetwork,
  FiatTransferType,
  SavedRequisite,
  RequisitesPayload,
  CryptoWithdrawLimits,
  CryptoWithdrawOptions,
  WithdrawMethod,
  FiatWithdrawLimits,
  FiatWithdrawOptions,
  WithdrawalResult,
  TransferAccount,
  TransferRequest,
  Accounts,
  Requisites,
  FiatRequisites,
  CryptoRequisites,
  BalanceScenario,
} from '@/api/types.ts';
