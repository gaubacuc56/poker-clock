import { formatAmount, formatMoney, formatNumber } from "@domain/rules/format";
import type { BlindLevel, PayoutResult } from "@domain/entities";
import ClockDisplay from "../clock/ClockDisplay";
import StatsPanel from "../clock/StatsPanel";
import PayoutTable from "../payouts/PayoutTable";
import ClubLogo from "./ClubLogo";

interface EntryPriceLine {
  label: string;
  amountCents: number;
}

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
  remainingPlayers,
  totalRegistered,
  totalEntries,
  rebuyCount,
  totalStack,
  avgStack,
  nextBreakSeconds,
}: ProjectorViewProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
      {backgroundPath && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundPath})` }}
        />
      )}

      <div
        className="relative z-10 flex h-full flex-col"
        style={{ padding: "clamp(1rem, 2.5vw, 2.75rem)" }}
      >
        <div
          className="grid shrink-0 items-start gap-4"
          style={{ gridTemplateColumns: "1fr auto 1fr" }}
        >
          <div className="flex justify-start">
            <ClubLogo />
          </div>
          <div className="flex max-w-full flex-col items-center justify-self-center px-4">
            <h1
              className="max-w-full truncate text-center font-bold"
              style={{ fontSize: "clamp(1.25rem, 2.8vw, 3.8rem)" }}
            >
              {tournamentName}
            </h1>
            <div className="flex gap-[3rem]">
              {entryPriceLines.map((line) => (
                <p
                  key={line.label}
                  className="max-w-full truncate text-center"
                  style={{ fontSize: "clamp(0.7rem, 2vw, 3rem)" }}
                >
                  {line.label}: {formatAmount(line.amountCents)}{" "}
                </p>
              ))}
              <p
                className="max-w-full truncate text-center"
                style={{ fontSize: "clamp(0.7rem, 2vw, 3rem)" }}
              >
                Stack: {formatNumber(startingStack)}
              </p>
            </div>
          </div>
          <div className="justify-self-end text-center">
            <p
              className="uppercase tracking-wide font-semibold"
              style={{ fontSize: "clamp(0.7rem, 1.35vw, 2rem)" }}
            >
              Prize Pool
            </p>
            <p
              className="font-bold tabular-nums"
              style={{ fontSize: "clamp(1.5rem, 3vw, 3.5rem)" }}
            >
              {formatMoney(prizePool, currency)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-1 items-stretch gap-6 overflow-hidden">
          <div style={{ width: "clamp(9rem, 15vw, 17rem)" }} className="shrink-0">
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

          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <ClockDisplay
              level={currentLevel}
              nextLevel={nextLevel}
              secondsRemaining={secondsRemaining}
              isPaused={isPaused}
            />
          </div>

          {/* The column keeps its width even with no payouts, so hiding the
              table doesn't shift the clock off-center. */}
          <div
            style={{ width: "clamp(10rem, 16vw, 19rem)" }}
            className="shrink-0"
          >
            {payoutResults.length > 0 && <PayoutTable results={payoutResults} />}
          </div>
        </div>
      </div>
    </div>
  );
}
