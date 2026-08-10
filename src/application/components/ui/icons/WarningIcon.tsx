import type { IconProps } from "./types";
import { outline } from "./constants";

export function WarningIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.25M12 16.5h.008" />
    </svg>
  );
}
