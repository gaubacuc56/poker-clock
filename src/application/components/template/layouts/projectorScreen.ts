import type { CSSProperties } from 'react';
import type { ProjectorData } from '@domain/entities';
import {
  buildProjectorModel,
  type ProjectorModel,
  type ProjectorPayoutRow,
} from '@domain/rules/projectorModel';
import { PROJECTOR_TONES, clockShadow, levelColor, payoutPip } from './constants';

interface PaintedPayoutRow extends ProjectorPayoutRow {
  /** The place marker's style, already resolved from the row's medal position. */
  pip: CSSProperties;
}

/**
 * The domain's projector model with its colours filled in.
 *
 * `buildProjectorModel` deals only in what is true of the tournament — which
 * mood it is in, what the clock reads, which places pay. This adds the one
 * thing the layouts also need and the domain has no business knowing: what all
 * of that looks like. Every layout builds its screen through here, so a colour
 * is decided once rather than four times.
 */
export interface ProjectorScreen extends ProjectorModel {
  accentColor: string;
  clockColor: string;
  clockShadow: string;
  levelColor: string;
  payouts: PaintedPayoutRow[];
}

export function buildProjectorScreen(data: ProjectorData): ProjectorScreen {
  const model = buildProjectorModel(data);
  const tone = PROJECTOR_TONES[model.tone];

  return {
    ...model,
    accentColor: tone.accent,
    clockColor: tone.clock,
    clockShadow: clockShadow(model.tone),
    levelColor: levelColor(model.tone, model.isFinished),
    payouts: model.payouts.map((row) => ({ ...row, pip: payoutPip(row.medalIndex) })),
  };
}
