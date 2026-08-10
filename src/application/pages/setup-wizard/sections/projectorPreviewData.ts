import { toCents } from '@domain/rules/money';
import type { ProjectorData } from '@domain/entities';

/**
 * The sample tournament the layout thumbnails are drawn from — a fixed,
 * mid-level snapshot rather than the draft being edited, so the previews stand
 * still while the form is filled in.
 *
 * The figures are chosen to exercise each layout rather than to be plausible:
 * six-figure blinds, a nine-place payout ladder and a long-ish name, so a
 * layout that can't hold its shape under real data shows that in the picker.
 * `backgroundPath` is supplied by the caller — the photo is a real choice made
 * on the same screen, and changing it is a deliberate act, not a keystroke.
 */
export const PREVIEW_TOURNAMENT: Omit<ProjectorData, 'backgroundPath' | 'layout'> = {
  tournamentName: 'Highroller 8max',
  currency: 'USD',
  entryPriceLines: [
    { label: 'Buy-in', amountCents: toCents(100) },
    { label: 'Re-buy', amountCents: toCents(100) },
  ],
  startingStack: 30_000,
  // Both halves set, so the previews show the "Reg End" line at full length.
  lateRegLevel: 8,
  regEndTime: '20:30',
  prizePool: toCents(4_800),
  payoutResults: [
    { position: 1, percentage: 30, amount: toCents(1_440) },
    { position: 2, percentage: 20, amount: toCents(960) },
    { position: 3, percentage: 14, amount: toCents(672) },
    { position: 4, percentage: 10, amount: toCents(480) },
    { position: 5, percentage: 8, amount: toCents(384) },
    { position: 6, percentage: 6, amount: toCents(288) },
    { position: 7, percentage: 4, amount: toCents(192) },
    // Equal places collapse into one "8 - 9" row, which the layouts must handle.
    { position: 8, percentage: 4, amount: toCents(192) },
    { position: 9, percentage: 4, amount: toCents(192) },
  ],
  currentLevel: {
    level: 7,
    smallBlind: 1_500,
    bigBlind: 3_000,
    ante: 3_000,
    isBigBlindAnte: false,
    durationSeconds: 1_200,
    isBreak: false,
  },
  nextLevel: {
    level: 8,
    smallBlind: 2_000,
    bigBlind: 4_000,
    ante: 4_000,
    isBigBlindAnte: false,
    durationSeconds: 1_200,
    isBreak: false,
  },
  // Two-thirds through the level, so the rail and the dial both show progress.
  secondsRemaining: 800,
  isPaused: false,
  remainingPlayers: 31,
  totalRegistered: 48,
  totalEntries: 62,
  rebuyCount: 14,
  totalStack: 1_860_000,
  avgStack: 60_000,
  nextBreakSeconds: 2_000,
  levelIndex: 6,
  levelCount: 14,
};
