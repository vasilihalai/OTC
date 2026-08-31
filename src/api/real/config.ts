import type { ClientType } from '@/api/types.ts';

export interface RealSessionConfig {
  baseUrl: string;
  miniAppClientId: string;
}

/**
 * Personal (FL) and business (UL) accounts authenticate against two
 * different backends (xruby.kg vs business.xruby.kg), each its own public
 * OAuth client on its own Mini App Service/auth-service deployment — so the
 * base URL and the Mini App's own clientId are both a function of
 * ClientType, not a constant. This split is a standing product decision,
 * confirmed explicitly and reconfirmed against v2.0 of
 * miniapp-auth-integration-spec.md — the spec document itself describes a
 * single-merchant architecture throughout (§0/§3) and never mentions this
 * split, since it's written from one merchant's point of view; xRuby just
 * happens to run two merchant registrations side by side, one per account
 * type, each independently conforming to the spec's contract (§7).
 */
const CONFIG: Record<ClientType, RealSessionConfig> = {
  FL: {
    baseUrl: import.meta.env.VITE_API_BASE_URL_PERSONAL ?? '',
    miniAppClientId: import.meta.env.VITE_MINI_APP_CLIENT_ID_PERSONAL ?? '',
  },
  UL: {
    baseUrl: import.meta.env.VITE_API_BASE_URL_BUSINESS ?? '',
    miniAppClientId: import.meta.env.VITE_MINI_APP_CLIENT_ID_BUSINESS ?? '',
  },
};

export function getRealSessionConfig(clientType: ClientType): RealSessionConfig {
  return CONFIG[clientType];
}
