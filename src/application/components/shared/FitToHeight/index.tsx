import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { PROJECTOR_UNIT, PROJECTOR_UNIT_VAR } from '@application/shared/projectorScale';
import { MIN_SCALE, REFINEMENTS, SETTLED } from './constants';

interface FitToHeightProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Shrinks its contents until they fit the height the parent has left over.
 *
 * It works by re-declaring `--pu` for the subtree, so everything inside — font
 * sizes, padding, the medal pips — scales together off the sizes the layout
 * already wrote, with no per-layout arithmetic.
 *
 * Both measurements are taken with the frame collapsed to nothing and the
 * subtree at full size, so neither one can be influenced by the scale currently
 * applied. That matters more than it sounds: measuring in place means the answer
 * depends on the last answer, and any column whose layout reacts to this box —
 * a centred stack, a sibling that can be squeezed — turns that into a loop that
 * shrinks, grows, and shrinks again for as long as the projector is open.
 */
export default function FitToHeight({ children, className, style }: FitToHeightProps) {
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const frameEl = frame.current;
    const contentEl = content.current;
    if (!frameEl || !contentEl) return;

    /** The scale currently written to the element, so a re-measure that agrees
     *  with it writes nothing and the observer goes quiet. */
    let applied = 1;

    const setScale = (scale: number) => {
      applied = scale;
      frameEl.style.setProperty(PROJECTOR_UNIT_VAR, `calc(${scale} * ${PROJECTOR_UNIT})`);
    };

    const fit = () => {
      // Collapsed and unscaled: the siblings lay out as if this box were not
      // here, and the rows report the height they were designed at.
      frameEl.style.height = '0px';
      frameEl.style.setProperty(PROJECTOR_UNIT_VAR, PROJECTOR_UNIT);
      const available = availableHeight(frameEl);
      const natural = contentEl.scrollHeight;
      frameEl.style.height = '';

      if (available <= 0 || natural <= 0) {
        setScale(applied);
        return;
      }

      let scale = clamp(available / natural);
      for (let i = 0; i < REFINEMENTS && scale > MIN_SCALE; i++) {
        setScale(scale);
        const used = contentEl.scrollHeight;
        if (used <= available) break;
        scale = clamp((scale * available) / used);
      }
      setScale(scale);
    };

    fit();

    // Re-fit on anything that can change the sum: the frame's own contents, the
    // siblings competing for the same column, and the column itself resizing.
    // Re-measuring a settled layout is cheap and lands on the same number, so
    // the passes this schedules against itself stop after one.
    const observer = new ResizeObserver(fit);
    observer.observe(contentEl);
    const parent = frameEl.parentElement;
    if (parent) {
      observer.observe(parent);
      for (const child of parent.children) observer.observe(child);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frame}
      className={`flex w-full min-h-0 flex-col overflow-hidden ${className ?? ''}`}
      style={{ ...style, [PROJECTOR_UNIT_VAR]: PROJECTOR_UNIT } as CSSProperties}
    >
      {/* Never shrunk by the frame, so its height always reads as the height the
          rows actually want at the current scale. */}
      <div ref={content} className="flex shrink-0 flex-col">
        {children}
      </div>
    </div>
  );
}

function clamp(scale: number): number {
  const fitted = Math.min(1, Math.max(MIN_SCALE, scale));
  // A hair under 1 is still 1: the rows are already inside the column, and
  // writing the difference only costs another measure.
  return fitted > 1 - SETTLED ? 1 : fitted;
}

/** The parent's content box less everything else competing for it. */
function availableHeight(frame: HTMLElement): number {
  const parent = frame.parentElement;
  if (!parent) return frame.clientHeight;

  const parentStyle = getComputedStyle(parent);
  let taken =
    px(parentStyle.paddingTop) +
    px(parentStyle.paddingBottom) +
    px(parentStyle.rowGap) * Math.max(0, parent.children.length - 1);

  for (const child of parent.children) {
    const box = child as HTMLElement;
    const childStyle = getComputedStyle(box);
    if (childStyle.position === 'absolute' || childStyle.position === 'fixed') continue;
    // Our own margins still take room; our height is what we are solving for.
    taken += px(childStyle.marginTop) + px(childStyle.marginBottom);
    if (child !== frame) taken += box.offsetHeight;
  }

  return parent.clientHeight - taken;
}

function px(value: string): number {
  return parseFloat(value) || 0;
}
