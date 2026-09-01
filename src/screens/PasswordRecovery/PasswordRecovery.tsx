import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { TextField } from '@/components/TextField/TextField.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { Logo } from '@/components/Logo/Logo.tsx';
import { OtpConfirmModal } from '@/screens/OtpConfirmModal/OtpConfirmModal.tsx';
import { ApiError, MockSignInError, MockVerifyCodeError, mapApiError, recoveryConfirmOtp, recoveryRequestOtp } from '@/api/index.ts';
import type { ClientType } from '@/api/index.ts';
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

  const routeState = location.state as { email?: string; clientType?: ClientType } | null;
  const [email, setEmail] = useState(routeState?.email ?? '');
  // The sign-in screen a user came from is the only source for this — falls
  // back to business (today's `/login` default) if reached some other way.
  const clientType: ClientType = routeState?.clientType ?? 'UL';
  const [emailError, setEmailError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [otpState, setOtpState] = useState<{ transactionId: string; twoFA: boolean }>();

  const canSubmit = isValidEmail(email);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || loading) {
      return;
    }
    setEmailError(undefined);
    setLoading(true);
    try {
      const tx = await recoveryRequestOtp(email, clientType);
      setOtpState(tx);
      openModal();
    } catch (err) {
      if (err instanceof MockSignInError) {
        setEmailError(ru.signIn.errorEmailInvalid);
      } else if (err instanceof ApiError) {
        setEmailError(mapApiError(err));
      }
      notifyError();
    } finally {
      setLoading(false);
    }
  }

  // §2.3 — confirm-otp returns a *new* transactionId; that's the one
  // `/reset-password` must carry forward to the final `complete` call, not
  // the one this screen started with.
  const [completedTransactionId, setCompletedTransactionId] = useState<string>();

  async function handleOtpSubmit(params: { transactionId: string; otp: string }) {
    try {
      const next = await recoveryConfirmOtp(params.transactionId, params.otp);
      setCompletedTransactionId(next.transactionId);
    } catch (err) {
      if (err instanceof MockVerifyCodeError) {
        throw new Error(ru.verification.errorCodeInvalid);
      }
      if (err instanceof ApiError) {
        throw new Error(mapApiError(err));
      }
      throw err;
    }
  }

  async function handleOtpResend() {
    try {
      return await recoveryRequestOtp(email, clientType);
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(mapApiError(err));
      }
      throw err;
    }
  }

  function handleOtpVerified() {
    closeModal();
    navigate('/reset-password', { state: { email, transactionId: completedTransactionId }, replace: true });
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

      {otpState && (
        <OtpConfirmModal
          open={modalOpen}
          email={email}
          transactionId={otpState.transactionId}
          twoFA={otpState.twoFA}
          onClose={closeModal}
          onSubmit={handleOtpSubmit}
          onResend={handleOtpResend}
          onVerified={handleOtpVerified}
        />
      )}
    </>
  );
}
