import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { captureProjectorImage } from "../../shared/captureProjectorImage";

// The projector image is always rendered at a fixed 16:9 HD frame, independent
// of the device that triggers the capture.
const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

export interface ProjectorCaptureFrameHandle {
  /** Renders the framed content to a PNG and downloads it; returns a toast message. */
  capture: (tournamentName: string) => Promise<string>;
}

interface ProjectorCaptureFrameProps {
  children: ReactNode;
}

/**
 * Hosts projector content inside a hidden, off-screen 1920×1080 iframe. Because
 * an iframe establishes its own viewport, the projector's vw-based font/spacing
 * (clamp()) resolves against 1920 no matter the device that triggers the
 * capture — so a phone produces the same HD image a desktop would, instead of a
 * broken layout scaled to the phone's width.
 */
const ProjectorCaptureFrame = forwardRef<
  ProjectorCaptureFrameHandle,
  ProjectorCaptureFrameProps
>(function ProjectorCaptureFrame({ children }, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);

  // A srcless same-origin iframe exposes an about:blank document synchronously;
  // prepare its body once mounted so the portal has a target.
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.documentElement.style.margin = "0";
    doc.body.style.margin = "0";
    doc.body.style.width = `${FRAME_WIDTH}px`;
    doc.body.style.height = `${FRAME_HEIGHT}px`;
    doc.body.style.overflow = "hidden";
    setBody(doc.body);
  }, []);

  useImperativeHandle(ref, () => ({
    async capture(tournamentName: string) {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || !doc.body) {
        return "Couldn't capture the projector image";
      }
      // Copy the app's compiled styles (Tailwind, etc.) into the frame right
      // before capturing so the layout is styled at 1920 width, then let the
      // browser reflow before snapshotting.
      injectParentStyles(doc);
      await nextFrame();
      return captureProjectorImage(doc.body, tournamentName);
    },
  }));

  return (
    <iframe
      ref={iframeRef}
      title="Projector capture frame"
      aria-hidden
      tabIndex={-1}
      width={FRAME_WIDTH}
      height={FRAME_HEIGHT}
      style={{
        position: "fixed",
        top: 0,
        left: -100000,
        border: 0,
        pointerEvents: "none",
      }}
    >
      {body && createPortal(children, body)}
    </iframe>
  );
});

export default ProjectorCaptureFrame;

/** Serializes every same-origin stylesheet into a single <style> in the frame. */
function injectParentStyles(targetDoc: Document) {
  targetDoc
    .querySelectorAll("style[data-capture-styles]")
    .forEach((node) => node.remove());

  const css = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch {
        // Cross-origin sheets block cssRules access — skip them.
        return "";
      }
    })
    .join("\n");

  const style = targetDoc.createElement("style");
  style.setAttribute("data-capture-styles", "");
  style.textContent = css;
  targetDoc.head.appendChild(style);
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}
