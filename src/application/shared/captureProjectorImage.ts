// Higher pixel density for a crisp capture regardless of the admin's screen.
const PROJECTOR_CAPTURE_SCALE = 2;

/**
 * Renders the given projector-layout element to a PNG entirely in the browser
 * (via modern-screenshot) and triggers a download named after the tournament,
 * so the admin gets an image of the current projector screen without opening it.
 *
 * modern-screenshot renders through the browser (unlike html2canvas), so
 * Tailwind's oklch() colors and cross-origin backgrounds are handled natively.
 * Returns the toast message to surface — success or a failure fallback.
 */
export async function captureProjectorImage(
  node: HTMLElement,
  tournamentName: string,
): Promise<string> {
  try {
    const { domToBlob } = await import("modern-screenshot");
    const blob = await domToBlob(node, {
      type: "image/png",
      scale: PROJECTOR_CAPTURE_SCALE,
      backgroundColor: "#020617",
    });
    if (!blob) throw new Error("Capture produced no image");

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName =
      tournamentName.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") ||
      "projector";
    link.href = url;
    link.download = `${safeName}-projector.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return "Projector image saved";
  } catch (err) {
    console.error("Projector capture failed", err);
    return "Couldn't capture the projector image";
  }
}
