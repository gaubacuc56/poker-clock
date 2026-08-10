import type { IconProps } from "./types";
import { outline } from "./constants";

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)} strokeWidth={2}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}
