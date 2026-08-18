import type {
  Asset,
  ClientType,
  CryptoWithdrawalRules,
  Deal,
  FiatWithdrawalRules,
  SavedAddress,
  SavedRequisite,
  Stats,
  User,
} from '@/api/types.ts';

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

export const MOCK_STATS: Stats = { activeDeals: 3, volume30d: '100.24M', volumeAsset: 'KGS' };

export const MOCK_DEALS: Deal[] = [
  {
    id: 'OTC-1055',
    status: 'RUNNING',
    date: '19.08.2026 09:12',
    direction: 'EXCHANGE',
    from: '15 000 USDT',
    to: '1 300 000 RUB',
  },
  {
    id: 'OTC-1054',
    status: 'DONE',
    date: '18.08.2026 18:03',
    direction: 'SELL',
    from: '0.080000 BTC',
    to: '480 000 KGS',
  },
  {
    id: 'OTC-1053',
    status: 'RUNNING',
    date: '17.08.2026 16:40',
    direction: 'BUY',
    from: '500 000 KGS',
    to: '4 250.00 USDT',
  },
  {
    id: 'OTC-1051',
    status: 'DONE',
    date: '15.08.2026 11:05',
    direction: 'SELL',
    from: '0.150000 BTC',
    to: '900 000 KGS',
  },
  {
    id: 'OTC-1049',
    status: 'DONE',
    date: '14.08.2026 08:51',
    direction: 'BUY',
    from: '2 000 000 RUB',
    to: '22 900.00 USDC',
  },
  {
    id: 'OTC-1048',
    status: 'DONE',
    date: '12.08.2026 12:23',
    direction: 'BUY',
    from: '1 000 000 KGS',
    to: '8 500.51 USDT',
  },
  {
    id: 'OTC-1047',
    status: 'RUNNING',
    date: '12.08.2026 12:23',
    direction: 'SELL',
    from: '20 000 USDT',
    to: '7 420 000 KGS',
  },
  {
    id: 'OTC-1044',
    status: 'DONE',
    date: '08.08.2026 14:02',
    direction: 'EXCHANGE',
    from: '10 000 USD',
    to: '890 000 000 KGS',
  },
  {
    id: 'OTC-1040',
    status: 'DONE',
    date: '02.08.2026 10:15',
    direction: 'BUY',
    from: '3 000 000 KGS',
    to: '25 500.00 USDT',
  },
  {
    id: 'OTC-1036',
    status: 'DONE',
    date: '25.07.2026 13:47',
    direction: 'SELL',
    from: '18 000 USDC',
    to: '6 300 000 KGS',
  },
  {
    id: 'OTC-1029',
    status: 'DONE',
    date: '14.07.2026 09:30',
    direction: 'EXCHANGE',
    from: '5 000 USD',
    to: '445 000 000 KGS',
  },
  {
    id: 'OTC-1018',
    status: 'DONE',
    date: '20.06.2026 17:22',
    direction: 'BUY',
    from: '800 000 RUB',
    to: '9 150.00 USDT',
  },
  {
    id: 'OTC-1005',
    status: 'DONE',
    date: '15.05.2026 12:00',
    direction: 'SELL',
    from: '0.300000 BTC',
    to: '1 800 000 KGS',
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

export const MOCK_CRYPTO_RULES: Record<string, CryptoWithdrawalRules> = {
  USDT: { ticker: 'USDT', min: '10', limit: '250000', networkFee: '1', networks: ['TRC20', 'ERC20'] },
  USDC: { ticker: 'USDC', min: '10', limit: '250000', networkFee: '3', networks: ['TRC20', 'ERC20'] },
  BTC: { ticker: 'BTC', min: '0.0005', limit: '5', networkFee: '0.0001', networks: [] },
};

export const MOCK_FIAT_RULES: Record<string, FiatWithdrawalRules> = {
  KGS: { ticker: 'KGS', min: '1000', limit: '15000000', feePercent: 0.5 },
  RUB: { ticker: 'RUB', min: '1000', limit: '10000000', feePercent: 0.5 },
  USD: { ticker: 'USD', min: '50', limit: '300000', feePercent: 0.8 },
};

export const MOCK_SAVED_ADDRESSES: SavedAddress[] = [
  { id: 'addr-1', ticker: 'USDT', network: 'TRC20', label: 'Основной кошелёк', address: 'TXn9s8gQmZ4vK7pR2wYbLd5fH1cJ6eA3xT' },
  { id: 'addr-2', ticker: 'USDT', network: 'ERC20', label: 'Binance', address: '0x8f2A3bC1d4E6f7A9B0C1d2E3f4A5b6C7d8E9f0A1' },
  { id: 'addr-3', ticker: 'BTC', label: 'Ledger', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
];

export const MOCK_SAVED_REQUISITES: SavedRequisite[] = [
  { id: 'req-1', ticker: 'KGS', transferType: 'internal', label: 'Свой счёт xRuby', account: '1234 5678 9012 3456' },
  {
    id: 'req-2',
    ticker: 'KGS',
    transferType: 'kg',
    label: 'Optima Bank',
    account: '1234567890123456',
    bankName: 'ОАО «Optima Bank»',
    bic: '129001',
    inn: '01234567891011',
  },
  {
    id: 'req-3',
    ticker: 'RUB',
    transferType: 'ru',
    label: 'Т-Банк',
    account: '40817810000000012345',
    bankName: 'АО «Т-Банк»',
    bic: '044525974',
    inn: '7710140679',
    correspondentAccount: '30101810145250000974',
  },
];

export function mockDelay(): Promise<void> {
  const ms = 400 + Math.random() * 400;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
