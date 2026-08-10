import type { IconProps } from "./types";
import { outline } from "./constants";

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)} strokeWidth={2}>
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
}
