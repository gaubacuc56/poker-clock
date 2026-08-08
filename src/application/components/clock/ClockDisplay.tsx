import type { BlindLevel } from '@domain/entities';
import { formatClock, formatCompactNumber } from '@domain/rules/format';
import { formatBlinds, formatBlindsLine, formatChipRaceLabel, formatLevelLabel } from '@domain/rules/blindFormat';
import { pu } from '../../shared/projectorScale';

/** The level/break heading above the clock and the blinds/ante lines below it
 *  are the same size, so the clock sits between two matching bands of text. */
const LEVEL_TEXT_SIZE = 4.2;

/** Under a minute left on a play level. */
const LOW_TIME_SECONDS = 60;

/** Per-state colouring, mirroring the control screen's dial so both surfaces
 *  read the same at a glance: gold running, teal on a break, coral running out. */
const TONES = {
  normal: { heading: 'text-accent', digits: 'text-fg [text-shadow:0_0_0.08em_rgba(245,197,66,.35)]' },
  break: { heading: 'text-break', digits: 'text-break [text-shadow:0_0_0.08em_rgba(92,201,193,.4)]' },
  low: { heading: 'text-coral', digits: 'text-coral [text-shadow:0_0_0.08em_rgba(255,107,90,.45)]' },
} as const;

interface ClockDisplayProps {
  level: BlindLevel;
  nextLevel?: BlindLevel;
  secondsRemaining: number;
  isPaused: boolean;
  /** When the tournament has ended, the countdown is replaced with "FINISHED". */
  isFinished?: boolean;
}

export default function ClockDisplay({
  level,
  nextLevel,
  secondsRemaining,
  isPaused,
  isFinished = false,
}: ClockDisplayProps) {
  const isLowTime =
    !isFinished &&
    !level.isBreak &&
    secondsRemaining > 0 &&
    secondsRemaining <= LOW_TIME_SECONDS;
  const tone = TONES[level.isBreak ? 'break' : isLowTime ? 'low' : 'normal'];

  return (
    <div className="flex flex-col items-center text-center">
      <p
        className={`display font-bold uppercase tracking-[0.06em] ${tone.heading}`}
        style={{ fontSize: pu(LEVEL_TEXT_SIZE) }}
      >
        {formatLevelLabel(level)}
      </p>

      {level.isBreak && level.chipRace && (
        <p
          className="font-semibold uppercase tracking-[0.06em] text-muted"
          style={{ fontSize: pu(2.8) }}
        >
          {formatChipRaceLabel(level)}
        </p>
      )}

      <p
        className={`display leading-none font-black tabular-nums tracking-[-0.03em] [-webkit-text-stroke:0.02em_currentColor] ${tone.digits}`}
        // "FINISHED" is a longer word than the countdown, so give it a smaller
        // size to keep it from overflowing the clock column.
        style={{ fontSize: isFinished ? pu(10) : pu(14) }}
      >
        {isFinished ? 'FINISHED' : isPaused ? 'PAUSED' : formatClock(secondsRemaining)}
      </p>

      <div
        className="flex flex-col self-stretch text-center"
        style={{ marginTop: pu(1) }}
      >
        {!level.isBreak && (
          <div className="flex flex-col" style={{ gap: pu(0.25) }}>
            <div
              className="flex items-baseline justify-between font-semibold"
              style={{ fontSize: pu(LEVEL_TEXT_SIZE) }}
            >
              <span className="tracking-[0.06em] text-faint">BLINDS :</span>
              <span className="display tabular-nums text-fg">{formatBlinds(level)}</span>
            </div>
            {level.ante > 0 && (
              <div
                className="flex items-baseline justify-between font-semibold"
                style={{ fontSize: pu(LEVEL_TEXT_SIZE) }}
              >
                <span className="tracking-[0.06em] text-faint">ANTE :</span>
                <span className="display tabular-nums text-fg">
                  {formatCompactNumber(level.ante)}
                </span>
              </div>
            )}
          </div>
        )}

        {nextLevel && (
          <p className="text-muted" style={{ fontSize: pu(3.4), marginTop: pu(0.75) }}>
            Next: {nextLevel.isBreak ? formatLevelLabel(nextLevel) : formatBlindsLine(nextLevel)}
          </p>
        )}
      </div>
    </div>
  );
}
