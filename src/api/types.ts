export type ClientType = 'UL' | 'FL';

/**
 * UI-facing identity only — no credential lives here. In real mode the
 * actual access/refresh tokens are owned exclusively by
 * `api/real/http/tokenStore.ts` (api-integration.md §1.4); in mock mode
 * nothing reads a token at all. Kept minimal on purpose so there is only
 * ever one place a stale token could leak from.
 */
export interface Session {
  email: string;
  clientType: ClientType;
}

/**
 * `DESK_CLOSED` is new — api-integration.md §7.1: `available === false` with
 * `enabled === true` "most likely means OTC is on for you but the desk is
 * closed," a state the old 3-way model had no room for (question B9).
 */
export type OtcAccessReason = 'GRANTED' | 'VERIFICATION_REQUIRED' | 'DESK_CLOSED' | 'NOT_ELIGIBLE';

/** `GET /v1/otc/access` — api-integration.md §7.1. */
export interface OtcAccessResult {
  enabled: boolean;
  available: boolean;
  reasons: string[];
}

/** How the account is protected — not its verification status. */
export type SecurityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  clientName: string;
  clientType: ClientType;
  verified: boolean;
  securityLevel: SecurityLevel;
  otcAccess: OtcAccessReason;
  email: string;
  phone: string;
  userId: string;
  webCabinetUrl: string;
  supportUrl: string;
  faqUrl: string;
  aboutUrl: string;
  /** Gates the 2FA method: Google Authenticator when true, email code otherwise. */
  authenticatorEnabled: boolean;
}

export interface Stats {
  activeDeals: number;
  volume30d: string;
  volumeAsset: string;
}

export type DealStatus =
  | 'RATE_PENDING'
  | 'RATE_ACTIVE'
  | 'RATE_STALE'
  | 'AWAITING_FUNDS'
  | 'RUNNING'
  | 'DONE'
  | 'DECLINED';

export type DealDirection = 'BUY' | 'SELL' | 'EXCHANGE';

export interface Deal {
  id: string;
  status: DealStatus;
  date: string;
  direction: DealDirection;
  from: string;
  to: string | null;
  rate: string | null;
  /** Ticker of the `from` asset — drives which requisites variant (fiat/crypto) applies. */
  ticker: string;
  /** Quote-card fields — only meaningful while `status === 'RATE_ACTIVE'`. */
  ratePerUnit?: string;
  rateUnitLabel?: string;
  /** ISO timestamp — the quote card counts down to this and flips to RATE_STALE at zero. */
  quoteExpiresAt?: string;
}

export type AssetGroup = 'crypto' | 'fiat';

export interface Asset {
  ticker: string;
  name: string;
  balance: string;
  group: AssetGroup;
}

export type SocialProvider = 'google' | 'apple';

export type SignInError = 'EMAIL_INVALID';

export type VerifyCodeError = 'CODE_INVALID' | 'RATE_LIMIT';

/** Display string, e.g. `TRON (TRC-20)` — the fixture set defines the whole vocabulary, not an enum. */
export type CryptoNetwork = string;

export type FiatTransferType = 'internal' | 'kg' | 'ru';

export interface SavedRequisite {
  id: string;
  transferType: FiatTransferType;
  label: string;
  account: string;
  bankName?: string;
  bic?: string;
  inn?: string;
  correspondentAccount?: string;
}

export interface RequisitesPayload {
  transferType: FiatTransferType;
  account: string;
  bankName?: string;
  bic?: string;
  inn?: string;
  correspondentAccount?: string;
  saveForLater: boolean;
}

export interface CryptoWithdrawLimits {
  min: string;
  available: string;
  fee: string;
  contractTail: string | null;
}

export interface CryptoWithdrawOptions {
  networks: CryptoNetwork[];
  limits: CryptoWithdrawLimits;
}

export interface WithdrawMethod {
  id: string;
  name: string;
  feePct: string;
  /** Which requisites field set the method needs — set once here, not re-picked on the requisites screen. */
  transferType: FiatTransferType;
}

export interface FiatWithdrawLimits {
  min: string;
  available: string;
}

export interface FiatWithdrawOptions {
  methods: WithdrawMethod[];
  limits: FiatWithdrawLimits;
}

export interface WithdrawalResult {
  id: string;
  status: 'PENDING';
}

export type TransferAccount = 'deposit' | 'trading';

export interface TransferRequest {
  from: TransferAccount;
  to: TransferAccount;
  ticker: string;
  amount: string;
}

export interface Accounts {
  deposit: Record<string, string>;
  trading: Record<string, string>;
}

export interface FiatRequisites {
  kind: 'fiat';
  companyName: string;
  bank: string;
  bankAddress: string;
  bik: string;
  account: string;
  recipient: string;
  recipientAddress: string;
  corrAccount: string;
  purpose: string;
}

export interface CryptoRequisites {
  kind: 'crypto';
  asset: string;
  assetName: string;
  network: string;
  address: string;
  /** Other networks this asset can also be deposited over, each with its own address. When present (>1 entry), the network field becomes a real picker instead of a fixed display. */
  networks?: { network: string; address: string }[];
}

export type Requisites = FiatRequisites | CryptoRequisites;

export type BalanceScenario = 'sufficient' | 'short1' | 'short' | 'belowmin';
