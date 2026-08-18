import { emitEvent, isTMA, mockTelegramEnv } from '@tma.js/sdk-react';

/**
 * True once `ensureTelegramEnvironment` has determined we're inside a real
 * Telegram client (as opposed to a plain browser running on the mocked
 * environment below). Read synchronously by AppHeader after bootstrap.
 */
export let isRealTelegram = false;

const THEME_PARAMS = {
  accent_text_color: '#3E9BFF',
  bg_color: '#0D0E10',
  button_color: '#FFFFFF',
  button_text_color: '#0D0E10',
  destructive_text_color: '#E5232E',
  header_bg_color: '#0D0E10',
  hint_color: '#9BA0A8',
  link_color: '#3E9BFF',
  secondary_bg_color: '#16181B',
  section_bg_color: '#0D0E10',
  section_header_text_color: '#3E9BFF',
  subtitle_text_color: '#9BA0A8',
  text_color: '#FFFFFF',
} as const;

const NO_INSETS = { left: 0, top: 0, bottom: 0, right: 0 } as const;

/**
 * Ensures the app has a usable Telegram environment. Inside real Telegram
 * this is a no-op; otherwise it mocks the WebApp bridge so the app also
 * runs standalone in a plain browser — including the deployed build, so
 * the live link is directly demoable without Telegram.
 */
export async function ensureTelegramEnvironment(): Promise<void> {
  isRealTelegram = await isTMA('complete');
  if (isRealTelegram) {
    return;
  }

  mockTelegramEnv({
    onEvent(e) {
      if (e.name === 'web_app_request_theme') {
        return emitEvent('theme_changed', { theme_params: THEME_PARAMS });
      }
      if (e.name === 'web_app_request_viewport') {
        return emitEvent('viewport_changed', {
          height: window.innerHeight,
          width: window.innerWidth,
          is_expanded: true,
          is_state_stable: true,
        });
      }
      if (e.name === 'web_app_request_content_safe_area') {
        return emitEvent('content_safe_area_changed', NO_INSETS);
      }
      if (e.name === 'web_app_request_safe_area') {
        return emitEvent('safe_area_changed', NO_INSETS);
      }
    },
    launchParams: new URLSearchParams([
      ['tgWebAppThemeParams', JSON.stringify(THEME_PARAMS)],
      ['tgWebAppData', new URLSearchParams([
        ['auth_date', (new Date().getTime() / 1000 | 0).toString()],
        ['hash', 'some-hash'],
        ['signature', 'some-signature'],
        ['user', JSON.stringify({ id: 1, first_name: 'Vladislav' })],
      ]).toString()],
      ['tgWebAppVersion', '8.4'],
      ['tgWebAppPlatform', 'tdesktop'],
    ]),
  });

  if (import.meta.env.DEV) {
    console.info(
      '⚠️ Running outside Telegram — the environment has been mocked so the app still works standalone.',
    );
  }
}
