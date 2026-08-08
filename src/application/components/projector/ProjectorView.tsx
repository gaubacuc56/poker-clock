import type { CSSProperties } from "react";
import { formatAmount, formatMoney, formatNumber } from "@domain/rules/format";
import type { BlindLevel, PayoutResult } from "@domain/entities";
import {
  PROJECTOR_UNIT,
  PROJECTOR_UNIT_VAR,
  pu,
} from "../../shared/projectorScale";
import ClockDisplay from "../clock/ClockDisplay";
import StatsPanel from "../clock/StatsPanel";
import PayoutList from "../payouts/PayoutList";
import ClubLogo from "./ClubLogo";

interface EntryPriceLine {
  label: string;
  amountCents: number;
}

// Centre-heading type scale, in projector units. Line heights are pinned so the
// heading's total height is known without measuring it, and the left column can
// reserve exactly that much space for the logo.
const TITLE_SIZE = 4;
const SUBTITLE_SIZE = 2.8;
const HEADING_LINE_HEIGHT = 1.2;
const HEADING_HEIGHT = (TITLE_SIZE + SUBTITLE_SIZE) * HEADING_LINE_HEIGHT;

/** Left column width, in projector units — sized so "TOTAL ENTRIES", the
 *  longest stat label, fits on one line. */
const STATS_COLUMN_WIDTH = 20;

/** Payout column bounds, in projector units. The maximum leaves the clock
 *  column enough room for its widest blinds line. */
const PAYOUT_MIN_WIDTH = 16;
const PAYOUT_MAX_WIDTH = 16;

export interface ProjectorViewProps {
  tournamentName: string;
  currency: string;
  backgroundPath: string | undefined;
  entryPriceLines: EntryPriceLine[];
  startingStack: number;
  prizePool: number;
  payoutResults: PayoutResult[];
  currentLevel: BlindLevel;
  nextLevel: BlindLevel | undefined;
  secondsRemaining: number;
  isPaused: boolean;
  /** The tournament has ended — the clock shows "FINISHED" instead of a countdown. */
  isFinished?: boolean;
  remainingPlayers: number;
  totalRegistered: number;
  totalEntries: number;
  rebuyCount: number;
  totalStack: number;
  avgStack: number;
  nextBreakSeconds: number | null;
}

/** The full projector screen as a pure presentational component, shared by the
 *  live projector page and the control-page capture (screenshot) feature. */
export default function ProjectorView({
  tournamentName,
  currency,
  backgroundPath,
  entryPriceLines,
  startingStack,
  prizePool,
  payoutResults,
  currentLevel,
  nextLevel,
  secondsRemaining,
  isPaused,
  isFinished = false,
  remainingPlayers,
  totalRegistered,
  totalEntries,
  rebuyCount,
  totalStack,
  avgStack,
  nextBreakSeconds,
}: ProjectorViewProps) {
  console.log("prizePool", )
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-slate-950 text-white"
      // Everything below sizes itself off `--pu`, so the whole layout scales
      // with this box instead of jumping between fixed breakpoint sizes.
      style={
        {
          containerType: "size",
          [PROJECTOR_UNIT_VAR]: PROJECTOR_UNIT,
        } as CSSProperties
      }
    >
      {backgroundPath && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundPath})` }}
        />
      )}

      {/* Three full-height columns: stats on the left, clock in the middle,
          payouts on the right. Each column owns its own heading. */}
      <div
        className="relative z-10 flex h-full items-stretch"
        style={{ padding: pu(1),  gap: pu(1.5) }}
      >
        <div
          style={{ width: pu(STATS_COLUMN_WIDTH) }}
          className="flex shrink-0 flex-col overflow-hidden"
        >
          {/* Always reserves the centre heading's height, so the stats start
              level with the clock whether or not a club logo is configured. */}
          <div
            className="flex shrink-0 items-center justify-end overflow-hidden"
            style={{ height: pu(HEADING_HEIGHT) }}
          >
            <ClubLogo />
          </div>
          <div className="min-h-0 flex-1" style={{ marginTop: pu(1) }}>
            <StatsPanel
              remainingPlayers={remainingPlayers}
              totalRegistered={totalRegistered}
              totalEntries={totalEntries}
              rebuyCount={rebuyCount}
              totalStack={totalStack}
              avgStack={avgStack}
              nextBreakSeconds={nextBreakSeconds}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className="flex max-w-full shrink-0 flex-col items-center"
            style={{ paddingInline: pu(1) }}
          >
            <h1
              className="max-w-full truncate text-center font-bold"
              style={{
                fontSize: pu(TITLE_SIZE),
                lineHeight: HEADING_LINE_HEIGHT,
              }}
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
                  {line.label}: {formatAmount(line.amountCents)}{" "}
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
              secondsRemaining={secondsRemaining}
              isPaused={isPaused}
              isFinished={isFinished}
            />
          </div>
        </div>

        {/* Grows to fit long payout notes, but never past PAYOUT_MAX_WIDTH —
            beyond that the clock column would be squeezed. The minimum keeps
            the clock centred even when there are no payouts at all. */}
        <div
          style={{
            width: "max-content",
            minWidth: pu(PAYOUT_MIN_WIDTH),
            maxWidth: pu(PAYOUT_MAX_WIDTH),
          }}
          className="flex shrink-0 flex-col overflow-hidden"
        >
          <div className="shrink-0">
            <p
              className="uppercase tracking-wide font-semibold"
              style={{ fontSize: pu(1.8) }}
            >
              Prize Pool
            </p>
            <p
              className="font-bold tabular-nums"
              style={{ fontSize: pu(3) }}
            >
              {formatMoney(prizePool, currency)}
            </p>
          </div>
          <div
            className="min-h-0 flex-1 overflow-hidden"
            style={{ marginTop: pu(1) }}
          >
            {payoutResults.length > 0 && <PayoutList results={payoutResults} />}
          </div>
        </div>
      </div>
    </div>
  );
}
