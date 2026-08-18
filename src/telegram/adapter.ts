import { useEffect, useRef } from 'react';
import { copyTextToClipboard, hapticFeedback, mainButton, miniApp, openLink } from '@tma.js/sdk-react';

// Keep in sync with the palette in src/index.css.
const DARK_PALETTE = {
  bg: '#0f1115',
  headerBg: '#0f1115',
  bottomBarBg: '#0f1115',
} as const;

/** xRuby always renders dark, regardless of the user's Telegram theme. */
export function applyDarkTheme(): void {
  miniApp.setBgColor.ifAvailable(DARK_PALETTE.bg);
  miniApp.setHeaderColor.ifAvailable(DARK_PALETTE.headerBg);
  miniApp.setBottomBarColor.ifAvailable(DARK_PALETTE.bottomBarBg);
}

interface UseMainButtonOptions {
  text: string;
  onClick: () => void;
  enabled?: boolean;
  loading?: boolean;
  visible?: boolean;
}

/**
 * Binds a screen's primary action to the Telegram MainButton so it never
 * needs to be duplicated as an in-page button.
 */
export function useMainButton({
  text,
  onClick,
  enabled = true,
  loading = false,
  visible = true,
}: UseMainButtonOptions): void {
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    mainButton.mount.ifAvailable();
    const clickResult = mainButton.onClick.ifAvailable(() => onClickRef.current());
    const unsubscribe = clickResult.ok ? clickResult.data : undefined;

    return () => {
      unsubscribe?.();
      mainButton.hide.ifAvailable();
    };
  }, []);

  useEffect(() => {
    mainButton.setParams.ifAvailable({
      text,
      isVisible: visible,
      isEnabled: enabled && !loading,
      isLoaderVisible: loading,
    });
  }, [text, visible, enabled, loading]);
}

export function notifySuccess(): void {
  hapticFeedback.notificationOccurred.ifAvailable('success');
}

export function notifyError(): void {
  hapticFeedback.notificationOccurred.ifAvailable('error');
}

export function openExternalLink(url: string): void {
  const result = openLink.ifAvailable(url);
  if (!result.ok) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await copyTextToClipboard(text);
  } catch {
    await navigator.clipboard.writeText(text);
  }
}
