import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { BlockingState } from '@/components/BlockingState/BlockingState.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { getUser } from '@/api/index.ts';
import type { OtcAccessReason, User } from '@/api/index.ts';
import { useSessionStore } from '@/store/session.ts';
import { openExternalLink } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

export function OtcUnavailable() {
  const session = useSessionStore((s) => s.session);
  // The gate that redirected here already knows the reason — carrying it via
  // location.state avoids losing a `?otc=` dev override once the URL has
  // changed to this screen. Still fetches the user for the action's URLs.
  const locationReason = (useLocation().state as { otcAccess?: OtcAccessReason } | null)?.otcAccess;
  const [user, setUser] = useState<User>();

  useEffect(() => {
    if (session) {
      void getUser(session.clientType).then(setUser);
    }
  }, [session]);

  if (!user) {
    return null;
  }

  const isVerification = (locationReason ?? user.otcAccess) === 'VERIFICATION_REQUIRED';

  return (
    <BlockingState
      logo={<span style={{ color: 'var(--brand-red)', fontWeight: 700, fontSize: 20 }}>xRuby</span>}
      title={isVerification ? ru.otcUnavailable.verificationTitle : ru.otcUnavailable.notEligibleTitle}
      body={isVerification ? ru.otcUnavailable.verificationBody : ru.otcUnavailable.notEligibleBody}
      caption={isVerification ? ru.otcUnavailable.verificationCaption : undefined}
      action={(
        <Button
          variant="accent"
          onClick={() => openExternalLink(isVerification ? user.webCabinetUrl : user.supportUrl)}
        >
          {isVerification ? ru.otcUnavailable.verificationAction : ru.otcUnavailable.notEligibleAction}
        </Button>
      )}
    />
  );
}
