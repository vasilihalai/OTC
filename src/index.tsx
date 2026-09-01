// Include Telegram UI styles first to allow our code override the package CSS.
import '@telegram-apps/telegram-ui/dist/styles.css';

import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { retrieveLaunchParams } from '@tma.js/sdk-react';

import { Root } from '@/components/Root.tsx';
import { EnvUnsupported } from '@/components/EnvUnsupported.tsx';
import { init } from '@/init.ts';
import { ensureTelegramEnvironment } from '@/telegram/environment.ts';
import { USE_REAL_API, exchangeSocialCode } from '@/api/index.ts';
import { hydrateTokensFromStorage } from '@/api/real/http/tokenStore.ts';
import { useSessionStore } from '@/store/session.ts';
import type { ClientType } from '@/api/types.ts';

import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

async function tryCompleteSocialSignIn(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const clientType = params.get('ct') as ClientType | null;
  if (!code || !state || !clientType) {
    return;
  }
  try {
    const result = await exchangeSocialCode(code, state);
    useSessionStore.getState().setSession({ email: result.email, clientType });
  } catch {
    // Provider/exchange failure — the user still has email+password (§2.2).
  } finally {
    // Strip the OAuth params either way so a refresh doesn't re-run this.
    const clean = new URL(window.location.href);
    clean.search = '';
    window.history.replaceState(null, '', clean.toString());
  }
}

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

    // Restores whatever access/refresh token survived a relaunch
    // (api-integration.md §1.4) into `tokenStore`'s in-memory cache and
    // arms its proactive-refresh timer. Synchronous, no network round trip —
    // unlike the old Telegram-binding flow, sign-in here is always an
    // explicit email+password+OTP form, never a silent boot-time call, so
    // there's nothing to await before rendering.
    if (USE_REAL_API) {
      hydrateTokensFromStorage();
      // Best-effort completion of Google/Apple sign-in (§2.2, question B3) —
      // only relevant if this relaunch happens to carry the OAuth
      // provider's redirect params; on every other boot this is a no-op
      // `URLSearchParams` read, not a network call.
      await tryCompleteSocialSignIn();
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
