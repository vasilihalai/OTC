import type {
  ClientType,
  RequisitesPayload,
  WithdrawOtpIssueResult,
  WithdrawQuote,
  WithdrawalResult,
} from '@/api/types.ts';
import { MOCK_USERS, MOCK_WITHDRAW_CRYPTO_NETWORKS, mockDelay } from '@/api/mock/fixtures.ts';
import { getAccountBalance, setAccountBalance } from '@/api/mock/accountsStore.ts';
import { RateLimitedError } from '@/lib/rateLimitedError.ts';
import { ru } from '@/i18n/ru.ts';

// Guards against a double-tap resubmitting the same withdrawal request.
const seenIdempotencyKeys = new Set<string>();

// ---------------------------------------------------------------------------
// Crypto — api-integration.md §5.2/§5.3's quote → issue-otp → confirm shape.
// Replaces the old single submitCryptoWithdrawal(payload) call entirely; the
// "submission" now happens at confirm time, keyed by the quote's own
// transactionId (mirroring the real flow, not just matching its final effect).
// ---------------------------------------------------------------------------

interface PendingWithdrawal {
  ticker: string;
  amount: number;
}

const pendingWithdrawals = new Map<string, PendingWithdrawal>();
let failedOtpAttempts = 0;

export async function getWithdrawCryptoQuote(params: {
  currency: string;
  currencyNetworkId: string;
  amount: string;
}): Promise<WithdrawQuote> {
  await mockDelay();
  const network = MOCK_WITHDRAW_CRYPTO_NETWORKS.find((n) => n.currencyNetworkId === params.currencyNetworkId);
  const amount = Number(params.amount) || 0;
  const commission = network ? Number(network.commissionFixed) + (amount * Number(network.commissionPercent)) / 100 : 0;
  const transactionId = `mock-wd-${Date.now()}`;
  pendingWithdrawals.set(transactionId, { ticker: params.currency, amount });
  return {
    transactionId,
    minimalAmount: network?.minimalAmount ?? '0',
    commission: String(commission),
    commissionPercent: network?.commissionPercent ?? '0',
    finalAmount: String(Math.max(0, amount - commission)),
    amountToWithdraw: String(amount),
    limits: { DAILY: { availableLimit: network?.maximumAmount ?? '0', currency: params.currency } },
    expiredAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    contractAddress: network?.contractAddress ?? null,
    addressRegex: network?.addressRegex ?? null,
    confirmation2FA: false,
    confirmationEmail: true,
    scannerLink: null,
  };
}

export async function issueWithdrawOtp(_transactionId: string, clientType: ClientType): Promise<WithdrawOtpIssueResult> {
  await mockDelay();
  return { twoFA: true, source: MOCK_USERS[clientType].authenticatorEnabled ? 'authenticator' : 'email' };
}

/** Any 6 digits succeed except '000000'; 3 consecutive failures rate-limit — same rule `verifyCode` has always used. */
export async function confirmWithdrawOtp(transactionId: string, otp: string): Promise<WithdrawalResult> {
  await mockDelay();
  if (otp === '000000') {
    failedOtpAttempts += 1;
    if (failedOtpAttempts >= 3) {
      throw new RateLimitedError();
    }
    throw new Error(ru.verification.errorCodeInvalid);
  }
  failedOtpAttempts = 0;
  const pending = pendingWithdrawals.get(transactionId);
  if (pending) {
    setAccountBalance('deposit', pending.ticker, getAccountBalance('deposit', pending.ticker) - pending.amount);
    pendingWithdrawals.delete(transactionId);
  }
  return { id: `WD-${Date.now().toString(36).toUpperCase()}`, status: 'PENDING' };
}

// ---------------------------------------------------------------------------
// Fiat — unchanged this round (§5's directory/quote/OTP shape for fiat is
// the Withdrawals step's next half, not done yet; WithdrawRequisites.tsx
// still calls this one directly).
// ---------------------------------------------------------------------------

export interface FiatWithdrawalPayload {
  ticker: string;
  methodId: string;
  amount: string;
  requisites: RequisitesPayload;
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
