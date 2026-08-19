export type ClientType = 'UL' | 'FL';

export interface Session {
  email: string;
  token: string;
  clientType: ClientType;
}

export type VerificationLevel = 1 | 2;

export interface User {
  clientName: string;
  clientType: ClientType;
  verificationLevel: VerificationLevel;
  email: string;
  userId: string;
  webCabinetUrl: string;
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

export type CryptoNetwork = 'TRC20' | 'ERC20';

export interface CryptoWithdrawalRules {
  ticker: string;
  min: string;
  limit: string;
  networkFee: string;
  networks: CryptoNetwork[];
}

export interface SavedAddress {
  id: string;
  ticker: string;
  network?: CryptoNetwork;
  label: string;
  address: string;
}

export type FiatTransferType = 'internal' | 'kg' | 'ru';

export interface FiatWithdrawalRules {
  ticker: string;
  min: string;
  limit: string;
  feePercent: number;
}

export interface SavedRequisite {
  id: string;
  ticker: string;
  transferType: FiatTransferType;
  label: string;
  account: string;
  bankName?: string;
  bic?: string;
  inn?: string;
  correspondentAccount?: string;
}

export interface WithdrawalResult {
  id: string;
  status: 'PENDING';
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
