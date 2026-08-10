import type { Background, ProjectorLayout } from '@domain/entities';
import Field from './Field';
import ProjectorLayoutPicker from './ProjectorLayoutPicker';

interface ProjectorStepProps {
  backgroundId: string;
  layout: ProjectorLayout;
  backgrounds: Background[];
  onBackgroundChange: (backgroundId: string) => void;
  onLayoutChange: (layout: ProjectorLayout) => void;
}

/** What the TV shows: which photo sits behind the clock, and how it's arranged. */
export default function ProjectorStep({
  backgroundId,
  layout,
  backgrounds,
  onBackgroundChange,
  onLayoutChange,
}: ProjectorStepProps) {
  const selected = backgrounds.find((background) => background.id === backgroundId);

  return (
    <div className="flex flex-col gap-3.5">
      <Field label="Projector background">
        <select
          className="input"
          value={backgroundId}
          onChange={(e) => onBackgroundChange(e.target.value)}
        >
          {backgrounds.map((background) => (
            <option key={background.id} value={background.id}>
              {background.label}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <span className="field-label">Layout</span>
        <ProjectorLayoutPicker
          value={layout}
          onChange={onLayoutChange}
          backgroundPath={selected?.path}
        />
      </div>
    </div>
  );
}
