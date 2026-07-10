import type { TournamentConfig } from '../entities';

export interface EntryPriceLine {
  label: string;
  amountCents: number;
}

/** Buy-in is always shown; rebuy/add-on only appear when the tournament allows them, falling back to the buy-in price when their own price isn't set. */
export function getEntryPriceLines(
  tournament: Pick<
    TournamentConfig,
    'buyIn' | 'allowRebuy' | 'rebuyPrice' | 'allowAddOn' | 'addOnPrice'
  >,
): EntryPriceLine[] {
  const lines: EntryPriceLine[] = [{ label: 'Buyin', amountCents: tournament.buyIn }];
  if (tournament.allowRebuy) {
    lines.push({ label: 'Rebuy', amountCents: tournament.rebuyPrice ?? tournament.buyIn });
  }
  if (tournament.allowAddOn) {
    lines.push({ label: 'Addons', amountCents: tournament.addOnPrice ?? tournament.buyIn });
  }
  return lines;
}
