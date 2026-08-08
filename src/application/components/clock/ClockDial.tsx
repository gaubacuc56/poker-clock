import { formatClock } from '@domain/rules/format';

/** Circumference of the r=140 track, to the precision the dash maths needs. */
const TRACK_LENGTH = 879.65;

/** Per-state colouring for the ring, its glow and the digits. */
const TONES = {
  normal: {
    stroke: 'stroke-accent',
    ringGlow: 'drop-shadow-[0_0_14px_rgba(245,197,66,.45)]',
    halo: 'bg-[radial-gradient(circle,rgba(245,197,66,.24)_0%,transparent_66%)]',
    digits: 'text-fg [text-shadow:0_0_38px_rgba(245,197,66,.22)]',
    colon: 'text-accent',
  },
  finished: {
    stroke: 'stroke-accent',
    ringGlow: 'drop-shadow-[0_0_14px_rgba(245,197,66,.45)]',
    halo: 'bg-[radial-gradient(circle,rgba(245,197,66,.34)_0%,transparent_66%)]',
    digits: 'text-fg [text-shadow:0_0_38px_rgba(245,197,66,.22)]',
    colon: 'text-accent',
  },
  break: {
    stroke: 'stroke-break',
    ringGlow: 'drop-shadow-[0_0_14px_rgba(92,201,193,.5)]',
    halo: 'bg-[radial-gradient(circle,rgba(92,201,193,.26)_0%,transparent_66%)]',
    digits: 'text-break [text-shadow:0_0_34px_rgba(92,201,193,.3)]',
    colon: 'text-break',
  },
  low: {
    stroke: 'stroke-coral',
    ringGlow: 'drop-shadow-[0_0_14px_rgba(255,107,90,.55)]',
    halo: 'bg-[radial-gradient(circle,rgba(255,107,90,.30)_0%,transparent_66%)] animate-[breathe_1s_ease-in-out_infinite]',
    digits: 'text-coral [text-shadow:0_0_34px_rgba(255,107,90,.38)]',
    colon: 'text-coral',
  },
} as const;

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
  const tone = TONES[
    isLowTime ? 'low' : isBreak ? 'break' : isFinished ? 'finished' : 'normal'
  ];

  // The arc is drawn by offsetting a full-circumference dash: no remaining time
  // means the whole length is offset out of view.
  const remainingFraction = isFinished
    ? 0
    : Math.min(1, Math.max(0, secondsRemaining / Math.max(1, durationSeconds)));

  const clock = formatClock(secondsRemaining);
  const showDigits = !isFinished && !isPaused;
  const digitClass = `display tabular-nums leading-[1.04] tracking-[-0.04em] ${
    isFinished ? 'text-[33px]' : 'text-[59px]'
  } ${tone.digits} ${
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
          <div className={digitClass}>
            {/* Keyed so each group replays its drop-in as it changes. */}
            <span
              key={clock.slice(0, 2)}
              className="inline-block animate-[tickin_.4s_cubic-bezier(.2,.8,.3,1)]"
            >
              {clock.slice(0, 2)}
            </span>
            <span
              className={`inline-block px-0.5 animate-[colonblink_1s_steps(1,end)_infinite] ${tone.colon}`}
            >
              :
            </span>
            <span
              key={clock.slice(3)}
              className="inline-block animate-[tickin_.4s_cubic-bezier(.2,.8,.3,1)]"
            >
              {clock.slice(3)}
            </span>
          </div>
        ) : (
          <div className={digitClass}>{isFinished ? 'FINISHED' : 'PAUSED'}</div>
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
