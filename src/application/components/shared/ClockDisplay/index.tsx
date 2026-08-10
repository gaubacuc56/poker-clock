import type { BlindLevel } from '@domain/entities';
import { formatCompactNumber } from '@domain/rules/format';
import { formatBlinds, formatChipRaceLabel } from '@domain/rules/blindFormat';
import type { ProjectorTone } from '@domain/rules/projectorModel';
import { pu } from '@application/shared/projectorScale';
import {
  CHIP_RACE_SIZE,
  CLASSIC_TONES,
  DIGIT_TRACKING,
  LEVEL_TEXT_SIZE,
  NEXT_TEXT_SIZE,
} from './constants';

/**
 * Everything here comes pre-decided by the projector model rather than being
 * re-derived from the level, so the classic screen can't drift from the other
 * three on what a state looks like — which is exactly what it used to do.
 */
interface ClockDisplayProps {
  /** Only the blinds and ante figures are read off the level itself. */
  level: BlindLevel;
  /** The heading above the clock — the level, or the state that replaces it
   *  ("Registering", "Finished"). */
  levelLabel: string;
  /** Already formatted, so every layout's clock reads the same in every state. */
  clockText: string;
  /** Font size for the clock, in projector units — decided by the layout, which
   *  is where the per-state sizes live. */
  clockSize: number;
  showClock?: boolean;
  /** False on a break, and while registering — play hasn't opened, so no blinds
   *  are in force yet. */
  showBlinds: boolean;
  /** The "Next: …" line, already worded; empty when there is nothing after this. */
  nextText: string;
  tone: ProjectorTone;
  isFinished?: boolean;
}

/** The classic screen's centre column: level heading, countdown, blinds and
 *  what comes next. */
export default function ClockDisplay({
  level,
  levelLabel,
  clockText,
  clockSize,
  showClock = true,
  showBlinds,
  nextText,
  tone,
}: ClockDisplayProps) {
  const tones = CLASSIC_TONES[tone];

  return (
    <div className="flex flex-col items-center text-center">
      <p
        className="display font-bold uppercase tracking-[0.06em]"
        style={{ fontSize: pu(LEVEL_TEXT_SIZE) }}
      >
        {levelLabel}
      </p>

      {level.isBreak && level.chipRace && (
        <p
          className="font-semibold uppercase tracking-[0.06em] text-muted"
          style={{ fontSize: pu(CHIP_RACE_SIZE) }}
        >
          {formatChipRaceLabel(level)}
        </p>
      )}

      {showClock && (
        <p
          className={`display leading-none font-black tabular-nums [-webkit-text-stroke:0.02em_currentColor] ${tones.digits}`}
          style={{
            fontSize: pu(clockSize),
            letterSpacing: DIGIT_TRACKING,
            // Letter spacing is added after the last character too, which would
            // shove the centred line off to the left by that much.
            marginRight: `-${DIGIT_TRACKING}`,
          }}
        >
          {clockText}
        </p>
      )}

      <div className="flex flex-col self-stretch text-center" style={{ marginTop: pu(1) }}>
        {showBlinds && (
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

        {nextText && (
          <p className="text-muted" style={{ fontSize: pu(NEXT_TEXT_SIZE), marginTop: pu(0.75) }}>
            {nextText}
          </p>
        )}
      </div>
    </div>
  );
}
