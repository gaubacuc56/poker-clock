import type { SoundId } from '@domain/entities';

/**
 * Plays the .mp3 files in `public/sounds/` (one per SoundId). Elements are
 * cached and reused so repeated plays don't re-download or leak audio nodes.
 * `BASE_URL` keeps the path correct when the app is served under a subpath.
 */
const cache = new Map<SoundId, HTMLAudioElement>();

function getAudio(id: SoundId): HTMLAudioElement | null {
  if (id === 'none') return null;
  let audio = cache.get(id);
  if (!audio) {
    audio = new Audio(`${import.meta.env.BASE_URL}sounds/${id}.mp3`);
    audio.preload = 'auto';
    cache.set(id, audio);
  }
  return audio;
}

export function playSound(id: SoundId): void {
  const audio = getAudio(id);
  if (!audio) return;
  audio.currentTime = 0;
  // Autoplay can be blocked until the user has interacted with the page; the
  // rejected promise is expected in that case, so swallow it.
  void audio.play().catch(() => {});
}
