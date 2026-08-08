import {
  PROJECTOR_LAYOUTS,
  type BlindLevel,
  type PayoutTier,
  type PayoutUnit,
  type ProjectorLayout,
} from '@domain/entities';
import { calculatePayouts, hasPayouts } from '@domain/rules/payouts';
import { toCents } from '@domain/rules/money';
import ProjectorView from '../../../components/projector/ProjectorView';

interface ProjectorLayoutPickerProps {
  value: ProjectorLayout;
  onChange: (layout: ProjectorLayout) => void;
  /** Everything the preview needs to look like this tournament rather than a stock one. */
  tournamentName: string;
  currency: string;
  buyIn: string;
  startingStack: string;
  entrantCount: string;
  levels: BlindLevel[];
  tiers: PayoutTier[];
  payoutUnit: PayoutUnit;
  backgroundPath: string | undefined;
}

/**
 * The layout choice, as a radio group of live previews: each option renders the
 * real `ProjectorView` at thumbnail size with this tournament's own numbers.
 * The projector scales off container units, so a miniature is a faithful
 * picture of the TV rather than a drawing of one.
 */
export default function ProjectorLayoutPicker({
  value,
  onChange,
  tournamentName,
  currency,
  buyIn,
  startingStack,
  entrantCount,
  levels,
  tiers,
  payoutUnit,
  backgroundPath,
}: ProjectorLayoutPickerProps) {
  const preview = buildPreviewProps({
    tournamentName,
    currency,
    buyIn,
    startingStack,
    entrantCount,
    levels,
    tiers,
    payoutUnit,
    backgroundPath,
  });

  return (
    <div
      role="radiogroup"
      aria-label="Projector layout"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {PROJECTOR_LAYOUTS.map((layout) => {
        const isSelected = layout.id === value;
        return (
          <button
            key={layout.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(layout.id)}
            className={`flex cursor-pointer flex-col gap-2 rounded-card border-0 bg-surface p-2.5 text-left font-[inherit] text-inherit ring-1 ring-inset transition-shadow duration-150 ${
              isSelected ? 'shadow-lift-md ring-accent' : 'shadow-lift-sm ring-transparent'
            }`}
          >
            {/* `pointer-events-none` so the whole card stays one click target. */}
            <div className="pointer-events-none aspect-video overflow-hidden rounded-field bg-base-deep">
              <ProjectorView {...preview} layout={layout.id} />
            </div>
            <span className="flex items-center gap-2 px-0.5">
              <span
                className={`grid size-[18px] flex-none place-items-center rounded-full border-[1.5px] ${
                  isSelected ? 'border-accent' : 'border-hair-strong'
                }`}
              >
                {isSelected && <span className="size-2.5 rounded-full bg-accent" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-[18px]">{layout.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** A frozen, mid-level snapshot — enough real data that each layout previews honestly. */
function buildPreviewProps({
  tournamentName,
  currency,
  buyIn,
  startingStack,
  entrantCount,
  levels,
  tiers,
  payoutUnit,
  backgroundPath,
}: Omit<ProjectorLayoutPickerProps, 'value' | 'onChange'>) {
  const playLevels = levels.filter((level) => !level.isBreak);
  const currentLevel: BlindLevel = playLevels[1] ??
    playLevels[0] ?? {
      level: 1,
      smallBlind: 100,
      bigBlind: 200,
      ante: 0,
      durationSeconds: 1200,
      isBreak: false,
    };
  const levelIndex = Math.max(0, levels.indexOf(currentLevel));
  const entrants = Number(entrantCount) || 0;
  const prizePool = toCents(Number(buyIn) || 0) * entrants;

  return {
    tournamentName: tournamentName || 'Untitled Tournament',
    currency,
    backgroundPath,
    entryPriceLines: [{ label: 'Buy-in', amountCents: toCents(Number(buyIn) || 0) }],
    startingStack: Number(startingStack) || 0,
    prizePool,
    payoutResults: hasPayouts(tiers)
      ? calculatePayouts({ name: tournamentName, tiers }, prizePool, payoutUnit)
      : [],
    currentLevel,
    nextLevel: levels[levelIndex + 1],
    // Roughly two-thirds through the level, so the rail and dial show progress.
    secondsRemaining: Math.round(currentLevel.durationSeconds / 3),
    isPaused: false,
    remainingPlayers: Math.max(1, Math.round(entrants * 0.7)),
    totalRegistered: entrants,
    totalEntries: entrants,
    rebuyCount: 0,
    totalStack: (Number(startingStack) || 0) * entrants,
    avgStack: Number(startingStack) || 0,
    nextBreakSeconds: null,
    levelIndex,
    levelCount: levels.length,
  };
}
