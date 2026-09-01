import type { OtcAccessReason, OtcAccessResult } from '@/api/types.ts';

/**
 * `GET /v1/otc/access` (api-integration.md §7.1) doesn't document its
 * `reasons` code vocabulary anywhere in the eight Swagger files — this maps
 * the ones that are guessable from their name to the app's existing
 * verification/not-eligible copy, and falls back to the generic "contact a
 * manager" state for anything unrecognized, per the doc's own instruction.
 * One place to extend once real codes are seen in practice.
 */
const KNOWN_REASONS: Record<string, OtcAccessReason> = {
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  KYC_REQUIRED: 'VERIFICATION_REQUIRED',
  NOT_VERIFIED: 'VERIFICATION_REQUIRED',
};

export function toOtcAccessReason(access: OtcAccessResult): OtcAccessReason {
  if (!access.enabled) {
    for (const reason of access.reasons) {
      const mapped = KNOWN_REASONS[reason];
      if (mapped) {
        return mapped;
      }
    }
    return 'NOT_ELIGIBLE';
  }
  if (!access.available) {
    return 'DESK_CLOSED';
  }
  return 'GRANTED';
}
