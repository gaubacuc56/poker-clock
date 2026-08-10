import type { IconProps } from "./types";
import { outline } from "./constants";

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)} strokeWidth={2}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
