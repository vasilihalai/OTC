import type {
  Accounts,
  Asset,
  ClientType,
  CryptoRequisites,
  CryptoWithdrawLimits,
  CryptoNetwork,
  Deal,
  FiatRequisites,
  FiatWithdrawLimits,
  SavedAddress,
  SavedRequisite,
  Stats,
  User,
  WithdrawMethod,
} from '@/api/types.ts';

export const MOCK_USERS: Record<ClientType, User> = {
  UL: {
    clientName: 'ООО «Альфа Трейд»',
    clientType: 'UL',
    verified: true,
    securityLevel: 'LOW',
    otcAccess: 'GRANTED',
    email: 'karimov@gmail.com',
    phone: '+996 500 123 456',
    userId: '8f3a92c17b4e55d0a6f23e81c94b1d07',
    webCabinetUrl: 'https://xruby.example/cabinet',
    supportUrl: 'https://t.me/xruby_support',
    faqUrl: 'https://xruby.example/faq',
    aboutUrl: 'https://xruby.example/about',
    authenticatorEnabled: true,
  },
  FL: {
    clientName: 'Каримов Азамат',
    clientType: 'FL',
    verified: true,
    securityLevel: 'MEDIUM',
    otcAccess: 'GRANTED',
    email: 'karimov@gmail.com',
    phone: '+996 500 123 456',
    userId: '8f3a92c17b4e55d0a6f23e81c94b1d07',
    webCabinetUrl: 'https://xruby.example/cabinet',
    supportUrl: 'https://t.me/xruby_support',
    faqUrl: 'https://xruby.example/faq',
    aboutUrl: 'https://xruby.example/about',
    authenticatorEnabled: false,
  },
};

export const MOCK_STATS: Stats = { activeDeals: 5, volume30d: '100.24M', volumeAsset: 'KGS' };

export const MOCK_DEALS: Deal[] = [
  {
    id: 'OTC-1055',
    status: 'RATE_ACTIVE',
    date: '19.08.2026 09:12',
    direction: 'SELL',
    from: '25 000 USDT',
    to: '100 954 500 KGS',
    rate: '4 038.18 KGS',
    ticker: 'USDT',
    ratePerUnit: '4 038.18',
    rateUnitLabel: 'KGS за 1 USDT',
    quoteExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'OTC-1054',
    status: 'RATE_STALE',
    date: '18.08.2026 18:03',
    direction: 'EXCHANGE',
    from: '4 000 000 KGS',
    to: null,
    rate: null,
    ticker: 'KGS',
  },
  {
    id: 'OTC-1053',
    status: 'AWAITING_FUNDS',
    date: '17.08.2026 16:40',
    direction: 'BUY',
    from: '2.540000 BTC',
    to: '159 275 USD',
    rate: '62 706.69 USD',
    ticker: 'BTC',
  },
  {
    id: 'OTC-1051',
    status: 'RATE_PENDING',
    date: '15.08.2026 11:05',
    direction: 'SELL',
    from: '209 000 USDT',
    to: '81 420 000 KGS',
    rate: null,
    ticker: 'USDT',
  },
  {
    id: 'OTC-1049',
    status: 'RUNNING',
    date: '14.08.2026 08:51',
    direction: 'SELL',
    from: '20 000 USDT',
    to: '7 420 000 KGS',
    rate: '371.00 KGS',
    ticker: 'USDT',
  },
  {
    id: 'OTC-1048',
    status: 'DONE',
    date: '12.08.2026 12:23',
    direction: 'BUY',
    from: '1 000 000 KGS',
    to: '8 500.51 USDT',
    rate: '117.64 KGS',
    ticker: 'KGS',
  },
  {
    id: 'OTC-1047',
    status: 'DECLINED',
    date: '10.08.2026 15:47',
    direction: 'EXCHANGE',
    from: '4 000 000 KGS',
    to: '11 454.75 USDT',
    rate: '349.20 KGS',
    ticker: 'KGS',
  },
  {
    id: 'OTC-1044',
    status: 'DONE',
    date: '08.08.2026 14:02',
    direction: 'EXCHANGE',
    from: '10 000 USD',
    to: '890 000 000 KGS',
    rate: '89 000.00 KGS',
    ticker: 'USD',
  },
  {
    id: 'OTC-1040',
    status: 'DONE',
    date: '02.08.2026 10:15',
    direction: 'BUY',
    from: '3 000 000 KGS',
    to: '25 500.00 USDT',
    rate: '117.65 KGS',
    ticker: 'KGS',
  },
  {
    id: 'OTC-1036',
    status: 'DONE',
    date: '25.07.2026 13:47',
    direction: 'SELL',
    from: '18 000 USDC',
    to: '6 300 000 KGS',
    rate: '350.00 KGS',
    ticker: 'USDC',
  },
  {
    id: 'OTC-1029',
    status: 'DONE',
    date: '14.07.2026 09:30',
    direction: 'EXCHANGE',
    from: '5 000 USD',
    to: '445 000 000 KGS',
    rate: '89 000.00 KGS',
    ticker: 'USD',
  },
  {
    id: 'OTC-1018',
    status: 'DECLINED',
    date: '20.06.2026 17:22',
    direction: 'BUY',
    from: '800 000 RUB',
    to: '9 150.00 USDT',
    rate: '87.43 RUB',
    ticker: 'RUB',
  },
  {
    id: 'OTC-1005',
    status: 'DONE',
    date: '15.05.2026 12:00',
    direction: 'SELL',
    from: '0.300000 BTC',
    to: '1 800 000 KGS',
    rate: '6 000 000.00 KGS',
    ticker: 'BTC',
  },
];

/** OTC minimum deal size per source asset — used by the confirmation body's callout branches. */
export const MOCK_MIN_DEAL: Record<string, string> = {
  KGS: '1000000',
  RUB: '1000000',
  USD: '12000',
  USDT: '12000',
  USDC: '12000',
  BTC: '0.15',
};

export const MOCK_REQUISITES_FIAT: FiatRequisites = {
  kind: 'fiat',
  companyName: 'ОАО «СО ЕЭС»',
  bank: 'ОАО «БАКАЙ БАНК»',
  bankAddress: 'Кыргызская Республика, 720040, г. Бишкек, ул. Исанова 105',
  bik: '124032',
  account: '1240020001397008',
  recipient: 'ОАО «БитРуби»',
  recipientAddress: 'Кыргызская Республика, г. Бишкек, Ленинский район, ул. Тыныстанова 249',
  corrAccount: '30100012345678976190',
  purpose: 'Оплата по заявке № ОТС–1052. НДС не облагается',
};

export const MOCK_REQUISITES_CRYPTO: CryptoRequisites = {
  kind: 'crypto',
  asset: 'USDT',
  assetName: 'Tether',
  network: 'TRON (TRC-20)',
  address: 'bnb1mrzq7fenlfxx59usn2fn8aygdyfrsku4jz8k9r',
};

export const MOCK_ASSETS: Asset[] = [
  { ticker: 'KGS', name: 'Кыргызский сом', balance: '10000000', group: 'fiat' },
  { ticker: 'RUB', name: 'Российский рубль', balance: '5000000', group: 'fiat' },
  { ticker: 'USD', name: 'Доллар США', balance: '200000', group: 'fiat' },
  { ticker: 'USDT', name: 'Tether', balance: '56889.65', group: 'crypto' },
  { ticker: 'USDC', name: 'USD Coin', balance: '12500.00', group: 'crypto' },
  { ticker: 'BTC', name: 'Bitcoin', balance: '0.420000', group: 'crypto' },
];

/** Deposit vs. trading account balances — the mutable source of truth lives in `accountsStore.ts`. */
export const MOCK_ACCOUNTS: Accounts = {
  deposit: { KGS: '10000000', RUB: '5000000', USD: '200000', USDT: '56889.65', USDC: '12500.00', BTC: '0.420000' },
  trading: { KGS: '1000000', RUB: '0', USD: '0', USDT: '50000.00', USDC: '0', BTC: '0' },
};

export const MOCK_WITHDRAW_FIAT: {
  currencies: string[];
  methods: Record<string, WithdrawMethod[]>;
  limits: Record<string, FiatWithdrawLimits>;
} = {
  currencies: ['KGS', 'RUB', 'USD'],
  methods: {
    KGS: [
      { id: 'bakai', name: 'Бакай Банк', feePct: '1.0' },
      { id: 'other_kg', name: 'Другой Банк Кыргызстана', feePct: '1.5' },
    ],
    RUB: [{ id: 'other_ru', name: 'Межбанковский перевод RU', feePct: '1.5' }],
    USD: [{ id: 'swift', name: 'SWIFT-перевод', feePct: '2.0' }],
  },
  limits: {
    KGS: { min: '100000', available: '15000000' },
    RUB: { min: '100000', available: '10000000' },
    USD: { min: '1000', available: '200000' },
  },
};

// No saved address supports the 'Bitcoin' network on purpose — this is how the
// empty-saved-address-list state (§7's scenario switch) is reached without a
// separate dev toggle: just pick BTC.
export const MOCK_WITHDRAW_CRYPTO: {
  assets: string[];
  addresses: SavedAddress[];
  networks: Record<string, CryptoNetwork[]>;
  limits: Record<string, CryptoWithdrawLimits>;
} = {
  assets: ['USDT', 'USDC', 'BTC'],
  addresses: [
    {
      id: 'addr-1',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976',
      networks: ['Ethereum (ERC-20)'],
      labels: ['Trust Wallet', 'MetaMask', 'Ledger', 'Safe'],
    },
    {
      id: 'addr-2',
      address: '0x8f2A3bC1d4E6f7A9B0C1d2E3f4A5b6C7d8E9f0A1',
      networks: ['Ethereum (ERC-20)'],
      labels: ['Trust Wallet'],
    },
    {
      id: 'addr-3',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      networks: ['TRON (TRC-20)'],
      labels: ['Trust Wallet'],
    },
  ],
  networks: {
    USDT: ['TRON (TRC-20)', 'Ethereum (ERC-20)'],
    USDC: ['Ethereum (ERC-20)'],
    BTC: ['Bitcoin'],
  },
  limits: {
    USDT: { min: '7', available: '30000', fee: '0.50', contractTail: 'frsku4u7' },
    USDC: { min: '7', available: '12500', fee: '0.50', contractTail: 'a1c9e2b4' },
    BTC: { min: '0.0005', available: '0.42', fee: '0.0002', contractTail: null },
  },
};

export const MOCK_SAVED_REQUISITES: SavedRequisite[] = [
  { id: 'req-1', transferType: 'internal', label: 'Свой счёт xRuby · 1234…3456', account: '12345678901234563456' },
  {
    id: 'req-2',
    transferType: 'kg',
    label: 'Optima Bank · 1234…3456',
    account: '1234567890123456',
    bankName: 'ОАО «Optima Bank»',
    bic: '129001',
    inn: '01234567891011',
  },
  {
    id: 'req-3',
    transferType: 'ru',
    label: 'Т-Банк · 4081…2345',
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
