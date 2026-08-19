import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { KeyValueRow } from '@/components/KeyValueRow/KeyValueRow.tsx';
import { Badge } from '@/components/Badge/Badge.tsx';
import { StatusChip } from '@/components/StatusChip/StatusChip.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog.tsx';
import { Skeleton } from '@/components/Skeleton/Skeleton.tsx';
import { getUser } from '@/api/index.ts';
import type { User } from '@/api/index.ts';
import { useRequireSession, useSessionStore } from '@/store/session.ts';
import { useCopy } from '@/lib/useCopy.ts';
import { groupOf4 } from '@/lib/text.ts';
import { openExternalLink } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './Profile.css';

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4H4a1.5 1.5 0 0 0-1.5 1.5V12A1.5 1.5 0 0 0 4 13.5h6.5A1.5 1.5 0 0 0 12 12v-2M9 3h4v4M13 3L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AvatarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="10.5" r="4.5" stroke="#fff" strokeWidth="1.8"/>
      <path d="M5 23c1.6-4.6 5.4-7 9-7s7.4 2.4 9 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function CopyableRow({ label, value, display }: { label: string; value: string; display?: string }) {
  const copy = useCopy();
  return (
    <KeyValueRow
      label={label}
      value={(
        <span className="profile__row-value">
          <span className="profile__row-text">{display ?? value}</span>
          <button type="button" className="profile__copy" aria-label={ru.common.copyAction} onClick={() => copy(value)}>
            <CopyIcon/>
          </button>
        </span>
      )}
    />
  );
}

export function Profile() {
  const session = useRequireSession();
  const navigate = useNavigate();
  const clearSession = useSessionStore((s) => s.clearSession);
  const [user, setUser] = useState<User>();
  const [error, setError] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      return;
    }
    setError(false);
    setUser(undefined);
    try {
      setUser(await getUser(session.clientType));
    } catch {
      setError(true);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSignOut() {
    setSignOutOpen(false);
    clearSession();
    navigate('/login', { replace: true });
  }

  if (error) {
    return (
      <div className="profile">
        <Panel>
          <p className="profile__error">{ru.profile.errorTitle}</p>
          <Button variant="secondary" onClick={() => void load()}>{ru.profile.retryAction}</Button>
        </Panel>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile">
        <Panel>
          <div className="profile__identity">
            <Skeleton width={56} height={56} radius={28}/>
            <div className="profile__identity-info">
              <Skeleton width={140} height={20}/>
              <Skeleton width={90} height={22} radius={8}/>
            </div>
          </div>
        </Panel>
        <Panel surface="card">
          <Skeleton height={60} radius={8}/>
        </Panel>
      </div>
    );
  }

  const isLevel2 = user.verificationLevel === 2;
  const levelLabel = `${isLevel2 ? ru.profile.level2Label : ru.profile.level1Label} ✓`;

  return (
    <div className="profile">
      <Panel>
        <div className="profile__identity">
          <div className="profile__monogram" aria-hidden="true"><AvatarIcon/></div>
          <div className="profile__identity-info">
            <h2 className="profile__name">{user.clientName}</h2>
            <div className="profile__badges">
              <Badge>{user.clientType === 'UL' ? ru.profile.typeUl : ru.profile.typeFl}</Badge>
              <StatusChip tone="success">{levelLabel}</StatusChip>
            </div>
          </div>
        </div>

        <div className="profile__account-rows">
          <CopyableRow label={ru.profile.emailRow} value={user.email}/>
          <CopyableRow label={ru.profile.userIdRow} value={user.userId} display={groupOf4(user.userId)}/>
          <KeyValueRow
            label={ru.profile.verificationRow}
            value={<StatusChip tone="success">{levelLabel}</StatusChip>}
          />
        </div>
      </Panel>

      <Panel surface="card">
        <button type="button" className="profile__action" onClick={() => openExternalLink(user.webCabinetUrl)}>
          <span>{ru.profile.openCabinetAction}</span>
          <ExternalLinkIcon/>
        </button>
        <button type="button" className="profile__action profile__action--danger" onClick={() => setSignOutOpen(true)}>
          <span>{ru.profile.signOutAction}</span>
        </button>
      </Panel>

      <ConfirmDialog
        open={signOutOpen}
        title={ru.profile.signOutConfirmTitle}
        onConfirm={handleSignOut}
        onCancel={() => setSignOutOpen(false)}
      />
    </div>
  );
}
