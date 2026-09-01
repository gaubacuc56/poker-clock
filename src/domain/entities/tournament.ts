import type { ScheduleRepeat } from '../rules/tournamentSchedule';
import type { BlindLevel } from './blinds';
import type { PayoutTier, PayoutUnit } from './payout';
import type { SoundSettings } from './sound';

export type TournamentStatus =
  | 'setup'
  | 'registering'
  | 'running'
  | 'paused'
  | 'finished';

/** A `currencies.code` value — the allowed set is database-controlled, not a fixed union. */
export type CurrencyUnit = string;

/**
 * How the projector arranges the same tournament data. `classic` is the
 * original three-column screen; the rest come from the design handoff.
 */
export type ProjectorLayout = 'classic' | 'ledger' | 'panel' | 'dial';

export const PROJECTOR_LAYOUTS: { id: ProjectorLayout; label: string; description: string }[] = [
  { id: 'classic', label: 'Classic', description: 'Stats left, clock centre, payouts right' },
  { id: 'ledger', label: 'Ledger', description: 'Gold brackets, draining level rail, level dots' },
  { id: 'panel', label: 'Panel', description: 'Stat rows with the clock on a raised panel' },
  { id: 'dial', label: 'Dial', description: 'Clock inside a draining ring' },
];

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
  /**
   * The last level late registration is open through. Also the level the
   * projector's "Reg End" line announces — one number, so the sign on the TV
   * and the rule the app enforces cannot disagree. 0 = nothing announced.
   */
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
  /** Which arrangement the TV draws. Absent = 'classic', the only layout before this shipped. */
  projectorLayout?: ProjectorLayout;
  /**
   * The schedule. `once` uses the instant; `weekly` uses the days and the time
   * of day and works the instant out per occurrence. See
   * `domain/rules/tournamentSchedule` — nothing outside it reads these directly.
   */
  scheduleRepeat?: ScheduleRepeat;
  tournamentStartAt?: string;
  scheduleWeekdays?: number[];
  startTime?: string;
  scheduleDismissedAt?: string;
  /**
   * When the operator opened the registration countdown, if they have. There is
   * no scheduled registration start any more — the doors open when somebody
   * opens them, within `REGISTRATION_LEAD_HOURS` of the start.
   */
  registrationOpenedAt?: string;
  /**
   * The wall-clock time `lateRegLevel` is expected at, as `HH:mm` — the other
   * half of the projector's "Reg End" announcement. A time of day with no date:
   * the room reads it off the wall, and a tournament that runs late simply
   * reaches the level late. Absent = the level is announced without a time.
   */
  regEndTime?: string;
  createdAt: string;
  status: TournamentStatus;
}
