import type { User } from '@/api/types.ts';
import { apiFetch } from '@/api/http.ts';

/** Assumed endpoint — reconcile against Swagger once available. */
export async function getUser(): Promise<User> {
  return apiFetch<User>('/profile/me');
}
