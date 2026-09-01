// Swap point for the real API: screens must import only from this file,
// never from `api/mock/*` or `api/real/*` directly, so flipping
// VITE_USE_REAL_API does not touch a single screen file.
//
// Deals are real-API-ready for the five commands that have a built screen
// (api-integration.md §7.3/§7.4/§7.6) — acceptQuote/rejectQuote/confirmHold/
// requestNewRate/cancelDeal, below. The other four commands (ACCEPT_AMOUNT/
// REJECT_AMOUNT/ACCEPT_REPRICE/REJECT_REPRICE) have no screen to call them
// from — REQUOTE/RATE_RENEGOTIATING is read-only except Cancel, per an
// explicit "flag it to the analyst, do not improvise them" instruction —
// see lib/otcStatus.ts.
import * as mockAuth from '@/api/mock/auth.mock.ts';
import * as realAuth from '@/api/real/auth.ts';
import * as mockData from '@/api/mock/data.mock.ts';
import * as mockActions from '@/api/mock/actions.mock.ts';
import type { ConfirmDealPatch } from '@/api/mock/actions.mock.ts';
import type { Deal } from '@/api/types.ts';
import * as realProfile from '@/api/real/profile.ts';
import * as realBalances from '@/api/real/balances.ts';
import * as realOtc from '@/api/real/otc.ts';
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

export const getStats = USE_REAL_API ? realOtc.getStats : mockData.getStats;
export const getAccounts = USE_REAL_API ? realBalances.getAccounts : mockData.getAccounts;
export const getRequisites = USE_REAL_API ? realWithdrawals.getRequisites : mockData.getRequisites;
export const getSavedRequisites = USE_REAL_API ? realWithdrawals.getSavedRequisites : mockData.getSavedRequisites;
export const transfer = USE_REAL_API ? realTransfers.transfer : mockActions.transfer;

// Read side — real as of this round (§7.3/§7.4), see the top-of-file note.
export const getDeals = USE_REAL_API ? realOtc.getDeals : mockData.getDeals;
export const getDealById = USE_REAL_API ? realOtc.getDealById : mockData.getDealById;

// Write side — §7.6. Named for the UI action, not the raw command, since
// one button can imply different commands depending which screen it's on
// (both RATE_ACTIVE's and AWAITING_FUNDS's "Отклонить" are REJECT_QUOTE;
// RATE_PENDING's and RATE_RENEGOTIATING's "Отменить заявку" are CANCEL —
// two visually-identical buttons, two different real commands).

/** RATE_ACTIVE's "Подтвердить сделку". */
export async function acceptQuote(dealId: string): Promise<Deal | undefined> {
  return USE_REAL_API ? realOtc.sendOtcCommand(dealId, 'ACCEPT_QUOTE') : mockActions.confirmDeal(dealId, { status: 'RUNNING' });
}

/** RATE_ACTIVE's and AWAITING_FUNDS's "Отклонить" — both map to REJECT_QUOTE (§7.6's table). */
export async function rejectQuote(dealId: string): Promise<Deal | undefined> {
  return USE_REAL_API ? realOtc.sendOtcCommand(dealId, 'REJECT_QUOTE') : mockActions.declineDeal(dealId);
}

/**
 * AWAITING_FUNDS's "Подтвердить сделку" (all three non-belowmin branches).
 * Real: a single `CONFIRM_HOLD` — the server decides whether the result is
 * `RUNNING` or a `REQUOTE` renegotiation based on what was actually frozen,
 * so there's nothing to compute client-side; the refetch after the command
 * picks up whichever it was. Mock: no server logic to simulate that
 * decision, so it still needs the branch-computed patch passed in.
 */
export async function confirmHold(dealId: string, mockPatch: ConfirmDealPatch): Promise<Deal | undefined> {
  return USE_REAL_API ? realOtc.sendOtcCommand(dealId, 'CONFIRM_HOLD') : mockActions.confirmDeal(dealId, mockPatch);
}

/** RATE_STALE's "Запросить новый курс" — always lands in `RATE_RENEGOTIATING`, confirmed directly: this is one of its two real triggers (the other is `confirmHold`'s "short" branch). */
export async function requestNewRate(dealId: string): Promise<Deal | undefined> {
  return USE_REAL_API ? realOtc.sendOtcCommand(dealId, 'REQUEST_NEW_RATE') : mockActions.requestNewRate(dealId);
}

/** RATE_PENDING's and RATE_RENEGOTIATING's "Отменить заявку" — CANCEL. */
export async function cancelDeal(dealId: string): Promise<Deal | undefined> {
  return USE_REAL_API ? realOtc.sendOtcCommand(dealId, 'CANCEL') : mockActions.declineDeal(dealId);
}

// Client-driven only (the quote card's own countdown hitting zero) — real
// mode has no command for this at all, the server just eventually reflects
// EXPIRED on its own; see DealDetail.tsx's QuoteCard for how each mode
// handles the countdown reaching zero differently.
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
  DealDocument,
  OtcAccessResult,
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
