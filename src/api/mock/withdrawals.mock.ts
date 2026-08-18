import type {
  CryptoNetwork,
  CryptoWithdrawalRules,
  FiatTransferType,
  FiatWithdrawalRules,
  SavedAddress,
  SavedRequisite,
  WithdrawalResult,
} from '@/api/types.ts';
import {
  MOCK_CRYPTO_RULES,
  MOCK_FIAT_RULES,
  MOCK_SAVED_ADDRESSES,
  MOCK_SAVED_REQUISITES,
  mockDelay,
} from '@/api/mock/fixtures.ts';

// Guards against a double-tap resubmitting the same withdrawal request.
const seenIdempotencyKeys = new Set<string>();

export async function getCryptoWithdrawalRules(ticker: string): Promise<CryptoWithdrawalRules> {
  await mockDelay();
  return MOCK_CRYPTO_RULES[ticker] ?? { ticker, min: '0', limit: '0', networkFee: '0', networks: [] };
}

export async function getFiatWithdrawalRules(ticker: string): Promise<FiatWithdrawalRules> {
  await mockDelay();
  return MOCK_FIAT_RULES[ticker] ?? { ticker, min: '0', limit: '0', feePercent: 0 };
}

export async function getSavedAddresses(ticker: string): Promise<SavedAddress[]> {
  await mockDelay();
  return MOCK_SAVED_ADDRESSES.filter((a) => a.ticker === ticker);
}

export async function getSavedRequisites(ticker: string): Promise<SavedRequisite[]> {
  await mockDelay();
  return MOCK_SAVED_REQUISITES.filter((r) => r.ticker === ticker);
}

export interface CryptoWithdrawalPayload {
  ticker: string;
  network?: CryptoNetwork;
  address: string;
  amount: string;
  idempotencyKey: string;
}

export async function submitCryptoWithdrawal(payload: CryptoWithdrawalPayload): Promise<WithdrawalResult> {
  await mockDelay();
  if (seenIdempotencyKeys.has(payload.idempotencyKey)) {
    return { id: payload.idempotencyKey, status: 'PENDING' };
  }
  seenIdempotencyKeys.add(payload.idempotencyKey);
  return { id: `WD-${Date.now().toString(36).toUpperCase()}`, status: 'PENDING' };
}

export interface FiatWithdrawalPayload {
  ticker: string;
  transferType: FiatTransferType;
  account: string;
  bankName?: string;
  bic?: string;
  inn?: string;
  correspondentAccount?: string;
  amount: string;
  saveRequisite: boolean;
  idempotencyKey: string;
}

export async function submitFiatWithdrawal(payload: FiatWithdrawalPayload): Promise<WithdrawalResult> {
  await mockDelay();
  if (seenIdempotencyKeys.has(payload.idempotencyKey)) {
    return { id: payload.idempotencyKey, status: 'PENDING' };
  }
  seenIdempotencyKeys.add(payload.idempotencyKey);
  return { id: `WD-${Date.now().toString(36).toUpperCase()}`, status: 'PENDING' };
}
