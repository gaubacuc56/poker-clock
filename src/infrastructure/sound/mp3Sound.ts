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

/**
 * Unlocks playback for the given sounds. Must be called from inside a user
 * gesture (click/tap): each element is played muted and immediately reset,
 * which satisfies the browser's autoplay policy so later `playSound` calls —
 * fired programmatically when a level ends — are allowed. Needed on the
 * projector when it's opened directly from history/a bookmark rather than by
 * clicking through the code-entry page.
 */
export function primeSounds(ids: Iterable<SoundId>): void {
  for (const id of ids) {
    const audio = getAudio(id);
    if (!audio) continue;
    const wasMuted = audio.muted;
    audio.muted = true;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = wasMuted;
      })
      .catch(() => {
        audio.muted = wasMuted;
      });
  }
}
