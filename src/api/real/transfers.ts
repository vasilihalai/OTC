import type { TransferRequest } from '@/api/types.ts';
import { apiFetch } from '@/api/http.ts';

/** Assumed endpoint — reconcile against Swagger once available. */
export async function transfer(request: TransferRequest): Promise<void> {
  await apiFetch<void>('/accounts/transfer', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
