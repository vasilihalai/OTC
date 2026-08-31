import type {
  Accounts,
  Asset,
  AssetGroup,
  ClientType,
  CryptoWithdrawOptions,
  Deal,
  FiatWithdrawOptions,
  Requisites,
  SavedRequisite,
  Stats,
  User,
} from '@/api/types.ts';
import {
  MOCK_ASSETS,
  MOCK_REQUISITES_CRYPTO,
  MOCK_REQUISITES_FIAT,
  MOCK_SAVED_REQUISITES,
  MOCK_STATS,
  MOCK_USERS,
  MOCK_WITHDRAW_CRYPTO,
  MOCK_WITHDRAW_FIAT,
  mockDelay,
} from '@/api/mock/fixtures.ts';
import { findDeal, listDeals } from '@/api/mock/store.ts';
import { getAccountBalance, getAccountsSnapshot } from '@/api/mock/accountsStore.ts';
import { isFiatTicker } from '@/lib/money.ts';
import { otcAccessOverride } from '@/lib/devSwitches.ts';

export async function getUser(clientType: ClientType): Promise<User> {
  await mockDelay();
  const user = MOCK_USERS[clientType];
  const override = otcAccessOverride();
  return override ? { ...user, otcAccess: override } : user;
}

export async function getStats(): Promise<Stats> {
  await mockDelay();
  return MOCK_STATS;
}

export async function getDeals(): Promise<Deal[]> {
  await mockDelay();
  return listDeals();
}

export async function getDealById(id: string): Promise<Deal | undefined> {
  await mockDelay();
  return findDeal(id);
}

export async function getRequisites(id: string): Promise<Requisites | undefined> {
  await mockDelay();
  const deal = findDeal(id);
  if (!deal) {
    return undefined;
  }
  return isFiatTicker(deal.ticker) ? MOCK_REQUISITES_FIAT : MOCK_REQUISITES_CRYPTO;
}

export async function getAssets(group: AssetGroup): Promise<Asset[]> {
  await mockDelay();
  return MOCK_ASSETS
    .filter((asset) => asset.group === group)
    .map((asset) => ({ ...asset, balance: String(getAccountBalance('deposit', asset.ticker)) }));
}

export async function getAccounts(): Promise<Accounts> {
  await mockDelay();
  return getAccountsSnapshot();
}

export async function getWithdrawFiatOptions(currency: string): Promise<FiatWithdrawOptions> {
  await mockDelay();
  return {
    methods: MOCK_WITHDRAW_FIAT.methods[currency] ?? [],
    limits: MOCK_WITHDRAW_FIAT.limits[currency] ?? { min: '0', available: '0' },
  };
}

export async function getSavedRequisites(): Promise<SavedRequisite[]> {
  await mockDelay();
  return MOCK_SAVED_REQUISITES;
}

export async function getWithdrawCryptoOptions(asset: string): Promise<CryptoWithdrawOptions> {
  await mockDelay();
  return {
    networks: MOCK_WITHDRAW_CRYPTO.networks[asset] ?? [],
    limits: MOCK_WITHDRAW_CRYPTO.limits[asset] ?? { min: '0', available: '0', fee: '0', contractTail: null },
  };
}
