import type { ClientType } from '@/api/types.ts';

export interface RealSessionConfig {
  baseUrl: string;
  miniAppClientId: string;
}

/**
 * Personal (FL) and business (UL) accounts authenticate against two
 * different backends (xruby.kg vs business.xruby.kg) — per
 * miniapp-auth-integration-spec.md §3.1, each side is its own public OAuth
 * client on its own auth-service deployment, so the base URL and the Mini
 * App's own clientId are both a function of ClientType, not a constant.
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
