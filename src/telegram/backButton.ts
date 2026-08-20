import { useEffect } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { backButton } from '@tma.js/sdk-react';

import { routes } from '@/navigation/routes.tsx';
import { useModalStore } from '@/store/modal.ts';

/**
 * Single app-level handler for the Telegram system back button, mounted once
 * in App.tsx. Centralized (rather than per-page) so the verification modal
 * can intercept the back gesture to close itself without also triggering
 * navigate(-1) on the page underneath it.
 */
export function useAppBackButton(): void {
  const location = useLocation();
  const navigate = useNavigate();
  const isModalOpen = useModalStore((s) => s.isVerificationModalOpen);
  const closeModal = useModalStore((s) => s.closeVerificationModal);

  useEffect(() => {
    const route = routes.find((r) => matchPath(r.path, location.pathname));
    // Only 'back' routes get the native BackButton — it's a chevron with
    // "go to the previous screen" semantics. 'close' routes (login,
    // otc-unavailable: entry points with nothing to go back to, even right
    // after signing out) must leave it hidden so Telegram's own default
    // close affordance shows instead; showing our back button there was a
    // real bug; it let a signed-out user "go back" into the app they just
    // left.
    const showsBack = isModalOpen || route?.headerVariant === 'back';

    if (!showsBack) {
      backButton.hide.ifAvailable();
      return;
    }

    backButton.show.ifAvailable();
    const clickResult = backButton.onClick.ifAvailable(() => {
      if (isModalOpen) {
        closeModal();
      } else {
        navigate(-1);
      }
    });
    const unsubscribe = clickResult.ok ? clickResult.data : undefined;

    return () => {
      unsubscribe?.();
    };
  }, [location.pathname, isModalOpen, navigate, closeModal]);
}

/** Used by AppHeader's in-browser pill to mirror the same back semantics. */
export function useGoBack(): () => void {
  const navigate = useNavigate();
  const isModalOpen = useModalStore((s) => s.isVerificationModalOpen);
  const closeModal = useModalStore((s) => s.closeVerificationModal);

  return () => {
    if (isModalOpen) {
      closeModal();
    } else {
      navigate(-1);
    }
  };
}
