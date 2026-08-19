export type ClientType = 'UL' | 'FL';

export interface Session {
  email: string;
  token: string;
  clientType: ClientType;
}

export type VerificationLevel = 1 | 2;

export type OtcAccessReason = 'GRANTED' | 'VERIFICATION_REQUIRED' | 'NOT_ELIGIBLE';

export interface User {
  clientName: string;
  clientType: ClientType;
  verificationLevel: VerificationLevel;
  otcAccess: OtcAccessReason;
  email: string;
  userId: string;
  webCabinetUrl: string;
  supportUrl: string;
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

export interface SavedAddress {
  id: string;
  address: string;
  /** Chains this address can receive on — an address is asset-agnostic, a network is not. */
  networks: CryptoNetwork[];
  /** Wallet labels shown as the dropdown row's second metadata line, e.g. `Trust Wallet, MetaMask +2`. */
  labels: string[];
}

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
  addresses: SavedAddress[];
  networks: CryptoNetwork[];
  limits: CryptoWithdrawLimits;
}

export interface WithdrawMethod {
  id: string;
  name: string;
  feePct: string;
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
}

export type Requisites = FiatRequisites | CryptoRequisites;

export type BalanceScenario = 'sufficient' | 'short1' | 'short' | 'belowmin';
