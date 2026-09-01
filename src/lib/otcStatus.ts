import type { DealStatus } from '@/api/types.ts';

/** `StatusEnum` from `POST /otc/deals`/`GET /otc/deals/{id}` — api-integration.md §7.6. */
export type OtcRealStatus =
  | 'INITIALIZED' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'ACCEPTED'
  | 'REQUOTE' | 'HOLD' | 'EXECUTED' | 'CANCELED' | 'ERROR';

/**
 * §7.6's own proposed status→UI mapping table — explicitly marked
 * "assumption, must be confirmed" (question B11) in the source doc, but
 * given as a concrete table to implement, not left open. A status this
 * doesn't recognize (a real 10th value, or a typo somewhere) renders
 * read-only rather than actionable — per the doc's own words: "an
 * unrecognised state that offers a button is how a client accepts something
 * nobody intended." Exhaustive over `OtcRealStatus`, so TypeScript forces
 * every future backend addition through here before it can compile.
 */
export function mapOtcStatus(status: OtcRealStatus): DealStatus {
  switch (status) {
    case 'INITIALIZED':
    case 'PENDING':
      return 'RATE_PENDING';
    case 'ACTIVE':
      return 'RATE_ACTIVE';
    case 'EXPIRED':
      return 'RATE_STALE';
    case 'ACCEPTED':
      return 'AWAITING_FUNDS';
    case 'REQUOTE':
      return 'RATE_RENEGOTIATING';
    case 'HOLD':
      return 'RUNNING';
    case 'EXECUTED':
      return 'DONE';
    case 'CANCELED':
    case 'ERROR':
      return 'DECLINED';
    default: {
      console.warn('[otc] Unrecognized status from backend, rendering read-only:', status);
      return 'DECLINED';
    }
  }
}
