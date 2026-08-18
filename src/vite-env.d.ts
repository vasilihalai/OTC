/// <reference types="vite/client" />

// Injected by vite.config.ts's `define` from the last git commit at build time.
declare const __LAST_COMMIT_DATE__: string;
declare const __LAST_COMMIT_HASH__: string;

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_REAL_API?: string;
  readonly VITE_SKIP_INITDATA?: string;
  readonly VITE_FORCE_INAPP_HEADER?: string;
}
