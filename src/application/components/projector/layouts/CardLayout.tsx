import { formatMoney } from '@domain/rules/format';
import { pu } from '../../../shared/projectorScale';
import ClubLogo from '../ClubLogo';
import { buildProjectorModel } from '../projectorData';
import { LevelDots } from './LedgerLayout';
import type { ProjectorViewProps } from '../ProjectorView';

/**
 * D · Card — everything on one blurred panel floating over the photo, with a
 * gold-washed header. The layout that survives any background image, however
 * busy, because nothing sits directly on the photo.
 */
export default function CardLayout(props: ProjectorViewProps) {
  const m = buildProjectorModel(props);
  const { tournamentName, currency, prizePool, isFinished = false } = props;

  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={{ padding: `${pu(3)} ${pu(4)}`, color: 'var(--pj-ink)' }}
    >
      <div
        className="flex size-full flex-col overflow-hidden"
        style={{
          borderRadius: pu(2),
          background: 'var(--pj-panel)',
          backdropFilter: `blur(${pu(1.2)})`,
          boxShadow: 'var(--pj-card-shadow), inset 0 0 0 1px var(--pj-hair-2)',
        }}
      >
        <div
          className="flex flex-none items-center"
          style={{
            gap: pu(1.6),
            padding: `${pu(1.4)} ${pu(2.4)}`,
            background: 'linear-gradient(to right,var(--pj-gold-dim),transparent)',
          }}
        >
          <ClubLogo />
          <span
            className="display min-w-0 flex-1 truncate"
            style={{ fontSize: pu(2.4), fontWeight: 600 }}
          >
            {tournamentName}
          </span>
          <span
            className="flex-none whitespace-nowrap"
            style={{ fontSize: pu(1.5), color: 'var(--pj-dim)', letterSpacing: '.06em' }}
          >
            {m.priceLine}
          </span>
        </div>

        <div
          className="grid min-h-0 flex-1"
          style={{ gridTemplateColumns: 'minmax(0,30fr) minmax(0,44fr) minmax(0,26fr)' }}
        >
          <div
            className="flex min-h-0 flex-col justify-evenly overflow-hidden"
            style={{
              padding: `${pu(1.4)} ${pu(2.4)}`,
              borderRight: '1px solid var(--pj-hair)',
            }}
          >
            {m.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-baseline justify-between whitespace-nowrap"
                style={{ gap: pu(1.2) }}
              >
                <span
                  className="uppercase"
                  style={{ fontSize: pu(1.4), letterSpacing: '.18em', color: 'var(--pj-faint)' }}
                >
                  {stat.label}
                </span>
                <span
                  className="display tabular-nums"
                  style={{ fontSize: pu(2.6), fontWeight: 600 }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          <div
            className="flex min-h-0 flex-col items-center justify-center overflow-hidden"
            style={{ padding: `${pu(1)} ${pu(2)}` }}
          >
            <div
              className="uppercase whitespace-nowrap"
              style={{ fontSize: pu(1.8), letterSpacing: '.26em', color: m.levelColor }}
            >
              {m.levelLabel}
            </div>
            {m.chipRaceLine && (
              <div
                className="uppercase"
                style={{
                  fontSize: pu(1.4),
                  letterSpacing: '.16em',
                  color: 'var(--color-break)',
                  marginTop: pu(0.3),
                }}
              >
                {m.chipRaceLine}
              </div>
            )}
            <div
              key={m.levelKey}
              className="display tabular-nums whitespace-nowrap"
              style={{
                fontSize: isFinished ? pu(6) : pu(11.5),
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: '-.05em',
                color: m.clockColor,
                textShadow: m.clockShadow,
                animation: m.isLowTime ? 'cdpulse 1s ease-in-out infinite' : 'lvlin .5s ease',
              }}
            >
              {m.clockText}
            </div>

            <LevelDots
              levelIndex={props.levelIndex}
              levelCount={props.levelCount}
              isBreak={m.isBreak}
            />

            {m.showBlinds && (
              <div
                className="flex items-end justify-center whitespace-nowrap"
                style={{ gap: pu(2.2), marginTop: pu(1.2) }}
              >
                <Cell label="Small" value={m.blinds.sb} />
                <Cell label="Big" value={m.blinds.bb} />
                <Cell label="Ante" value={m.blinds.ante} color="var(--pj-gold)" />
              </div>
            )}
            <div
              style={{
                marginTop: pu(0.9),
                fontSize: pu(1.5),
                color: 'var(--pj-dim)',
                letterSpacing: '.06em',
              }}
            >
              {m.nextText}
            </div>
          </div>

          <div
            className="flex min-h-0 flex-col justify-center overflow-hidden"
            style={{ padding: `${pu(1.4)} ${pu(2.4)}`, borderLeft: '1px solid var(--pj-hair)' }}
          >
            <div
              className="uppercase"
              style={{ fontSize: pu(1.3), letterSpacing: '.2em', color: 'var(--pj-faint)' }}
            >
              Prize Pool
            </div>
            <div
              className="display tabular-nums"
              style={{
                fontSize: pu(3.4),
                fontWeight: 600,
                lineHeight: 1.15,
                color: 'var(--pj-gold)',
                textShadow: 'var(--pj-glow)',
              }}
            >
              {formatMoney(prizePool, currency)}
            </div>
            <div style={{ height: '1px', margin: `${pu(1)} 0`, background: 'var(--pj-hair)' }} />
            {m.payouts.map((row) => (
              <div
                key={row.place}
                className="flex items-start"
                style={{ gap: pu(1), padding: `${pu(0.3)} 0` }}
              >
                <span style={row.pip}>{row.place}</span>
                <span
                  className="display flex-1 text-right tabular-nums"
                  style={{ fontSize: pu(1.7), lineHeight: pu(2.6), fontWeight: 600 }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <div
        className="uppercase"
        style={{ fontSize: pu(1.2), letterSpacing: '.24em', color: 'var(--pj-faint)' }}
      >
        {label}
      </div>
      <div
        className="display tabular-nums"
        style={{ fontSize: pu(3.2), fontWeight: 600, lineHeight: 1.05, color }}
      >
        {value}
      </div>
    </div>
  );
}
