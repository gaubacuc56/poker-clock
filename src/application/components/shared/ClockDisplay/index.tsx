import type { BlindLevel } from '@domain/entities';
import { formatCompactNumber } from '@domain/rules/format';
import {
  formatBlinds,
  formatBlindsLine,
  formatChipRaceLabel,
  formatLevelLabel,
} from '@domain/rules/blindFormat';
import type { ProjectorTone } from '@domain/rules/projectorModel';
import { pu } from '@application/shared/projectorScale';
import {
  CHIP_RACE_SIZE,
  CLASSIC_TONES,
  CLOCK_SIZE,
  DIGIT_TRACKING,
  FINISHED_CLOCK_SIZE,
  LEVEL_TEXT_SIZE,
  NEXT_TEXT_SIZE,
} from './constants';

interface ClockDisplayProps {
  level: BlindLevel;
  nextLevel?: BlindLevel;
  /** Already formatted by the projector model, so every layout's clock reads
   *  the same in every state. */
  clockText: string;
  tone: ProjectorTone;
  isFinished?: boolean;
}

/** The classic screen's centre column: level heading, countdown, blinds and
 *  what comes next. */
export default function ClockDisplay({
  level,
  nextLevel,
  clockText,
  tone,
  isFinished = false,
}: ClockDisplayProps) {
  const tones = CLASSIC_TONES[tone];

  return (
    <div className="flex flex-col items-center text-center">
      <p
        className="display font-bold uppercase tracking-[0.06em]"
        style={{ fontSize: pu(LEVEL_TEXT_SIZE) }}
      >
        {formatLevelLabel(level)}
      </p>

      {level.isBreak && level.chipRace && (
        <p
          className="font-semibold uppercase tracking-[0.06em] text-muted"
          style={{ fontSize: pu(CHIP_RACE_SIZE) }}
        >
          {formatChipRaceLabel(level)}
        </p>
      )}

      <p
        className={`display leading-none font-black tabular-nums [-webkit-text-stroke:0.02em_currentColor] ${tones.digits}`}
        style={{
          fontSize: pu(isFinished ? FINISHED_CLOCK_SIZE : CLOCK_SIZE),
          letterSpacing: DIGIT_TRACKING,
          // Letter spacing is added after the last character too, which would
          // shove the centred line off to the left by that much.
          marginRight: `-${DIGIT_TRACKING}`,
        }}
      >
        {clockText}
      </p>

      <div className="flex flex-col self-stretch text-center" style={{ marginTop: pu(1) }}>
        {!level.isBreak && (
          <div className="flex flex-col" style={{ gap: pu(0.25) }}>
            <div
              className="flex items-baseline justify-between font-semibold"
              style={{ fontSize: pu(LEVEL_TEXT_SIZE) }}
            >
              <span className="tracking-[0.06em]">BLINDS :</span>
              <span className={`display tabular-nums ${tones.heading}`}>{formatBlinds(level)}</span>
            </div>
            {level.ante > 0 && (
              <div
                className="flex items-baseline justify-between font-semibold"
                style={{ fontSize: pu(LEVEL_TEXT_SIZE) }}
              >
                <span className="tracking-[0.06em]">ANTE :</span>
                <span className={`display tabular-nums ${tones.heading}`}>
                  {formatCompactNumber(level.ante)}
                </span>
              </div>
            )}
          </div>
        )}

        {nextLevel && (
          <p className="text-muted" style={{ fontSize: pu(NEXT_TEXT_SIZE), marginTop: pu(0.75) }}>
            Next: {nextLevel.isBreak ? formatLevelLabel(nextLevel) : formatBlindsLine(nextLevel)}
          </p>
        )}
      </div>
    </div>
  );
}
