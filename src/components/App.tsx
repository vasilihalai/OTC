import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import { useLaunchParams } from '@tma.js/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';

import { routes } from '@/navigation/routes.tsx';
import { Toast } from '@/components/Toast/Toast.tsx';
import { useSessionStore } from '@/store/session.ts';

// xRuby always renders dark, regardless of the user's Telegram theme.
function Entry() {
  const session = useSessionStore((s) => s.session);
  return <Navigate to={session ? '/profile' : '/login'} replace/>;
}

export function App() {
  const lp = useLaunchParams();

  return (
    <AppRoot
      appearance="dark"
      platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <HashRouter>
        <Routes>
          <Route path="/" element={<Entry/>}/>
          {routes.map((route) => <Route key={route.path} {...route} />)}
          <Route path="*" element={<Navigate to="/"/>}/>
        </Routes>
      </HashRouter>
      <Toast/>
    </AppRoot>
  );
}
