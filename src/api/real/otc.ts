import type { OtcAccessResult } from '@/api/types.ts';
import { apiFetch } from '@/api/http.ts';

/**
 * api-integration.md §7.1. Called on app boot (after profile) and again on
 * resume from background per the doc's own instruction — "a client whose
 * verification completed while the app was open should not have to restart
 * it." Only `getOtcAccess` is wired this round (feeds Profile's verified
 * badge and `useRequireOtcAccess`'s gate); dashboard/deals/documents/commands
 * are the rest of §7, deferred to the OTC step.
 */
export async function getOtcAccess(): Promise<OtcAccessResult> {
  const res = await apiFetch<{ result: OtcAccessResult }>('/v1/otc/access', {}, false, 'financial');
  return res.result;
}
