/**
 * A sound is either silence or the basename of an .mp3 in `public/sounds/`.
 * Playback loads `<BASE_URL>sounds/<id>.mp3` — see `infrastructure/sound/mp3Sound.ts`.
 */
export type SoundId =
  | 'none'
  | 'bell1'
  | 'bell2'
  | 'bell3'
  | 'next_level'
  | 'celebrate'
  | 'scary';

export interface SoundSettings {
  nextLevel: SoundId;
  breakStart: SoundId;
  breakEnd: SoundId;
  warning5s: SoundId;
  warning10s: SoundId;
  warning30s: SoundId;
  warning60s: SoundId;
}

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  nextLevel: 'none',
  breakStart: 'none',
  breakEnd: 'none',
  warning5s: 'none',
  warning10s: 'none',
  warning30s: 'none',
  warning60s: 'none',
};

export const SOUND_OPTIONS: { id: SoundId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'bell1', label: 'Bell 1' },
  { id: 'bell2', label: 'Bell 2' },
  { id: 'bell3', label: 'Bell 3' },
  { id: 'next_level', label: 'Next Level' },
  { id: 'celebrate', label: 'Celebrate' },
  { id: 'scary', label: 'Scary' },
];
