import type { IconProps } from "./types";
import { outline } from "./constants";

export function SlidersIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)}>
      <path d="M3 7h11m4 0h3M3 17h3m4 0h11M16 4.5v5M8 14.5v5" />
    </svg>
  );
}
