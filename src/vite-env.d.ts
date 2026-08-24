/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_BASE_URL_PERSONAL?: string;
  readonly VITE_API_BASE_URL_BUSINESS?: string;
  readonly VITE_MINI_APP_CLIENT_ID_PERSONAL?: string;
  readonly VITE_MINI_APP_CLIENT_ID_BUSINESS?: string;
  readonly VITE_USE_REAL_API?: string;
  readonly VITE_FORCE_INAPP_HEADER?: string;
}
