import type { ProjectorData } from '@domain/entities';
import { formatAmount, formatMoney, formatNumber } from '@domain/rules/format';
import { pu } from '@application/shared/projectorScale';
import ClockDisplay from '@application/components/shared/ClockDisplay';
import ClubLogo from '@application/components/shared/ClubLogo';
import FitToHeight from '@application/components/shared/FitToHeight';
import PayoutList from '@application/components/shared/PayoutList';
import StatsPanel from '@application/components/shared/StatsPanel';
import { CLASSIC_TONES } from '@application/components/shared/ClockDisplay/constants';
import { buildProjectorScreen } from '../projectorScreen';
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
    nextLevel,
    isFinished = false,
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

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className="flex max-w-full shrink-0 flex-col items-center"
          style={{ paddingInline: pu(1) }}
        >
          <h1
            className={`max-w-full truncate text-center font-bold ${CLASSIC_TONES.normal.heading}`}
            style={{ fontSize: pu(TITLE_SIZE), lineHeight: HEADING_LINE_HEIGHT }}
          >
            {tournamentName}
          </h1>
          {/* Wraps onto extra rows rather than overflowing the column when
              there are enough entry lines to exceed its width. */}
          <div
            className="flex max-w-full flex-wrap justify-center"
            style={{
              columnGap: pu(2.5),
              rowGap: pu(0.3),
              lineHeight: HEADING_LINE_HEIGHT,
            }}
          >
            {entryPriceLines.map((line) => (
              <p
                key={line.label}
                className="max-w-full whitespace-nowrap text-center"
                style={{ fontSize: pu(SUBTITLE_SIZE) }}
              >
                {line.label}: {formatAmount(line.amountCents)}{' '}
              </p>
            ))}
            <p
              className="max-w-full whitespace-nowrap text-center"
              style={{ fontSize: pu(SUBTITLE_SIZE) }}
            >
              Stack: {formatNumber(startingStack)}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          <ClockDisplay
            level={currentLevel}
            nextLevel={nextLevel}
            clockText={m.clockText}
            tone={m.tone}
            isFinished={isFinished}
          />
        </div>
      </div>

      {/* Grows to fit long payout notes, but never past PAYOUT_MAX_WIDTH —
          beyond that the clock column would be squeezed. The minimum keeps
          the clock centred even when there are no payouts at all. */}
      <div
        style={{
          width: 'max-content',
          minWidth: pu(PAYOUT_MIN_WIDTH),
          maxWidth: pu(PAYOUT_MAX_WIDTH),
        }}
        className="flex shrink-0 flex-col overflow-hidden"
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
