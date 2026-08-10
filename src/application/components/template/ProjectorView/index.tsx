import type { CSSProperties } from 'react';
import type { ProjectorData } from '@domain/entities';
import { PROJECTOR_UNIT, PROJECTOR_UNIT_VAR } from '@application/shared/projectorScale';
import { DEFAULT_LAYOUT, LAYOUTS } from './constants';

/**
 * The projector screen, shared by the live projector page and the control-page
 * capture. It owns the frame — background photo, scrim and the `--pu` scale —
 * and hands the tournament data to whichever layout the tournament selected.
 * The layouts are pure presentation; all four receive exactly these props.
 */
export default function ProjectorView(props: ProjectorData) {
  const layout = props.layout ?? DEFAULT_LAYOUT;
  const Layout = LAYOUTS[layout] ?? LAYOUTS[DEFAULT_LAYOUT];
  const isClassic = layout === DEFAULT_LAYOUT;

  return (
    <div
      className="pj relative h-full w-full overflow-hidden bg-slate-950 text-white"
      // Everything below sizes itself off `--pu`, so the whole layout scales
      // with this box instead of jumping between fixed breakpoint sizes.
      style={
        {
          containerType: 'size',
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
            opacity: isClassic ? undefined : 'var(--pj-img)',
          }}
        />
      )}
      {/* The scrim is what lets the new layouts stay legible over any photo.
          Classic was drawn without one and keeps its original look. */}
      {!isClassic && <div className="absolute inset-0" style={{ background: 'var(--pj-scrim)' }} />}

      <Layout {...props} />
    </div>
  );
}
