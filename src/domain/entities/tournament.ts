import type { BlindLevel } from './blinds';
import type { PayoutTier, PayoutUnit } from './payout';
import type { SoundSettings } from './sound';

export type TournamentStatus =
  | 'setup'
  | 'registering'
  | 'running'
  | 'paused'
  | 'final_table'
  | 'complete';

/** A `currencies.code` value — the allowed set is database-controlled, not a fixed union. */
export type CurrencyUnit = string;

export interface TournamentConfig {
  id: string;
  name: string;
  /** Short human-typeable code for the public projector URL (/p/:joinCode). Assigned by the repository on first save — absent until then. */
  joinCode?: string;
  buyIn: number; // hundredths of a currency unit
  fee: number; // hundredths of a currency unit, house rake, excluded from prize pool
  /** Absent on tournaments created before the currency picker shipped — treat as 'USD'. */
  currency?: CurrencyUnit;
  startingStack: number;
  maxPlayersPerTable: number;
  minEntrants?: number;
  maxEntrants?: number;
  /**
   * The app never tracks individual players — only aggregate counts, kept
   * up to date live by the admin. Rebuys/add-ons each grant the starting
   * stack; their cost is rebuyPrice/addOnPrice (falling back to buyIn for
   * tournaments created before those shipped).
   */
  entrantCount: number;
  eliminatedCount: number;
  rebuyCount: number;
  addOnCount: number;
  lateRegLevel: number;
  allowRebuy: boolean;
  allowAddOn: boolean;
  /** Cost of a single rebuy, hundredths of a currency unit. Absent = same as buyIn. */
  rebuyPrice?: number;
  /** Cost of a single add-on, hundredths of a currency unit. Absent = same as buyIn. */
  addOnPrice?: number;
  guaranteedPrizePool?: number;
  blindLevels: BlindLevel[];
  payoutTiers: PayoutTier[];
  /** Absent on tournaments created before this shipped — treat as 'percentage'. */
  payoutUnit?: PayoutUnit;
  /** Absent on tournaments created before the sound picker shipped — treat as all 'none'. */
  sounds?: SoundSettings;
  /** Object path in the Supabase Storage `media` bucket (e.g. `background/uuid-name.jpg`). Absent/empty = flat background, no image. */
  projectorBackgroundId?: string;
  createdAt: string;
  status: TournamentStatus;
}
