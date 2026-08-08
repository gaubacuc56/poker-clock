import { formatMoney } from '@domain/rules/format';
import { pu } from '../../../shared/projectorScale';
import ClubLogo from '../ClubLogo';
import { buildProjectorModel } from '../projectorData';
import type { ProjectorViewProps } from '../ProjectorView';

/** Circumference of the r=140 track, to the precision the dash maths needs. */
const TRACK_LENGTH = 879.65;

/**
 * C · Dial — the control screen's ring, at projector scale: hairline track,
 * 60-tick ring and a progress arc that turns coral in the last minute and teal
 * on a break. Stats on gold spines left, prize pool and payouts right.
 */
export default function DialLayout(props: ProjectorViewProps) {
  const m = buildProjectorModel(props);
  const { tournamentName, currency, prizePool, isFinished = false } = props;

  return (
    <div
      className="absolute inset-0 grid"
      style={{
        gridTemplateColumns: 'minmax(0,25fr) minmax(0,50fr) minmax(0,25fr)',
        gridTemplateRows: 'minmax(0,1fr)',
        alignItems: 'stretch',
        padding: `${pu(3)} ${pu(4)}`,
        color: 'var(--pj-ink)',
      }}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex flex-none items-center" style={{ height: pu(7) }}>
          <ClubLogo />
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-around">
          {m.stats.map((stat) => (
            <div key={stat.label} className="flex items-center" style={{ gap: pu(1.2) }}>
              <span
                style={{
                  width: pu(0.35),
                  height: pu(3),
                  borderRadius: '999px',
                  background: 'var(--pj-gold-dim)',
                }}
              />
              <span className="flex-1">
                <span
                  className="block uppercase"
                  style={{ fontSize: pu(1.4), letterSpacing: '.2em', color: 'var(--pj-faint)' }}
                >
                  {stat.label}
                </span>
                <span
                  className="display block tabular-nums"
                  style={{ fontSize: pu(3.2), fontWeight: 600, lineHeight: 1.05 }}
                >
                  {stat.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden">
        <div
          className="display max-w-full flex-none truncate text-center"
          style={{ fontSize: pu(2.6), fontWeight: 600 }}
        >
          {tournamentName}
        </div>
        <div
          className="flex max-w-full flex-none flex-wrap justify-center"
          style={{
            gap: pu(1.4),
            marginTop: pu(0.5),
            fontSize: pu(1.5),
            color: 'var(--pj-dim)',
            letterSpacing: '.06em',
          }}
        >
          {m.priceLine}
        </div>

        <div
          className="relative flex-none"
          style={{ width: pu(36), height: pu(36), marginTop: pu(0.8) }}
        >
          <svg
            viewBox="0 0 320 320"
            className="absolute inset-0 size-full"
            style={{ transform: 'rotate(-90deg)' }}
            aria-hidden="true"
          >
            <circle cx="160" cy="160" r="140" fill="none" stroke="var(--pj-hair)" strokeWidth="10" />
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke="var(--pj-gold-dim)"
              strokeWidth="2"
              strokeDasharray="2 12.66"
            />
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke={m.accentColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={TRACK_LENGTH}
              strokeDashoffset={TRACK_LENGTH * m.elapsedFraction}
              style={{ transition: 'stroke-dashoffset .5s linear' }}
            />
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ gap: pu(0.4) }}
          >
            <div
              className="uppercase whitespace-nowrap"
              style={{ fontSize: pu(1.6), letterSpacing: '.24em', color: m.levelColor }}
            >
              {m.levelLabel}
            </div>
            <div
              key={m.levelKey}
              className="display tabular-nums whitespace-nowrap"
              style={{
                fontSize: isFinished ? pu(4.6) : pu(7.8),
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: '-.04em',
                color: m.clockColor,
                animation: m.isLowTime ? 'cdpulse 1s ease-in-out infinite' : 'lvlin .5s ease',
              }}
            >
              {m.clockText}
            </div>
            {m.chipRaceLine && (
              <div
                className="uppercase"
                style={{ fontSize: pu(1.4), letterSpacing: '.16em', color: 'var(--color-break)' }}
              >
                {m.chipRaceLine}
              </div>
            )}
          </div>
        </div>

        {m.showBlinds && (
          <div
            className="display flex items-baseline justify-center tabular-nums whitespace-nowrap"
            style={{ gap: pu(1.8), marginTop: pu(1.2), fontSize: pu(3), fontWeight: 600 }}
          >
            <span>{m.blinds.sb}</span>
            <span style={{ color: 'var(--pj-hair-2)' }}>/</span>
            <span>{m.blinds.bb}</span>
            <span style={{ color: 'var(--pj-gold)' }}>{m.blinds.ante}</span>
          </div>
        )}
        <div style={{ marginTop: pu(0.8), fontSize: pu(1.6), color: 'var(--pj-dim)' }}>
          {m.nextText}
        </div>
      </div>

      <div className="flex h-full min-h-0 flex-col items-end justify-center overflow-hidden text-right">
        <div
          className="uppercase"
          style={{ fontSize: pu(1.4), letterSpacing: '.2em', color: 'var(--pj-faint)' }}
        >
          Prize Pool
        </div>
        <div
          className="display tabular-nums"
          style={{
            fontSize: pu(3.6),
            fontWeight: 600,
            lineHeight: 1.1,
            color: 'var(--pj-gold)',
            textShadow: 'var(--pj-glow)',
          }}
        >
          {formatMoney(prizePool, currency)}
        </div>
        <div
          style={{
            width: '100%',
            height: '1px',
            margin: `${pu(1.4)} 0`,
            background: 'linear-gradient(to left,var(--pj-hair-2),transparent)',
          }}
        />
        {m.payouts.map((row) => (
          <div
            key={row.place}
            className="flex w-full items-start justify-end"
            style={{ gap: pu(1.2), padding: `${pu(0.5)} 0` }}
          >
            <span
              className="display flex-1 tabular-nums"
              style={{ fontSize: pu(1.9), lineHeight: pu(2.9), fontWeight: 600 }}
            >
              {row.value}
            </span>
            <span style={row.pip}>{row.place}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
