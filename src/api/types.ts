export type ClientType = 'UL' | 'FL';

export interface Session {
  email: string;
  token: string;
  clientType: ClientType;
}

export type VerificationStatus = 'KYB_PASSED' | 'KYC_PASSED' | 'NONE';

export interface User {
  clientName: string;
  clientType: ClientType;
  verification: VerificationStatus;
  email: string;
  userId: string;
  webCabinetUrl: string;
}

export interface Stats {
  activeDeals: number;
  volume30d: string;
  volumeAsset: string;
}

export type DealStatus = 'DONE' | 'RUNNING';

export type DealDirection = 'BUY' | 'SELL' | 'EXCHANGE';

export interface Deal {
  id: string;
  status: DealStatus;
  date: string;
  direction: DealDirection;
  from: string;
  to: string;
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
