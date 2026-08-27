import type { OtcAccessReason } from '@/api/index.ts';

/** Reads a `?key=` param from the hash query string, e.g. `#/home?otc=verification`. */
export function readHashParam(name: string): string | null {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) {
    return null;
  }
  return new URLSearchParams(hash.slice(queryIndex + 1)).get(name);
}

/** Dev-only override so both OTC-unavailable reasons are reachable without editing fixtures. */
export function otcAccessOverride(): OtcAccessReason | undefined {
  const value = readHashParam('otc');
  if (value === 'verification') {
    return 'VERIFICATION_REQUIRED';
  }
  if (value === 'not_eligible') {
    return 'NOT_ELIGIBLE';
  }
  if (value === 'granted') {
    return 'GRANTED';
  }
  return undefined;
}

/** `?scenario=quote_expiring` — the RATE_ACTIVE deal's quote countdown starts at ~10s instead of 5 minutes. */
export function isQuoteExpiringScenario(): boolean {
  return readHashParam('scenario') === 'quote_expiring';
}

/** `?scenario=empty_deals` — deals list loads empty, for the empty-state screens. */
export function isEmptyDealsScenario(): boolean {
  return readHashParam('scenario') === 'empty_deals';
}

/** `?addressMode=manual` — forces WithdrawCrypto's address field to manual-entry-only, as if the merchant had that setting on, regardless of saved addresses. */
export function addressEntryModeOverride(): 'dropdown' | 'manual' | undefined {
  const value = readHashParam('addressMode');
  return value === 'manual' || value === 'dropdown' ? value : undefined;
}
