import type { TournamentRepository } from '@domain/ports';
import type { SoundSettings, TournamentConfig } from '@domain/entities';
import { generateJoinCode } from '@domain/rules/joinCode';
import { supabase } from './client';
import type { Database } from './database.types';

type TournamentRow = Database['public']['Tables']['tournaments']['Row'];

/** Also used for the public join-code RPC result, which omits owner_id. */
function rowToTournament(row: Omit<TournamentRow, 'owner_id'>): TournamentConfig {
  return {
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    buyIn: row.buy_in_cents,
    fee: row.fee_cents,
    currency: row.currency,
    startingStack: row.starting_stack,
    maxPlayersPerTable: row.max_players_per_table,
    minEntrants: row.min_entrants ?? undefined,
    maxEntrants: row.max_entrants ?? undefined,
    entrantCount: row.entrant_count,
    eliminatedCount: row.eliminated_count,
    rebuyCount: row.rebuy_count,
    addOnCount: row.add_on_count,
    lateRegLevel: row.late_reg_level,
    allowRebuy: row.allow_rebuy,
    allowAddOn: row.allow_add_on,
    rebuyPrice: row.rebuy_price_cents ?? undefined,
    addOnPrice: row.add_on_price_cents ?? undefined,
    guaranteedPrizePool: row.guaranteed_prize_pool_cents ?? undefined,
    blindLevels: row.blind_levels,
    payoutTiers: row.payout_tiers.map((tier) => ({
      position: tier.position,
      value: tier.value ?? tier.percentage ?? 0,
    })),
    payoutUnit: row.payout_unit,
    sounds: row.sounds,
    projectorBackgroundId: row.projector_background_id ?? undefined,
    createdAt: row.created_at,
    status: row.status,
  };
}

function tournamentToRow(
  tournament: TournamentConfig,
): Database['public']['Tables']['tournaments']['Insert'] {
  return {
    id: tournament.id,
    name: tournament.name,
    join_code: tournament.joinCode ?? '',
    status: tournament.status,
    currency: tournament.currency ?? 'USD',
    buy_in_cents: tournament.buyIn,
    fee_cents: tournament.fee,
    guaranteed_prize_pool_cents: tournament.guaranteedPrizePool ?? null,
    starting_stack: tournament.startingStack,
    max_players_per_table: tournament.maxPlayersPerTable,
    min_entrants: tournament.minEntrants ?? null,
    max_entrants: tournament.maxEntrants ?? null,
    entrant_count: tournament.entrantCount,
    eliminated_count: tournament.eliminatedCount,
    rebuy_count: tournament.rebuyCount,
    add_on_count: tournament.addOnCount,
    late_reg_level: tournament.lateRegLevel,
    allow_rebuy: tournament.allowRebuy,
    allow_add_on: tournament.allowAddOn,
    rebuy_price_cents: tournament.rebuyPrice ?? null,
    add_on_price_cents: tournament.addOnPrice ?? null,
    blind_levels: tournament.blindLevels,
    payout_tiers: tournament.payoutTiers,
    payout_unit: tournament.payoutUnit ?? 'percentage',
    sounds: tournament.sounds ?? ({} as SoundSettings),
    projector_background_id: tournament.projectorBackgroundId ?? null,
    created_at: tournament.createdAt,
  };
}

const MAX_JOIN_CODE_ATTEMPTS = 5;
const UNIQUE_VIOLATION = '23505';

export class SupabaseTournamentRepository implements TournamentRepository {
  async list(): Promise<TournamentConfig[]> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToTournament);
  }

  async save(tournament: TournamentConfig): Promise<TournamentConfig> {
    const isNew = !tournament.joinCode;
    let joinCode = tournament.joinCode || generateJoinCode();

    for (let attempt = 1; attempt <= MAX_JOIN_CODE_ATTEMPTS; attempt++) {
      const { data, error } = await supabase
        .from('tournaments')
        .upsert(tournamentToRow({ ...tournament, joinCode }))
        .select()
        .single();

      if (!error) return rowToTournament(data);

      const isJoinCodeCollision = isNew && error.code === UNIQUE_VIOLATION;
      if (!isJoinCodeCollision || attempt === MAX_JOIN_CODE_ATTEMPTS) throw error;
      joinCode = generateJoinCode();
    }

    // Unreachable — the loop always returns or throws.
    throw new Error('Failed to save tournament: could not generate a unique join code');
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) throw error;
  }

  async findByJoinCode(code: string): Promise<TournamentConfig | null> {
    const { data, error } = await supabase.rpc('get_tournament_by_join_code', {
      p_join_code: code,
    });
    if (error) throw error;
    const row = data?.[0];
    return row ? rowToTournament(row) : null;
  }
}
