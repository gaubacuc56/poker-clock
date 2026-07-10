export type SoundId =
  | 'none'
  | 'beep'
  | 'double-beep'
  | 'chime'
  | 'alarm'
  | 'horn';

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
  { id: 'beep', label: 'Beep' },
  { id: 'double-beep', label: 'Double Beep' },
  { id: 'chime', label: 'Chime' },
  { id: 'alarm', label: 'Alarm' },
  { id: 'horn', label: 'Horn' },
];
