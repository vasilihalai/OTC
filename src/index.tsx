// Include Telegram UI styles first to allow our code override the package CSS.
import '@telegram-apps/telegram-ui/dist/styles.css';

import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { retrieveLaunchParams } from '@tma.js/sdk-react';

import { Root } from '@/components/Root.tsx';
import { EnvUnsupported } from '@/components/EnvUnsupported.tsx';
import { init } from '@/init.ts';
import { ensureTelegramEnvironment } from '@/telegram/environment.ts';
import { USE_REAL_API } from '@/api/index.ts';
import { bootRealSession } from '@/store/session.ts';

import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

// No top-level await: some Telegram clients' embedded webview engines (notably
// older Telegram Desktop builds) fail to parse a module using it at all, which
// silently renders a blank screen instead of the app.
void (async () => {
  try {
    // Mocks the environment when running outside real Telegram (including in
    // production), so retrieveLaunchParams() below always has something to read.
    await ensureTelegramEnvironment();

    const launchParams = retrieveLaunchParams();
    const { tgWebAppPlatform: platform } = launchParams;
    const debug = (launchParams.tgWebAppStartParam || '').includes('debug')
      || import.meta.env.DEV;

    // Configure all application dependencies.
    await init({
      debug,
      eruda: debug && ['ios', 'android'].includes(platform),
      mockForMacOS: platform === 'macos',
    });

    // A no-op unless VITE_USE_REAL_API is on. Establishes a silent session
    // when a Telegram↔account binding already exists, or marks the store so
    // Shell can show the login screen (BINDING_REQUIRED) or an error state
    // (miniapp-auth-integration-spec.md §6) — never throws itself, so a
    // failure here isn't a reason to fall into the EnvUnsupported catch below.
    if (USE_REAL_API) {
      await bootRealSession();
    }

    root.render(
      <StrictMode>
        <Root/>
      </StrictMode>,
    );
  } catch {
    root.render(<EnvUnsupported/>);
  }
})();
