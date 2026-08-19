import { copyTextToClipboard, hapticFeedback, miniApp, openLink } from '@tma.js/sdk-react';

import { isRealTelegram } from '@/telegram/environment.ts';

// Keep in sync with theme/tokens.css.
const DARK_PALETTE = {
  bg: '#0D0E10',
  headerBg: '#0D0E10',
  bottomBarBg: '#0D0E10',
} as const;

/** xRuby always renders dark, regardless of the user's Telegram theme. */
export function applyDarkTheme(): void {
  miniApp.setBgColor.ifAvailable(DARK_PALETTE.bg);
  miniApp.setHeaderColor.ifAvailable(DARK_PALETTE.headerBg);
  miniApp.setBottomBarColor.ifAvailable(DARK_PALETTE.bottomBarBg);
}

export function notifySuccess(): void {
  hapticFeedback.notificationOccurred.ifAvailable('success');
}

export function notifyError(): void {
  hapticFeedback.notificationOccurred.ifAvailable('error');
}

export function openExternalLink(url: string): void {
  // Outside real Telegram, ensureTelegramEnvironment() mocks the bridge so
  // openLink.ifAvailable() reports "available" without actually opening
  // anything — go straight to window.open there instead of no-op'ing.
  if (isRealTelegram) {
    try {
      const result = openLink.ifAvailable(url);
      if (result.ok) {
        return;
      }
    } catch {
      // fall through to window.open
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await copyTextToClipboard(text);
  } catch {
    await navigator.clipboard.writeText(text);
  }
}
