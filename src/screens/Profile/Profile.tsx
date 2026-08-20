import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { SettingRow } from '@/components/SettingRow/SettingRow.tsx';
import { PickerModal } from '@/components/PickerModal/PickerModal.tsx';
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog.tsx';
import { Skeleton } from '@/components/Skeleton/Skeleton.tsx';
import { getUser } from '@/api/index.ts';
import type { User } from '@/api/index.ts';
import { useRequireSession, useSessionStore } from '@/store/session.ts';
import { useSettingsStore } from '@/store/settings.ts';
import { useCopy } from '@/lib/useCopy.ts';
import { groupOf4 } from '@/lib/text.ts';
import { maskEmail } from '@/lib/mask.ts';
import { SAMPLE_DOCUMENT_URL } from '@/lib/sampleDocument.ts';
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

function VerifiedIcon() {
  return (
    <span className="profile__verified-icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

function GlobeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.3 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.3-3.8-8.5S9.5 5.8 12 3.5z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FaqIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9.6 9.3a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1 .8-1 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="16.3" r="0.9" fill="currentColor"/>
    </svg>
  );
}

function AboutIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="12" cy="7.8" r="1" fill="currentColor"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9M14 16l4-4-4-4M18 12H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const LANGUAGE_OPTIONS = [
  { value: 'ru' as const, label: ru.profile.languageRu },
  { value: 'en' as const, label: ru.profile.languageEn },
  { value: 'ky' as const, label: ru.profile.languageKy },
];

const THEME_OPTIONS = [
  { value: 'dark' as const, label: ru.profile.themeDark },
  { value: 'light' as const, label: ru.profile.themeLight },
];

function DetailRow({ label, value, display, copyValue }: { label: string; value: string; display?: string; copyValue?: string }) {
  const copy = useCopy();
  return (
    <div className="profile__detail-row">
      <span className="profile__detail-label">{label}</span>
      <span className="profile__detail-value">
        <span className="profile__detail-text">{display ?? value}</span>
        {copyValue && (
          <button type="button" className="profile__copy" aria-label={ru.common.copyAction} onClick={() => copy(copyValue)}>
            <CopyIcon/>
          </button>
        )}
      </span>
    </div>
  );
}

export function Profile() {
  const session = useRequireSession();
  const navigate = useNavigate();
  const clearSession = useSessionStore((s) => s.clearSession);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [user, setUser] = useState<User>();
  const [error, setError] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

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

  function handleCertificate() {
    openExternalLink(SAMPLE_DOCUMENT_URL);
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
        <div className="profile__panel1">
          <Skeleton width={160} height={24}/>
          <div className="profile__details-card">
            <Skeleton height={120} radius={8}/>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile__panel1">
        <div className="profile__title-row">
          <h1 className="profile__name">{user.clientName}</h1>
          {user.verified && (
            <span className="profile__verified-badge">
              <VerifiedIcon/>
              {ru.profile.verifiedBadge}
            </span>
          )}
        </div>

        <div className="profile__details-card">
          <DetailRow label={ru.profile.emailRow} value={user.email} display={maskEmail(user.email)} copyValue={user.email}/>
          <DetailRow label={ru.profile.userIdRow} value={user.userId} display={groupOf4(user.userId)} copyValue={user.userId}/>
          <DetailRow label={ru.profile.phoneRow} value={user.phone}/>
        </div>

        <Button variant="secondary" size="compact" onClick={handleCertificate}>
          {ru.profile.certificateAction}
        </Button>
      </div>

      <div className="profile__panel2">
        <SettingRow
          icon={<GlobeIcon/>}
          label={ru.profile.languageRow}
          value={LANGUAGE_OPTIONS.find((o) => o.value === language)?.label}
          onClick={() => setLanguageModalOpen(true)}
        />
        <SettingRow
          icon={<ThemeIcon/>}
          label={ru.profile.themeRow}
          value={THEME_OPTIONS.find((o) => o.value === theme)?.label}
          onClick={() => setThemeModalOpen(true)}
        />
        <div className="profile__divider"/>
        <SettingRow icon={<FaqIcon/>} label={ru.profile.faqRow} onClick={() => openExternalLink(user.faqUrl)}/>
        <SettingRow icon={<AboutIcon/>} label={ru.profile.aboutRow} onClick={() => openExternalLink(user.aboutUrl)}/>
        <div className="profile__spacer"/>
        <SettingRow icon={<LogoutIcon/>} label={ru.profile.signOutAction} danger onClick={() => setSignOutOpen(true)}/>
      </div>

      <ConfirmDialog
        open={signOutOpen}
        title={ru.profile.signOutConfirmTitle}
        onConfirm={handleSignOut}
        onCancel={() => setSignOutOpen(false)}
      />

      <PickerModal
        open={languageModalOpen}
        title={ru.profile.languageModalTitle}
        options={LANGUAGE_OPTIONS}
        value={language}
        onSelect={setLanguage}
        onClose={() => setLanguageModalOpen(false)}
      />
      <PickerModal
        open={themeModalOpen}
        title={ru.profile.themeModalTitle}
        options={THEME_OPTIONS}
        value={theme}
        onSelect={setTheme}
        onClose={() => setThemeModalOpen(false)}
      />
    </div>
  );
}
