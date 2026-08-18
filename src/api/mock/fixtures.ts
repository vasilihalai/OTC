import type { Asset, ClientType, Deal, Stats, User } from '@/api/types.ts';

export const MOCK_USERS: Record<ClientType, User> = {
  UL: {
    clientName: 'ООО «Альфа Трейд»',
    clientType: 'UL',
    verification: 'KYB_PASSED',
    email: 'karimov@gmail.com',
    userId: '8f3a92c17b4e55d0a6f23e81c94b1d07',
    webCabinetUrl: 'https://xruby.example/cabinet',
  },
  FL: {
    clientName: 'Каримов Азамат',
    clientType: 'FL',
    verification: 'KYC_PASSED',
    email: 'karimov@gmail.com',
    userId: '8f3a92c17b4e55d0a6f23e81c94b1d07',
    webCabinetUrl: 'https://xruby.example/cabinet',
  },
};

export const MOCK_STATS: Stats = { activeDeals: 2, volume30d: '100.24M', volumeAsset: 'KGS' };

export const MOCK_DEALS: Deal[] = [
  {
    id: 'OTC-1047',
    status: 'DONE',
    date: '12.08.2024 12:23',
    direction: 'BUY',
    from: '1 000 000 KGS',
    to: '8 500.51 USDT',
  },
  {
    id: 'OTC-1046',
    status: 'RUNNING',
    date: '12.08.2024 12:23',
    direction: 'SELL',
    from: '20 000 USDT',
    to: '7 420 000 KGS',
  },
];

export const MOCK_ASSETS: Asset[] = [
  { ticker: 'KGS', name: 'Кыргызский сом', balance: '10000000', group: 'fiat' },
  { ticker: 'RUB', name: 'Российский рубль', balance: '5000000', group: 'fiat' },
  { ticker: 'USD', name: 'Доллар США', balance: '200000', group: 'fiat' },
  { ticker: 'USDT', name: 'Tether', balance: '56889.65', group: 'crypto' },
  { ticker: 'USDC', name: 'USD Coin', balance: '12500.00', group: 'crypto' },
  { ticker: 'BTC', name: 'Bitcoin', balance: '0.420000', group: 'crypto' },
];

export function mockDelay(): Promise<void> {
  const ms = 400 + Math.random() * 400;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
