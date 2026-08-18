import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';
import { TextField } from '@/components/TextField/TextField.tsx';
import { MockAuthError, requestCode, verifyCode } from '@/api/index.ts';
import { useSessionStore } from '@/store/session.ts';
import { useMainButton, notifyError, notifySuccess } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './Login.css';

type Step = 'email' | 'code';

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_INVALID: ru.login.errorEmailInvalid,
  CODE_INVALID: ru.login.errorCodeInvalid,
  RATE_LIMIT: ru.login.errorRateLimit,
};

export function Login() {
  const navigate = useNavigate();
  const existingSession = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingSession) {
      navigate('/profile', { replace: true });
    }
  }, [existingSession, navigate]);

  async function handleRequestCode() {
    setEmailError(undefined);
    setLoading(true);
    try {
      await requestCode(email);
      setStep('code');
    } catch (err) {
      if (err instanceof MockAuthError) {
        setEmailError(ERROR_MESSAGES[err.code]);
      }
      notifyError();
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    setCodeError(undefined);
    setLoading(true);
    try {
      const session = await verifyCode(email, code);
      notifySuccess();
      setSession(session);
    } catch (err) {
      if (err instanceof MockAuthError) {
        setCodeError(ERROR_MESSAGES[err.code]);
      }
      notifyError();
    } finally {
      setLoading(false);
    }
  }

  const isEmailStep = step === 'email';
  const canSubmit = isEmailStep ? email.trim().length > 0 : code.trim().length > 0;

  useMainButton({
    text: isEmailStep ? ru.login.requestCodeAction : ru.login.submitAction,
    onClick: () => void (isEmailStep ? handleRequestCode() : handleVerifyCode()),
    enabled: canSubmit,
    loading,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || !canSubmit) {
      return;
    }
    if (isEmailStep) {
      void handleRequestCode();
    } else {
      void handleVerifyCode();
    }
  }

  return (
    <Page back={false}>
      <form className="login" onSubmit={handleSubmit}>
        <div className="login__header">
          <div className="login__logo">xRuby</div>
          <h1 className="login__title">{ru.login.title}</h1>
          <p className="login__subtitle">{ru.login.subtitle}</p>
        </div>

        <h2 className="login__section-title">{ru.login.sectionTitle}</h2>

        <TextField
          label={ru.login.emailLabel}
          type="email"
          inputMode="email"
          value={email}
          error={emailError}
          disabled={!isEmailStep || loading}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          label={ru.login.codeLabel}
          type="text"
          inputMode="numeric"
          value={code}
          error={codeError}
          disabled={isEmailStep || loading}
          onChange={(e) => setCode(e.target.value)}
        />

        <p className="login__note">{ru.login.verificationNote}</p>
      </form>
    </Page>
  );
}
