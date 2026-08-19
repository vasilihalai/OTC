import type { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';

import { SignIn } from '@/screens/SignIn/SignIn.tsx';
import { PasswordRecovery } from '@/screens/PasswordRecovery/PasswordRecovery.tsx';
import { NewPassword } from '@/screens/NewPassword/NewPassword.tsx';
import { Home } from '@/screens/Home/Home.tsx';
import { Deals } from '@/screens/Deals/Deals.tsx';
import { DealDetail } from '@/screens/DealDetail/DealDetail.tsx';
import { WithdrawCrypto } from '@/screens/WithdrawCrypto/WithdrawCrypto.tsx';
import { WithdrawFiat } from '@/screens/WithdrawFiat/WithdrawFiat.tsx';
import { Profile } from '@/screens/Profile/Profile.tsx';
import { OtcUnavailable } from '@/screens/OtcUnavailable/OtcUnavailable.tsx';

export type HeaderVariant = 'close' | 'back' | 'home' | 'none';

export interface Route {
  path: string;
  Component: ComponentType;
  tabBar: boolean;
  headerVariant: HeaderVariant;
}

export const routes: Route[] = [
  { path: '/login', Component: () => <SignIn variant="business"/>, tabBar: false, headerVariant: 'close' },
  { path: '/login/personal', Component: () => <SignIn variant="personal"/>, tabBar: false, headerVariant: 'back' },
  { path: '/login/business', Component: () => <Navigate to="/login" replace/>, tabBar: false, headerVariant: 'none' },
  { path: '/forgot', Component: PasswordRecovery, tabBar: false, headerVariant: 'back' },
  { path: '/reset-password', Component: NewPassword, tabBar: false, headerVariant: 'back' },
  { path: '/otc-unavailable', Component: OtcUnavailable, tabBar: false, headerVariant: 'close' },
  { path: '/home', Component: Home, tabBar: true, headerVariant: 'home' },
  { path: '/deals', Component: Deals, tabBar: true, headerVariant: 'close' },
  { path: '/deals/:id', Component: DealDetail, tabBar: false, headerVariant: 'back' },
  { path: '/profile', Component: Profile, tabBar: true, headerVariant: 'home' },
  { path: '/withdraw/crypto', Component: WithdrawCrypto, tabBar: false, headerVariant: 'back' },
  { path: '/withdraw/fiat', Component: WithdrawFiat, tabBar: false, headerVariant: 'back' },
];
