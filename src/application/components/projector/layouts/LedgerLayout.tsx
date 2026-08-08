import { formatMoney } from '@domain/rules/format';
import { pu } from '../../../shared/projectorScale';
import ClubLogo from '../ClubLogo';
import { buildProjectorModel } from '../projectorData';
import type { ProjectorViewProps } from '../ProjectorView';

/**
 * A · Ledger — the handoff's default. Gold corner brackets, a level rail that
 * drains across the top edge, stats down a hairline on the left, the centre
 * stack (name, price line, level between two fading rules, clock, level dots,
 * three labelled blinds, next-up pill) and prize pool + medal payouts right.
 */
export default function LedgerLayout(props: ProjectorViewProps) {
  const m = buildProjectorModel(props);
  const { tournamentName, currency, prizePool, isFinished = false } = props;

  const bracket = `1px solid var(--pj-gold-soft)`;
  const corner = { position: 'absolute', width: pu(4), height: pu(4) } as const;

  return (
    <div className="absolute inset-0" style={{ color: 'var(--pj-ink)' }}>
      {/* Level rail: fills left-to-right as the level runs out. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: pu(0.45),
          width: `${(m.elapsedFraction * 100).toFixed(2)}%`,
          background: `linear-gradient(to right, var(--pj-gold-dim), ${m.accentColor})`,
          boxShadow: 'var(--pj-glow)',
          transition: 'width .5s linear',
        }}
      />

      <span style={{ ...corner, top: pu(2), left: pu(2), borderLeft: bracket, borderTop: bracket }} />
      <span style={{ ...corner, top: pu(2), right: pu(2), borderRight: bracket, borderTop: bracket }} />
      <span
        style={{ ...corner, bottom: pu(2), left: pu(2), borderLeft: bracket, borderBottom: bracket }}
      />
      <span
        style={{ ...corner, bottom: pu(2), right: pu(2), borderRight: bracket, borderBottom: bracket }}
      />

      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: 'minmax(0,26fr) minmax(0,48fr) minmax(0,26fr)',
          padding: `${pu(3.4)} ${pu(4)}`,
        }}
      >
        <div
          className="flex flex-col items-end text-right"
          style={{ paddingRight: pu(2.2), borderRight: '1px solid var(--pj-hair)' }}
        >
          <div className="flex items-center" style={{ height: pu(9) }}>
            <ClubLogo />
          </div>
          <div
            className="flex w-full flex-1 flex-col justify-between"
            style={{ padding: `${pu(2)} 0 ${pu(1)}` }}
          >
            {m.stats.map((stat) => (
              <div
                key={stat.label}
                className="relative flex flex-col items-end"
                style={{ gap: pu(0.3) }}
              >
                {/* Short gold tick on the hairline, one per stat. */}
                <span
                  style={{
                    position: 'absolute',
                    right: `calc(-1 * ${pu(2.2)})`,
                    top: pu(2.4),
                    width: pu(1.1),
                    height: '1px',
                    background: 'var(--pj-gold-soft)',
                  }}
                />
                <div
                  className="uppercase"
                  style={{ fontSize: pu(1.5), letterSpacing: '.2em', color: 'var(--pj-faint)' }}
                >
                  {stat.label}
                </div>
                <div
                  className="display tabular-nums"
                  style={{ fontSize: pu(3.6), fontWeight: 600, lineHeight: 1 }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex min-w-0 max-w-full flex-col items-center justify-center"
          style={{ padding: `0 ${pu(3)}` }}
        >
          <div
            className="display max-w-full truncate text-center"
            style={{ fontSize: pu(3.4), fontWeight: 600, letterSpacing: '-.01em' }}
          >
            {tournamentName}
          </div>
          <div
            className="flex max-w-full flex-wrap justify-center"
            style={{
              gap: pu(1.6),
              marginTop: pu(1),
              fontSize: pu(1.6),
              color: 'var(--pj-dim)',
              letterSpacing: '.06em',
            }}
          >
            {m.priceLine}
          </div>

          <div
            className="flex w-full max-w-full items-center"
            style={{ gap: pu(1.6), margin: `${pu(2.2)} 0 ${pu(0.4)}` }}
          >
            <span
              className="h-px min-w-0 flex-1"
              style={{ background: 'linear-gradient(to right,transparent,var(--pj-gold-soft))' }}
            />
            <span
              className="min-w-0 truncate uppercase"
              style={{ fontSize: pu(2.4), letterSpacing: '.24em', color: m.levelColor }}
            >
              {m.levelLabel}
            </span>
            <span
              className="h-px min-w-0 flex-1"
              style={{ background: 'linear-gradient(to left,transparent,var(--pj-gold-soft))' }}
            />
          </div>
          {m.chipRaceLine && (
            <div
              className="uppercase"
              style={{
                fontSize: pu(1.8),
                letterSpacing: '.16em',
                color: 'var(--color-break)',
                marginTop: pu(0.6),
              }}
            >
              {m.chipRaceLine}
            </div>
          )}

          <div
            key={m.levelKey}
            className="display tabular-nums whitespace-nowrap"
            style={{
              fontSize: isFinished ? pu(6) : pu(13),
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: m.clockColor,
              margin: `${pu(0.6)} 0`,
              textShadow: m.clockShadow,
              animation: m.isLowTime
                ? 'cdpulse 1s ease-in-out infinite'
                : 'lvlin .5s ease',
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
              className="flex max-w-full items-end justify-center whitespace-nowrap"
              style={{ gap: pu(2.2), marginTop: pu(1.8) }}
            >
              <Blind label="Small" value={m.blinds.sb} />
              <span style={{ fontSize: pu(3), color: 'var(--pj-hair-2)', paddingBottom: pu(0.4) }}>
                /
              </span>
              <Blind label="Big" value={m.blinds.bb} />
              <span style={{ width: '1px', height: pu(4), background: 'var(--pj-hair-2)' }} />
              <Blind
                label="Ante"
                value={m.blinds.anteNumber}
                unit={m.blinds.anteUnit}
                color="var(--pj-gold)"
              />
            </div>
          )}

          <div
            style={{
              marginTop: pu(2),
              padding: `${pu(0.7)} ${pu(2)}`,
              borderRadius: '999px',
              background: 'var(--pj-panel)',
              fontSize: pu(1.7),
              color: 'var(--pj-dim)',
              letterSpacing: '.06em',
            }}
          >
            {m.nextText}
          </div>
        </div>

        <div
          className="flex flex-col items-stretch justify-center"
          style={{
            minWidth: pu(20),
            paddingLeft: pu(2.2),
            borderLeft: '1px solid var(--pj-hair)',
          }}
        >
          <div
            className="uppercase"
            style={{ fontSize: pu(1.5), letterSpacing: '.2em', color: 'var(--pj-faint)' }}
          >
            Prize Pool
          </div>
          <div
            className="display tabular-nums"
            style={{
              fontSize: pu(4.2),
              fontWeight: 600,
              lineHeight: 1.1,
              color: 'var(--pj-gold)',
              textShadow: `0 0 ${pu(2)} var(--pj-gold-dim)`,
            }}
          >
            {formatMoney(prizePool, currency)}
          </div>
          <div
            style={{
              height: '1px',
              margin: `${pu(1.6)} 0`,
              background: 'linear-gradient(to right,var(--pj-hair-2),transparent)',
            }}
          />
          {m.payouts.map((row) => (
            <div
              key={row.place}
              className="flex items-start"
              style={{ gap: pu(1.2), padding: `${pu(0.55)} 0` }}
            >
              <span style={row.pip}>{row.place}</span>
              <span
                className="display flex-1 text-right tabular-nums"
                style={{ fontSize: pu(2), lineHeight: pu(2.9), fontWeight: 600 }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Blind({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div
        className="uppercase"
        style={{ fontSize: pu(1.3), letterSpacing: '.24em', color: 'var(--pj-faint)' }}
      >
        {label}
      </div>
      <div
        className="display whitespace-nowrap tabular-nums"
        style={{ fontSize: pu(4.4), fontWeight: 600, lineHeight: 1.05, color }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: pu(1.6), letterSpacing: '.08em', marginLeft: pu(0.4) }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * One dot per entry in the blind structure — played ones dimmed gold, the
 * current one stretched into a dash, the rest hairline.
 */
export function LevelDots({
  levelIndex,
  levelCount,
  isBreak,
}: {
  levelIndex: number;
  levelCount: number;
  isBreak: boolean;
}) {
  return (
    <div className="flex items-center" style={{ gap: pu(0.55), marginTop: pu(0.4) }}>
      {Array.from({ length: levelCount }, (_, index) => (
        <span
          key={index}
          style={{
            width: index === levelIndex ? pu(1.5) : pu(0.5),
            height: pu(0.5),
            borderRadius: '999px',
            background:
              index === levelIndex
                ? isBreak
                  ? 'var(--color-break)'
                  : 'var(--pj-gold)'
                : index < levelIndex
                  ? 'var(--pj-gold-dim)'
                  : 'var(--pj-hair-2)',
          }}
        />
      ))}
    </div>
  );
}
