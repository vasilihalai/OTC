import { HashRouter, matchPath, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useLaunchParams } from '@tma.js/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';

import { routes } from '@/navigation/routes.tsx';
import { Toast } from '@/components/Toast/Toast.tsx';
import { AppHeader } from '@/components/AppHeader/AppHeader.tsx';
import { TabBar } from '@/components/TabBar/TabBar.tsx';
import { TransferModal } from '@/components/TransferModal/TransferModal.tsx';
import { AuthError } from '@/screens/AuthError/AuthError.tsx';
import { useSessionStore } from '@/store/session.ts';
import { useAppBackButton, useGoBack } from '@/telegram/backButton.ts';

function Entry() {
  const session = useSessionStore((s) => s.session);
  return <Navigate to={session ? '/home' : '/login'} replace/>;
}

function Shell() {
  const location = useLocation();
  const goBack = useGoBack();
  useAppBackButton();
  const authStatus = useSessionStore((s) => s.authStatus);
  const authError = useSessionStore((s) => s.authError);

  const matched = routes.find((r) => matchPath(r.path, location.pathname));
  const headerVariant = matched?.headerVariant ?? 'none';
  const showTabBar = matched?.tabBar ?? false;

  // Real-mode only (§6) — a terminal sessionStart failure (invalid initData,
  // Mini App disabled, a Telegram identity already bound elsewhere) blocks
  // the whole app rather than letting routing proceed into a screen with no
  // usable session. BINDING_REQUIRED is not handled here: it's not an
  // error, existing Entry/useRequireSession already routes to /login for it.
  if (authStatus === 'error' && authError) {
    return <AuthError code={authError}/>;
  }

  return (
    <div className="app-shell">
      <AppHeader variant={headerVariant} onBack={goBack}/>
      <main className={showTabBar ? 'app-content app-content--with-tab-bar' : 'app-content'}>
        <div key={location.pathname} className="app-content__page">
          <Routes>
            <Route path="/" element={<Entry/>}/>
            {routes.map((route) => <Route key={route.path} {...route} />)}
            <Route path="*" element={<Navigate to="/"/>}/>
          </Routes>
        </div>
      </main>
      {showTabBar && <TabBar/>}
      <Toast/>
      <TransferModal/>
    </div>
  );
}

// xRuby always renders dark, regardless of the user's Telegram theme.
export function App() {
  const lp = useLaunchParams();

  return (
    <AppRoot
      appearance="dark"
      platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <HashRouter>
        <Shell/>
      </HashRouter>
    </AppRoot>
  );
}
