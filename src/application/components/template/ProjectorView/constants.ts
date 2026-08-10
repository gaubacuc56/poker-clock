import type { ProjectorData, ProjectorLayout } from '@domain/entities';
import type { ReactNode } from 'react';
import ClassicLayout from '../layouts/ClassicLayout';
import DialLayout from '../layouts/DialLayout';
import LedgerLayout from '../layouts/LedgerLayout';
import PanelLayout from '../layouts/PanelLayout';

/** The arrangement a tournament falls back to — and what an id this build no
 *  longer ships (a layout removed since the tournament was saved) resolves to. */
export const DEFAULT_LAYOUT: ProjectorLayout = 'classic';

export const LAYOUTS: Record<ProjectorLayout, (props: ProjectorData) => ReactNode> = {
  classic: ClassicLayout,
  ledger: LedgerLayout,
  panel: PanelLayout,
  dial: DialLayout,
};
