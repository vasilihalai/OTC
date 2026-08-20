import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { TextField } from '@/components/TextField/TextField.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { Logo } from '@/components/Logo/Logo.tsx';
import { VerificationModal } from '@/screens/VerificationModal/VerificationModal.tsx';
import { MockSignInError, sendVerificationCode } from '@/api/index.ts';
import { isValidEmail } from '@/lib/validate.ts';
import { useModalStore } from '@/store/modal.ts';
import { notifyError } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './PasswordRecovery.css';

export function PasswordRecovery() {
  const navigate = useNavigate();
  const location = useLocation();
  const modalOpen = useModalStore((s) => s.isVerificationModalOpen);
  const openModal = useModalStore((s) => s.openVerificationModal);
  const closeModal = useModalStore((s) => s.closeVerificationModal);

  const prefill = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefill);
  const [emailError, setEmailError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const canSubmit = isValidEmail(email);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || loading) {
      return;
    }
    setEmailError(undefined);
    setLoading(true);
    try {
      await sendVerificationCode(email);
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

  function handleVerified() {
    closeModal();
    navigate('/reset-password', { state: { email }, replace: true });
  }

  return (
    <>
      <form className="password-recovery" onSubmit={(e) => void handleSubmit(e)}>
        <Logo/>
        <h1 className="password-recovery__title">{ru.recovery.title}</h1>
        <p className="password-recovery__body">{ru.recovery.body}</p>

        <TextField
          label={ru.recovery.emailLabel}
          type="email"
          inputMode="email"
          value={email}
          error={emailError}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" disabled={!canSubmit} loading={loading}>
          {ru.recovery.submitAction}
        </Button>
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
