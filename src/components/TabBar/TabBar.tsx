import { useLocation, useNavigate } from 'react-router-dom';

import { bem } from '@/css/bem.ts';
import { ru } from '@/i18n/ru.ts';
import { DealsIcon, HomeIcon, ProfileIcon } from '@/components/TabBar/icons.tsx';

import './TabBar.css';

const [b, e] = bem('tab-bar');

const TABS = [
  { path: '/home', label: ru.nav.home, Icon: HomeIcon },
  { path: '/deals', label: ru.nav.deals, Icon: DealsIcon },
  { path: '/profile', label: ru.nav.profile, Icon: ProfileIcon },
] as const;

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={b()}>
      {TABS.map(({ path, label, Icon }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            type="button"
            className={e('tab', { active })}
            onClick={() => navigate(path)}
          >
            <Icon/>
            <span className={e('label')}>{label}</span>
          </button>
        );
      })}
      <div className={e('indicator')} aria-hidden="true"/>
    </nav>
  );
}
