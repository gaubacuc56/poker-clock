import type { ProjectorData } from '@domain/entities';
import { formatMoney } from '@domain/rules/format';
import { pu } from '@application/shared/projectorScale';
import ClubLogo from '@application/components/shared/ClubLogo';
import FitToHeight from '@application/components/shared/FitToHeight';
import { buildProjectorScreen } from '../projectorScreen';
import { CENTRE_HEADING_WIDTH, PLACE_INK, clockFontSize } from '../constants';
import Cell from './sections/Cell';
import {
  CHIP_RACE_SIZE,
  LEVEL_LABEL_SIZE,
  NEXT_SIZE,
  PRICE_LINE_SIZE,
  PRIZE_LABEL_SIZE,
  PRIZE_VALUE_SIZE,
  STAT_LABEL_SIZE,
  STAT_VALUE_SIZE,
  TITLE_SIZE,
} from '../LedgerLayout/constants';
import {
  BLIND_GAP,
  CLOCK_SIZE,
  CLOCK_TRACKING,
  FINISHED_CLOCK_SIZE,
  PAYOUT_HEADER_SIZE,
  PAYOUT_ROW_SIZE,
  STAT_ROWS,
} from './constants';

/**
 * B · Panel — stat rows against hairlines on the left, the clock raised onto a
 * card in the centre with a gold seam across its top edge, payouts as a
 * place/amount ledger on the right.
 */
export default function PanelLayout(props: ProjectorData) {
  const m = buildProjectorScreen(props);
  const { tournamentName, currency, prizePool } = props;

  return (
    <div
      className="absolute inset-0 grid"
      style={{
        // The centre track is floored at its own min-content so the price line
        // can stay on one row; the side tracks yield what it needs.
        gridTemplateColumns: 'minmax(0,24fr) minmax(min-content,52fr) minmax(0,24fr)',
        // The single row is pinned to the frame's height. Left as `auto` it
        // grows to whatever the tallest column needs, and because every column
        // centres its own content, a long prize pool or a deep payout list
        // would push the stats and the clock down with it.
        gridTemplateRows: 'minmax(0,1fr)',
        gap: pu(2),
        padding: `${pu(2)} ${pu(4)}`,
        paddingTop: 0,
        color: 'var(--pj-ink)',
      }}
    >
      <div className="flex min-h-0 flex-col">
        <div className="flex shrink-0 items-center" style={{ height: pu(8) }}>
          <ClubLogo />
        </div>
        <div
          className="grid min-h-0 flex-1"
          style={{ gridTemplateRows: `repeat(${STAT_ROWS},minmax(0,1fr))`, gap: pu(0.6) }}
        >
          {m.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-baseline justify-between"
              style={{
                gap: pu(1),
                borderBottom: '1px solid var(--pj-hair)',
                paddingBottom: pu(0.6),
              }}
            >
              <span
                className="uppercase"
                style={{
                  fontSize: pu(STAT_LABEL_SIZE),
                  fontWeight: 600,
                  letterSpacing: '.1em',
                  color: 'var(--pj-faint)',
                }}
              >
                {stat.label}
              </span>
              <span
                className="display tabular-nums"
                style={{ fontSize: pu(STAT_VALUE_SIZE), fontWeight: 600 }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-col justify-evenly" style={{ gap: pu(1.4) }}>
        {/* Name over its buy-in / re-buy / stack line, both centred over the
            card — the same heading ledger builds, at the same sizes. */}
        <div className="flex flex-col items-center">
          <div
            className={`display truncate text-center ${CENTRE_HEADING_WIDTH}`}
            style={{ fontSize: pu(TITLE_SIZE), fontWeight: 600, letterSpacing: '-.01em' }}
          >
            {tournamentName}
          </div>
          <div
            className="flex justify-center whitespace-nowrap"
            style={{
              gap: pu(1.6),
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
                marginTop: pu(0.3),
                fontSize: pu(PRICE_LINE_SIZE),
                color: 'var(--pj-dim)',
                letterSpacing: '.06em',
              }}
            >
              {m.regEndLine}
            </div>
          )}
        </div>

        <div
          className="relative flex flex-col items-center"
          style={{
            borderRadius: pu(1.2),
            background: 'var(--pj-card)',
            boxShadow: '0 0 0 1px var(--pj-gold-dim), var(--pj-card-shadow)',
            padding: `${pu(2.2)} ${pu(2.4)} ${pu(2)}`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '18%',
              right: '18%',
              height: '2px',
              background: 'linear-gradient(to right,transparent,var(--pj-gold),transparent)',
            }}
          />
          <div
            className="uppercase"
            style={{
              fontSize: pu(LEVEL_LABEL_SIZE),
              fontWeight: 700,
              letterSpacing: '.2em',
              color: m.levelColor,
            }}
          >
            {m.levelLabel}
          </div>
          {m.chipRaceLine && (
            <div
              className="uppercase"
              style={{
                fontSize: pu(CHIP_RACE_SIZE),
                letterSpacing: '.16em',
                color: 'var(--color-break)',
                marginTop: pu(0.5),
              }}
            >
              {m.chipRaceLine}
            </div>
          )}
          <div
            key={m.levelKey}
            className="display tabular-nums whitespace-nowrap"
            style={{
              fontSize: pu(
                clockFontSize(m.clockStatus, {
                  running: CLOCK_SIZE,
                  finished: FINISHED_CLOCK_SIZE,
                }),
              ),
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: CLOCK_TRACKING,
              color: m.clockColor,
              // Tracking is added after the last digit too, which would shove
              // the centred line off to the left by that much.
              margin: `${pu(0.6)} -${CLOCK_TRACKING} ${pu(0.6)} 0`,
              textShadow: m.clockShadow,
              animation: m.isLowTime ? 'cdpulse 1s ease-in-out infinite' : 'lvlin .5s ease',
            }}
          >
            {m.clockText}
          </div>

          {/* Ledger's figures are a third larger than the ones this row used to
              hold, so the gap between them gives up what they took. */}
          {m.showBlinds && (
            <div
              className="flex max-w-full items-end justify-center whitespace-nowrap"
              style={{ gap: pu(BLIND_GAP), marginTop: pu(1.2) }}
            >
              <Cell label="BLINDS" value={m.blindsText} />
              <div style={{ width: '1px', height: pu(4), background: 'var(--pj-hair-2)' }} />
              <Cell label="ANTE" value={m.blinds.ante} />
            </div>
          )}
        </div>

        <div
          className="text-center"
          style={{ fontSize: pu(NEXT_SIZE), color: 'var(--pj-dim)', letterSpacing: '.06em' }}
        >
          {m.nextText}
        </div>
      </div>

      <div className="flex min-h-0 flex-col justify-center" style={{ minWidth: pu(19) }}>
        <span
          className="uppercase"
          style={{ fontSize: pu(PRIZE_LABEL_SIZE), letterSpacing: '.2em', color: 'var(--pj-faint)' }}
        >
          Prize Pool
        </span>
        <div
          className="display tabular-nums"
          style={{ fontSize: pu(PRIZE_VALUE_SIZE), fontWeight: 600, color: 'var(--pj-gold)', lineHeight: 1.2 }}
        >
          {formatMoney(prizePool, currency)}
        </div>
        <div
          className="flex justify-between uppercase"
          style={{
            marginTop: pu(1.4),
            fontSize: pu(PAYOUT_HEADER_SIZE),
            letterSpacing: '.18em',
            color: 'var(--pj-faint)',
          }}
        >
          <span>Place</span>
          <span>Payout</span>
        </div>
        <FitToHeight>
          {m.payouts.map((row) => (
            <div
              key={row.place}
              className="flex items-baseline justify-between"
              style={{
                gap: pu(1),
                padding: `${pu(0.5)} 0`,
                borderBottom: '1px solid var(--pj-hair)',
              }}
            >
              <span
                className="tabular-nums"
                style={{ fontSize: pu(PAYOUT_ROW_SIZE), color: PLACE_INK }}
              >
                {row.place}
              </span>
              <span
                className="display text-right tabular-nums"
                style={{ fontSize: pu(PAYOUT_ROW_SIZE), fontWeight: 600 }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </FitToHeight>
      </div>
    </div>
  );
}
