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
            value={user && formatInGroupsOf4(user.userId)}
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

      <Button variant="link" className="profile__demo-link" onClick={() => navigate('/demo')}>
        {ru.profile.demoLink}
      </Button>

      <p className="profile__footer">
        {ru.profile.lastUpdateLabel} {__LAST_COMMIT_DATE__} · {__LAST_COMMIT_HASH__}
      </p>
    </div>
  );
}
