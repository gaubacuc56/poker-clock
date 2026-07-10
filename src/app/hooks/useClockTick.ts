import { useEffect, useState } from 'react';

/**
 * Re-renders the caller on an interval so time-derived values (e.g.
 * getSecondsRemaining) stay live. The interval only drives re-renders — the
 * actual time-truth is always derived fresh from Date.now() and the clock's
 * epoch fields, so drift/throttling never desyncs the displayed value.
 */
export function useClockTick(intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
