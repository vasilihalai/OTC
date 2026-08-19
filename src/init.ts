import {
  setDebug,
  themeParams,
  initData,
  viewport,
  swipeBehavior,
  init as initSDK,
  mockTelegramEnv,
  type ThemeParamsState,
  retrieveLaunchParams,
  emitEvent,
  miniApp,
  backButton,
} from '@tma.js/sdk-react';

import { applyDarkTheme } from '@/telegram/adapter.ts';

/**
 * Initializes the application and configures its dependencies.
 */
export async function init(options: {
  debug: boolean;
  eruda: boolean;
  mockForMacOS: boolean;
}): Promise<void> {
  // Set @telegram-apps/sdk-react debug mode and initialize it.
  setDebug(options.debug);
  initSDK();

  // Add Eruda if needed.
  options.eruda && void import('eruda').then(({ default: eruda }) => {
    eruda.init();
    eruda.position({ x: window.innerWidth - 50, y: 0 });
  });

  // Telegram for macOS has a ton of bugs, including cases, when the client doesn't
  // even response to the "web_app_request_theme" method. It also generates an incorrect
  // event for the "web_app_request_safe_area" method.
  if (options.mockForMacOS) {
    let firstThemeSent = false;
    mockTelegramEnv({
      onEvent(event, next) {
        if (event.name === 'web_app_request_theme') {
          let tp: ThemeParamsState = {};
          if (firstThemeSent) {
            tp = themeParams.state();
          } else {
            firstThemeSent = true;
            tp ||= retrieveLaunchParams().tgWebAppThemeParams;
          }
          return emitEvent('theme_changed', { theme_params: tp });
        }

        if (event.name === 'web_app_request_safe_area') {
          return emitEvent('safe_area_changed', { left: 0, top: 0, right: 0, bottom: 0 });
        }

        // Some macOS Telegram Desktop builds also never answer this one,
        // which would otherwise leave viewport.mount() pending forever
        // below and the app stuck blank — belt-and-suspenders alongside
        // the timeout guard on that call.
        if (event.name === 'web_app_request_viewport') {
          return emitEvent('viewport_changed', {
            height: window.innerHeight,
            width: window.innerWidth,
            is_expanded: true,
            is_state_stable: true,
          });
        }

        next();
      },
    });
  }

  // Mount all components used in the project.
  backButton.mount.ifAvailable();
  initData.restore();

  if (miniApp.mount.isAvailable()) {
    themeParams.mount();
    miniApp.mount();
    themeParams.bindCssVars();
    applyDarkTheme();
  }

  if (viewport.mount.isAvailable()) {
    // Some Telegram clients (macOS Desktop has a history of this) never
    // answer the viewport request the SDK waits on, which would otherwise
    // leave this awaited forever and the whole app stuck blank. A timeout
    // lets the app render in a degraded (unbound safe-area vars) state
    // instead of never rendering at all.
    const mounted = await Promise.race([
      viewport.mount().then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2500)),
    ]);

    if (mounted) {
      viewport.bindCssVars();
      viewport.expand.ifAvailable();

      // Bot API 8.0+ only; .ifAvailable() no-ops cleanly on older clients
      // (Desktop/Web) instead of throwing, so this never needs a manual
      // version check. Only ever called here, once, on initial mount.
      const fullscreenRequest = viewport.requestFullscreen.ifAvailable();
      if (fullscreenRequest.ok) {
        fullscreenRequest.data.catch((err: unknown) => {
          // e.g. UNSUPPORTED on Desktop/Web, ALREADY_FULLSCREEN — normal mode stays active.
          console.warn('Fullscreen request failed, staying in normal mode:', err);
        });
      }

      swipeBehavior.mount.ifAvailable();
      swipeBehavior.disableVertical.ifAvailable();
    } else {
      console.warn('viewport.mount() timed out — rendering without full viewport binding.');
    }
  }

  // Keeps a CSS hook (body.is-fullscreen) in sync with the SDK's reactive
  // fullscreen state, for layout rules that can't be expressed with the
  // safe-area CSS vars alone.
  viewport.isFullscreen.sub((isFullscreen) => {
    document.body.classList.toggle('is-fullscreen', isFullscreen);
  });
  document.body.classList.toggle('is-fullscreen', viewport.isFullscreen());
}