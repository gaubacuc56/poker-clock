import type { BlindLevel } from '@domain/entities';
import { formatClock, formatNumber } from '@domain/rules/format';

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
        style={{ fontSize: 'clamp(1.5rem, 3.2vw, 4.5rem)' }}
      >
        {level.isBreak ? (level.breakLabel ?? 'Break') : `Level ${level.level}`}
      </p>

      <p
        className="font-mono font-bold leading-none tabular-nums"
        style={{ fontSize: 'clamp(6rem, 17vw, 19rem)' }}
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
            Next: {nextLevel.isBreak ? (nextLevel.breakLabel ?? 'Break') : formatNextLine(nextLevel)}
          </p>
        )}
      </div>
    </div>
  );
}

function formatBlinds(level: BlindLevel): string {
  return `${formatNumber(level.smallBlind)} / ${formatNumber(level.bigBlind)}`;
}

function formatNextLine(level: BlindLevel): string {
  const parts = [formatNumber(level.smallBlind), formatNumber(level.bigBlind)];
  if (level.ante > 0) parts.push(formatNumber(level.ante));
  return parts.join('/');
}
