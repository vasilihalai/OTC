import { useEffect, useState } from 'react';

import { Modal } from '@/components/Modal/Modal.tsx';
import { CodeInput } from '@/components/CodeInput/CodeInput.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { Spinner } from '@/components/Spinner/Spinner.tsx';
import { notifyError, notifySuccess } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './OtpConfirmModal.css';

const RESEND_SECONDS = 59;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export interface OtpConfirmSubmitParams {
  transactionId: string;
  otp: string;
  twoFaCode?: string;
}

export interface OtpConfirmModalProps {
  open: boolean;
  email: string;
  transactionId: string;
  /** From the OTP-issue step's response — whether a second, authenticator code is also required. */
  twoFA: boolean;
  onClose: () => void;
  /** Verifies the code(s). Reject with an `Error` whose `message` is already display-ready (via `errorMap.ts`) to show inline; resolve on success. */
  onSubmit: (params: OtpConfirmSubmitParams) => Promise<void>;
  /** Re-issues the code; returns the (possibly new) transactionId/twoFA — api-integration.md §2.3 explicitly returns a fresh transactionId on confirm, and resend realistically hits the same rate limit as the initial request. */
  onResend: () => Promise<{ transactionId: string; twoFA: boolean }>;
  onVerified: () => void;
}

/**
 * Generic OTP-confirm step shared by sign-in (api-integration.md §2.1) and
 * password recovery (§2.3) — both are "email/SMS code, plus an authenticator
 * code when the account has one enabled," never either/or, which is why this
 * is its own component rather than reusing the withdrawal-confirmation
 * `TwoFactorGate`/`VerificationModal`/`AuthenticatorModal` trio (those pick
 * ONE of the two, matching a different real contract — §5.3).
 */
export function OtpConfirmModal({
  open, email, transactionId, twoFA, onClose, onSubmit, onResend, onVerified,
}: OtpConfirmModalProps) {
  const [txId, setTxId] = useState(transactionId);
  const [requiresTwoFa, setRequiresTwoFa] = useState(twoFA);
  const [otp, setOtp] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [error, setError] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTxId(transactionId);
    setRequiresTwoFa(twoFA);
    setOtp('');
    setTwoFaCode('');
    setError(undefined);
    setResendCountdown(RESEND_SECONDS);
  }, [open, transactionId, twoFA]);

  useEffect(() => {
    if (!open || resendCountdown <= 0) {
      return;
    }
    const timer = setInterval(() => setResendCountdown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [open, resendCountdown > 0]);

  async function attemptConfirm(nextOtp: string, nextTwoFaCode: string) {
    setVerifying(true);
    setError(undefined);
    try {
      await onSubmit({ transactionId: txId, otp: nextOtp, twoFaCode: nextTwoFaCode || undefined });
      notifySuccess();
      onVerified();
    } catch (err) {
      notifyError();
      setError(err instanceof Error ? err.message : ru.verification.errorCodeInvalid);
      setOtp('');
      setTwoFaCode('');
    } finally {
      setVerifying(false);
    }
  }

  function handleOtpComplete(value: string) {
    setOtp(value);
    if (!requiresTwoFa) {
      void attemptConfirm(value, '');
    } else if (twoFaCode.length === 6) {
      void attemptConfirm(value, twoFaCode);
    }
  }

  function handleTwoFaComplete(value: string) {
    setTwoFaCode(value);
    if (otp.length === 6) {
      void attemptConfirm(otp, value);
    }
  }

  async function handleResend() {
    setError(undefined);
    try {
      const next = await onResend();
      setTxId(next.transactionId);
      setRequiresTwoFa(next.twoFA);
      setOtp('');
      setTwoFaCode('');
      setResendCountdown(RESEND_SECONDS);
    } catch (err) {
      notifyError();
      setError(err instanceof Error ? err.message : ru.verification.errorCodeInvalid);
    }
  }

  return (
    <Modal
      open={open}
      title={ru.verification.title}
      onClose={onClose}
      compactClose
      footer={(
        <Button
          type="button"
          variant="secondary"
          disabled={resendCountdown > 0}
          onClick={() => void handleResend()}
        >
          {resendCountdown > 0
            ? `${ru.verification.resendAction} ${formatCountdown(resendCountdown)}`
            : ru.verification.resendAction}
        </Button>
      )}
    >
      <p className="otp-confirm-modal__sent-to">{ru.verification.sentTo}</p>
      <p className="otp-confirm-modal__email">{email}</p>

      <CodeInput value={otp} onChange={setOtp} onComplete={handleOtpComplete} error={!!error} disabled={verifying}/>

      {requiresTwoFa && (
        <>
          <p className="otp-confirm-modal__two-fa-label">{ru.authenticator.title}</p>
          <CodeInput
            value={twoFaCode}
            onChange={setTwoFaCode}
            onComplete={handleTwoFaComplete}
            error={!!error}
            disabled={verifying}
          />
        </>
      )}

      {verifying && (
        <p className="otp-confirm-modal__status"><Spinner size={16}/>{ru.verification.verifyingLabel}</p>
      )}
      {error && <p className="otp-confirm-modal__error">{error}</p>}
    </Modal>
  );
}
