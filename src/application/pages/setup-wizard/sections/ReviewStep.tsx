import type { EntryPriceLine } from '@domain/entities';
import { formatAmount } from '@domain/rules/format';
import {
  summarizeDraft,
  UNTITLED_TOURNAMENT_NAME,
  type DraftStructures,
  type TournamentDraft,
} from '@domain/rules/tournamentDraft';

interface ReviewStepProps {
  draft: TournamentDraft;
  structures: Pick<DraftStructures, 'blindLevels' | 'payoutTiers'>;
  entryPriceLines: EntryPriceLine[];
  /** Assigned on save, so a tournament being created for the first time has none yet. */
  joinCode: string | undefined;
}

/** The last step: the tournament card, then the draft read back row by row. */
export default function ReviewStep({
  draft,
  structures,
  entryPriceLines,
  joinCode,
}: ReviewStepProps) {
  const priceLine = entryPriceLines
    .map((line) => `${line.label} ${formatAmount(line.amountCents)}`)
    .join(' · ');

  return (
    <div>
      <div className="slab mb-[18px] flex flex-col rounded-[18px]">
        <div className="flex items-center gap-3.5 px-4 pt-4 pb-3.5">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] tracking-[.18em] uppercase text-accent">
              Your tournament
            </div>
            <div className="engrave display mt-1 truncate text-[24px]">
              {draft.name || UNTITLED_TOURNAMENT_NAME}
            </div>
            <div className="mt-0.5 text-[18px] text-faint">{priceLine}</div>
          </div>
          <div className="flex-none text-center">
            <div className="kicker mb-1 text-[12px]">Join code</div>
            <span className="plate text-[22px] text-accent-lift">{joinCode ?? '—'}</span>
          </div>
        </div>
        <div className="mx-3 border-t border-dashed border-hair-strong" />
        <div className="flex h-[45px] items-center px-4 text-[14px] text-muted">
          {joinCode
            ? 'Players type this code on the TV to open the projector.'
            : 'A join code is assigned as soon as the tournament is created.'}
        </div>
      </div>

      {summarizeDraft(draft, structures).map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-4 border-b border-hair px-0.5 py-[11px]"
        >
          <span className="text-[16px] text-muted">{row.label}</span>
          <span className="text-right text-[20px]">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
