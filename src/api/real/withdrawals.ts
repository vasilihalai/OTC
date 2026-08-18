import type {
  CryptoWithdrawalRules,
  FiatWithdrawalRules,
  SavedAddress,
  SavedRequisite,
  WithdrawalResult,
} from '@/api/types.ts';
import type { CryptoWithdrawalPayload, FiatWithdrawalPayload } from '@/api/mock/withdrawals.mock.ts';
import { apiFetch } from '@/api/http.ts';

/**
 * Assumed endpoints — reconcile against Swagger once available. Min/limit/fee
 * must come from the backend (mini-app-v1.md §5.4 rule: never hardcode), and
 * submission carries the idempotency key as a header so a double-tap retry
 * is safe to resend.
 */

export async function getCryptoWithdrawalRules(ticker: string): Promise<CryptoWithdrawalRules> {
  return apiFetch<CryptoWithdrawalRules>(`/withdrawals/crypto/rules?ticker=${ticker}`);
}

export async function getFiatWithdrawalRules(ticker: string): Promise<FiatWithdrawalRules> {
  return apiFetch<FiatWithdrawalRules>(`/withdrawals/fiat/rules?ticker=${ticker}`);
}

export async function getSavedAddresses(ticker: string): Promise<SavedAddress[]> {
  return apiFetch<SavedAddress[]>(`/withdrawals/crypto/addresses?ticker=${ticker}`);
}

export async function getSavedRequisites(ticker: string): Promise<SavedRequisite[]> {
  return apiFetch<SavedRequisite[]>(`/withdrawals/fiat/requisites?ticker=${ticker}`);
}

export async function submitCryptoWithdrawal(payload: CryptoWithdrawalPayload): Promise<WithdrawalResult> {
  const { idempotencyKey, ...body } = payload;
  return apiFetch<WithdrawalResult>('/withdrawals/crypto', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  });
}

export async function submitFiatWithdrawal(payload: FiatWithdrawalPayload): Promise<WithdrawalResult> {
  const { idempotencyKey, ...body } = payload;
  return apiFetch<WithdrawalResult>('/withdrawals/fiat', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  });
}
