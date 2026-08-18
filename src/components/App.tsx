import { HashRouter, matchPath, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useLaunchParams } from '@tma.js/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';

import { routes } from '@/navigation/routes.tsx';
import { Toast } from '@/components/Toast/Toast.tsx';
import { AppHeader } from '@/components/AppHeader/AppHeader.tsx';
import { TabBar } from '@/components/TabBar/TabBar.tsx';
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

  const matched = routes.find((r) => matchPath(r.path, location.pathname));
  const headerVariant = matched?.headerVariant ?? 'none';
  const showTabBar = matched?.tabBar ?? false;

  return (
    <>
      <AppHeader variant={headerVariant} onBack={goBack}/>
      <main className="app-content">
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
    </>
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
