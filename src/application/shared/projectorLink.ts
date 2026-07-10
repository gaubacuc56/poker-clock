/** The public projector URL for a tournament's short join code. */
export function getProjectorUrl(joinCode: string): string {
  return `${window.location.origin}/p/${joinCode}`;
}

/**
 * Copies the projector link to the clipboard and returns the toast message to
 * show — success or a fallback if the clipboard write was blocked. Callers
 * surface the returned message through their own toast.
 */
export async function copyProjectorLink(joinCode: string): Promise<string> {
  const url = getProjectorUrl(joinCode);
  try {
    await navigator.clipboard.writeText(url);
    return `Projector link copied — code ${joinCode}`;
  } catch {
    return `Could not copy link — code ${joinCode}`;
  }
}
