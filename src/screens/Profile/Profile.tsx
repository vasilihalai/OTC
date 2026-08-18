import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { KeyValueRow } from '@/components/KeyValueRow/KeyValueRow.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { getUser } from '@/api/index.ts';
import type { User, VerificationStatus } from '@/api/index.ts';
import { useRequireSession, useSessionStore } from '@/store/session.ts';
import { useToastStore } from '@/store/toast.ts';
import { copyToClipboard, notifySuccess, openExternalLink } from '@/telegram/adapter.ts';
import { formatInGroupsOf4 } from '@/lib/format.ts';
import { ru } from '@/i18n/ru.ts';

import './Profile.css';

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9 5V2.5a1 1 0 0 0-1-1H2.5a1 1 0 0 0-1 1V8a1 1 0 0 0 1 1H5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  KYB_PASSED: ru.profile.verificationPassedKyb,
  KYC_PASSED: ru.profile.verificationPassedKyc,
  NONE: ru.profile.verificationNone,
};

export function Profile() {
  const navigate = useNavigate();
  const session = useRequireSession();
  const clearSession = useSessionStore((s) => s.clearSession);
  const showToast = useToastStore((s) => s.show);

  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError(false);
    try {
      setUser(await getUser(session.clientType));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSignOut() {
    clearSession();
    navigate('/login', { replace: true });
  }

  async function handleCopyUserId() {
    if (!user) {
      return;
    }
    await copyToClipboard(user.userId);
    notifySuccess();
    showToast(ru.profile.copiedToast);
  }

  const nameLabel = session?.clientType === 'UL' ? ru.profile.companyRow : ru.profile.nameRow;
  const typeBadge = user && (user.clientType === 'UL' ? ru.profile.typeUl : ru.profile.typeFl);

  return (
    <div className="profile">
      {error ? (
        <div className="profile__error">
          <p>{ru.profile.errorTitle}</p>
          <Button variant="social" onClick={() => void load()}>{ru.profile.retryAction}</Button>
        </div>
      ) : (
        <Panel>
          <KeyValueRow
            label={nameLabel}
            loading={loading}
            value={user && `${user.clientName} · ${typeBadge}`}
          />
          <KeyValueRow
            label={ru.profile.verificationRow}
            loading={loading}
            value={user && VERIFICATION_LABEL[user.verification]}
          />
          <KeyValueRow label={ru.profile.emailRow} loading={loading} value={user?.email}/>
          <KeyValueRow
            label={ru.profile.userIdRow}
            loading={loading}
            value={user && (
              <span className="profile__id-value">
                {formatInGroupsOf4(user.userId)}
                <CopyIcon/>
              </span>
            )}
            onClick={user ? () => void handleCopyUserId() : undefined}
          />
        </Panel>
      )}

      <div className="profile__actions">
        <Button variant="footer-link" disabled={!user} onClick={() => user && openExternalLink(user.webCabinetUrl)}>
          {ru.profile.openCabinetAction}
        </Button>
        <Button variant="footer-link" onClick={handleSignOut}>
          {ru.profile.signOutAction}
        </Button>
      </div>
    </div>
  );
}
