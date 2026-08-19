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
import { verifyInitData } from '@/api/real/initdata.ts';

const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

export const sendVerificationCode = USE_REAL_API ? realAuth.sendVerificationCode : mockAuth.sendVerificationCode;
export const verifyCode = USE_REAL_API ? realAuth.verifyCode : mockAuth.verifyCode;
export const completeSignIn = USE_REAL_API ? realAuth.completeSignIn : mockAuth.completeSignIn;
export const signInSocial = USE_REAL_API ? realAuth.signInSocial : mockAuth.signInSocial;
export const resetPassword = USE_REAL_API ? realAuth.resetPassword : mockAuth.resetPassword;
export const MockSignInError = mockAuth.MockSignInError;
export const MockVerifyCodeError = mockAuth.MockVerifyCodeError;

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

// Always mocked — see header comment.
export const getDeals = mockData.getDeals;
export const getDealById = mockData.getDealById;
export const getRequisites = mockData.getRequisites;
export const getStats = mockData.getStats;
export const getAccounts = mockData.getAccounts;
export const confirmDeal = mockActions.confirmDeal;
export const declineDeal = mockActions.declineDeal;
export const requestNewRate = mockActions.requestNewRate;
export const transfer = mockActions.transfer;
export const setDepositBalanceForTesting = mockActions.setDepositBalanceForTesting;

// Called once from index.tsx's bootstrap, ahead of everything else above;
// a no-op unless VITE_USE_REAL_API is on (VITE_SKIP_INITDATA skips just the
// network call within that, per mini-app-v1.md §4.5).
export async function verifyTelegramInitData(): Promise<void> {
  if (!USE_REAL_API) {
    return;
  }
  await verifyInitData();
}

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
  VerificationLevel,
  OtcAccessReason,
  SocialProvider,
  SignInError,
  VerifyCodeError,
  CryptoNetwork,
  SavedAddress,
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
