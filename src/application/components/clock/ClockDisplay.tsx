import type { BlindLevel } from '@domain/entities';
import { formatClock, formatCompactNumber } from '@domain/rules/format';
import { formatBlinds, formatBlindsLine, formatChipRaceLabel, formatLevelLabel } from '@domain/rules/blindFormat';
import { pu } from '../../shared/projectorScale';

/** The level/break heading above the clock and the blinds/ante lines below it
 *  are the same size, so the clock sits between two matching bands of text. */
const LEVEL_TEXT_SIZE = 4.2;

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
  return (
    <div className="flex flex-col items-center text-center text-white">
      <p
        className="font-bold uppercase tracking-wide"
        style={{ fontSize: pu(LEVEL_TEXT_SIZE) }}
      >
        {formatLevelLabel(level)}
      </p>

      {level.isBreak && level.chipRace && (
        <p
          className="font-semibold uppercase tracking-wide"
          style={{ fontSize: pu(2.8) }}
        >
          {formatChipRaceLabel(level)}
        </p>
      )}

      <p
        className="font-mono font-black leading-none tabular-nums"
        style={{
          // "FINISHED" is a longer word than the countdown, so give it a
          // smaller size to keep it from overflowing the clock column.
          fontSize: isFinished ? pu(10) : pu(14),
          WebkitTextStroke: '0.02em currentColor',
        }}
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
              <span>BLINDS :</span>
              <span>{formatBlinds(level)}</span>
            </div>
            {level.ante > 0 && (
              <div
                className="flex items-baseline justify-between font-semibold"
                style={{ fontSize: pu(LEVEL_TEXT_SIZE) }}
              >
                <span>ANTE :</span>
                <span>{formatCompactNumber(level.ante)}</span>
              </div>
            )}
          </div>
        )}

        {nextLevel && (
          <p style={{ fontSize: pu(3.4), marginTop: pu(0.75) }}>
            Next: {nextLevel.isBreak ? formatLevelLabel(nextLevel) : formatBlindsLine(nextLevel)}
          </p>
        )}
      </div>
    </div>
  );
}
