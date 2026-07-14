import type { BlindLevel } from '@domain/entities';
import { formatClock, formatNumber } from '@domain/rules/format';
import { formatBlinds, formatBlindsLine, formatChipRaceLabel, formatLevelLabel } from '@domain/rules/blindFormat';

interface ClockDisplayProps {
  level: BlindLevel;
  nextLevel?: BlindLevel;
  secondsRemaining: number;
  isPaused: boolean;
}

export default function ClockDisplay({
  level,
  nextLevel,
  secondsRemaining,
  isPaused,
}: ClockDisplayProps) {
  return (
    <div className="flex flex-col items-center text-center text-white">
      <p
        className="font-bold uppercase tracking-wide"
        style={{ fontSize: level.isBreak ? 'clamp(1.5rem, 4vw, 5rem)': 'clamp(1.5rem, 3.2vw, 4.5rem)' }}
      >
        {formatLevelLabel(level)}
      </p>

      {level.isBreak && level.chipRace && (
        <p
          className="font-semibold uppercase tracking-wide"
          style={{ fontSize: 'clamp(1.25rem, 2.8vw, 4.5rem)' }}
        >
          {formatChipRaceLabel(level)}
        </p>
      )}

      <p
        className="font-mono font-bold leading-none tabular-nums"
        style={{ fontSize: 'clamp(6rem, 16vw, 18rem)' }}
      >
        {isPaused ? 'PAUSED' : formatClock(secondsRemaining)}
      </p>

      <div className="mt-4 flex flex-col self-stretch text-center">
        {!level.isBreak && (
          <div className="flex flex-col gap-1">
            <div
              className="flex items-baseline justify-between font-semibold"
              style={{ fontSize: 'clamp(1.75rem, 3.8vw, 5rem)' }}
            >
              <span>BLINDS :</span>
              <span>{formatBlinds(level)}</span>
            </div>
            {level.ante > 0 && (
              <div
                className="flex items-baseline justify-between font-semibold"
                style={{ fontSize: 'clamp(1.75rem, 3.8vw, 5rem)' }}
              >
                <span>ANTE :</span>
                <span>{formatNumber(level.ante)}</span>
              </div>
            )}
          </div>
        )}

        {nextLevel && (
          <p className="mt-3" style={{ fontSize: 'clamp(2rem, 2.5vw, 5rem)' }}>
            Next: {nextLevel.isBreak ? formatLevelLabel(nextLevel) : formatBlindsLine(nextLevel)}
          </p>
        )}
      </div>
    </div>
  );
}
