import type { Asset, AssetGroup } from '@/api/types.ts';
import { apiFetch } from '@/api/http.ts';

/** Assumed endpoint — reconcile against Swagger once available. */
export async function getAssets(group: AssetGroup): Promise<Asset[]> {
  return apiFetch<Asset[]>(`/balances?group=${group}`);
}
