import type { Accounts, ClientType, Stats, User } from '@/api/types.ts';
import { apiFetch } from '@/api/http.ts';

/**
 * Assumed endpoints — reconcile against Swagger once available. `getUser`
 * takes `clientType` only to mirror the mock's signature exactly (a real
 * `/profile/me` call is session-derived and ignores it).
 */

export async function getUser(_clientType: ClientType): Promise<User> {
  return apiFetch<User>('/profile/me');
}

export async function getStats(): Promise<Stats> {
  return apiFetch<Stats>('/profile/stats');
}

export async function getAccounts(): Promise<Accounts> {
  return apiFetch<Accounts>('/profile/accounts');
}
