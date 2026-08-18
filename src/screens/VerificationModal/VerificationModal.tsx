import { useEffect, useState } from 'react';

import { Modal } from '@/components/Modal/Modal.tsx';
import { CodeInput } from '@/components/CodeInput/CodeInput.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { MockVerifyCodeError, sendVerificationCode, verifyCode } from '@/api/index.ts';
import { maskEmail } from '@/lib/mask.ts';
import { notifyError, notifySuccess } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './VerificationModal.css';

const RESEND_SECONDS = 59;
const LOCKOUT_SECONDS = 30;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export interface VerificationModalProps {
  open: boolean;
  email: string;
  onClose: () => void;
  onVerified: () => void;
}

export function VerificationModal({ open, email, onClose, onVerified }: VerificationModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }
    setCode('');
    setError(undefined);
    setResendCountdown(RESEND_SECONDS);
    setLockoutCountdown(0);
  }, [open]);

  useEffect(() => {
    if (!open || resendCountdown <= 0) {
      return;
    }
    const timer = setInterval(() => setResendCountdown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [open, resendCountdown > 0]);

  useEffect(() => {
    if (lockoutCountdown <= 0) {
      return;
    }
    const timer = setInterval(() => setLockoutCountdown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [lockoutCountdown > 0]);

  async function handleComplete(value: string) {
    setVerifying(true);
    setError(undefined);
    try {
      await verifyCode(value);
      notifySuccess();
      onVerified();
    } catch (err) {
      notifyError();
      if (err instanceof MockVerifyCodeError) {
        if (err.code === 'RATE_LIMIT') {
          setError(ru.verification.errorRateLimit);
          setLockoutCountdown(LOCKOUT_SECONDS);
        } else {
          setError(ru.verification.errorCodeInvalid);
        }
      }
      setCode('');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    await sendVerificationCode(email);
    setCode('');
    setError(undefined);
    setResendCountdown(RESEND_SECONDS);
  }

  const locked = lockoutCountdown > 0 || verifying;

  return (
    <Modal open={open} title={ru.verification.title} onClose={onClose}>
      <p className="verification-modal__sent-to">{ru.verification.sentTo}</p>
      <p className="verification-modal__email">{maskEmail(email)}</p>

      <CodeInput
        value={code}
        onChange={setCode}
        onComplete={(value) => void handleComplete(value)}
        error={!!error}
        disabled={locked}
      />
      {error && <p className="verification-modal__error">{error}</p>}

      <Button
        type="button"
        variant="primary"
        disabled={resendCountdown > 0}
        onClick={() => void handleResend()}
      >
        {resendCountdown > 0
          ? `${ru.verification.resendAction} ${formatCountdown(resendCountdown)}`
          : ru.verification.resendAction}
      </Button>
    </Modal>
  );
}
