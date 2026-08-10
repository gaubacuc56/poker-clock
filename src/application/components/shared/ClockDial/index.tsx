import { formatClock } from '@domain/rules/format';
import {
  BASE_CLOCK_LENGTH,
  DIAL_TONES,
  DIGIT_SIZE,
  FINISHED_SIZE,
  TRACK_LENGTH,
  type DialTone,
} from './constants';

interface ClockDialProps {
  secondsRemaining: number;
  /** Full length of the level the countdown belongs to — the arc is the ratio of the two. */
  durationSeconds: number;
  isPaused: boolean;
  isFinished: boolean;
  isBreak: boolean;
  /** Under a minute left on a play level: the whole dial goes coral and breathes. */
  isLowTime: boolean;
  /** Read out by screen readers instead of the silently-ticking digits. */
  announce: string;
  /** Quiet line under the digits, e.g. "of 20 min". */
  caption: string;
}

/**
 * The control screen's countdown: a ring that drains over the level, with the
 * digits at its centre. Mount it with a `key` that changes per level so the
 * whole dial replays its pop animation on every level change.
 */
export default function ClockDial({
  secondsRemaining,
  durationSeconds,
  isPaused,
  isFinished,
  isBreak,
  isLowTime,
  announce,
  caption,
}: ClockDialProps) {
  const tone = DIAL_TONES[dialTone({ isLowTime, isBreak, isFinished })];

  // The arc is drawn by offsetting a full-circumference dash: no remaining time
  // means the whole length is offset out of view.
  const remainingFraction = isFinished
    ? 0
    : Math.min(1, Math.max(0, secondsRemaining / Math.max(1, durationSeconds)));

  const clock = formatClock(secondsRemaining);
  const [minutes, seconds] = clock.split(':');
  const digitSize = isFinished ? FINISHED_SIZE : fittedDigitSize(clock);
  const showDigits = !isFinished && !isPaused;
  const digitClass = `display whitespace-nowrap tabular-nums leading-[1.04] tracking-[-0.04em] ${tone.digits} ${
    isLowTime ? 'animate-[cdpulse_1s_ease-in-out_infinite]' : 'animate-[lvlin_.45s_ease]'
  }`;

  return (
    <div
      role="timer"
      aria-atomic="true"
      className="relative grid aspect-square w-[250px] max-w-[76%] place-items-center animate-[ringpop_.5s_cubic-bezier(.2,.8,.3,1)]"
    >
      <div
        className={`pointer-events-none absolute -inset-[16%] rounded-full transition-[background] duration-700 ${tone.halo}`}
      />

      <svg
        viewBox="0 0 320 320"
        className="absolute inset-0 size-full overflow-visible"
        aria-hidden="true"
      >
        <circle cx="160" cy="160" r="140" fill="none" className="stroke-hair" strokeWidth="11" />
        {/* 60 ticks, one per minute of a clock face. */}
        <circle
          cx="160"
          cy="160"
          r="140"
          fill="none"
          className="stroke-line"
          strokeWidth="3"
          strokeDasharray="2 12.66"
          transform="rotate(-90 160 160)"
        />
        <circle
          cx="160"
          cy="160"
          r="140"
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={TRACK_LENGTH}
          strokeDashoffset={TRACK_LENGTH * (1 - remainingFraction)}
          transform="rotate(-90 160 160)"
          className={`transition-[stroke-dashoffset,stroke] duration-[400ms,600ms] ease-linear ${tone.stroke} ${tone.ringGlow}`}
        />
      </svg>

      <div className="relative flex flex-col items-center">
        {showDigits ? (
          <div className={digitClass} style={{ fontSize: digitSize }}>
            {/* Keyed so each group replays its drop-in as it changes. */}
            <span
              key={minutes}
              className="inline-block animate-[tickin_.4s_cubic-bezier(.2,.8,.3,1)]"
            >
              {minutes}
            </span>
            <span
              className={`inline-block px-0.5 animate-[colonblink_1s_steps(1,end)_infinite] ${tone.colon}`}
            >
              :
            </span>
            <span
              key={seconds}
              className="inline-block animate-[tickin_.4s_cubic-bezier(.2,.8,.3,1)]"
            >
              {seconds}
            </span>
          </div>
        ) : (
          <div className={digitClass} style={{ fontSize: digitSize }}>
            {isFinished ? 'FINISHED' : 'PAUSED'}
          </div>
        )}
        <div className="kicker mt-0.5 text-[13px] tracking-[.2em]">{caption}</div>
      </div>

      {/* The digits change every second; announce only the level and state. */}
      <span aria-live="polite" className="sr-only">
        {announce}
      </span>
    </div>
  );
}

/** Low time wins over a break, which wins over the finished state. */
function dialTone(state: { isLowTime: boolean; isBreak: boolean; isFinished: boolean }): DialTone {
  if (state.isLowTime) return 'low';
  if (state.isBreak) return 'break';
  return state.isFinished ? 'finished' : 'normal';
}

/**
 * Levels of an hour and a half or more push the minutes past two digits
 * ("120:00"), so the type shrinks in proportion to the extra characters and the
 * longer string still fits inside the ring.
 */
function fittedDigitSize(clock: string): number {
  return Math.round(DIGIT_SIZE * Math.min(1, BASE_CLOCK_LENGTH / clock.length));
}
