import type { IconProps } from "./types";
import { outline } from "./constants";

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)}>
      <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
