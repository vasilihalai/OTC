import { retrieveRawInitData } from '@tma.js/sdk-react';

/**
 * Raw `initData` string, read fresh from the Telegram SDK every call — never
 * cache/reuse a previously-read value. Its signature carries a 300s TTL
 * (miniapp-auth-integration-spec.md §5), and the gap between reading it once
 * at launch and using it again after a user types an email/password/OTP can
 * easily exceed that, so `session.confirm` re-reads this immediately before
 * the call rather than reusing the string `session.start` read at boot.
 */
export function getFreshInitData(): string | undefined {
  return retrieveRawInitData();
}
