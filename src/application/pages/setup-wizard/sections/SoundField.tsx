import { playSound } from '@composition/container';
import { SOUND_OPTIONS, type SoundId } from '@domain/entities';
import { PlayIcon } from '@application/components/ui/icons';

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
    <div className="flex items-center gap-[9px] rounded-2xl bg-surface-2 px-[11px] py-[9px] shadow-lift-sm">
      <span className="min-w-0 flex-1 text-[20px]">{label}</span>
      <select
        className="input w-[150px] flex-none"
        value={value}
        onChange={(e) => onChange(e.target.value as SoundId)}
        aria-label={label}
      >
        {SOUND_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-icon btn-secondary"
        disabled={value === 'none'}
        onClick={() => playSound(value)}
        title="Preview sound"
        aria-label="Preview sound"
      >
        <PlayIcon className="size-[14px]" />
      </button>
    </div>
  );
}
