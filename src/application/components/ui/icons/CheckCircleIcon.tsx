import type { IconProps } from "./types";
import { outline } from "./constants";

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.25 12.25l2.5 2.5 5-5.5" />
    </svg>
  );
}
