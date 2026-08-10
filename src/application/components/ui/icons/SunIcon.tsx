import type { IconProps } from "./types";
import { outline } from "./constants";

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.25M12 19.25v2.25M4.22 4.22l1.6 1.6M18.18 18.18l1.6 1.6M2.5 12h2.25M19.25 12h2.25M4.22 19.78l1.6-1.6M18.18 5.82l1.6-1.6" />
    </svg>
  );
}
