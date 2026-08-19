import type { Deal } from '@/api/types.ts';
import { mockDelay } from '@/api/mock/fixtures.ts';
import { updateDeal } from '@/api/mock/store.ts';

export async function confirmDeal(id: string): Promise<Deal | undefined> {
  await mockDelay();
  return updateDeal(id, { status: 'RUNNING' });
}

export async function declineDeal(id: string): Promise<Deal | undefined> {
  await mockDelay();
  return updateDeal(id, { status: 'DECLINED' });
}

export async function requestNewRate(id: string): Promise<Deal | undefined> {
  await mockDelay();
  return updateDeal(id, { status: 'RATE_PENDING' });
}
