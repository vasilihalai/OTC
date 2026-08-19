import type {
  CryptoWithdrawOptions,
  FiatWithdrawOptions,
  Requisites,
  SavedRequisite,
  WithdrawalResult,
} from '@/api/types.ts';
import type { CryptoWithdrawalPayload, FiatWithdrawalPayload } from '@/api/mock/withdrawals.mock.ts';
import { apiFetch } from '@/api/http.ts';

/**
 * Assumed endpoints — reconcile against Swagger once available. Limits/methods/
 * addresses must come from the backend (never hardcode), and submission carries
 * the idempotency key as a header so a double-tap retry is safe to resend.
 */

export async function getWithdrawFiatOptions(currency: string): Promise<FiatWithdrawOptions> {
  return apiFetch<FiatWithdrawOptions>(`/withdrawals/fiat/options?currency=${currency}`);
}

export async function getWithdrawCryptoOptions(asset: string): Promise<CryptoWithdrawOptions> {
  return apiFetch<CryptoWithdrawOptions>(`/withdrawals/crypto/options?asset=${asset}`);
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

export async function getSavedRequisites(): Promise<SavedRequisite[]> {
  return apiFetch<SavedRequisite[]>('/withdrawals/fiat/requisites');
}

/** Payment requisites to fund a specific deal — id is a deal id, not a withdrawal. */
export async function getRequisites(dealId: string): Promise<Requisites | undefined> {
  return apiFetch<Requisites | undefined>(`/deals/${dealId}/requisites`);
}
