import type { Asset, AssetGroup, ClientType, Deal, Requisites, Stats, User } from '@/api/types.ts';
import { MOCK_ASSETS, MOCK_REQUISITES_CRYPTO, MOCK_REQUISITES_FIAT, MOCK_STATS, MOCK_USERS, mockDelay } from '@/api/mock/fixtures.ts';
import { findDeal, listDeals } from '@/api/mock/store.ts';
import { isFiatTicker } from '@/lib/money.ts';

export async function getUser(clientType: ClientType): Promise<User> {
  await mockDelay();
  return MOCK_USERS[clientType];
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
  return MOCK_ASSETS.filter((asset) => asset.group === group);
}
