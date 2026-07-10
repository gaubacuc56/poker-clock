import type { TournamentConfig } from '../entities';

/** Total paid entries — buy-ins plus rebuys/add-ons, regardless of what each cost. */
function paidEntryCount(tournament: TournamentConfig): number {
  return tournament.entrantCount + tournament.rebuyCount + tournament.addOnCount;
}

/** Money actually paid in: buy-ins at buyIn, rebuys/add-ons at their own price (or buyIn if unset). */
function totalMoneyIn(tournament: TournamentConfig): number {
  const rebuyPrice = tournament.rebuyPrice ?? tournament.buyIn;
  const addOnPrice = tournament.addOnPrice ?? tournament.buyIn;
  return (
    tournament.entrantCount * tournament.buyIn +
    tournament.rebuyCount * rebuyPrice +
    tournament.addOnCount * addOnPrice
  );
}

/** When a guarantee is set, it IS the prize pool — no entrant/buy-in math involved. Only falls back to computing from entries when there's no guarantee at all. */
export function calculatePrizePoolForTournament(tournament: TournamentConfig): number {
  if (tournament.guaranteedPrizePool != null) return tournament.guaranteedPrizePool;
  return totalMoneyIn(tournament);
}

/** Rebuys/add-ons are assumed to grant the same starting stack as an initial buy-in. */
export function calculateTotalChipsInPlay(tournament: TournamentConfig): number {
  return paidEntryCount(tournament) * tournament.startingStack;
}
