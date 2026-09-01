import type {
  FiatWithdrawOptions,
  Requisites,
  SavedRequisite,
  WithdrawNetworkOption,
  WithdrawOtpIssueResult,
  WithdrawQuote,
  WithdrawalResult,
} from '@/api/types.ts';
import type { CryptoWithdrawOptions } from '@/api/types.ts';
import type { FiatWithdrawalPayload } from '@/api/mock/withdrawals.mock.ts';
import { apiFetch } from '@/api/http.ts';

/**
 * Fiat side — unchanged, still assumed/placeholder endpoints (reconcile
 * against §5.1's real directory once the Withdrawals step's fiat half is
 * done; only the crypto side is wired to api-integration.md this round).
 */

export async function getWithdrawFiatOptions(currency: string): Promise<FiatWithdrawOptions> {
  return apiFetch<FiatWithdrawOptions>(`/withdrawals/fiat/options?currency=${currency}`);
}

export async function getSavedRequisites(): Promise<SavedRequisite[]> {
  return apiFetch<SavedRequisite[]>('/withdrawals/fiat/requisites');
}

/** Payment requisites to fund a specific deal — id is a deal id, not a withdrawal. */
export async function getRequisites(dealId: string): Promise<Requisites | undefined> {
  return apiFetch<Requisites | undefined>(`/deals/${dealId}/requisites`);
}

export async function submitFiatWithdrawal(payload: FiatWithdrawalPayload): Promise<WithdrawalResult> {
  const { idempotencyKey, ...body } = payload;
  return apiFetch<WithdrawalResult>('/withdrawals/fiat', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Crypto — api-integration.md §5.1–§5.3.
// ---------------------------------------------------------------------------

interface RawCurrencyItem {
  currency: string;
  currencyNetworkId?: string;
  networkCode?: string;
  networkLabel?: string;
  contractAddress?: string | null;
  addressRegex?: string | null;
  minimalAmount: string;
  maximumAmount: string;
  commissionPercent: string;
  commissionFixed: string;
}

/** `GET /v3/configuration/withdraws` — §5.1. Replaces the old assumed `/withdrawals/crypto/options` wholesale. */
export async function getWithdrawCryptoOptions(asset: string): Promise<CryptoWithdrawOptions> {
  const res = await apiFetch<{ cryptoCurrencies: RawCurrencyItem[] }>('/v3/configuration/withdraws', {}, false, 'financial');
  const networks: WithdrawNetworkOption[] = res.cryptoCurrencies
    .filter((item) => item.currency === asset)
    .map((item) => ({
      currencyNetworkId: item.currencyNetworkId ?? '',
      networkCode: item.networkCode ?? '',
      networkLabel: item.networkLabel ?? '',
      contractAddress: item.contractAddress ?? null,
      addressRegex: item.addressRegex ?? null,
      minimalAmount: item.minimalAmount,
      maximumAmount: item.maximumAmount,
      commissionPercent: item.commissionPercent,
      commissionFixed: item.commissionFixed,
    }));
  return { networks };
}

export interface WithdrawQuoteParams {
  currency: string;
  currencyNetworkId: string;
  amount: string;
  address: string;
  isFullAmount?: boolean;
}

/**
 * `POST /operations/withdraw/info` — §5.2. `requisites` for crypto is the
 * destination address; sent here (not only at confirm) so the fee/limit
 * calculation sees the real destination, per §5.3's explicit instruction —
 * repeat at confirm only if the backend rejects without it.
 */
export async function getWithdrawCryptoQuote(params: WithdrawQuoteParams): Promise<WithdrawQuote> {
  const res = await apiFetch<{ result: WithdrawQuote }>('/v2/operations/withdraw/info', {
    method: 'POST',
    body: JSON.stringify({
      currency: params.currency,
      operationType: 'WITHDRAW',
      currencyNetworkId: params.currencyNetworkId,
      amount: Number(params.amount),
      isFullAmount: params.isFullAmount ?? false,
      isRequisiteSave: false,
      requisites: { address: params.address },
    }),
  }, false, 'financial');
  return res.result;
}

/** `POST /operations/issue-otp/{transactionId}` — §5.3. `clientType` unused (session-derived), kept to mirror the mock's signature. */
export async function issueWithdrawOtp(transactionId: string): Promise<WithdrawOtpIssueResult> {
  const res = await apiFetch<{ result: WithdrawOtpIssueResult }>(`/v2/operations/issue-otp/${transactionId}`, { method: 'POST' }, false, 'financial');
  return res.result;
}

/** `POST /operations/confirm/{transactionId}` — §5.3. */
export async function confirmWithdrawOtp(transactionId: string, otp: string, address?: string): Promise<WithdrawalResult> {
  const res = await apiFetch<{ result: WithdrawalResult }>(`/v2/operations/confirm/${transactionId}`, {
    method: 'POST',
    body: JSON.stringify({ otp, requisites: address ? { address } : undefined }),
  }, false, 'financial');
  return res.result;
}
