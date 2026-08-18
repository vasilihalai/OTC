import { retrieveRawInitData } from '@tma.js/sdk-react';

import { apiFetch } from '@/api/http.ts';

/**
 * Sends raw Telegram initData to the backend for signature + auth_date
 * validation and Telegram-account binding, per mini-app-v1.md §4.
 * Assumed endpoint — reconcile against Swagger once available.
 *
 * `VITE_SKIP_INITDATA=true` skips the call while keeping this in the normal
 * bootstrap path, so enabling validation later is a one-line config change.
 */
export async function verifyInitData(): Promise<void> {
  if (import.meta.env.VITE_SKIP_INITDATA === 'true') {
    return;
  }

  const initDataRaw = retrieveRawInitData();
  if (!initDataRaw) {
    return;
  }

  await apiFetch<void>('/auth/telegram/verify', {
    method: 'POST',
    body: JSON.stringify({ initData: initDataRaw }),
  });
}
