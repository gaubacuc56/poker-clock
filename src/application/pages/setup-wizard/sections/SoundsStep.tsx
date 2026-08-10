import type { SoundId, SoundSettings } from '@domain/entities';
import { SOUND_TRIGGERS } from '@domain/constants/sound';
import SoundField from './SoundField';

interface SoundsStepProps {
  sounds: SoundSettings;
  onChange: (key: keyof SoundSettings, sound: SoundId) => void;
}

/** One sound picker per moment the tournament can announce. */
export default function SoundsStep({ sounds, onChange }: SoundsStepProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="mb-1 text-[16px] text-muted">Pick a sound for each event — defaults to none.</p>
      {SOUND_TRIGGERS.map(({ key, label }) => (
        <SoundField
          key={key}
          label={label}
          value={sounds[key]}
          onChange={(value) => onChange(key, value)}
        />
      ))}
    </div>
  );
}
