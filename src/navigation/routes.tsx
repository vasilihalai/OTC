import type { ComponentType } from 'react';

import { SignIn } from '@/screens/SignIn/SignIn.tsx';
import { PasswordRecovery } from '@/screens/PasswordRecovery/PasswordRecovery.tsx';
import { NewPassword } from '@/screens/NewPassword/NewPassword.tsx';
import { Home } from '@/screens/Home/Home.tsx';
import { Deals } from '@/screens/Deals/Deals.tsx';
import { DealDetail } from '@/screens/DealDetail/DealDetail.tsx';
import { WithdrawCrypto } from '@/screens/WithdrawCrypto/WithdrawCrypto.tsx';
import { WithdrawFiat } from '@/screens/WithdrawFiat/WithdrawFiat.tsx';
import { Profile } from '@/screens/Profile/Profile.tsx';
import { Stub } from '@/screens/Stub/Stub.tsx';

export type HeaderVariant = 'close' | 'back' | 'home' | 'none';

export interface Route {
  path: string;
  Component: ComponentType;
  tabBar: boolean;
  headerVariant: HeaderVariant;
}

export const routes: Route[] = [
  { path: '/login', Component: () => <SignIn variant="personal"/>, tabBar: false, headerVariant: 'close' },
  { path: '/login/business', Component: () => <SignIn variant="business"/>, tabBar: false, headerVariant: 'back' },
  { path: '/forgot', Component: PasswordRecovery, tabBar: false, headerVariant: 'back' },
  { path: '/reset-password', Component: NewPassword, tabBar: false, headerVariant: 'back' },
  { path: '/home', Component: Home, tabBar: true, headerVariant: 'home' },
  { path: '/deals', Component: Deals, tabBar: true, headerVariant: 'home' },
  { path: '/deals/:id', Component: DealDetail, tabBar: true, headerVariant: 'back' },
  { path: '/profile', Component: Profile, tabBar: true, headerVariant: 'home' },
  { path: '/withdraw/crypto', Component: WithdrawCrypto, tabBar: true, headerVariant: 'back' },
  { path: '/withdraw/fiat', Component: WithdrawFiat, tabBar: true, headerVariant: 'back' },
  {
    path: '/manage/addresses',
    Component: () => <Stub titlePrefix="Управление адресами" param="_"/>,
    tabBar: true,
    headerVariant: 'back',
  },
  {
    path: '/manage/requisites',
    Component: () => <Stub titlePrefix="Управление реквизитами" param="_"/>,
    tabBar: true,
    headerVariant: 'back',
  },
];
