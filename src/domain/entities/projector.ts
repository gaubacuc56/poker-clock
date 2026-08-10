import type { BlindLevel } from './blinds';
import type { PayoutResult } from './payout';
import type { ProjectorLayout } from './tournament';
import type { RegistrationWindow } from '../rules/tournamentSchedule';

/** One "Buy-in £20" / "Re-buy £20" entry on the projector's price line. */
export interface EntryPriceLine {
  label: string;
  amountCents: number;
}

/**
 * Everything the projector screen draws, in the terms the tournament is kept
 * in rather than the terms a layout draws it in.
 *
 * This lives in the domain because the projector page, the capture frame and
 * the setup-wizard preview all assemble one, and because the model built from
 * it is domain logic. Nothing here is a React or CSS concept.
 */
export interface ProjectorData {
  tournamentName: string;
  currency: string;
  backgroundPath: string | undefined;
  entryPriceLines: EntryPriceLine[];
  startingStack: number;
  /** Last level late registration is open through — 0 when nothing is
   *  announced — and the wall-clock time (`HH:mm`) it is expected at. */
  lateRegLevel: number;
  regEndTime?: string;
  prizePool: number;
  payoutResults: PayoutResult[];
  currentLevel: BlindLevel;
  nextLevel: BlindLevel | undefined;
  secondsRemaining: number;
  isPaused: boolean;
  /** The tournament has ended — the clock shows "FINISHED" instead of a countdown. */
  isFinished?: boolean;
  registration?: RegistrationWindow;
  remainingPlayers: number;
  totalRegistered: number;
  totalEntries: number;
  rebuyCount: number;
  totalStack: number;
  avgStack: number;
  nextBreakSeconds: number | null;
  /** Position of the current entry in the blind structure, and how many entries there are — the level-dot strip. */
  levelIndex: number;
  levelCount: number;
  /** Which arrangement to draw. Absent = the classic three-column screen. */
  layout?: ProjectorLayout;
}
