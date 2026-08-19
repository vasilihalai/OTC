import type { Deal } from '@/api/types.ts';
import { MOCK_DEALS } from '@/api/mock/fixtures.ts';

// In-memory, mutated by actions.mock.ts so a status change is visible
// immediately and survives navigation within the session; a reload resets
// back to the fixtures.
const deals: Deal[] = MOCK_DEALS.map((deal) => ({ ...deal }));

export function listDeals(): Deal[] {
  return deals;
}

export function findDeal(id: string): Deal | undefined {
  return deals.find((deal) => deal.id === id);
}

export function updateDeal(id: string, patch: Partial<Deal>): Deal | undefined {
  const index = deals.findIndex((deal) => deal.id === id);
  if (index === -1) {
    return undefined;
  }
  deals[index] = { ...deals[index], ...patch };
  return deals[index];
}
