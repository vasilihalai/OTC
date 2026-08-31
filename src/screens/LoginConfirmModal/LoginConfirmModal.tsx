import { useEffect, useState } from 'react';

import { Modal } from '@/components/Modal/Modal.tsx';
import { CodeInput } from '@/components/CodeInput/CodeInput.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { Spinner } from '@/components/Spinner/Spinner.tsx';
import { SessionError, sessionConfirm } from '@/api/index.ts';
import type { ClientType, Session } from '@/api/types.ts';
import { useSessionStore } from '@/store/session.ts';
import { getFreshInitData } from '@/telegram/initData.ts';
import { notifyError, notifySuccess } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './LoginConfirmModal.css';

const RESEND_SECONDS = 59;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export interface LoginConfirmModalProps {
  open: boolean;
  email: string;
  clientType: ClientType;
  loginTransactionId: string;
  /** From step 1's response — whether a second, authenticator code is also required. */
  twoFA: boolean;
  onClose: () => void;
  onVerified: (session: Session) => void;
  /** Re-runs step 1 to get a fresh loginTransactionId; returns its response. */
  onResend: () => Promise<{ loginTransactionId: string; twoFA: boolean }>;
}

/**
 * Step 2 of first-time binding — miniapp-auth-integration-spec.md §7
 * `/login/confirm`. Distinct from the shared `VerificationModal`/
 * `AuthenticatorModal` (which pick ONE of email-code-or-authenticator):
 * this endpoint always takes the email/SMS `otp`, *plus* a `twoFaCode` when
 * step 1 returned `twoFA: true` — never either/or.
 */
export function LoginConfirmModal({
  open, email, clientType, loginTransactionId, twoFA, onClose, onVerified, onResend,
}: LoginConfirmModalProps) {
  const setAuthStatus = useSessionStore((s) => s.setAuthStatus);
  const [txId, setTxId] = useState(loginTransactionId);
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
    setTxId(loginTransactionId);
    setRequiresTwoFa(twoFA);
    setOtp('');
    setTwoFaCode('');
    setError(undefined);
    setResendCountdown(RESEND_SECONDS);
  }, [open, loginTransactionId, twoFA]);

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
      const initData = getFreshInitData();
      if (!initData) {
        throw new SessionError('INVALID_INIT_DATA', 0);
      }
      const result = await sessionConfirm(clientType, {
        loginTransactionId: txId,
        otp: nextOtp,
        twoFaCode: nextTwoFaCode || undefined,
        initData,
      });
      notifySuccess();
      onVerified({ email, clientType, token: result.accessToken });
    } catch (err) {
      notifyError();
      if (err instanceof SessionError && err.code === 'INVALID_OTP') {
        setError(ru.verification.errorCodeInvalid);
        setOtp('');
        setTwoFaCode('');
      } else {
        // INVALID_INIT_DATA / BINDING_CONFLICT / UNKNOWN are terminal here —
        // not something retyping a code can fix. Hand off to the app-level
        // AuthError screen instead of leaving this modal open on a dead end.
        const code = err instanceof SessionError ? err.code : 'UNKNOWN';
        onClose();
        setAuthStatus('error', code);
      }
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
      // Re-runs step 1 (`/session/login`) — the same email/password submit
      // as the initial attempt, so it can realistically hit the same
      // TOO_MANY_ATTEMPTS rate limit a repeatedly-tapped resend button would
      // trigger (miniapp-auth-integration-spec.md §7 `/session/login` 429).
      const next = await onResend();
      setTxId(next.loginTransactionId);
      setRequiresTwoFa(next.twoFA);
      setOtp('');
      setTwoFaCode('');
      setResendCountdown(RESEND_SECONDS);
    } catch (err) {
      notifyError();
      setError(err instanceof SessionError && err.code === 'TOO_MANY_ATTEMPTS'
        ? ru.signIn.errorTooManyAttempts
        : ru.verification.errorCodeInvalid);
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
      <p className="login-confirm-modal__sent-to">{ru.verification.sentTo}</p>
      <p className="login-confirm-modal__email">{email}</p>

      <CodeInput value={otp} onChange={setOtp} onComplete={handleOtpComplete} error={!!error} disabled={verifying}/>

      {requiresTwoFa && (
        <>
          <p className="login-confirm-modal__two-fa-label">{ru.authenticator.title}</p>
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
        <p className="login-confirm-modal__status"><Spinner size={16}/>{ru.verification.verifyingLabel}</p>
      )}
      {error && <p className="login-confirm-modal__error">{error}</p>}
    </Modal>
  );
}
