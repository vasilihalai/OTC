import type { PropsWithChildren } from 'react';

// Back-button wiring is centralized in telegram/backButton.ts's useAppBackButton(),
// driven by each route's headerVariant in navigation/routes.tsx. This component is
// now just a passthrough, kept so the existing demo pages don't need touching.
export function Page({ children }: PropsWithChildren<{ back?: boolean }>) {
  return <>{children}</>;
}
