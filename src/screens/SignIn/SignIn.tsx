import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { TextField } from '@/components/TextField/TextField.tsx';
import { PasswordField } from '@/components/PasswordField/PasswordField.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { VerificationModal } from '@/screens/VerificationModal/VerificationModal.tsx';
import { MockSignInError, completeSignIn, sendVerificationCode, signInSocial } from '@/api/index.ts';
import type { ClientType } from '@/api/index.ts';
import { useSessionStore } from '@/store/session.ts';
import { useModalStore } from '@/store/modal.ts';
import { notifyError } from '@/telegram/adapter.ts';
import { AppleIcon, GoogleIcon } from '@/components/SocialIcons/SocialIcons.tsx';
import { ru } from '@/i18n/ru.ts';

import './SignIn.css';

export interface SignInProps {
  variant: 'personal' | 'business';
}

const CLIENT_TYPE: Record<SignInProps['variant'], ClientType> = {
  personal: 'FL',
  business: 'UL',
};

export function SignIn({ variant }: SignInProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useSessionStore((s) => s.setSession);
  const modalOpen = useModalStore((s) => s.isVerificationModalOpen);
  const openModal = useModalStore((s) => s.openVerificationModal);
  const closeModal = useModalStore((s) => s.closeVerificationModal);

  const prefill = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefill);
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple'>();

  const clientType = CLIENT_TYPE[variant];
  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || loading) {
      return;
    }
    setEmailError(undefined);
    setLoading(true);
    try {
      await sendVerificationCode(email, password);
      openModal();
    } catch (err) {
      if (err instanceof MockSignInError) {
        setEmailError(ru.signIn.errorEmailInvalid);
      }
      notifyError();
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider: 'google' | 'apple') {
    setSocialLoading(provider);
    try {
      const session = await signInSocial(provider, clientType);
      setSession(session);
      navigate('/home', { replace: true });
    } finally {
      setSocialLoading(undefined);
    }
  }

  function handleVerified() {
    closeModal();
    setSession(completeSignIn(email, clientType));
    navigate('/home', { replace: true });
  }

  return (
    <>
      <form className="sign-in" onSubmit={(e) => void handleSubmit(e)}>
        <div className="sign-in__logo">xRuby</div>
        <h1 className="sign-in__title">
          {variant === 'personal' ? ru.signIn.titlePersonal : ru.signIn.titleBusiness}
        </h1>

        <TextField
          label={ru.signIn.emailLabel}
          placeholder={ru.signIn.emailPlaceholder}
          type="email"
          inputMode="email"
          value={email}
          error={emailError}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label={ru.signIn.passwordLabel}
          placeholder={ru.signIn.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="button"
          className="sign-in__forgot"
          onClick={() => navigate('/forgot', { state: { email } })}
        >
          {ru.signIn.forgotPassword}
        </button>

        <Button type="submit" disabled={!canSubmit} loading={loading}>
          {ru.signIn.submitAction}
        </Button>

        <div className="sign-in__social">
          <Button
            type="button"
            variant="social"
            icon={<GoogleIcon/>}
            loading={socialLoading === 'google'}
            disabled={!!socialLoading}
            onClick={() => void handleSocial('google')}
          >
            {ru.signIn.googleAction}
          </Button>
          <Button
            type="button"
            variant="social"
            icon={<AppleIcon/>}
            loading={socialLoading === 'apple'}
            disabled={!!socialLoading}
            onClick={() => void handleSocial('apple')}
          >
            {ru.signIn.appleAction}
          </Button>
        </div>

        {variant === 'personal' ? (
          <Button
            type="button"
            variant="footer-link"
            className="sign-in__business-link"
            icon="🏢"
            onClick={() => navigate('/login/business')}
          >
            {ru.signIn.businessAccountLink}
          </Button>
        ) : (
          <Button
            type="button"
            variant="footer-link"
            className="sign-in__business-link"
            icon="👤"
            onClick={() => navigate('/login')}
          >
            {ru.signIn.personalAccountLink}
          </Button>
        )}
      </form>

      <VerificationModal
        open={modalOpen}
        email={email}
        onClose={closeModal}
        onVerified={handleVerified}
      />
    </>
  );
}
