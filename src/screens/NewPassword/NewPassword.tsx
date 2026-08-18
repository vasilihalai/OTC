import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { PasswordField } from '@/components/PasswordField/PasswordField.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { resetPassword } from '@/api/index.ts';
import { useToastStore } from '@/store/toast.ts';
import { ru } from '@/i18n/ru.ts';

import './NewPassword.css';

const MIN_LENGTH = 8;

export function NewPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToastStore((s) => s.show);

  const email = (location.state as { email?: string } | null)?.email ?? '';
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const tooShort = touched && password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = touched && repeat.length > 0 && repeat !== password;
  const canSubmit = password.length >= MIN_LENGTH && repeat === password;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit || loading) {
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, password);
      showToast(ru.newPassword.successToast);
      navigate('/login', { state: { email }, replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="new-password" onSubmit={(e) => void handleSubmit(e)}>
      <h1 className="new-password__title">{ru.newPassword.title}</h1>

      <PasswordField
        label={ru.newPassword.newPasswordLabel}
        value={password}
        error={tooShort ? ru.newPassword.newPasswordHint : undefined}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordField
        label={ru.newPassword.repeatPasswordLabel}
        value={repeat}
        error={mismatch ? ru.newPassword.errorMismatch : undefined}
        onChange={(e) => setRepeat(e.target.value)}
      />

      <Button type="submit" disabled={!canSubmit} loading={loading}>
        {ru.newPassword.submitAction}
      </Button>
    </form>
  );
}
