export interface Session {
  email: string;
  token: string;
}

export type ClientType = 'UL' | 'FL';

export type VerificationStatus = 'KYB_PASSED' | 'KYC_PASSED' | 'NONE';

export interface Profile {
  clientName: string;
  clientType: ClientType;
  verification: VerificationStatus;
  email: string;
  userId: string;
  webCabinetUrl: string;
}

export type RequestCodeError = 'EMAIL_INVALID';

export type VerifyCodeError = 'CODE_INVALID' | 'RATE_LIMIT';
