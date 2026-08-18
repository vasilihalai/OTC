import { useEffect } from 'react';

import { useToastStore } from '@/store/toast.ts';

import './Toast.css';

const AUTO_HIDE_MS = 2000;

export function Toast() {
  const message = useToastStore((s) => s.message);
  const hide = useToastStore((s) => s.hide);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = setTimeout(hide, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [message, hide]);

  if (!message) {
    return null;
  }

  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}
