import type { CryptoNetwork, WithdrawalResult } from '@/api/types.ts';
import { mockDelay } from '@/api/mock/fixtures.ts';
import { getAccountBalance, setAccountBalance } from '@/api/mock/accountsStore.ts';

// Guards against a double-tap resubmitting the same withdrawal request.
const seenIdempotencyKeys = new Set<string>();

export interface CryptoWithdrawalPayload {
  ticker: string;
  network: CryptoNetwork;
  addressId: string;
  amount: string;
  idempotencyKey: string;
}

export async function submitCryptoWithdrawal(payload: CryptoWithdrawalPayload): Promise<WithdrawalResult> {
  await mockDelay();
  if (seenIdempotencyKeys.has(payload.idempotencyKey)) {
    return { id: payload.idempotencyKey, status: 'PENDING' };
  }
  seenIdempotencyKeys.add(payload.idempotencyKey);
  setAccountBalance('deposit', payload.ticker, getAccountBalance('deposit', payload.ticker) - Number(payload.amount));
  return { id: `WD-${Date.now().toString(36).toUpperCase()}`, status: 'PENDING' };
}

export interface FiatWithdrawalPayload {
  ticker: string;
  methodId: string;
  amount: string;
  idempotencyKey: string;
}

export async function submitFiatWithdrawal(payload: FiatWithdrawalPayload): Promise<WithdrawalResult> {
  await mockDelay();
  if (seenIdempotencyKeys.has(payload.idempotencyKey)) {
    return { id: payload.idempotencyKey, status: 'PENDING' };
  }
  seenIdempotencyKeys.add(payload.idempotencyKey);
  setAccountBalance('deposit', payload.ticker, getAccountBalance('deposit', payload.ticker) - Number(payload.amount));
  return { id: `WD-${Date.now().toString(36).toUpperCase()}`, status: 'PENDING' };
}
