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
import * as realSession from '@/api/real/session.ts';

export const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

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

export const getStats = USE_REAL_API ? realProfile.getStats : mockData.getStats;
export const getAccounts = USE_REAL_API ? realProfile.getAccounts : mockData.getAccounts;
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

// Telegram-binding session flow (miniapp-auth-integration-spec.md §7) —
// real-API-only, no mock counterpart. Called from index.tsx's bootstrap
// (sessionStart, every launch) and SignIn's real-mode branch
// (sessionLogin/sessionConfirm, only after a BINDING_REQUIRED start). The
// mock path keeps using sendVerificationCode/verifyCode/completeSignIn
// above for its own (unrelated, always-shown) login screen.
export const sessionStart = realSession.start;
export const sessionLogin = realSession.login;
export const sessionConfirm = realSession.confirm;
export const sessionLogout = realSession.logout;
export { SessionError } from '@/api/real/session.ts';
export type { SessionErrorCode, SessionResult, LoginResult, ConfirmParams } from '@/api/real/session.ts';

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
  SavedAddress,
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
