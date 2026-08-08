import type { CSSProperties } from "react";
import type { BlindLevel, PayoutResult, ProjectorLayout } from "@domain/entities";
import { PROJECTOR_UNIT, PROJECTOR_UNIT_VAR } from "../../shared/projectorScale";
import ClassicLayout from "./layouts/ClassicLayout";
import LedgerLayout from "./layouts/LedgerLayout";
import PanelLayout from "./layouts/PanelLayout";
import DialLayout from "./layouts/DialLayout";
import CardLayout from "./layouts/CardLayout";

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
  /** The tournament has ended — the clock shows "FINISHED" instead of a countdown. */
  isFinished?: boolean;
  remainingPlayers: number;
  totalRegistered: number;
  totalEntries: number;
  rebuyCount: number;
  totalStack: number;
  avgStack: number;
  nextBreakSeconds: number | null;
  /** Position of the current entry in the blind structure, and how many entries there are — the level-dot strip. */
  levelIndex: number;
  levelCount: number;
  /** Which arrangement to draw. Absent = the classic three-column screen. */
  layout?: ProjectorLayout;
}

const LAYOUTS: Record<ProjectorLayout, (props: ProjectorViewProps) => React.ReactNode> = {
  classic: ClassicLayout,
  ledger: LedgerLayout,
  panel: PanelLayout,
  dial: DialLayout,
  card: CardLayout,
};

/**
 * The projector screen, shared by the live projector page and the control-page
 * capture. It owns the frame — background photo, scrim and the `--pu` scale —
 * and hands the tournament data to whichever layout the tournament selected.
 * The layouts are pure presentation; all five receive exactly these props.
 */
export default function ProjectorView(props: ProjectorViewProps) {
  const Layout = LAYOUTS[props.layout ?? "classic"] ?? ClassicLayout;
  const isClassic = (props.layout ?? "classic") === "classic";

  return (
    <div
      className="pj relative h-full w-full overflow-hidden bg-slate-950 text-white"
      // Everything below sizes itself off `--pu`, so the whole layout scales
      // with this box instead of jumping between fixed breakpoint sizes.
      style={
        {
          containerType: "size",
          [PROJECTOR_UNIT_VAR]: PROJECTOR_UNIT,
        } as CSSProperties
      }
    >
      {props.backgroundPath && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${props.backgroundPath})`,
            // Classic renders the photo at full strength, as it always has.
            opacity: isClassic ? undefined : "var(--pj-img)",
          }}
        />
      )}
      {/* The scrim is what lets the new layouts stay legible over any photo.
          Classic was drawn without one and keeps its original look. */}
      {!isClassic && (
        <div className="absolute inset-0" style={{ background: "var(--pj-scrim)" }} />
      )}

      <Layout {...props} />
    </div>
  );
}
