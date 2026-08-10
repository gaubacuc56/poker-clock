import type { IconProps } from "./types";
import { outline } from "./constants";

export function StopIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)}>
      <circle cx="12" cy="12" r="9" />
      <rect x="8.75" y="8.75" width="6.5" height="6.5" rx="1.25" />
    </svg>
  );
}

/** Counter-clockwise arrow — used for both Undo and Reset Tournament. */
