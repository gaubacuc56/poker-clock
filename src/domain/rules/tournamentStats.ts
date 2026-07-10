import type { TournamentConfig } from '../entities';
import { calculateTotalChipsInPlay } from './prizePool';

export interface TournamentStats {
  totalRegistered: number;
  remainingPlayers: number;
  buyInCount: number;
  rebuyCount: number;
  addOnCount: number;
  totalEntries: number;
  totalStack: number;
  avgStack: number;
  lateRegLevel: number
  startingStack: number
}

export function computeTournamentStats(tournament: TournamentConfig): TournamentStats {
  const totalRegistered = tournament.entrantCount;
  const remainingPlayers = Math.max(
    0,
    tournament.entrantCount - tournament.eliminatedCount,
  );
  const buyInCount = totalRegistered;
  const totalEntries = buyInCount + tournament.rebuyCount;
  const totalStack = calculateTotalChipsInPlay(tournament);
  const avgStack = remainingPlayers > 0 ? totalStack / remainingPlayers : 0;
  const lateRegLevel = tournament.lateRegLevel
  const startingStack = tournament.startingStack
  return {
    totalRegistered,
    remainingPlayers,
    buyInCount,
    rebuyCount: tournament.rebuyCount,
    addOnCount: tournament.addOnCount,
    totalEntries,
    totalStack,
    avgStack,
    lateRegLevel,
    startingStack
  };
}

/** The average stack expressed in big blinds — 0 when there's no big blind to divide by (e.g. during a break). */
export function averageStackInBigBlinds(avgStack: number, bigBlind: number): number {
  return bigBlind > 0 ? Math.round(avgStack / bigBlind) : 0;
}
