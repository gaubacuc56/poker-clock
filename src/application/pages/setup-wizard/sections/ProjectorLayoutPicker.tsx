import { PROJECTOR_LAYOUTS, type ProjectorLayout } from '@domain/entities';
import ProjectorView from '@application/components/template/ProjectorView';
import { PREVIEW_TOURNAMENT } from './projectorPreviewData';

interface ProjectorLayoutPickerProps {
  value: ProjectorLayout;
  onChange: (layout: ProjectorLayout) => void;
  /** The chosen background, so the thumbnails show the photo the projector will use. */
  backgroundPath: string | undefined;
}

/**
 * The layout choice, as a radio group of previews: each option renders the real
 * `ProjectorView` at thumbnail size. The projector scales off container units,
 * so a miniature is a faithful picture of the TV rather than a drawing of one.
 *
 * The numbers are a fixed sample tournament, not the draft being edited. Wiring
 * the draft in made every thumbnail re-lay-out on each keystroke — a name being
 * typed, a buy-in gaining a digit or a payout tier being added would reflow all
 * four at once, which read as flickering rather than as a preview.
 */
export default function ProjectorLayoutPicker({
  value,
  onChange,
  backgroundPath,
}: ProjectorLayoutPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Projector layout"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {PROJECTOR_LAYOUTS.map((layout) => {
        const isSelected = layout.id === value;
        return (
          <button
            key={layout.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(layout.id)}
            className={`flex cursor-pointer flex-col gap-2 rounded-card border-0 bg-surface p-2.5 text-left font-[inherit] text-inherit ring-1 ring-inset transition-shadow duration-150 ${
              isSelected ? 'shadow-lift-md ring-accent' : 'shadow-lift-sm ring-transparent'
            }`}
          >
            {/* `pointer-events-none` so the whole card stays one click target. */}
            <div className="pointer-events-none aspect-video overflow-hidden rounded-field bg-base-deep">
              <ProjectorView
                {...PREVIEW_TOURNAMENT}
                backgroundPath={backgroundPath}
                layout={layout.id}
              />
            </div>
            <span className="flex items-center gap-2 px-0.5">
              <span
                className={`grid size-[18px] flex-none place-items-center rounded-full border-[1.5px] ${
                  isSelected ? 'border-accent' : 'border-hair-strong'
                }`}
              >
                {isSelected && <span className="size-2.5 rounded-full bg-accent" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-[18px]">{layout.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
