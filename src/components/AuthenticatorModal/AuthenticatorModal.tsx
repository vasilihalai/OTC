import { useEffect, useState } from 'react';

import { Modal } from '@/components/Modal/Modal.tsx';
import { CodeInput } from '@/components/CodeInput/CodeInput.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { MockVerifyCodeError, verifyCode } from '@/api/index.ts';
import { useToastStore } from '@/store/toast.ts';
import { notifyError, notifySuccess } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './AuthenticatorModal.css';

export interface AuthenticatorModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a valid code — should perform the actual submission. */
  onVerified: () => Promise<void> | void;
}

export function AuthenticatorModal({ open, onClose, onVerified }: AuthenticatorModalProps) {
  const show = useToastStore((s) => s.show);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (open) {
      setCode('');
      setError(undefined);
      setVerifying(false);
    }
  }, [open]);

  async function handleComplete(value: string) {
    setVerifying(true);
    setError(undefined);
    try {
      await verifyCode(value);
      notifySuccess();
      await onVerified();
    } catch (err) {
      notifyError();
      if (err instanceof MockVerifyCodeError) {
        setError(err.code === 'RATE_LIMIT' ? ru.verification.errorRateLimit : ru.verification.errorCodeInvalid);
      }
      setCode('');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Modal open={open} title={ru.authenticator.title} onClose={onClose}>
      <p className="authenticator-modal__body">{ru.authenticator.body}</p>
      <CodeInput
        value={code}
        onChange={setCode}
        onComplete={(value) => void handleComplete(value)}
        error={!!error}
        disabled={verifying}
      />
      {error && <p className="authenticator-modal__error">{error}</p>}
      <Button type="button" variant="link" onClick={() => show(ru.stub.inDevelopment)}>
        {ru.authenticator.syncHelpAction}
      </Button>
    </Modal>
  );
}
