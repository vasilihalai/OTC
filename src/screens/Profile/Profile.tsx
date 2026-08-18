import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';
import { Card } from '@/components/Card/Card.tsx';
import { Row } from '@/components/Row/Row.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { getProfile, type Profile as ProfileData, type VerificationStatus } from '@/api/index.ts';
import { useSessionStore } from '@/store/session.ts';
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
  const session = useSessionStore((s) => s.session);
  const clearSession = useSessionStore((s) => s.clearSession);
  const showToast = useToastStore((s) => s.show);

  const [profile, setProfile] = useState<ProfileData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setProfile(await getProfile());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }
    void load();
  }, [session, navigate, load]);

  function handleSignOut() {
    clearSession();
    navigate('/login', { replace: true });
  }

  async function handleCopyUserId() {
    if (!profile) {
      return;
    }
    await copyToClipboard(profile.userId);
    notifySuccess();
    showToast(ru.profile.copiedToast);
  }

  if (!session) {
    return null;
  }

  return (
    <Page back={false}>
      <div className="profile">
        {error ? (
          <div className="profile__error">
            <p>{ru.profile.errorTitle}</p>
            <Button variant="secondary" onClick={() => void load()}>{ru.profile.retryAction}</Button>
          </div>
        ) : (
          <Card>
            <Row
              label={ru.profile.companyRow}
              loading={loading}
              value={profile && `${profile.clientName} · ${profile.clientType === 'UL' ? ru.profile.typeUl : ru.profile.typeFl}`}
            />
            <Row
              label={ru.profile.verificationRow}
              loading={loading}
              value={profile && VERIFICATION_LABEL[profile.verification]}
            />
            <Row label={ru.profile.emailRow} loading={loading} value={profile?.email} />
            <Row
              label={ru.profile.userIdRow}
              loading={loading}
              value={profile && formatInGroupsOf4(profile.userId)}
              onClick={profile ? () => void handleCopyUserId() : undefined}
            />
          </Card>
        )}

        <div className="profile__actions">
          <Button variant="secondary" onClick={() => profile && openExternalLink(profile.webCabinetUrl)} disabled={!profile}>
            {ru.profile.openCabinetAction}
          </Button>
          <Button variant="secondary" onClick={handleSignOut}>
            {ru.profile.signOutAction}
          </Button>
        </div>

        <Button variant="ghost" onClick={() => navigate('/demo')}>
          {ru.profile.demoLink}
        </Button>
      </div>
    </Page>
  );
}
