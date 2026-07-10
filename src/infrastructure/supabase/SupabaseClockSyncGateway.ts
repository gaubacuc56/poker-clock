import type { ClockSyncGateway } from '@domain/ports';
import type { ClockState } from '@domain/entities';
import { supabase } from './client';
import type { Database } from './database.types';

type ClockStateRow = Database['public']['Tables']['clock_states']['Row'];

function rowToClockState(row: ClockStateRow): ClockState {
  return {
    currentLevelIndex: row.current_level_index,
    levelStartedAtEpochMs: row.level_started_at_epoch_ms,
    pausedAccumulatedMs: row.paused_accumulated_ms,
    isPaused: row.is_paused,
    pausedAtEpochMs: row.paused_at_epoch_ms,
  };
}

export class SupabaseClockSyncGateway implements ClockSyncGateway {
  async push(tournamentId: string, clock: ClockState): Promise<void> {
    const { error } = await supabase.from('clock_states').upsert({
      tournament_id: tournamentId,
      current_level_index: clock.currentLevelIndex,
      level_started_at_epoch_ms: clock.levelStartedAtEpochMs,
      paused_accumulated_ms: clock.pausedAccumulatedMs,
      is_paused: clock.isPaused,
      paused_at_epoch_ms: clock.pausedAtEpochMs,
    });
    if (error) throw error;
  }

  async fetch(tournamentId: string): Promise<ClockState | null> {
    const { data, error } = await supabase
      .from('clock_states')
      .select('*')
      .eq('tournament_id', tournamentId)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToClockState(data) : null;
  }

  async clear(tournamentId: string): Promise<void> {
    const { error } = await supabase
      .from('clock_states')
      .delete()
      .eq('tournament_id', tournamentId);
    if (error) throw error;
  }

  subscribe(tournamentId: string, onChange: (clock: ClockState | null) => void): () => void {
    const channel = supabase
      .channel(`clock-states:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clock_states',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            onChange(null);
            return;
          }
          const row = payload.new as ClockStateRow;
          if (!row?.tournament_id) return;
          onChange(rowToClockState(row));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
