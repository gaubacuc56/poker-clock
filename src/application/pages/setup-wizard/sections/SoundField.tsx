import { playSound } from '@composition/container';
import { SOUND_OPTIONS, type SoundId } from '@domain/entities';

export default function SoundField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SoundId;
  onChange: (value: SoundId) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-40 shrink-0 text-sm text-themed-muted">{label}</span>
      <select
        className="input flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value as SoundId)}
      >
        {SOUND_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn-secondary shrink-0 px-3"
        disabled={value === 'none'}
        onClick={() => playSound(value)}
        title="Preview sound"
        aria-label="Preview sound"
      >
        ▶
      </button>
    </div>
  );
}
