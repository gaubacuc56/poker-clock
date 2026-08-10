import type { ProjectorData } from '@domain/entities';
import { formatMoney } from '@domain/rules/format';
import { pu } from '@application/shared/projectorScale';
import ClubLogo from '@application/components/shared/ClubLogo';
import FitToHeight from '@application/components/shared/FitToHeight';
import { buildProjectorScreen } from '../projectorScreen';
import Blind from './sections/Blind';
import LevelDots from './sections/LevelDots';
import {
  CHIP_RACE_SIZE,
  CLOCK_SIZE,
  CLOCK_TRACKING,
  FINISHED_CLOCK_SIZE,
  LEVEL_LABEL_SIZE,
  NEXT_SIZE,
  PAYOUT_ROW_SIZE,
  PRICE_LINE_SIZE,
  PRIZE_LABEL_SIZE,
  PRIZE_VALUE_SIZE,
  STAT_LABEL_SIZE,
  STAT_VALUE_SIZE,
  TITLE_SIZE,
} from './constants';

/**
 * A · Ledger — the handoff's default. Gold corner brackets, a level rail that
 * drains across the top edge, stats down a hairline on the left, the centre
 * stack (name, price line, level between two fading rules, clock, level dots,
 * three labelled blinds, next-up pill) and prize pool + medal payouts right.
 */
export default function LedgerLayout(props: ProjectorData) {
  const m = buildProjectorScreen(props);
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
          // The single row is pinned to the frame's height. Left as `auto` it
          // grows to whatever the tallest column needs, and because every
          // column centres its own content, a long prize pool or a deep payout
          // list would push the stats and the clock down with it.
          gridTemplateRows: 'minmax(0,1fr)',
          padding: `${pu(2)} ${pu(4)}`,
        }}
      >
        <div
          className="flex min-h-0 flex-col items-end text-right"
          style={{ paddingRight: pu(6), borderRight: '1px solid var(--pj-hair)' }}
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
                className="relative flex flex-col items-end mb-3 "
                style={{ gap: pu(0.3) }}
              >
              
                <div
                  className="uppercase"
                  style={{
                    fontSize: pu(STAT_LABEL_SIZE),
                    fontWeight: 700,
                    letterSpacing: '.18em',
                    color: 'var(--pj-faint)',
                  }}
                >
                  {stat.label}
                </div>
                <div
                  className="display tabular-nums"
                  style={{ fontSize: pu(STAT_VALUE_SIZE), fontWeight: 600, lineHeight: 1 }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex min-h-0 min-w-0 max-w-full flex-col items-center justify-center"
        >
          <div
            className="display max-w-full truncate text-center"
            style={{ fontSize: pu(TITLE_SIZE), fontWeight: 600, letterSpacing: '-.01em' }}
          >
            {tournamentName}
          </div>
          <div
            className="flex max-w-full flex-wrap justify-center"
            style={{
              gap: pu(1.6),
              marginTop: pu(1),
              fontSize: pu(PRICE_LINE_SIZE),
              color: 'var(--pj-dim)',
              letterSpacing: '.06em',
            }}
          >
            {m.priceLine}
          </div>
          {m.regEndLine && (
            <div
              className="max-w-full text-center"
              style={{
                marginTop: pu(0.4),
                fontSize: pu(PRICE_LINE_SIZE),
                color: 'var(--pj-dim)',
                letterSpacing: '.06em',
              }}
            >
              {m.regEndLine}
            </div>
          )}

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
              style={{
                fontSize: pu(LEVEL_LABEL_SIZE),
                fontWeight: 700,
                letterSpacing: '.24em',
                color: m.levelColor,
              }}
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
                fontSize: pu(CHIP_RACE_SIZE),
                letterSpacing: '.16em',
                color: 'var(--color-break)',
                marginTop: pu(0.6),
              }}
            >
              {m.chipRaceLine}
            </div>
          )}

          {m.showClock && (
            <div
              key={m.levelKey}
              className="display tabular-nums whitespace-nowrap"
              style={{
                fontSize: pu(isFinished ? FINISHED_CLOCK_SIZE : CLOCK_SIZE),
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: CLOCK_TRACKING,
                color: m.clockColor,
                // Tracking is added after the last digit too, which would shove
                // the centred line off to the left by that much.
                margin: `${pu(0.6)} -${CLOCK_TRACKING} ${pu(0.6)} 0`,
                textShadow: m.clockShadow,
                animation: m.isLowTime
                  ? 'cdpulse 1s ease-in-out infinite'
                  : 'lvlin .5s ease',
              }}
            >
              {m.clockText}
            </div>
          )}

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
              <span style={{ fontSize: pu(LEVEL_LABEL_SIZE), color: 'var(--pj-hair-2)', paddingBottom: pu(0.4) }}>
                /
              </span>
              <Blind label="Big" value={m.blinds.bb} />
              <span style={{ width: '1px', height: pu(4), background: 'var(--pj-hair-2)' }} />
              <Blind label="Ante" value={m.blinds.anteNumber} unit={m.blinds.anteUnit} />
            </div>
          )}

          <div
            style={{
              marginTop: pu(2),
              padding: `${pu(0.7)} ${pu(2)}`,
              borderRadius: '999px',
              background: 'var(--pj-panel)',
              fontSize: pu(NEXT_SIZE),
              color: 'var(--pj-dim)',
              letterSpacing: '.06em',
            }}
          >
            {m.nextText}
          </div>
        </div>

        <div
          className="flex min-h-0 flex-col items-stretch justify-center"
          style={{
            minWidth: pu(20),
            paddingLeft: pu(6),
            borderLeft: '1px solid var(--pj-hair)',
          }}
        >
          <div
            className="uppercase"
            style={{ fontSize: pu(PRIZE_LABEL_SIZE), letterSpacing: '.2em', color: 'var(--pj-faint)' }}
          >
            Prize Pool
          </div>
          <div
            className="display tabular-nums"
            style={{
              fontSize: pu(PRIZE_VALUE_SIZE),
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
          <FitToHeight>
            {m.payouts.map((row) => (
              <div
                key={row.place}
                className="flex items-start"
                style={{ gap: pu(1.2), padding: `${pu(0.55)} 0` }}
              >
                <span style={row.pip}>{row.place}</span>
                <span
                  className="display flex-1 text-right tabular-nums"
                  style={{ fontSize: pu(PAYOUT_ROW_SIZE), lineHeight: pu(2.9), fontWeight: 600 }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </FitToHeight>
        </div>
      </div>
    </div>
  );
}
