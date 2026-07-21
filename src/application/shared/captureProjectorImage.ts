// Higher pixel density for a crisp capture regardless of the admin's screen.
const PROJECTOR_CAPTURE_SCALE = 2;

/**
 * Renders the given projector-layout element to a PNG entirely in the browser
 * (via modern-screenshot), so the admin gets an image of the current projector
 * screen without opening it.
 *
 * On devices with file sharing (phones/tablets) it opens the native share sheet,
 * where "Save Image" / "Add to Photos" drops it straight into the gallery — the
 * closest the web platform can get to saving to Photos, since pages can't write
 * there directly. Elsewhere (desktop) it falls back to a normal file download.
 *
 * modern-screenshot renders through the browser (unlike html2canvas), so
 * Tailwind's oklch() colors and cross-origin backgrounds are handled natively.
 * Returns the toast message to surface — success, cancellation, or a failure.
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

    const safeName =
      tournamentName.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") ||
      "projector";
    const fileName = `${safeName}-projector.png`;
    const file = new File([blob], fileName, { type: "image/png" });

    // Prefer the native share sheet so mobile users can save to Photos in a tap.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: tournamentName });
        return "Projector image shared";
      } catch (err) {
        // User dismissed the share sheet — not an error, don't fall back.
        if (err instanceof DOMException && err.name === "AbortError") {
          return "Capture cancelled";
        }
        // Any other share failure: fall through to a plain download.
      }
    }

    downloadBlob(blob, fileName);
    return "Projector image saved";
  } catch (err) {
    console.error("Projector capture failed", err);
    return "Couldn't capture the projector image";
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
