import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Logo } from '@/components/Logo/Logo.tsx';
import { PasswordField } from '@/components/PasswordField/PasswordField.tsx';
import { HelpTip } from '@/components/HelpTip/HelpTip.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { resetPassword } from '@/api/index.ts';
import { useToastStore } from '@/store/toast.ts';
import { copyToClipboard, notifySuccess } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './NewPassword.css';

const MIN_LENGTH = 8;

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*';

function pick(chars: string): string {
  return chars[Math.floor(Math.random() * chars.length)];
}

function generatePassword(): string {
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  const rest = Array.from({ length: 8 }, () => pick(UPPER + LOWER + DIGITS + SYMBOLS));
  return [...required, ...rest].sort(() => Math.random() - 0.5).join('');
}

type Strength = 'weak' | 'strong';

function computeStrength(password: string): Strength | undefined {
  if (!password) {
    return undefined;
  }
  const variety = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  return password.length >= MIN_LENGTH && variety >= 3 ? 'strong' : 'weak';
}

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
  const strength = computeStrength(password);

  function handleGenerate() {
    const generated = generatePassword();
    setPassword(generated);
    setRepeat(generated);
    setTouched(false);
    void copyToClipboard(generated).then(() => {
      notifySuccess();
      showToast(ru.newPassword.passwordCopiedToast);
    });
  }

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
      <Logo/>
      <h1 className="new-password__title">{ru.newPassword.title}</h1>

      <PasswordField
        label={ru.newPassword.newPasswordLabel}
        labelHint={<HelpTip text={ru.newPassword.newPasswordHelp}/>}
        placeholder={ru.newPassword.newPasswordPlaceholder}
        value={password}
        error={tooShort ? ru.newPassword.newPasswordHint : undefined}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="new-password__strength-row">
        <button type="button" className="new-password__generate" onClick={handleGenerate}>
          {ru.newPassword.generatePasswordAction}
        </button>
        {strength && (
          <span className={`new-password__strength new-password__strength--${strength}`}>
            <span className="new-password__strength-dot" aria-hidden="true"/>
            {strength === 'strong' ? ru.newPassword.strengthStrong : ru.newPassword.strengthWeak}
          </span>
        )}
      </div>

      <PasswordField
        label={ru.newPassword.repeatPasswordLabel}
        placeholder={ru.newPassword.repeatPasswordPlaceholder}
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
