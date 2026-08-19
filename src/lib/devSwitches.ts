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
