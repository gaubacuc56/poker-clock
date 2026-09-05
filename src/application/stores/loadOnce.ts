/**
 * The fetch guard every list store shares.
 *
 * A store's data is per-account and doesn't change behind the app's back, so it
 * is fetched once and kept. Two things make that harder than a boolean:
 *
 *   - Several screens read the same list, and each one asks for it on mount.
 *     Asking is how a screen stops depending on some other screen having been
 *     visited first — but two screens mounting together, or one mounting while
 *     the first request is still in the air, would each start their own.
 *   - `isLoaded` only turns true when a request comes back, so it cannot answer
 *     "is one already on its way".
 *
 * So a load in flight is returned to the next caller rather than started again,
 * and a load that has already landed is answered without touching the network.
 * `force` is for the caller that knows the server has moved on.
 */
export interface LoadOptions {
  /** Fetch even if the data is already held — for a deliberate refresh. */
  force?: boolean;
}

export function loadOnce(
  isLoaded: () => boolean,
  fetch: () => Promise<void>,
): (options?: LoadOptions) => Promise<void> {
  let inFlight: Promise<void> | null = null;

  return (options) => {
    if (!options?.force) {
      if (isLoaded()) return Promise.resolve();
      if (inFlight) return inFlight;
    }

    const request = fetch().finally(() => {
      // Only clear the slot if it is still this request's — a forced reload
      // started meanwhile owns it now.
      if (inFlight === request) inFlight = null;
    });
    inFlight = request;
    return request;
  };
}
