import type { IconProps } from "./types";
import { outline } from "./constants";

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)} strokeWidth={2}>
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}
