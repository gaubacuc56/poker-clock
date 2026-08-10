import type { IconProps } from "./types";
import { outline } from "./constants";

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)} strokeWidth={2}>
      <path d="M5 15l7-7 7 7" />
    </svg>
  );
}
