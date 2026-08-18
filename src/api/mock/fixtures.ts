import type { Profile } from '@/api/types.ts';

export const MOCK_EMAIL = 'finance@alpha-trade.kg';

export const MOCK_PROFILE: Profile = {
  clientName: 'ООО «Альфа Трейд»',
  clientType: 'UL',
  verification: 'KYB_PASSED',
  email: MOCK_EMAIL,
  userId: '8f3a92c17b4e55d0a6f23e81c94b1d07',
  webCabinetUrl: 'https://xruby.example/cabinet',
};

export const MAX_CONSECUTIVE_CODE_ATTEMPTS = 5;

export function mockDelay(): Promise<void> {
  const ms = 400 + Math.random() * 400;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
