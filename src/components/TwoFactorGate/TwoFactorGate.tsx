import { AuthenticatorModal } from '@/components/AuthenticatorModal/AuthenticatorModal.tsx';
import { VerificationModal } from '@/screens/VerificationModal/VerificationModal.tsx';

export interface TwoFactorGateProps {
  open: boolean;
  /** Google Authenticator when the user has it enabled, email code otherwise. */
  authenticatorEnabled: boolean;
  email: string;
  onClose: () => void;
  onVerified: () => Promise<void> | void;
}

/**
 * Second-factor step shared by sign-in and both withdrawal flows: Google
 * Authenticator when the user has it enabled, the email code otherwise —
 * never both.
 */
export function TwoFactorGate({ open, authenticatorEnabled, email, onClose, onVerified }: TwoFactorGateProps) {
  if (authenticatorEnabled) {
    return <AuthenticatorModal open={open} onClose={onClose} onVerified={onVerified}/>;
  }
  return <VerificationModal open={open} email={email} onClose={onClose} onVerified={() => void onVerified()}/>;
}
