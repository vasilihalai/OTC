import type { Asset, AssetGroup, ClientType, Deal, Stats, User } from '@/api/types.ts';
import { MOCK_ASSETS, MOCK_DEALS, MOCK_STATS, MOCK_USERS, mockDelay } from '@/api/mock/fixtures.ts';

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
  return MOCK_DEALS;
}

export async function getAssets(group: AssetGroup): Promise<Asset[]> {
  await mockDelay();
  return MOCK_ASSETS.filter((asset) => asset.group === group);
}
