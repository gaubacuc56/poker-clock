/**
 * Live countdown state arrives over Supabase Realtime; this poll only keeps the
 * slower-changing fields (player counts, prize pool) fresh.
 */
export const REFRESH_INTERVAL_MS = 8_000;
