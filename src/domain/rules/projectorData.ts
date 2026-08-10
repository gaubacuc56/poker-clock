import type {
  BlindLevel,
  BlindStructure,
  PayoutResult,
  PayoutStructure,
  ProjectorData,
  TournamentConfig,
} from '../entities';
import { DEFAULT_CURRENCY } from '../constants/tournament';
import { getEntryPriceLines } from './entryPricing';
import { calculatePayouts, hasPayouts } from './payouts';
import { calculatePrizePoolForTournament } from './prizePool';
import { computeTournamentStats } from './tournamentStats';
import type { RegistrationWindow } from './tournamentSchedule';

/**
 * The payout ladder for a tournament at its current prize pool, or an empty
 * ladder when no tier actually pays anything.
 */
export function calculateTournamentPayouts(
  tournament: TournamentConfig,
  prizePool: number,
): PayoutResult[] {
  if (!hasPayouts(tournament.payoutTiers)) return [];
  const structure: PayoutStructure = { name: tournament.name, tiers: tournament.payoutTiers };
  return calculatePayouts(structure, prizePool, tournament.payoutUnit);
}

/** The clock state the projector is drawn from, however the caller obtained it. */
export interface ProjectorClockSnapshot {
  structure: BlindStructure | undefined;
  currentLevel: BlindLevel;
  nextLevel: BlindLevel | undefined;
  secondsRemaining: number;
  nextBreakSeconds: number | null;
  activeLevelIndex: number;
  isPaused: boolean;
  isFinished: boolean;
  registration?: RegistrationWindow;
}

/**
 * Assembles everything the projector screen draws from a tournament and its
 * clock.
 *
 * Both surfaces that render a projector — the live projector page and the
 * control page's capture frame — need exactly this, derived exactly this way.
 * Building it here is what keeps a captured image and the TV it was captured
 * from showing the same numbers.
 *
 * `backgroundPath` is passed in rather than resolved here: which file a
 * background id maps to is a wiring concern, not a tournament rule.
 */
export function buildProjectorData(
  tournament: TournamentConfig,
  clock: ProjectorClockSnapshot,
  backgroundPath: string | undefined,
): ProjectorData {
  const prizePool = calculatePrizePoolForTournament(tournament);
  const { totalRegistered, remainingPlayers, rebuyCount, totalEntries, totalStack, avgStack } =
    computeTournamentStats(tournament);

  return {
    tournamentName: tournament.name,
    currency: tournament.currency ?? DEFAULT_CURRENCY,
    backgroundPath,
    entryPriceLines: getEntryPriceLines(tournament),
    startingStack: tournament.startingStack,
    lateRegLevel: tournament.lateRegLevel,
    regEndTime: tournament.regEndTime,
    prizePool,
    payoutResults: calculateTournamentPayouts(tournament, prizePool),
    currentLevel: clock.currentLevel,
    nextLevel: clock.nextLevel,
    secondsRemaining: clock.secondsRemaining,
    isPaused: clock.isPaused,
    isFinished: clock.isFinished,
    registration: clock.registration,
    remainingPlayers,
    totalRegistered,
    totalEntries,
    rebuyCount,
    totalStack,
    avgStack,
    nextBreakSeconds: clock.nextBreakSeconds,
    levelIndex: clock.activeLevelIndex,
    levelCount: clock.structure?.levels.length ?? 0,
    layout: tournament.projectorLayout,
  };
}
