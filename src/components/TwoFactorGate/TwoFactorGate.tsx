import { AuthenticatorModal } from '@/components/AuthenticatorModal/AuthenticatorModal.tsx';
import { VerificationModal } from '@/screens/VerificationModal/VerificationModal.tsx';

export interface TwoFactorGateProps {
  open: boolean;
  /** Google Authenticator when the user has it enabled, email code otherwise. */
  authenticatorEnabled: boolean;
  email: string;
  onClose: () => void;
  /** Verifies the code (and, for callers whose "verification" is really a submission, performs it atomically). Reject with an `Error` whose `message` is already display-ready to show inline. */
  onSubmit: (code: string) => Promise<void>;
  /** Only used by the email-code branch — the authenticator app has nothing to resend. */
  onResend: () => Promise<void>;
  onVerified: () => void;
}

/**
 * Second-factor step shared by sign-in and both withdrawal flows: Google
 * Authenticator when the user has it enabled, the email code otherwise —
 * never both.
 */
export function TwoFactorGate({ open, authenticatorEnabled, email, onClose, onSubmit, onResend, onVerified }: TwoFactorGateProps) {
  if (authenticatorEnabled) {
    return <AuthenticatorModal open={open} onClose={onClose} onSubmit={onSubmit} onVerified={onVerified}/>;
  }
  return <VerificationModal open={open} email={email} onClose={onClose} onSubmit={onSubmit} onResend={onResend} onVerified={onVerified}/>;
}
