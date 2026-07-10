import { useCallback, useEffect, useRef, useState } from 'react';

interface ToastControls {
  toastMessage: string | null;
  showToast: (message: string) => void;
}

/** A short-lived status message (e.g. "Link copied"), auto-dismissed after `durationMs`. */
export function useToast(durationMs = 2500): ToastControls {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setToastMessage(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return { toastMessage, showToast };
}
