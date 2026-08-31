import { BlockingState } from '@/components/BlockingState/BlockingState.tsx';
import { Button } from '@/components/Button/Button.tsx';
import type { SessionErrorCode } from '@/api/index.ts';
import { ru } from '@/i18n/ru.ts';

const COPY: Record<SessionErrorCode, { title: string; body: string }> = {
  INVALID_INIT_DATA: { title: ru.authError.invalidInitDataTitle, body: ru.authError.invalidInitDataBody },
  MINI_APP_UNAVAILABLE: { title: ru.authError.unavailableTitle, body: ru.authError.unavailableBody },
  BINDING_CONFLICT: { title: ru.authError.conflictTitle, body: ru.authError.conflictBody },
  // BINDING_REQUIRED never reaches this screen (it routes to /login instead);
  // INVALID_CREDENTIALS/INVALID_OTP/TOO_MANY_ATTEMPTS are shown inline on the
  // login/code forms (SignIn's emailError), not here — all three are things
  // the user fixes by retrying the same form, not a reason to block the
  // whole app. All three fall back to the generic copy below defensively.
  BINDING_REQUIRED: { title: ru.authError.unknownTitle, body: ru.authError.unknownBody },
  INVALID_CREDENTIALS: { title: ru.authError.unknownTitle, body: ru.authError.unknownBody },
  INVALID_OTP: { title: ru.authError.unknownTitle, body: ru.authError.unknownBody },
  TOO_MANY_ATTEMPTS: { title: ru.authError.unknownTitle, body: ru.authError.unknownBody },
  UNKNOWN: { title: ru.authError.unknownTitle, body: ru.authError.unknownBody },
};

export function AuthError({ code }: { code: SessionErrorCode }) {
  const { title, body } = COPY[code];

  return (
    <BlockingState
      logo={<span style={{ color: 'var(--brand-mark)', fontWeight: 700, fontSize: 20 }}>xRuby</span>}
      title={title}
      body={body}
      action={<Button variant="accent" onClick={() => window.location.reload()}>{ru.authError.reloadAction}</Button>}
    />
  );
}
