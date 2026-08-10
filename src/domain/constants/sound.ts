import type { SoundSettings } from '../entities/sound';

/**
 * Every moment a tournament can make a noise, with the words the organiser
 * picks it by. Typed against `SoundSettings`, so adding a trigger to the
 * settings without giving it a label here is a compile error rather than a
 * quietly unconfigurable sound.
 */
export const SOUND_TRIGGERS: { key: keyof SoundSettings; label: string }[] = [
  { key: 'nextLevel', label: 'Next level' },
  { key: 'breakStart', label: 'Break start' },
  { key: 'breakEnd', label: 'Break end' },
  { key: 'warning5s', label: 'Next level in 5s' },
  { key: 'warning10s', label: 'Next level in 10s' },
  { key: 'warning30s', label: 'Next level in 30s' },
  { key: 'warning60s', label: 'Next level in 60s' },
];

/** The value meaning "stay silent" — never played, and not counted as configured. */
export const SILENT_SOUND_ID = 'none';
