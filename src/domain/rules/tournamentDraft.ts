import {
  DEFAULT_SOUND_SETTINGS,
  type BlindLevel,
  type CurrencyUnit,
  type PayoutTier,
  type PayoutUnit,
  type ProjectorLayout,
  type SoundSettings,
  type TournamentConfig,
} from '../entities';
import { DEFAULT_CURRENCY } from '../constants/tournament';
import { SILENT_SOUND_ID, SOUND_TRIGGERS } from '../constants/sound';
import { normalizeBlindLevels } from './blindStructureEditor';
import { formatNumber } from './format';
import { fromCents, toCents } from './money';
import { DEFAULT_ENTRANT_COUNT } from './tournamentLifecycle';
import {
  formatRegistrationEnd,
  formatScheduleTime,
  scheduleIsoToLocal,
  scheduleLocalToIso,
  WEEKDAY_LABELS,
  type ScheduleRepeat,
} from './tournamentSchedule';

/**
 * A tournament part-way through being written down.
 *
 * Every numeric field is a string because the wizard's inputs are text: a
 * half-typed buy-in is "2", and "" is a field the organiser hasn't answered
 * rather than a zero. The conversion to and from the real `TournamentConfig` —
 * cents, defaults, which optional fields are dropped when empty — is the
 * business logic below, kept off the form so both directions stay in step.
 */
export interface TournamentDraft {
  name: string;
  buyIn: string;
  fee: string;
  currency: CurrencyUnit;
  allowRebuy: boolean;
  allowAddOn: boolean;
  rebuyPrice: string;
  addOnPrice: string;
  startingStack: string;
  maxPlayersPerTable: string;
  entrantCount: string;
  lateRegLevel: string;
  guaranteedPrizePool: string;
  /** Which shape the schedule fields below are read as. */
  scheduleRepeat: ScheduleRepeat;
  /** `once`: a `datetime-local` value, UTC+7 wall time as typed. */
  tournamentStart: string;
  /** `weekly`: days (0 = Sunday) and one `HH:mm` time of day, UTC+7. */
  scheduleWeekdays: number[];
  startTime: string;
  /** The `HH:mm` the room expects `lateRegLevel` at — the other half of the
   *  projector's "Reg End" line. Blank when it isn't announced. */
  regEndTime: string;
  sounds: SoundSettings;
  projectorBackgroundId: string;
  projectorLayout: ProjectorLayout;
}

/** The background id a brand-new draft starts on, before the real list loads. */
export const UNSET_BACKGROUND_ID = 'default';

/** What a new tournament is pre-filled with — the shape of a typical home game. */
export function createEmptyDraft(): TournamentDraft {
  return {
    name: '',
    buyIn: '20',
    fee: '0',
    currency: DEFAULT_CURRENCY,
    allowRebuy: false,
    allowAddOn: false,
    rebuyPrice: '20',
    addOnPrice: '20',
    startingStack: '10000',
    maxPlayersPerTable: '9',
    entrantCount: String(DEFAULT_ENTRANT_COUNT),
    lateRegLevel: '4',
    guaranteedPrizePool: '',
    scheduleRepeat: 'once',
    tournamentStart: '',
    scheduleWeekdays: [],
    startTime: '',
    regEndTime: '',
    sounds: { ...DEFAULT_SOUND_SETTINGS },
    projectorBackgroundId: UNSET_BACKGROUND_ID,
    projectorLayout: 'classic',
  };
}

/** An existing tournament reopened for editing, back in the wizard's terms. */
export function draftFromTournament(tournament: TournamentConfig): TournamentDraft {
  return {
    name: tournament.name,
    buyIn: String(fromCents(tournament.buyIn)),
    fee: String(fromCents(tournament.fee)),
    currency: tournament.currency ?? DEFAULT_CURRENCY,
    allowRebuy: tournament.allowRebuy,
    allowAddOn: tournament.allowAddOn,
    rebuyPrice: String(fromCents(tournament.rebuyPrice ?? tournament.buyIn)),
    addOnPrice: String(fromCents(tournament.addOnPrice ?? tournament.buyIn)),
    startingStack: String(tournament.startingStack),
    maxPlayersPerTable: String(tournament.maxPlayersPerTable),
    entrantCount: String(tournament.entrantCount),
    lateRegLevel: String(tournament.lateRegLevel),
    // An absent guarantee is an empty field, not a zero — the two mean
    // different things on the way back out.
    guaranteedPrizePool: tournament.guaranteedPrizePool
      ? String(fromCents(tournament.guaranteedPrizePool))
      : '',
    scheduleRepeat: tournament.scheduleRepeat ?? 'once',
    tournamentStart: scheduleIsoToLocal(tournament.tournamentStartAt),
    scheduleWeekdays: [...(tournament.scheduleWeekdays ?? [])],
    startTime: tournament.startTime ?? '',
    regEndTime: tournament.regEndTime ?? '',
    sounds: { ...DEFAULT_SOUND_SETTINGS, ...tournament.sounds },
    projectorBackgroundId: tournament.projectorBackgroundId || UNSET_BACKGROUND_ID,
    projectorLayout: tournament.projectorLayout ?? 'classic',
  };
}

/** The guarantee in cents, or 0 when the organiser left it blank. */
export function draftGuaranteeCents(draft: TournamentDraft): number {
  return draft.guaranteedPrizePool ? toCents(Number(draft.guaranteedPrizePool)) : 0;
}

export interface DraftStructures {
  blindLevels: BlindLevel[];
  payoutTiers: PayoutTier[];
  payoutUnit: PayoutUnit;
}

/** The name a tournament is saved under when the organiser never gave it one. */
export const UNTITLED_TOURNAMENT_NAME = 'Untitled Tournament';

/**
 * The draft as a real tournament, ready to save.
 *
 * `existing` carries over everything the wizard doesn't ask about — the id,
 * join code, live counters and creation time — so editing a running tournament
 * never resets its progress. Absent, this mints a new tournament instead.
 */
export function draftToTournament(
  draft: TournamentDraft,
  structures: DraftStructures,
  existing: TournamentConfig | undefined,
  newId: () => string,
  now: () => string,
): TournamentConfig {
  return {
    id: existing?.id ?? newId(),
    joinCode: existing?.joinCode,
    name: draft.name || UNTITLED_TOURNAMENT_NAME,
    buyIn: toCents(Number(draft.buyIn)),
    fee: toCents(Number(draft.fee)),
    currency: draft.currency,
    startingStack: Number(draft.startingStack),
    maxPlayersPerTable: Number(draft.maxPlayersPerTable),
    entrantCount: Number(draft.entrantCount),
    eliminatedCount: existing?.eliminatedCount ?? 0,
    rebuyCount: existing?.rebuyCount ?? 0,
    addOnCount: existing?.addOnCount ?? 0,
    lateRegLevel: Number(draft.lateRegLevel),
    allowRebuy: draft.allowRebuy,
    allowAddOn: draft.allowAddOn,
    // A price for a mode that's switched off is dropped, not kept at its last
    // value — it would otherwise reappear if the mode is switched back on.
    rebuyPrice: draft.allowRebuy ? toCents(Number(draft.rebuyPrice)) : undefined,
    addOnPrice: draft.allowAddOn ? toCents(Number(draft.addOnPrice)) : undefined,
    guaranteedPrizePool: draft.guaranteedPrizePool
      ? toCents(Number(draft.guaranteedPrizePool))
      : undefined,
    blindLevels: normalizeBlindLevels(structures.blindLevels),
    payoutTiers: structures.payoutTiers,
    payoutUnit: structures.payoutUnit,
    sounds: draft.sounds,
    projectorBackgroundId: draft.projectorBackgroundId || undefined,
    projectorLayout: draft.projectorLayout,
    // Only the half that matches the chosen shape is written, so switching
    // between them can't leave a stale dated occurrence behind a weekly one.
    scheduleRepeat: draft.scheduleRepeat,
    tournamentStartAt:
      draft.scheduleRepeat === 'once' ? scheduleLocalToIso(draft.tournamentStart) : undefined,
    scheduleWeekdays: draft.scheduleRepeat === 'weekly' ? [...draft.scheduleWeekdays] : [],
    startTime: draft.scheduleRepeat === 'weekly' ? draft.startTime || undefined : undefined,
    // Both carried, never edited: one records what the admin already dismissed,
    // the other that they already opened the doors on the run in play.
    scheduleDismissedAt: existing?.scheduleDismissedAt,
    registrationOpenedAt: existing?.registrationOpenedAt,
    regEndTime: draft.regEndTime || undefined,
    createdAt: existing?.createdAt ?? now(),
    status: existing?.status ?? 'setup',
  };
}

export interface DraftSummaryRow {
  label: string;
  value: string;
}

/** The review step: the draft read back as plain sentences, in save order. */
export function summarizeDraft(
  draft: TournamentDraft,
  structures: Pick<DraftStructures, 'blindLevels' | 'payoutTiers'>,
): DraftSummaryRow[] {
  const breakCount = structures.blindLevels.filter((level) => level.isBreak).length;
  const configuredSounds = Object.values(draft.sounds).filter(
    (sound) => sound !== SILENT_SOUND_ID,
  ).length;

  return [
    { label: 'Name', value: draft.name || UNTITLED_TOURNAMENT_NAME },
    // Both schedule rows are dropped when unset rather than shown as "—": an
    // unscheduled tournament has no schedule to review, not a blank one.
    ...scheduleRows(draft),
    {
      label: 'Buy-in + fee',
      value: `${formatNumber(Number(draft.buyIn))} + ${formatNumber(Number(draft.fee))} ${draft.currency}`,
    },
    { label: 'Entrants', value: formatNumber(Number(draft.entrantCount)) },
    {
      label: 'Rebuys',
      value: draft.allowRebuy
        ? `${formatNumber(Number(draft.rebuyPrice))} ${draft.currency}`
        : 'None',
    },
    {
      label: 'Add-ons',
      value: draft.allowAddOn
        ? `${formatNumber(Number(draft.addOnPrice))} ${draft.currency}`
        : 'None',
    },
    {
      label: 'Blind levels',
      value: `${structures.blindLevels.length - breakCount} levels · ${breakCount} breaks`,
    },
    { label: 'Payout places', value: String(structures.payoutTiers.length) },
    {
      label: 'Sounds',
      value: `${configuredSounds} of ${SOUND_TRIGGERS.length} sounds configured`,
    },
  ];
}

function scheduleRows(draft: TournamentDraft): DraftSummaryRow[] {
  const rows: DraftSummaryRow[] = [];

  if (draft.scheduleRepeat === 'weekly') {
    if (draft.scheduleWeekdays.length > 0 && draft.startTime) {
      // Listed in week order however they were clicked.
      const days = [...draft.scheduleWeekdays]
        .sort((a, b) => a - b)
        .map((day) => WEEKDAY_LABELS[day])
        .join(', ');
      rows.push({ label: 'Every week', value: days });
      rows.push({ label: 'Start time', value: draft.startTime });
    }
    return rows;
  }

  const start = formatScheduleTime(scheduleLocalToIso(draft.tournamentStart));
  if (start) rows.push({ label: 'Tournament starts', value: start });

  const regEnd = formatRegistrationEnd(Number(draft.lateRegLevel) || undefined, draft.regEndTime);
  if (regEnd) rows.push({ label: 'Registration ends', value: regEnd });
  return rows;
}
