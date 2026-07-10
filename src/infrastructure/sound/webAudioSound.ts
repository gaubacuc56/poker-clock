import type { SoundId } from '@domain/entities';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playBeep(frequency: number, durationMs: number): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  oscillator.start();
  oscillator.stop(ctx.currentTime + durationMs / 1000);
}

export function playSound(id: SoundId): void {
  switch (id) {
    case 'beep':
      playBeep(660, 150);
      break;
    case 'double-beep':
      playBeep(660, 150);
      setTimeout(() => playBeep(880, 200), 180);
      break;
    case 'chime':
      playBeep(523, 150);
      setTimeout(() => playBeep(659, 150), 160);
      setTimeout(() => playBeep(784, 250), 320);
      break;
    case 'alarm':
      playBeep(440, 150);
      setTimeout(() => playBeep(330, 150), 200);
      setTimeout(() => playBeep(440, 150), 400);
      break;
    case 'horn':
      playBeep(220, 500);
      break;
    case 'none':
      break;
  }
}
