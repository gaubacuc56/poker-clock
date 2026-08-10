import type { ProjectorData } from '@domain/entities';
import { formatAmount, formatMoney, formatNumber } from '@domain/rules/format';
import { pu } from '@application/shared/projectorScale';
import ClockDisplay from '@application/components/shared/ClockDisplay';
import ClubLogo from '@application/components/shared/ClubLogo';
import FitToHeight from '@application/components/shared/FitToHeight';
import PayoutList from '@application/components/shared/PayoutList';
import StatsPanel from '@application/components/shared/StatsPanel';
import {
  CLASSIC_TONES,
  CLOCK_SIZE,
  FINISHED_CLOCK_SIZE,
} from '@application/components/shared/ClockDisplay/constants';
import { buildProjectorScreen } from '../projectorScreen';
import { CENTRE_HEADING_WIDTH, clockFontSize } from '../constants';
import {
  HEADING_HEIGHT,
  HEADING_LINE_HEIGHT,
  PAYOUT_MAX_WIDTH,
  PAYOUT_MIN_WIDTH,
  PRIZE_LABEL_SIZE,
  PRIZE_VALUE_SIZE,
  STATS_COLUMN_WIDTH,
  SUBTITLE_SIZE,
  TITLE_SIZE,
} from './constants';

/** The projector as it has always looked: stats left, clock centre, payouts right. */
export default function ClassicLayout(props: ProjectorData) {
  const m = buildProjectorScreen(props);
  const {
    tournamentName,
    currency,
    entryPriceLines,
    startingStack,
    prizePool,
    payoutResults,
    currentLevel,
  } = props;

  return (
    /* Three full-height columns: stats on the left, clock in the middle,
       payouts on the right. Each column owns its own heading. */
    <div
      className="relative z-10 flex h-full items-stretch"
      style={{ padding: pu(1), paddingTop: pu(2), gap: pu(1.5) }}
    >
      <div style={{ width: pu(STATS_COLUMN_WIDTH) }} className="flex shrink-0 flex-col overflow-hidden">
        {/* Always reserves the centre heading's height, so the stats start
            level with the clock whether or not a club logo is configured. */}
        <div
          className="flex shrink-0 items-center justify-end overflow-hidden"
          style={{ height: pu(HEADING_HEIGHT) }}
        >
          <ClubLogo />
        </div>
        <div className="min-h-0 flex-1" style={{ marginTop: pu(1) }}>
          <StatsPanel stats={m.stats} />
        </div>
      </div>

      {/* `min-w-min` rather than `min-w-0`: the column is floored at its own
          min-content so the entry lines below stay on one row, and the payout
          column beside it gives up the width. Stated explicitly because this
          column also clips, and an `auto` minimum is zero on anything that
          does. */}
      <div className="flex min-w-min flex-1 flex-col overflow-hidden">
        <div
          className="flex max-w-full shrink-0 flex-col items-center"
          style={{ paddingInline: pu(1) }}
        >
          <h1
            className={`truncate text-center font-bold ${CENTRE_HEADING_WIDTH} ${CLASSIC_TONES.normal.heading}`}
            style={{ fontSize: pu(TITLE_SIZE), lineHeight: HEADING_LINE_HEIGHT }}
          >
            {tournamentName}
          </h1>
          {/* One row at any entry-line count: the column widens to hold them
              rather than folding them onto a second row at a size the room can
              no longer read across. */}
          <div
            className="flex flex-nowrap justify-center"
            style={{
              columnGap: pu(2.5),
              lineHeight: HEADING_LINE_HEIGHT,
            }}
          >
            {entryPriceLines.map((line) => (
              <p
                key={line.label}
                className="whitespace-nowrap text-center"
                style={{ fontSize: pu(SUBTITLE_SIZE) }}
              >
                {line.label}: {formatAmount(line.amountCents)}{' '}
              </p>
            ))}
            <p
              className="whitespace-nowrap text-center"
              style={{ fontSize: pu(SUBTITLE_SIZE) }}
            >
              Stack: {formatNumber(startingStack)}
            </p>
          </div>
          {m.regEndLine && (
            <p
              className="max-w-full whitespace-nowrap text-center text-muted"
              style={{ fontSize: pu(SUBTITLE_SIZE), lineHeight: HEADING_LINE_HEIGHT }}
            >
              {m.regEndLine}
            </p>
          )}
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          <ClockDisplay
            level={currentLevel}
            levelLabel={m.levelLabel}
            clockText={m.clockText}
            clockSize={clockFontSize(m.clockStatus, {
              running: CLOCK_SIZE,
              finished: FINISHED_CLOCK_SIZE,
            })}
            showClock={m.showClock}
            showBlinds={m.showBlinds}
            nextText={m.nextText}
            tone={m.tone}
          />
        </div>
      </div>

      {/* Grows to fit long payout notes, but never past PAYOUT_MAX_WIDTH —
          beyond that the clock column would be squeezed. The minimum keeps
          the clock centred even when there are no payouts at all.
          Shrinkable — this is the width the centre column takes when its entry
          lines need more than their share, and PAYOUT_MIN_WIDTH is the floor. */}
      <div
        style={{
          width: 'max-content',
          minWidth: pu(PAYOUT_MIN_WIDTH),
          maxWidth: pu(PAYOUT_MAX_WIDTH),
        }}
        className="flex flex-col overflow-hidden"
      >
        <div className="shrink-0">
          <p
            className="uppercase tracking-wide font-semibold"
            style={{ fontSize: pu(PRIZE_LABEL_SIZE) }}
          >
            Prize Pool
          </p>
          <p className="font-bold tabular-nums" style={{ fontSize: pu(PRIZE_VALUE_SIZE) }}>
            {formatMoney(prizePool, currency)}
          </p>
        </div>
        <FitToHeight className="flex-1" style={{ marginTop: pu(1) }}>
          {payoutResults.length > 0 && <PayoutList results={payoutResults} />}
        </FitToHeight>
      </div>
    </div>
  );
}
