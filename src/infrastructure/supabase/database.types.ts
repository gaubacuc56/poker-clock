import type {
  BlindLevel,
  CurrencyUnit,
  PayoutUnit,
  SoundSettings,
  TournamentStatus,
} from '@domain/entities';

/** The stored jsonb shape — some older rows may still have `percentage` instead of `value`; the repository maps both. */
export interface RawPayoutTier {
  position: number;
  value?: number;
  percentage?: number;
}

/** Hand-written mirror of supabase/migrations/*.sql — keep in sync with those files. */
export interface Database {
  public: {
    Tables: {
      tournaments: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          status: TournamentStatus;
          currency: CurrencyUnit;
          buy_in_cents: number;
          fee_cents: number;
          guaranteed_prize_pool_cents: number | null;
          starting_stack: number;
          max_players_per_table: number;
          min_entrants: number | null;
          max_entrants: number | null;
          entrant_count: number;
          eliminated_count: number;
          rebuy_count: number;
          add_on_count: number;
          late_reg_level: number;
          allow_rebuy: boolean;
          allow_add_on: boolean;
          rebuy_price_cents: number | null;
          add_on_price_cents: number | null;
          blind_levels: BlindLevel[];
          payout_tiers: RawPayoutTier[];
          payout_unit: PayoutUnit;
          sounds: SoundSettings;
          join_code: string;
          projector_background_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['tournaments']['Row'],
          'owner_id' | 'created_at' | 'updated_at'
        > & {
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tournaments']['Insert']>;
        Relationships: [];
      };
      clock_states: {
        Row: {
          tournament_id: string;
          owner_id: string;
          current_level_index: number;
          level_started_at_epoch_ms: number;
          paused_accumulated_ms: number;
          is_paused: boolean;
          paused_at_epoch_ms: number | null;
          is_muted: boolean;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['clock_states']['Row'],
          'owner_id' | 'updated_at' | 'is_muted'
        > & {
          owner_id?: string;
          updated_at?: string;
          is_muted?: boolean;
        };
        Update: Partial<Database['public']['Tables']['clock_states']['Insert']>;
        Relationships: [];
      };
      currencies: {
        Row: {
          code: string;
          label: string;
          sort_order: number;
        };
        Insert: Database['public']['Tables']['currencies']['Row'];
        Update: Partial<Database['public']['Tables']['currencies']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_tournament_by_join_code: {
        Args: { p_join_code: string };
        Returns: Array<Omit<Database['public']['Tables']['tournaments']['Row'], 'owner_id'>>;
      };
    };
  };
}
